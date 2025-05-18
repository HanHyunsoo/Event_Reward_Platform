import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { RewardDto } from '../events/event.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GiveRewardsRequestDto {
  userId?: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RewardDto)
  @ApiProperty({
    description: '보상 정보',
    type: [RewardDto],
  })
  rewards: RewardDto[];
}
