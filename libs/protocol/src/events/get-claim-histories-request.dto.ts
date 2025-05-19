import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Min, Max, IsDateString, IsNumber } from 'class-validator';

export enum ClaimHistoryFilter {
  ALL = 'ALL',
  EVENT_ID = 'EVENT_ID',
  USER_ID = 'USER_ID',
  EVENT_ID_AND_USER_ID = 'EVENT_ID_AND_USER_ID',
}

export class GetClaimHistoriesRequestDto {
  // 클라이언트에서 설정하지 않는 값
  filter?: ClaimHistoryFilter;

  // 클라이언트에서 설정하지 않는 값
  userId: string;

  // 클라이언트에서 설정하지 않는 값
  eventId?: string;

  @IsDateString()
  @ApiProperty({
    description: '이벤트 보상 지급 내역 시간(값 기준 이하 문서들 조회)',
    example: '2025-01-01T00:00:00.000Z',
    type: Date,
  })
  timeAt: Date | string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiProperty({
    description: '이벤트 보상 지급 내역 최대 조회 개수',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  limit: number = 10;
}
