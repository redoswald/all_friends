#!/bin/bash

# All Friends PRM - Database Backup Script
# Run this monthly: ./scripts/backup.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d)
FILENAME="backup_${DATE}.sql"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check for DIRECT_URL
if [ -z "$DIRECT_URL" ]; then
  echo "Error: DIRECT_URL environment variable not set"
  echo ""
  echo "Run with:"
  echo "  DIRECT_URL='postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres' ./scripts/backup.sh"
  exit 1
fi

echo "Backing up database to ${BACKUP_DIR}/${FILENAME}..."

pg_dump "$DIRECT_URL" > "${BACKUP_DIR}/${FILENAME}"

if [ $? -eq 0 ]; then
  echo "Backup complete: ${BACKUP_DIR}/${FILENAME}"
  echo "Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"
else
  echo "Backup failed!"
  exit 1
fi
