import { AllUserDto } from '../users/user.dto';

export interface ClaimEventRewardResponse {
  user: Pick<AllUserDto, 'coins' | 'cash' | 'inventory' | 'coupons'>;
}
