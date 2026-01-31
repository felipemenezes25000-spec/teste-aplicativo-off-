"""
Atualiza a senha dos usuários de teste para Teste123!
Execute: python atualizar_senhas_teste.py
"""
import asyncio
import os
import sys
from pathlib import Path

# Garantir que estamos no backend
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ".")

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env", encoding="utf-8")

import bcrypt
from database import db

SENHA = "Teste123!"
HASH = bcrypt.hashpw(SENHA.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

async def main():
    for email in ["teste@renoveja.com", "medico@renoveja.com"]:
        result = await db.update("users", {"password_hash": HASH}, {"email": email})
        if result is not None:
            print(f"OK: Senha de {email} atualizada para Teste123!")
        else:
            print(f"ERRO: Não foi possível atualizar {email}")

if __name__ == "__main__":
    asyncio.run(main())
