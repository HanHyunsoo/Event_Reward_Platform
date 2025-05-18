import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  ArmorId,
  ConsumableId,
  CouponId,
  CreateOrLoginUserRequestDto,
  CreateOrLoginUserResponseDto,
  FindOneUserResponseDto,
  GiveRewardsRequestDto,
  InventoryItemType,
  RewardType,
  UserDto,
  WeaponId,
} from '@event-reward-platform/protocol';
import { User, UserDocument } from '../schemas/user.schema';
import { GiveRewardsResponse } from '@event-reward-platform/protocol/users/give-rewards-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(
    createUserRequest: CreateOrLoginUserRequestDto,
  ): Promise<CreateOrLoginUserResponseDto> {
    const isExistUsername = await this.userModel.exists({
      userId: createUserRequest.userId,
    });

    if (isExistUsername) {
      throw new RpcException(
        new ConflictException('유저 아이디가 이미 존재합니다.'),
      );
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash(createUserRequest.password, 10);
    const user = await this.userModel.create({
      userId: createUserRequest.userId,
      password: hashedPassword,
      todayLoginCount: 1,
      consecutiveLogin: {
        startTime: now,
        count: 1,
      },
      lastLoginAt: now,
    });

    return {
      userId: user.userId,
      role: user.role,
    };
  }

  async login(
    loginUserRequest: CreateOrLoginUserRequestDto,
  ): Promise<CreateOrLoginUserResponseDto> {
    const user = await this.userModel.findOne(
      { userId: loginUserRequest.userId },
      {
        userId: 1,
        password: 1,
        role: 1,
        bannedUntil: 1,
        consecutiveLogin: 1,
        lastLoginAt: 1,
        todayLoginCount: 1,
      },
    );

    if (user == null) {
      throw new RpcException(
        new NotFoundException('유저가 존재하지 않습니다.'),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserRequest.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new RpcException(
        new UnauthorizedException('비밀번호가 일치하지 않습니다.'),
      );
    }

    const now = new Date();

    if (user.bannedUntil.getTime() > now.getTime()) {
      throw new RpcException(
        new ForbiddenException(
          `유저가 정지되었습니다.(정지 종료 시간: ${user.bannedUntil.toISOString()})`,
        ),
      );
    }

    const oneDay = 1000 * 60 * 60 * 24;
    const isConsecutiveLogin =
      Math.floor(user.lastLoginAt.getTime() / oneDay) -
        Math.floor(user.consecutiveLogin.startTime.getTime() / oneDay) ===
      1;

    if (isConsecutiveLogin) {
      user.todayLoginCount = 1;
      user.consecutiveLogin.count = user.consecutiveLogin.count + 1;
    } else {
      user.consecutiveLogin.count = 1;
      user.consecutiveLogin.startTime = now;
    }

    user.todayLoginCount = user.todayLoginCount + 1;
    user.lastLoginAt = now;
    await user.save();

    return {
      userId: user.userId,
      role: user.role,
    };
  }

  async getUserInfoWithValidation(
    userId: string,
  ): Promise<FindOneUserResponseDto> {
    const user = await this.userModel.findOne({ userId });

    if (user == null) {
      throw new RpcException(
        new NotFoundException('유저가 존재하지 않습니다.'),
      );
    }

    if (user.bannedUntil.getTime() > Date.now()) {
      throw new RpcException(
        new ForbiddenException(
          `유저가 정지되었습니다.(정지 종료 시간: ${user.bannedUntil.toISOString()})`,
        ),
      );
    }

    return {
      user: {
        userId: user.userId,
        role: user.role,
        cash: user.cash,
        coins: user.coins,
        inventory: user.inventory.map((item) => ({
          type: item.type,
          id: item.id,
          quantity: item.quantity,
        })),
        coupons: user.coupons.map((coupon) => ({
          couponId: coupon.couponId,
          quantity: coupon.quantity,
        })),
        todayLoginCount: user.todayLoginCount,
        consecutiveLogin: {
          startTime: user.consecutiveLogin.startTime,
          count: user.consecutiveLogin.count,
        },
        lastLoginAt: user.lastLoginAt,
        bannedUntil: user.bannedUntil,
        createdAt: user.get('createdAt') as Date,
        updatedAt: user.get('updatedAt') as Date,
      },
    };
  }

  async updateUser(user: UserDto): Promise<UserDto> {
    const userDoc = await this.userModel.findOne(
      { userId: user.userId },
      { userId: 1, role: 1 },
    );

    if (userDoc == null) {
      throw new RpcException(
        new NotFoundException('유저가 존재하지 않습니다.'),
      );
    }

    userDoc.role = user.role;
    await userDoc.save();

    return { userId: userDoc.userId, role: userDoc.role };
  }

  async giveRewards(
    payload: GiveRewardsRequestDto,
  ): Promise<GiveRewardsResponse> {
    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        const user = await this.userModel.findOne(
          { userId: payload.userId },
          {
            userId: 1,
            cash: 1,
            coins: 1,
            inventory: 1,
            coupons: 1,
          },
          { session },
        );

        if (user == null) {
          throw new RpcException(
            new NotFoundException('유저가 존재하지 않습니다.'),
          );
        }

        const rewards = payload.rewards;

        let coins = user.coins;
        let cash = user.cash;
        const inventoryMap = new Map<
          InventoryItemType,
          { id: string; quantity: number }
        >();
        const couponsMap = new Map<CouponId, number>();

        user.inventory.forEach((item) => {
          inventoryMap.set(item.type, {
            id: item.id,
            quantity: item.quantity,
          });
        });

        user.coupons.forEach((coupon) => {
          couponsMap.set(coupon.couponId, coupon.quantity);
        });

        for (const reward of rewards) {
          if (reward.rewardType === RewardType.COIN) {
            coins += reward.quantity;
          } else if (reward.rewardType === RewardType.CASH) {
            cash += reward.quantity;
          } else if (reward.rewardType === RewardType.ITEM) {
            const itemType = reward.itemInfo?.type;
            const itemId =
              reward.itemInfo?.weaponId ??
              reward.itemInfo?.armorId ??
              reward.itemInfo?.consumableId;

            const inventoryInfo = inventoryMap.get(
              itemType as InventoryItemType,
            );
            if (inventoryInfo == null) {
              inventoryMap.set(itemType as InventoryItemType, {
                id: itemId as WeaponId | ArmorId | ConsumableId,
                quantity: reward.quantity,
              });
            } else {
              inventoryInfo.quantity += reward.quantity;
            }
          } else if (reward.rewardType === RewardType.COUPON) {
            const couponId = reward.couponId;
            const quantity = reward.quantity;

            const couponQuantity = couponsMap.get(couponId as CouponId);
            if (couponQuantity == null) {
              couponsMap.set(couponId as CouponId, quantity);
            } else {
              couponsMap.set(couponId as CouponId, couponQuantity + quantity);
            }
          }
        }

        user.coins = coins;
        user.cash = cash;
        user.inventory = Array.from(inventoryMap.entries()).map(
          ([type, { id, quantity }]) => ({
            type,
            id: id as WeaponId | ArmorId | ConsumableId,
            quantity,
          }),
        );
        user.coupons = Array.from(couponsMap.entries()).map(
          ([couponId, quantity]) => ({
            couponId,
            quantity,
          }),
        );

        await user.save({ session });

        const res: GiveRewardsResponse = {
          user: {
            coins: user.coins,
            cash: user.cash,
            inventory: user.inventory,
            coupons: user.coupons,
          },
        };

        return res;
      });
    } finally {
      await session.endSession();
    }
  }
}
