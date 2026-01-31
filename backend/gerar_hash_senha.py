"""Gera hash bcrypt para senha de teste (rodar uma vez para atualizar o banco)."""
import bcrypt
import os
import sys

# Garantir que estamos no backend
os.chdir(os.path.dirname(os.path.abspath(__file__)))

SENHA = "Teste123!"
hash_bytes = bcrypt.hashpw(SENHA.encode("utf-8"), bcrypt.gensalt())
hash_str = hash_bytes.decode("utf-8")
print(hash_str)
sys.exit(0)
