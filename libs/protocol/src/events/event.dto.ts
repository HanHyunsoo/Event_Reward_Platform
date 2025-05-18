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
import { IsAnyEnum, IsDateAfter } from '@event-reward-platform/core';
import { ApiProperty } from '@nestjs/swagger';
import { CouponId } from '../users/coupon.enum';

export class ChallengeDto {
  @IsEnum(ChallengeType)
  @ApiProperty({
    description: `챌린지 타입

챌린지 타입에 따라 값을 다르게 설정해주세요.

- 누적 로그인 횟수 - loginCount: number
- 복귀 유저 - daysSinceLastLogin: number
- 캐시 소유 이상 - cash: number
- 캐시 소유 이하 - cash: number
- 코인 소유 이상 - coin: number
- 코인 소유 이하 - coin: number
- 모든 아이템 소유 개수 - count: number
- 특정 아이템 소유 개수 - itemId: WeaponId | ArmorId | ConsumableId, count: number
    `,
    example: ChallengeType.누적_로그인_횟수,
    enum: ChallengeType,
  })
  type: ChallengeType;

  @ValidateIf((o: ChallengeDto) => o.type === ChallengeType.누적_로그인_횟수)
  @IsNumber()
  @ApiProperty({
    description: '누적 로그인 횟수',
    example: 7,
  })
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
  @IsAnyEnum([WeaponId, ArmorId, ConsumableId])
  itemId?: WeaponId | ArmorId | ConsumableId;
}

export class ItemInfoDto {
  @IsEnum(InventoryItemType)
  @ApiProperty({
    description: `
아이템 타입에 따라 id key 값을 다르게 설정해주세요.
- WEAPON: weaponId(${Object.values(WeaponId).join(', ')})
- ARMOR: armorId(${Object.values(ArmorId).join(', ')})
- CONSUMABLE: consumableId(${Object.values(ConsumableId).join(', ')})
    `,
    example: InventoryItemType.WEAPON,
    enum: InventoryItemType,
  })
  type: InventoryItemType;

  @ValidateIf((o: ItemInfoDto) => o.type === InventoryItemType.WEAPON)
  @IsEnum(WeaponId)
  @ApiProperty({
    description: '무기 ID',
    example: WeaponId.AXE1,
    enum: WeaponId,
    required: false,
  })
  weaponId?: WeaponId;

  @ValidateIf((o: ItemInfoDto) => o.type === InventoryItemType.ARMOR)
  @IsEnum(ArmorId)
  armorId?: ArmorId;

  @ValidateIf((o: ItemInfoDto) => o.type === InventoryItemType.CONSUMABLE)
  @IsEnum(ConsumableId)
  consumableId?: ConsumableId;
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

  @ValidateIf((o: RewardDto) => o.rewardType === RewardType.COUPON)
  @IsEnum(CouponId)
  couponId?: CouponId;

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
    example: '2025-05-01T00:00:00.000Z',
  })
  startTime: Date | string;

  @IsDateString()
  @IsDateAfter('startTime')
  @ApiProperty({
    description: '이벤트 종료 시간(startTime 이후로 설정해주세요)',
    example: '2025-12-31T00:00:00.000Z',
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
