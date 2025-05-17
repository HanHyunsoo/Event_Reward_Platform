import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  CreateOrLoginUserRequestDto,
  CreateOrLoginUserResponseDto,
} from '@event-reward-platform/protocol';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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
        new UnauthorizedException(
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
}
