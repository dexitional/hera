#!/bin/bash
# 1. Load runtime variables from core production configuration environment
export $(grep -v '^#' .env.production | xargs)

BACKUP_DIR="/var/backups/db"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="$BACKUP_DIR/voting_backup_$TIMESTAMP.sql.gz"

# Ensure the targeted destination backup directory matches system pathways
mkdir -p $BACKUP_DIR

echo "⏳ Initiating continuous data stream compression snapshot to $FILENAME..."

# 2. Extract database structure and records using pg_dump utility variables
# Parses values directly out of your connection parameters string automatically
pg_dump $DATABASE_URL | gzip > $FILENAME

# 3. Retain records conservatively to prevent filling up VPS storage disks
# Automatically finds and deletes any backup snapshot files older than 7 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete

echo "✅ Backup compression snapshot captured cleanly."
