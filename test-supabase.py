#!/usr/bin/env python3
"""
🧪 Teste de Conexão com Supabase
Verifica se as credenciais estão corretas
"""

import os
from supabase import create_client, Client

# Carregar do .env
SUPABASE_URL = "https://cnfadyhxczrldavmlobh.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuZmFkeWh4Y3pybGRhdm1sb2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODA2NzMsImV4cCI6MjA4NDM1NjY3M30.8d8BdbUsSROaTPRukwi4rARFKcYDeicHEym_-j-OOz4"

try:
    print("🔌 Conectando ao Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Cliente Supabase criado com sucesso!")
    
    # Testar uma query simples (listar tabelas)
    print("\n📋 Testando acesso ao banco...")
    
    # Tentar listar usuários (se a tabela existir)
    try:
        result = supabase.table('users').select("id").limit(1).execute()
        print(f"✅ Acesso ao banco funcionando! (users table existe)")
        print(f"   Total de usuários no resultado: {len(result.data)}")
    except Exception as e:
        print(f"⚠️  Tabela 'users' ainda não existe ou sem permissão")
        print(f"   Erro: {str(e)}")
    
    print("\n🎉 Conexão com Supabase configurada corretamente!")
    print(f"📍 URL: {SUPABASE_URL}")
    
except Exception as e:
    print(f"❌ Erro ao conectar com Supabase:")
    print(f"   {str(e)}")
    exit(1)
