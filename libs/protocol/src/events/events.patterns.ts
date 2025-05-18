export const EVENT_PATTERNS = {
  HEALTH_CHECK: 'events.healthCheck',
  CREATE_EVENT: 'events.createEvent',
  GET_EVENT_BY_ID: 'events.getEventById',
  GET_EVENTS: 'events.getEvents',
  UPDATE_REWARDS: 'events.updateRewards',
  GET_REWARDS: 'events.getRewards',
  CLAIM_REWARD: 'events.claimReward',
} as const;
