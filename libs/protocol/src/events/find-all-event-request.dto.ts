import { IsBoolean, IsDateString, IsNumber, IsOptional } from 'class-validator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Role } from '../users/role.enum';

export class FindAllEventRequestDto {
  @IsDateString()
  startDate: Date;

  /**
   * 이벤트 공개 여부 필터링 옵션
   *
   * 권한별 동작 방식({@link Role}):
   * - 관리자/운영자(ADMIN/OPERATOR):
   *   - 설정 시: 지정된 공개 여부에 따라 필터링
   *   - 미설정 시: 모든 이벤트 조회(공개/비공개 모두)
   *
   * - 일반 사용자/감사자(USER/AUDITOR):
   *   - 설정과 관계없이 항상 공개 이벤트만 조회 가능
   *   - 이 값을 설정해도 필터링에 영향 없음
   */
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsNumber()
  count: number = 10;
}
