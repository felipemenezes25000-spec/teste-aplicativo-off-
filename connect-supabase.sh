#!/bin/bash

# Conexão Supabase PostgreSQL
# Transaction pooler (porta 6543)

PGPASSWORD="RA8fr4ospEIktVmY" psql \
  "postgresql://postgres.cnfadyhxczrldavmlobh:RA8fr4ospEIktVmY@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  -f supabase/setup-complete.sql

echo ""
echo "✅ SQL executado!"
