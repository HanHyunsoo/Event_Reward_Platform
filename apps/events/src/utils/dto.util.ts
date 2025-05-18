import { BadRequestException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  ArmorId,
  ConsumableId,
  InventoryItemType,
  ItemInfoDto,
  RewardDto,
  RewardType,
  WeaponId,
} from '@event-reward-platform/protocol';
import {
  CashReward,
  CoinReward,
  CouponReward,
  ItemReward,
  Reward,
} from '../schemas/reward.subschema';

export function convertRewardToDto(reward: Reward): RewardDto {
  switch (reward.rewardType) {
    case RewardType.ITEM: {
      const itemReward = reward as ItemReward;

      const itemInfo: ItemInfoDto = {
        type: itemReward.itemType,
      };
      if (itemReward.itemType === InventoryItemType.WEAPON) {
        itemInfo.weaponId = itemReward.itemId as WeaponId;
      } else if (itemReward.itemType === InventoryItemType.ARMOR) {
        itemInfo.armorId = itemReward.itemId as ArmorId;
      } else if (itemReward.itemType === InventoryItemType.CONSUMABLE) {
        itemInfo.consumableId = itemReward.itemId as ConsumableId;
      }
      return {
        rewardType: reward.rewardType,
        itemInfo,
        quantity: reward.quantity,
      } as RewardDto;
    }
    case RewardType.COUPON: {
      const couponReward = reward as CouponReward;

      return {
        rewardType: couponReward.rewardType,
        couponId: couponReward.couponId,
        quantity: couponReward.quantity,
      } as RewardDto;
    }
    case RewardType.CASH: {
      const cashReward = reward as CashReward;

      return {
        rewardType: cashReward.rewardType,
        quantity: cashReward.quantity,
      } as RewardDto;
    }
    case RewardType.COIN: {
      const coinReward = reward as CoinReward;

      return {
        rewardType: coinReward.rewardType,
        quantity: coinReward.quantity,
      } as RewardDto;
    }
    default:
      return {
        rewardType: reward.rewardType,
        quantity: reward.quantity,
      } as RewardDto;
  }
}

export function convertRewardDtoToReward(rewardDto: RewardDto): Reward {
  if (rewardDto.rewardType === RewardType.ITEM) {
    return {
      rewardType: rewardDto.rewardType,
      itemType: rewardDto?.itemInfo?.type,
      itemId:
        rewardDto?.itemInfo?.weaponId ??
        rewardDto?.itemInfo?.armorId ??
        rewardDto?.itemInfo?.consumableId,
      quantity: rewardDto.quantity,
    } as ItemReward;
  }

  if (rewardDto.rewardType === RewardType.COUPON) {
    return {
      rewardType: rewardDto.rewardType,
      couponId: rewardDto.couponId,
      quantity: rewardDto.quantity,
    } as CouponReward;
  }

  if (rewardDto.rewardType === RewardType.CASH) {
    return {
      rewardType: rewardDto.rewardType,
      quantity: rewardDto.quantity,
    } as CashReward;
  }

  if (rewardDto.rewardType === RewardType.COIN) {
    return {
      rewardType: rewardDto.rewardType,
      quantity: rewardDto.quantity,
    } as CoinReward;
  }

  throw new RpcException(new BadRequestException('Invalid reward type'));
}
