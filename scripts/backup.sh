#!/bin/sh
# PostgreSQL Backup Script for Robotics Academy
# Usage: ./scripts/backup.sh
# Environment variables:
#   DB_HOST     - Database host (default: postgres)
#   DB_USER     - Database user (default: postgres)
#   DB_NAME     - Database name (default: robotics_academy)
#   PGPASSWORD  - Database password (set via environment)
#   BACKUP_DIR  - Backup directory (default: /backups)
#   RETENTION_DAYS - Days to keep backups (default: 30)

set -e

# Restrict file permissions for new files (owner read/write only)
umask 077

DB_HOST="${DB_HOST:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-robotics_academy}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of ${DB_NAME}..."

# Run pg_dump and compress
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    # Ensure backup file is only readable by owner
    chmod 600 "$BACKUP_FILE"
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup completed: ${BACKUP_FILE} (${SIZE})"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

# Remove old backups
if [ "$RETENTION_DAYS" -gt 0 ]; then
    DELETED=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
    if [ "$DELETED" -gt 0 ]; then
        echo "[$(date)] Removed ${DELETED} backup(s) older than ${RETENTION_DAYS} days"
    fi
fi

echo "[$(date)] Backup process complete"
