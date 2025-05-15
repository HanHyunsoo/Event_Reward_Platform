#!/bin/bash
set -e

mongosh <<EOF

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
    "username": "admin",
    "password": "admin",
    "role": "ADMIN"
})

EOF
