#!/usr/bin/env python3
"""
Executa SQL diretamente no Supabase usando urllib (sem dependências extras)
"""

import urllib.request
import urllib.error
import json
import ssl

SUPABASE_URL = "https://cnfadyhxczrldavmlobh.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuZmFkeWh4Y3pybGRhdm1sb2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODA2NzMsImV4cCI6MjA4NDM1NjY3M30.8d8BdbUsSROaTPRukwi4rARFKcYDeicHEym_-j-OOz4"

# Criar contexto SSL que não valida certificados (só para desenvolvimento)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def create_table_via_rest(table_sql):
    """
    Tenta criar tabela usando a API REST do Supabase
    NOTA: Isto NÃO vai funcionar para DDL (CREATE TABLE)
    A API REST só aceita DML (SELECT, INSERT, UPDATE, DELETE)
    """
    print("⚠️  A API REST do Supabase NÃO suporta comandos DDL (CREATE TABLE)")
    print("   É necessário usar o SQL Editor no Dashboard")
    return False

def check_existing_tables():
    """Verifica quais tabelas já existem"""
    print("\n🔍 Verificando tabelas existentes...\n")
    
    tables_to_check = [
        'users', 'requests', 'prescriptions', 'exam_requests',
        'consultation_requests', 'chat_messages', 'notifications',
        'pharmacies', 'doctor_schedules', 'nurse_availability'
    ]
    
    existing = []
    missing = []
    
    for table in tables_to_check:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select=count&limit=0"
        headers = {
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Prefer": "count=exact"
        }
        
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5, context=ctx) as response:
                content_range = response.headers.get('content-range', '0')
                count = content_range.split('/')[-1] if '/' in content_range else '0'
                existing.append((table, count))
                print(f"   ✅ {table:30} existe ({count} registros)")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                missing.append(table)
                print(f"   ❌ {table:30} NÃO EXISTE")
            else:
                missing.append(table)
                print(f"   ⚠️  {table:30} erro {e.code}")
        except Exception as e:
            missing.append(table)
            print(f"   ❌ {table:30} erro: {str(e)[:50]}")
    
    print(f"\n📊 Resultado:")
    print(f"   ✅ Existentes: {len(existing)}")
    print(f"   ❌ Faltando: {len(missing)}")
    
    if missing:
        print(f"\n🔴 Tabelas faltando: {', '.join(missing)}")
    
    return existing, missing

def main():
    print("=" * 70)
    print("🗄️  Deploy SQL no Supabase")
    print("=" * 70)
    
    # Verificar tabelas existentes
    existing, missing = check_existing_tables()
    
    if len(missing) > 0:
        print("\n" + "=" * 70)
        print("⚠️  ATENÇÃO: Tabelas faltando!")
        print("=" * 70)
        print("\n📋 VOCÊ PRECISA EXECUTAR O SQL MANUALMENTE:")
        print("\n1. Abra: https://cnfadyhxczrldavmlobh.supabase.co")
        print("2. Clique em 'SQL Editor' (barra lateral)")
        print("3. Clique em '+ New query'")
        print("4. Copie TODO o conteúdo de: supabase/setup-complete.sql")
        print("5. Cole no editor")
        print("6. Clique em 'RUN' ou pressione Ctrl/Cmd + Enter")
        print("7. Aguarde ~60 segundos")
        print("8. Execute este script novamente para validar")
        print("\n📄 Arquivo SQL: supabase/setup-complete.sql")
        print("   Tamanho: ~20KB, ~200 comandos SQL")
        return 1
    else:
        print("\n" + "=" * 70)
        print("✅ TODAS AS TABELAS JÁ EXISTEM!")
        print("=" * 70)
        print("\n🎉 Banco de dados configurado corretamente!")
        print("\n🚀 Próximos passos:")
        print("   1. cd backend && python server.py")
        print("   2. cd frontend && npm start")
        return 0

if __name__ == "__main__":
    exit(main())
