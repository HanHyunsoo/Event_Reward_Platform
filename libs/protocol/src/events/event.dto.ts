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

export class ChallengeDto {
  @IsEnum(ChallengeType)
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
  itemId?: WeaponId | ArmorId | ConsumableId;
}

class ItemInfoDto {
  @IsEnum(InventoryItemType)
  type: InventoryItemType;

  @IsEnum(WeaponId)
  @IsEnum(ArmorId)
  @IsEnum(ConsumableId)
  id: WeaponId | ArmorId | ConsumableId;
}

export class RewardDto {
  @IsEnum(RewardType)
  rewardType: RewardType;

  @ValidateIf((o: RewardDto) => o.rewardType === RewardType.ITEM)
  @ValidateNested()
  @Type(() => ItemInfoDto)
  itemInfo?: ItemInfoDto;

  @IsNumber()
  quantity: number;
}

export class EventDto {
  // 응답의 경우 자동으로 채워집니다.
  _id?: string;

  @IsDateString()
  startTime: Date | string;

  @IsDateString()
  @IsDateAfter('startTime')
  endTime: Date | string;

  @IsBoolean()
  isPublic: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChallengeDto)
  challenge?: ChallengeDto;

  @ValidateNested({ each: true })
  @Type(() => RewardDto)
  rewards: RewardDto[];

  @IsOptional()
  @IsNumber()
  rewardLimit?: number;

  // 컨트롤러 단에서 자동으로 채워집니다.
  creatorId?: string;
}
