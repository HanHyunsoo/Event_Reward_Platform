import { ConflictException, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  CreateUserRequestDto,
  CreateUserResponseDto,
} from '@event-reward-platform/protocol';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async signUp(
    createUserRequest: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
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
}
