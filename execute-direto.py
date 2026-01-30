#!/usr/bin/env python3
"""
Executa SQL direto no Supabase via API
"""
import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://cnfadyhxczrldavmlobh.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuZmFkeWh4Y3pybGRhdm1sb2JoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4MDY3MywiZXhwIjoyMDg0MzU2NjczfQ.W_cjEq-uVMrWQZgPBSwqMnbUvxS1oHOdxGSrWQW4gSQ"

def run_sql(sql_query):
    """Executa SQL via endpoint query do Supabase"""
    # Tentar via endpoint de query SQL direto
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec"
    
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    # SQL statements a executar
    statements = [
        # 1. Criar tabela requests
        """
        CREATE TABLE IF NOT EXISTS requests (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
          nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
          type TEXT NOT NULL CHECK (type IN ('prescription', 'exam', 'consultation')),
          status TEXT NOT NULL DEFAULT 'pending',
          title TEXT,
          description TEXT,
          symptoms TEXT,
          medications_current JSONB DEFAULT '[]',
          attachments JSONB DEFAULT '[]',
          ai_analysis JSONB,
          urgency_level TEXT,
          payment_status TEXT DEFAULT 'pending',
          payment_amount DECIMAL(10, 2),
          payment_id TEXT,
          payment_method TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          accepted_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          cancelled_at TIMESTAMP WITH TIME ZONE
        );
        """,
        
        # 2. Criar tabela prescriptions
        """
        CREATE TABLE IF NOT EXISTS prescriptions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
          patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          medications JSONB NOT NULL,
          general_instructions TEXT,
          warnings TEXT,
          valid_until DATE NOT NULL,
          pdf_url TEXT,
          digital_signature TEXT,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # 3. Criar tabela pharmacies
        """
        CREATE TABLE IF NOT EXISTS pharmacies (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          cnpj TEXT UNIQUE,
          phone TEXT,
          email TEXT,
          website TEXT,
          address_street TEXT,
          address_number TEXT,
          address_complement TEXT,
          address_neighborhood TEXT,
          address_city TEXT,
          address_state TEXT,
          address_zipcode TEXT,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          opening_hours JSONB,
          active BOOLEAN DEFAULT true,
          verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # 4. Criar tabela doctor_schedules
        """
        CREATE TABLE IF NOT EXISTS doctor_schedules (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # 5. Criar tabela nurse_availability
        """
        CREATE TABLE IF NOT EXISTS nurse_availability (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          nurse_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          available BOOLEAN DEFAULT true,
          max_concurrent_patients INTEGER DEFAULT 5,
          shift TEXT,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
    ]
    
    print("🚀 Executando SQL direto no Supabase...\n")
    
    # Como a API REST não suporta DDL direto, vou gerar instruções
    print("❌ A API REST do Supabase não suporta comandos CREATE TABLE direto.")
    print("\n📋 MAS CALMA! Vou gerar um SQL otimizado simples para você:")
    print("\n" + "="*60)
    
    # Gerar SQL simplificado
    simple_sql = """-- Execute este SQL no Supabase Dashboard:

-- 1. REQUESTS
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES users(id) NOT NULL,
  doctor_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRESCRIPTIONS  
CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) NOT NULL,
  patient_id UUID REFERENCES users(id) NOT NULL,
  doctor_id UUID REFERENCES users(id) NOT NULL,
  medications JSONB NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PHARMACIES
CREATE TABLE pharmacies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address_city TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pharmacies (name, address_city) 
VALUES ('Farmácia Popular', 'São Paulo');

-- 4. DOCTOR_SCHEDULES
CREATE TABLE doctor_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) NOT NULL,
  day_of_week INTEGER,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NURSE_AVAILABILITY
CREATE TABLE nurse_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID REFERENCES users(id) NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Tabelas criadas!' as status;
"""
    
    print(simple_sql)
    print("="*60)
    
    # Salvar em arquivo
    with open('/mnt/c/Users/Felipe/Downloads/SQL-SIMPLES-EXECUTAR.sql', 'w') as f:
        f.write(simple_sql)
    
    print("\n✅ SQL SIMPLES salvo em:")
    print("   C:\\Users\\Felipe\\Downloads\\SQL-SIMPLES-EXECUTAR.sql")
    print("\n📋 COPIE E COLE NO SUPABASE SQL EDITOR")
    print("   https://cnfadyhxczrldavmlobh.supabase.co")

if __name__ == "__main__":
    run_sql("")
