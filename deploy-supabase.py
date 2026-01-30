#!/usr/bin/env python3
"""
🚀 Deploy completo do schema no Supabase
Executa o SQL e valida a criação das tabelas
"""

import httpx
import asyncio
import json

SUPABASE_URL = "https://cnfadyhxczrldavmlobh.supabase.co"
SUPABASE_KEY = "RQGKyG1piBpRwT7e"  # Service role key

async def execute_sql(sql_content: str):
    """Executa SQL no Supabase via API"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Ler arquivo SQL
    with open('supabase/setup-complete.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("📤 Executando SQL no Supabase...")
    print(f"   Tamanho do script: {len(sql)} caracteres")
    
    # Dividir em comandos individuais
    commands = [cmd.strip() for cmd in sql.split(';') if cmd.strip()]
    print(f"   Total de comandos: {len(commands)}")
    
    # Executar comando por comando (API REST do Supabase não aceita múltiplos comandos)
    # Vamos usar psycopg2 ou a CLI do Supabase
    
    print("\n⚠️  NOTA: O script SQL deve ser executado manualmente no Supabase Dashboard")
    print("   1. Acesse: https://cnfadyhxczrldavmlobh.supabase.co")
    print("   2. Vá em SQL Editor")
    print("   3. Cole o conteúdo de supabase/setup-complete.sql")
    print("   4. Execute")
    
    return True

async def verify_tables():
    """Verifica se as tabelas foram criadas"""
    url = f"{SUPABASE_URL}/rest/v1/"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    
    tables_to_check = [
        'users', 'requests', 'prescriptions', 'exam_requests',
        'consultation_requests', 'chat_messages', 'notifications',
        'pharmacies', 'doctor_schedules', 'nurse_availability'
    ]
    
    print("\n🔍 Verificando tabelas criadas...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        results = {}
        for table in tables_to_check:
            try:
                response = await client.get(
                    f"{url}{table}?select=count",
                    headers={**headers, "Prefer": "count=exact"}
                )
                
                if response.status_code == 200:
                    count = response.headers.get('content-range', '0').split('/')[-1]
                    results[table] = f"✅ OK ({count} registros)"
                else:
                    results[table] = f"❌ ERRO {response.status_code}"
            except Exception as e:
                results[table] = f"❌ {str(e)}"
        
        # Exibir resultados
        print("\n📊 Status das Tabelas:")
        print("=" * 50)
        for table, status in results.items():
            print(f"   {table:30} {status}")
        
        # Contar sucessos
        success = sum(1 for s in results.values() if '✅' in s)
        total = len(results)
        
        print("=" * 50)
        print(f"\n🎯 Resultado: {success}/{total} tabelas OK")
        
        if success == total:
            print("✅ BANCO DE DADOS COMPLETO E FUNCIONANDO!")
            return True
        else:
            print("⚠️  Algumas tabelas não foram criadas. Execute o SQL manualmente.")
            return False

async def test_insert():
    """Testa inserção de dados"""
    url = f"{SUPABASE_URL}/rest/v1/users"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    test_user = {
        "email": "teste@renoveja.com",
        "name": "Usuário Teste",
        "role": "patient",
        "cpf": "11122233344"
    }
    
    print("\n🧪 Testando inserção de dados...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, headers=headers, json=test_user)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data:
                    user_id = data[0].get('id') if isinstance(data, list) else data.get('id')
                    print(f"✅ Inserção bem-sucedida! ID: {user_id}")
                    
                    # Deletar usuário de teste
                    delete_url = f"{url}?id=eq.{user_id}"
                    await client.delete(delete_url, headers=headers)
                    print("🗑️  Usuário de teste removido")
                    
                    return True
            else:
                print(f"❌ Erro na inserção: {response.status_code}")
                print(f"   {response.text}")
                return False
        except Exception as e:
            print(f"❌ Exceção: {str(e)}")
            return False

async def main():
    print("=" * 60)
    print("🏥 RenoveJá+ - Deploy Supabase Database")
    print("=" * 60)
    
    # await execute_sql("")
    
    # Verificar tabelas
    tables_ok = await verify_tables()
    
    if tables_ok:
        # Testar inserção
        insert_ok = await test_insert()
        
        if insert_ok:
            print("\n" + "=" * 60)
            print("🎉 DEPLOY COMPLETO E VALIDADO!")
            print("=" * 60)
            print("\n✅ Próximos passos:")
            print("   1. Rodar backend: cd backend && python server.py")
            print("   2. Rodar frontend: cd frontend && npm start")
            print("   3. Testar app completo")
        else:
            print("\n⚠️  Tabelas OK, mas há problema com inserção")
            print("   Verifique as policies (RLS)")
    else:
        print("\n❌ Execute o SQL manualmente:")
        print("   1. Copie: supabase/setup-complete.sql")
        print("   2. Cole no SQL Editor do Supabase")
        print("   3. Execute e rode este script novamente")

if __name__ == "__main__":
    asyncio.run(main())
