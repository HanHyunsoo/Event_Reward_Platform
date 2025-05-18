import { AllUserDto } from './user.dto';

export interface GiveRewardsResponse {
  user: Pick<AllUserDto, 'coins' | 'cash' | 'inventory' | 'coupons'>;
}
