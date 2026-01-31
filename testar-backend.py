"""Script de teste para verificar se o backend carrega corretamente"""
import sys
import os

# Adicionar backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))

print("=" * 50)
print("Testando carregamento do backend RenoveJá+")
print("=" * 50)

try:
    print("\n1. Carregando variáveis de ambiente...")
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / 'backend' / '.env', encoding='utf-8')
    
    supabase_url = os.getenv('SUPABASE_URL', '')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
    
    print(f"   SUPABASE_URL: {supabase_url[:50]}..." if supabase_url else "   SUPABASE_URL: NÃO CONFIGURADO")
    print(f"   SUPABASE_KEY: {supabase_key[:30]}..." if supabase_key else "   SUPABASE_KEY: NÃO CONFIGURADO")
    
    # Verificar se é anon ou service_role
    if supabase_key:
        import base64
        import json
        try:
            payload = supabase_key.split('.')[1]
            # Adicionar padding
            payload += '=' * (4 - len(payload) % 4)
            decoded = json.loads(base64.urlsafe_b64decode(payload))
            role = decoded.get('role', 'unknown')
            print(f"   Role do token: {role}")
            if role == 'anon':
                print("   ⚠️  AVISO: Usando anon key - algumas operações podem falhar!")
        except:
            pass
    
    print("\n2. Importando módulo database...")
    from database import db, find_one
    print("   ✅ database importado")
    
    print("\n3. Importando módulo server...")
    from server import app
    print("   ✅ server importado")
    print(f"   App: {app.title} v{app.version}")
    
    print("\n4. Testando conexão com Supabase...")
    import asyncio
    async def test_connection():
        try:
            result = await db.select('users', limit=1)
            if result is not None:
                print(f"   ✅ Conexão OK - {len(result) if isinstance(result, list) else 1} usuário(s) encontrado(s)")
                return True
            else:
                print("   ⚠️  Conexão OK mas resultado vazio")
                return True
        except Exception as e:
            print(f"   ❌ Erro na conexão: {e}")
            return False
    
    asyncio.run(test_connection())
    
    print("\n" + "=" * 50)
    print("✅ Backend carregado com sucesso!")
    print("=" * 50)
    print("\nPara iniciar o servidor, execute:")
    print("  cd backend")
    print("  python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001")
    
except Exception as e:
    print(f"\n❌ ERRO: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
