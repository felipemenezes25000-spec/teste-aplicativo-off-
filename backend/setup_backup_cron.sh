#!/bin/bash
# Setup automated backup cron job for RenoveJá+

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up automated backup for RenoveJá+${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create backup directory
BACKUP_DIR="${SCRIPT_DIR}/backups"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓${NC} Created backup directory: $BACKUP_DIR"

# Create backup script
BACKUP_SCRIPT="${SCRIPT_DIR}/run_backup.sh"
cat > "$BACKUP_SCRIPT" << EOF
#!/bin/bash
# RenoveJá+ Automated Backup Script

# Load environment variables
source "${SCRIPT_DIR}/.env"

# Run backup
cd "${SCRIPT_DIR}"
python3 backup_manager.py >> "${BACKUP_DIR}/backup.log" 2>&1

# Rotate logs (keep last 10 backup logs)
if [ -f "${BACKUP_DIR}/backup.log" ]; then
    tail -n 10000 "${BACKUP_DIR}/backup.log" > "${BACKUP_DIR}/backup.log.tmp"
    mv "${BACKUP_DIR}/backup.log.tmp" "${BACKUP_DIR}/backup.log"
fi
EOF

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"
echo -e "${GREEN}✓${NC} Created backup script: $BACKUP_SCRIPT"

# Add cron job (runs daily at 2 AM)
CRON_JOB="0 2 * * * $BACKUP_SCRIPT"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo -e "${YELLOW}!${NC} Backup cron job already exists"
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓${NC} Added cron job: Backup runs daily at 2:00 AM"
fi

# Create systemd service (alternative to cron)
SYSTEMD_SERVICE="/etc/systemd/system/renoveja-backup.service"
SYSTEMD_TIMER="/etc/systemd/system/renoveja-backup.timer"

# Check if running with sudo for systemd setup
if [ "$EUID" -eq 0 ]; then
    # Create systemd service
    cat > "$SYSTEMD_SERVICE" << EOF
[Unit]
Description=RenoveJá+ Database Backup
After=network.target

[Service]
Type=oneshot
ExecStart=$BACKUP_SCRIPT
WorkingDirectory=$SCRIPT_DIR
StandardOutput=append:${BACKUP_DIR}/backup.log
StandardError=append:${BACKUP_DIR}/backup.log

[Install]
WantedBy=multi-user.target
EOF

    # Create systemd timer
    cat > "$SYSTEMD_TIMER" << EOF
[Unit]
Description=Run RenoveJá+ backup daily
Requires=renoveja-backup.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

    # Enable and start timer
    systemctl daemon-reload
    systemctl enable renoveja-backup.timer
    systemctl start renoveja-backup.timer
    
    echo -e "${GREEN}✓${NC} Created and enabled systemd timer"
else
    echo -e "${YELLOW}!${NC} Run with sudo to setup systemd timer (optional)"
fi

# Create manual backup command
MANUAL_BACKUP="${SCRIPT_DIR}/backup_now.sh"
cat > "$MANUAL_BACKUP" << EOF
#!/bin/bash
# Manual backup command for RenoveJá+

echo "Starting manual backup..."
"$BACKUP_SCRIPT"
echo "Backup completed. Check ${BACKUP_DIR}/backup.log for details."
EOF

chmod +x "$MANUAL_BACKUP"
echo -e "${GREEN}✓${NC} Created manual backup command: $MANUAL_BACKUP"

# Add backup configuration to .env.example
if ! grep -q "BACKUP_DIR" "${SCRIPT_DIR}/.env.example"; then
    cat >> "${SCRIPT_DIR}/.env.example" << EOF

# ===========================================
# BACKUP - RECOMENDADO
# ===========================================
# Local backup directory
BACKUP_DIR=./backups

# Retention policy (days)
BACKUP_LOCAL_RETENTION_DAYS=7
BACKUP_REMOTE_RETENTION_DAYS=30

# AWS S3 (opcional - para backup remoto)
BACKUP_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
EOF
    echo -e "${GREEN}✓${NC} Updated .env.example with backup configuration"
fi

echo -e "\n${GREEN}Backup automation setup complete!${NC}"
echo -e "\nBackup schedule:"
echo -e "  - Automatic: Daily at 2:00 AM"
echo -e "  - Manual: Run ${YELLOW}${MANUAL_BACKUP}${NC}"
echo -e "  - Logs: ${YELLOW}${BACKUP_DIR}/backup.log${NC}"

# Test backup
echo -e "\n${YELLOW}Would you like to run a test backup now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Running test backup..."
    "$MANUAL_BACKUP"
fi