import { ChallengeType } from './challenge.enum';
import {
  ArmorId,
  ConsumableId,
  InventoryItemType,
  WeaponId,
} from '../users/item.enum';
import { RewardType } from './reward.enum';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateAfter } from '@event-reward-platform/core';
import { ApiProperty } from '@nestjs/swagger';

export class ChallengeDto {
  @IsEnum(ChallengeType)
  @ApiProperty({
    description: '챌린지 타입',
    example: ChallengeType.누적_로그인_횟수,
    enum: ChallengeType,
  })
  type: ChallengeType;

  @ValidateIf((o: ChallengeDto) => o.type === ChallengeType.누적_로그인_횟수)
  @IsNumber()
  loginCount?: number;

  @ValidateIf((o: ChallengeDto) => o.type === ChallengeType.복귀_유저)
  @IsNumber()
  daysSinceLastLogin?: number;

  @ValidateIf((o: ChallengeDto) =>
    [ChallengeType.캐시_소유_이상, ChallengeType.캐시_소유_이하].includes(
      o.type,
    ),
  )
  @IsNumber()
  cash?: number;

  @ValidateIf((o: ChallengeDto) =>
    [ChallengeType.코인_소유_이상, ChallengeType.코인_소유_이하].includes(
      o.type,
    ),
  )
  @IsNumber()
  coin?: number;

  @ValidateIf((o: ChallengeDto) =>
    [
      ChallengeType.모든_아이템_소유_개수,
      ChallengeType.특정_아이템_소유_개수,
    ].includes(o.type),
  )
  @IsNumber()
  count?: number;

  @ValidateIf(
    (o: ChallengeDto) => o.type === ChallengeType.특정_아이템_소유_개수,
  )
  @IsEnum(WeaponId)
  @IsEnum(ArmorId)
  @IsEnum(ConsumableId)
  @ApiProperty({
    description: '아이템 ID',
    example: WeaponId.AXE1,
    enum: [
      ...Object.values(WeaponId),
      ...Object.values(ArmorId),
      ...Object.values(ConsumableId),
    ],
  })
  itemId?: WeaponId | ArmorId | ConsumableId;
}

class ItemInfoDto {
  @IsEnum(InventoryItemType)
  @ApiProperty({
    description: '아이템 타입',
    example: InventoryItemType.WEAPON,
    enum: InventoryItemType,
  })
  type: InventoryItemType;

  @IsEnum(WeaponId)
  @IsEnum(ArmorId)
  @IsEnum(ConsumableId)
  @ApiProperty({
    description: '아이템 ID',
    example: WeaponId.AXE1,
    enum: [
      ...Object.values(WeaponId),
      ...Object.values(ArmorId),
      ...Object.values(ConsumableId),
    ],
  })
  id: WeaponId | ArmorId | ConsumableId;
}

export class RewardDto {
  @IsEnum(RewardType)
  @ApiProperty({
    description: '보상 타입',
    example: RewardType.ITEM,
    enum: RewardType,
  })
  rewardType: RewardType;

  @ValidateIf((o: RewardDto) => o.rewardType === RewardType.ITEM)
  @ValidateNested()
  @Type(() => ItemInfoDto)
  @ApiProperty({
    description: '아이템 정보',
    type: ItemInfoDto,
  })
  itemInfo?: ItemInfoDto;

  @IsNumber()
  @ApiProperty({
    description: '보상 개수',
    example: 1,
  })
  quantity: number;
}

export class EventDto {
  // 응답의 경우 자동으로 채워집니다.
  _id?: string;

  @IsDateString()
  @ApiProperty({
    description: '이벤트 시작 시간',
    example: '2025-01-01T00:00:00.000Z',
  })
  startTime: Date | string;

  @IsDateString()
  @IsDateAfter('startTime')
  @ApiProperty({
    description: '이벤트 종료 시간(startTime 이후로 설정해주세요)',
    example: '2025-01-01T00:00:00.000Z',
  })
  endTime: Date | string;

  @IsBoolean()
  @ApiProperty({
    description:
      '이벤트 공개 여부, 미공개 이벤트의 경우 ADMIN/OPERATOR 권한만 볼 수 있습니다.',
    example: true,
  })
  isPublic: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChallengeDto)
  @ApiProperty({
    description: '이벤트 챌린지 정보',
    type: ChallengeDto,
  })
  challenge?: ChallengeDto;

  @ValidateNested({ each: true })
  @Type(() => RewardDto)
  @ApiProperty({
    description: '이벤트 보상 정보',
    type: RewardDto,
    isArray: true,
  })
  rewards: RewardDto[];

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: '이벤트 보상 제한 개수',
    example: 10,
  })
  rewardLimit?: number;

  creatorId?: string;
}
