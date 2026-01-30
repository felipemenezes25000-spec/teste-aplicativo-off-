#!/usr/bin/env python3
"""
🔍 Verifica se o Supabase está configurado corretamente
"""

import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://cnfadyhxczrldavmlobh.supabase.co"
SUPABASE_KEY = "RQGKyG1piBpRwT7e"

def check_table(table_name):
    """Verifica se uma tabela existe e retorna o count"""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=count"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "count=exact"
    }
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            content_range = response.headers.get('content-range', '0')
            count = content_range.split('/')[-1] if '/' in content_range else '0'
            return True, int(count)
    except urllib.error.HTTPError as e:
        return False, str(e.code)
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("🔍 Verificação do Banco de Dados Supabase")
    print("=" * 60)
    print(f"\n📍 URL: {SUPABASE_URL}")
    
    tables = [
        'users', 'requests', 'prescriptions', 'exam_requests',
        'consultation_requests', 'chat_messages', 'notifications',
        'pharmacies', 'doctor_schedules', 'nurse_availability'
    ]
    
    print("\n📊 Verificando tabelas...\n")
    
    results = {}
    for table in tables:
        exists, count = check_table(table)
        results[table] = (exists, count)
        
        if exists:
            print(f"   ✅ {table:30} OK ({count} registros)")
        else:
            print(f"   ❌ {table:30} ERRO: {count}")
    
    # Contar sucessos
    success = sum(1 for exists, _ in results.values() if exists)
    total = len(results)
    
    print("\n" + "=" * 60)
    print(f"🎯 Resultado: {success}/{total} tabelas encontradas")
    print("=" * 60)
    
    if success == total:
        print("\n✅ BANCO DE DADOS CONFIGURADO CORRETAMENTE!")
        print("\n🚀 Próximos passos:")
        print("   1. cd backend && python server.py")
        print("   2. cd frontend && npm start")
        return 0
    elif success == 0:
        print("\n❌ NENHUMA TABELA ENCONTRADA!")
        print("\n📋 Você precisa executar o SQL no Supabase:")
        print("   1. Abra: https://cnfadyhxczrldavmlobh.supabase.co")
        print("   2. Vá em SQL Editor")
        print("   3. Cole o conteúdo de: supabase/setup-complete.sql")
        print("   4. Execute (RUN)")
        print("\n📄 Veja instruções detalhadas em: DEPLOY-SUPABASE-MANUAL.md")
        return 1
    else:
        print(f"\n⚠️  CONFIGURAÇÃO PARCIAL ({success}/{total})")
        print("\n   Algumas tabelas estão faltando.")
        print("   Execute o SQL novamente no Supabase Dashboard.")
        return 1

if __name__ == "__main__":
    exit(main())
