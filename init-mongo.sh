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
    "todayLoginCount": 0,
    "consecutiveLogin": {
      "startTime": new Date(),
      "count": 0
    },
    "lastLoginAt": new Date(),
    "bannedUntil": new Date()
})

EOF
