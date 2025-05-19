import { AllUserDto } from '../users/user.dto';

export interface ClaimEventRewardResponseDto {
  user: Pick<AllUserDto, 'coins' | 'cash' | 'inventory' | 'coupons'>;
}
