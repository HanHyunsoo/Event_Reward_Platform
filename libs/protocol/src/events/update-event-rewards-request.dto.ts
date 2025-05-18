import { IsArray } from 'class-validator';

import { ValidateNested } from 'class-validator';

import { IsDefined } from 'class-validator';
import { RewardDto } from './event.dto';
import { Type } from 'class-transformer';

export class UpdateEventRewardsRequestDto {
  // 유저가 설정할 필요없습니다.
  eventId?: string;

  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardDto)
  rewards: RewardDto[];
}
