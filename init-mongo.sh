#!/bin/bash
set -e

mongosh <<EOF
use admin

db.createUser({
  user: "${USER_SERVICE_USERNAME}",
  pwd: "${USER_SERVICE_PASSWORD}",
  roles: [{ role: "readWrite", db: "${USER_SERVICE_DATABASE}" }]
})

db.createUser({
  user: "${EVENT_SERVICE_USERNAME}",
  pwd: "${EVENT_SERVICE_PASSWORD}",
  roles: [{ role: "readWrite", db: "${EVENT_SERVICE_DATABASE}" }]
})

use ${USER_SERVICE_DATABASE}
db.createCollection("users")

use ${EVENT_SERVICE_DATABASE}
db.createCollection("events")

EOF
