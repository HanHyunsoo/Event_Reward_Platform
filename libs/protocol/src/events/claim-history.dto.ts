import { ClaimStatus } from '@event-reward-platform/protocol';

export interface ClaimHistoryDto {
  eventId: string;
  userId: string;
  status: ClaimStatus;
  failureCause?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
