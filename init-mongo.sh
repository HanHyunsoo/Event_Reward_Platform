#!/bin/bash
set -e

mongosh <<'EOF'

use admin

db.createUser({
  user: "user",
  pwd: "user",
  roles: [{ role: "readWrite", db: "user_service" }]
})

db.createUser({
  user: "event",
  pwd: "event",
  roles: [{ role: "readWrite", db: "event_service" }]
})

use user_service
db.users.insertOne({
    "userId": "admin",
    "password": "$2b$10$iEg7XYpW6mSk3vs7DH0kG.DJTljPM.mcDsSBJ/mnP014UnK68K2ye",
    "role": "admin",
    "cash": 0,
    "coins": 0,
    "inventory": [],
    "coupons": [],
    "todayLoginCount": 0,
    "consecutiveLogin": {
      "startTime": new Date(),
      "count": 0
    },
    "lastLoginAt": new Date(),
    "bannedUntil": new Date()
})

use event_service
// 누적 로그인 횟수 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  challenge: {
    type: "continuousLoginCount",
    loginCount: 7
  },
  rewards: [
    {
      rewardType: "cash",
      quantity: 1000
    },
    {
      rewardType: "coin", 
      quantity: 500
    }
  ],
  creatorId: "admin"
})

// 복귀 유저 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  challenge: {
    type: "returnUser",
    daysSinceLastLogin: 30
  },
  rewards: [
    {
      rewardType: "item",
      itemType: "weapon",
      itemId: "sword1",
      quantity: 1
    }
  ],
  creatorId: "admin"
})

// 캐시 소유 이상 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  challenge: {
    type: "cashGreaterThanOrEqual",
    cash: 5000
  },
  rewards: [
    {
      rewardType: "coupon",
      couponId: "coupon1",
      quantity: 1
    }
  ],
  rewardLimit: 100,
  creatorId: "admin"
})

// 캐시 소유 이하 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  challenge: {
    type: "cashLessThanOrEqual",
    cash: 1000
  },
  rewards: [
    {
      rewardType: "item",
      itemType: "armor",
      itemId: "fullbody1"
      quantity: 1
    }
  ],
  creatorId: "admin"
})

// 코인 소유 이상 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  challenge: {
    type: "coinGreaterThanOrEqual",
    coin: 10000
  },
  rewards: [
    {
      rewardType: "item",
      itemType: "weapon",
      itemId: "axe1",
      quantity: 1
    }
  ],
  creatorId: "admin"
})

// 코인 소유 이하 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  challenge: {
    type: "coinLessThanOrEqual",
    coin: 500
  },
  rewards: [
    {
      rewardType: "item",
      itemType: "consumable",
      itemId: "healthPotion",
      quantity: 3
    }
  ],
  creatorId: "admin"
})

// 모든 아이템 소유 개수 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  challenge: {
    type: "allItemCount",
    count: 5
  },
  rewards: [
    {
      rewardType: "item",
      itemType: "armor",
      itemId: "gloves1",
      quantity: 1
    },
    {
      rewardType: "item",
      itemType: "armor",
      itemId: "boots1",
      quantity: 1
    }
  ],
  creatorId: "admin"
})

// 특정 아이템 소유 개수 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  challenge: {
    type: "specificItemCount",
    itemId: "bow1",
    count: 2
  },
  rewards: [
    {
      rewardType: "item",
      itemType: "consumable",
      itemId: "manaPotion",
      quantity: 5
    }
  ],
  creatorId: "admin"
})

// 조건 없는 이벤트
db.events.insertOne({
  startTime: new Date(),
  endTime: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  isPublic: true,
  rewards: [
    {
      rewardType: "item",
      itemType: "consumable",
      itemId: "manaPotion",
      quantity: 5
    }
  ],
  creatorId: "admin"
})

EOF
