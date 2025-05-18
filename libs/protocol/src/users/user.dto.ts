import { CouponId } from './coupon.enum';
import {
  ArmorId,
  ConsumableId,
  InventoryItemType,
  WeaponId,
} from './item.enum';
import { Role } from './role.enum';

// 인증 전용 User DTO
export interface UserDto {
  userId: string;
  role: Role;
}

export interface InventoryItemDto {
  type: InventoryItemType;
  id: WeaponId | ArmorId | ConsumableId;
  quantity: number;
}

export interface CouponDto {
  couponId: CouponId;
  quantity: number;
}

export interface ConsecutiveLoginDto {
  startTime: Date | string;
  count: number;
}

// 비밀번호를 제외한 모든 정보를 포함한 User DTO
export interface AllUserDto extends UserDto {
  role: Role;
  cash: number;
  coins: number;
  inventory: InventoryItemDto[];
  coupons: CouponDto[];
  todayLoginCount: number;
  consecutiveLogin: ConsecutiveLoginDto;
  lastLoginAt: Date | string;
  bannedUntil: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
