"""Debug script to check what's happening with the backend"""
import sys
import os
import traceback

# Change to backend directory
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
sys.path.insert(0, '.')

print("=" * 60)
print("DEBUG: Verificando backend RenoveJá+")
print("=" * 60)
print(f"Python: {sys.version}")
print(f"CWD: {os.getcwd()}")
print()

# Check .env
print("[1] Verificando .env...")
if os.path.exists('.env'):
    print("    .env existe")
    with open('.env', 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('SUPABASE'):
                key = line.split('=')[0]
                val = line.split('=')[1][:30] if '=' in line else ''
                print(f"    {key}={val}...")
else:
    print("    .env NÃO EXISTE!")

print()
print("[2] Importando dependências...")
try:
    import fastapi
    print(f"    fastapi: {fastapi.__version__}")
except ImportError as e:
    print(f"    ERRO fastapi: {e}")

try:
    import uvicorn
    print(f"    uvicorn OK")
except ImportError as e:
    print(f"    ERRO uvicorn: {e}")

try:
    import httpx
    print(f"    httpx OK")
except ImportError as e:
    print(f"    ERRO httpx: {e}")

try:
    import bcrypt
    print(f"    bcrypt OK")
except ImportError as e:
    print(f"    ERRO bcrypt: {e}")

print()
print("[3] Importando server.py...")
try:
    from server import app
    print(f"    ✓ App carregado: {app.title}")
except Exception as e:
    print(f"    ✗ ERRO ao importar server:")
    traceback.print_exc()
    sys.exit(1)

print()
print("[4] Iniciando servidor...")
print("    URL: http://localhost:8001")
print("    Docs: http://localhost:8001/docs")
print()

try:
    uvicorn.run(app, host="0.0.0.0", port=8001)
except Exception as e:
    print(f"ERRO ao iniciar: {e}")
    traceback.print_exc()
