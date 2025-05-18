import { IsArray } from 'class-validator';

import { ValidateNested } from 'class-validator';

import { IsDefined } from 'class-validator';
import { RewardDto } from './event.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEventRewardsRequestDto {
  // 유저가 설정할 필요없습니다.
  eventId?: string;

  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardDto)
  @ApiProperty({
    description: '이벤트 보상',
    type: [RewardDto],
  })
  rewards: RewardDto[];
}
