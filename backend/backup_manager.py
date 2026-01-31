#!/usr/bin/env python3
"""
Backup Manager for RenoveJá+
Automated database backup with Supabase integration
"""

import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
import boto3
from typing import Optional, Dict, List
from dotenv import load_dotenv
import httpx
import gzip
import shutil

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BackupManager:
    """Manages automated database backups"""
    
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.backup_dir = Path(os.getenv("BACKUP_DIR", "./backups"))
        self.backup_dir.mkdir(exist_ok=True)
        
        # S3 configuration (optional)
        self.s3_bucket = os.getenv("BACKUP_S3_BUCKET")
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.aws_region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
        
        # Backup retention
        self.local_retention_days = int(os.getenv("BACKUP_LOCAL_RETENTION_DAYS", "7"))
        self.remote_retention_days = int(os.getenv("BACKUP_REMOTE_RETENTION_DAYS", "30"))
        
    def backup_database(self) -> Optional[str]:
        """
        Create a database backup
        
        Returns:
            Path to the backup file or None if failed
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"renoveja_backup_{timestamp}.json"
        backup_path = self.backup_dir / backup_name
        
        try:
            logger.info(f"Starting database backup: {backup_name}")
            
            # Export all tables
            tables = [
                "users", "doctor_profiles", "nurse_profiles",
                "requests", "payments", "messages", "notifications",
                "ratings", "prescriptions", "exams", "consultations"
            ]
            
            backup_data = {
                "timestamp": datetime.now().isoformat(),
                "version": "2.0.0",
                "tables": {}
            }
            
            # Backup each table
            for table in tables:
                logger.info(f"Backing up table: {table}")
                data = self._export_table(table)
                if data is not None:
                    backup_data["tables"][table] = data
                    logger.info(f"Backed up {len(data)} records from {table}")
            
            # Write backup file
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            # Compress backup
            compressed_path = self._compress_backup(backup_path)
            
            logger.info(f"Database backup completed: {compressed_path}")
            return str(compressed_path)
            
        except Exception as e:
            logger.error(f"Backup failed: {str(e)}")
            if backup_path.exists():
                backup_path.unlink()
            return None
    
    def _export_table(self, table_name: str) -> Optional[List[Dict]]:
        """Export a single table from Supabase"""
        try:
            url = f"{self.supabase_url}/rest/v1/{table_name}"
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            # Paginate through all records
            all_records = []
            offset = 0
            limit = 1000
            
            while True:
                params = {
                    "select": "*",
                    "offset": offset,
                    "limit": limit
                }
                
                with httpx.Client() as client:
                    response = client.get(url, headers=headers, params=params)
                    response.raise_for_status()
                    
                    records = response.json()
                    if not records:
                        break
                    
                    all_records.extend(records)
                    
                    if len(records) < limit:
                        break
                    
                    offset += limit
            
            return all_records
            
        except Exception as e:
            logger.error(f"Failed to export table {table_name}: {str(e)}")
            return None
    
    def _compress_backup(self, backup_path: Path) -> Path:
        """Compress backup file using gzip"""
        compressed_path = backup_path.with_suffix('.json.gz')
        
        with open(backup_path, 'rb') as f_in:
            with gzip.open(compressed_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        
        # Remove uncompressed file
        backup_path.unlink()
        
        return compressed_path
    
    def upload_to_s3(self, backup_path: str) -> bool:
        """
        Upload backup to S3
        
        Args:
            backup_path: Path to the backup file
            
        Returns:
            True if successful, False otherwise
        """
        if not all([self.s3_bucket, self.aws_access_key, self.aws_secret_key]):
            logger.warning("S3 not configured, skipping remote backup")
            return False
        
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
                region_name=self.aws_region
            )
            
            file_name = Path(backup_path).name
            s3_key = f"renoveja-backups/{file_name}"
            
            logger.info(f"Uploading backup to S3: {s3_key}")
            
            with open(backup_path, 'rb') as f:
                s3_client.upload_fileobj(
                    f, 
                    self.s3_bucket, 
                    s3_key,
                    ExtraArgs={
                        'ServerSideEncryption': 'AES256',
                        'StorageClass': 'STANDARD_IA'  # Infrequent Access for cost savings
                    }
                )
            
            logger.info(f"Backup uploaded successfully to S3")
            return True
            
        except Exception as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            return False
    
    def cleanup_old_backups(self):
        """Remove old backup files based on retention policy"""
        now = datetime.now()
        
        # Clean local backups
        for backup_file in self.backup_dir.glob("renoveja_backup_*.json.gz"):
            file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
            age_days = (now - file_time).days
            
            if age_days > self.local_retention_days:
                logger.info(f"Removing old local backup: {backup_file.name} ({age_days} days old)")
                backup_file.unlink()
        
        # Clean S3 backups (if configured)
        if all([self.s3_bucket, self.aws_access_key, self.aws_secret_key]):
            try:
                self._cleanup_s3_backups()
            except Exception as e:
                logger.error(f"Failed to cleanup S3 backups: {str(e)}")
    
    def _cleanup_s3_backups(self):
        """Remove old backups from S3"""
        s3_client = boto3.client(
            's3',
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.aws_region
        )
        
        # List objects in backup prefix
        response = s3_client.list_objects_v2(
            Bucket=self.s3_bucket,
            Prefix='renoveja-backups/'
        )
        
        if 'Contents' not in response:
            return
        
        now = datetime.now()
        objects_to_delete = []
        
        for obj in response['Contents']:
            age_days = (now - obj['LastModified'].replace(tzinfo=None)).days
            if age_days > self.remote_retention_days:
                objects_to_delete.append({'Key': obj['Key']})
                logger.info(f"Marking S3 backup for deletion: {obj['Key']} ({age_days} days old)")
        
        if objects_to_delete:
            s3_client.delete_objects(
                Bucket=self.s3_bucket,
                Delete={'Objects': objects_to_delete}
            )
            logger.info(f"Deleted {len(objects_to_delete)} old backups from S3")
    
    def restore_from_backup(self, backup_file: str) -> bool:
        """
        Restore database from backup file
        
        Args:
            backup_file: Path to the backup file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.warning(f"Starting database restore from: {backup_file}")
            
            # Decompress if needed
            if backup_file.endswith('.gz'):
                with gzip.open(backup_file, 'rt', encoding='utf-8') as f:
                    backup_data = json.load(f)
            else:
                with open(backup_file, 'r', encoding='utf-8') as f:
                    backup_data = json.load(f)
            
            # Verify backup format
            if 'tables' not in backup_data:
                logger.error("Invalid backup format")
                return False
            
            logger.info(f"Backup created at: {backup_data.get('timestamp')}")
            logger.info(f"Backup version: {backup_data.get('version')}")
            
            # Restore each table
            for table_name, records in backup_data['tables'].items():
                logger.info(f"Restoring table {table_name}: {len(records)} records")
                success = self._restore_table(table_name, records)
                if not success:
                    logger.error(f"Failed to restore table: {table_name}")
                    return False
            
            logger.info("Database restore completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Restore failed: {str(e)}")
            return False
    
    def _restore_table(self, table_name: str, records: List[Dict]) -> bool:
        """Restore a single table to Supabase"""
        try:
            url = f"{self.supabase_url}/rest/v1/{table_name}"
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"  # Upsert behavior
            }
            
            # Restore in batches
            batch_size = 100
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                
                with httpx.Client() as client:
                    response = client.post(url, headers=headers, json=batch)
                    response.raise_for_status()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to restore table {table_name}: {str(e)}")
            return False

def run_backup():
    """Run automated backup process"""
    manager = BackupManager()
    
    # Create backup
    backup_path = manager.backup_database()
    if not backup_path:
        logger.error("Backup creation failed")
        return False
    
    # Upload to S3 (if configured)
    manager.upload_to_s3(backup_path)
    
    # Cleanup old backups
    manager.cleanup_old_backups()
    
    return True

if __name__ == "__main__":
    # Run backup when executed directly
    success = run_backup()
    exit(0 if success else 1)