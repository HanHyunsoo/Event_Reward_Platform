import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Role } from '../users/role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FindAllEventRequestDto {
  @IsDateString()
  @ApiProperty({
    description: '이벤트 시작 시간(이후부터 조회)',
    example: '2025-01-01T00:00:00.000Z',
    type: Date,
  })
  startDate: Date | string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    }
  })
  @ApiProperty({
    description: `이벤트 공개 여부 필터링 옵션

- 관리자/운영자(ADMIN/OPERATOR):
  - 설정 시: 지정된 공개 여부에 따라 필터링
  - 미설정 시: 모든 이벤트 조회(공개/비공개 모두)

- 일반 사용자/감사자(USER/AUDITOR):
  - 설정과 관계없이 항상 공개 이벤트만 조회 가능
  - 이 값을 설정해도 필터링에 영향 없음`,
    required: false,
    example: true,
  })
  isPublic?: boolean;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number(value))
  @ApiProperty({
    description: '이벤트 개수',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  limit: number = 10;
}
