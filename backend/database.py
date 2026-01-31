"""
Supabase Database Module
Handles all database operations using Supabase Python client
Includes in-memory mock database for development/testing
"""

import os
from pathlib import Path
from typing import Optional, List, Dict, Any, Union
from dotenv import load_dotenv
import httpx
import json
import uuid
from datetime import datetime
import bcrypt

# Carregar .env do diretório do backend (UTF-8 no Windows)
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env", encoding="utf-8")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")  # Use service role for backend

# Check if we should use mock database
USE_MOCK_DB = not SUPABASE_URL or SUPABASE_URL == "" or "xxxxx" in SUPABASE_URL


class MockDatabase:
    """In-memory database for development/testing without Supabase"""
    
    def __init__(self):
        self.tables: Dict[str, List[Dict]] = {
            "users": [],
            "requests": [],
            "payments": [],
            "chat_messages": [],
            "notifications": [],
            "reviews": [],
            "sessions": [],
        }
        self._seed_test_data()
    
    def _seed_test_data(self):
        """Add test users for development"""
        # Hash password "123456"
        password_hash = bcrypt.hashpw("123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        test_users = [
            {
                "id": str(uuid.uuid4()),
                "email": "paciente@teste.com",
                "name": "Paciente Teste",
                "role": "patient",
                "cpf": "12345678900",
                "phone": "(11) 99999-9999",
                "password_hash": password_hash,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "email": "medico@teste.com",
                "name": "Dr. Médico Teste",
                "role": "doctor",
                "cpf": "98765432100",
                "phone": "(11) 88888-8888",
                "crm": "123456",
                "crm_state": "SP",
                "specialty": "Clínico Geral",
                "verified": True,
                "available": True,
                "password_hash": password_hash,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "email": "enfermeiro@teste.com",
                "name": "Enfermeiro(a) Teste",
                "role": "nurse",
                "cpf": "11122233344",
                "phone": "(11) 77777-7777",
                "coren": "123456",
                "coren_state": "SP",
                "verified": True,
                "available": True,
                "password_hash": password_hash,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "email": "admin@teste.com",
                "name": "Admin Teste",
                "role": "admin",
                "cpf": "55566677788",
                "phone": "(11) 66666-6666",
                "password_hash": password_hash,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
        ]
        self.tables["users"] = test_users
        print("🧪 MODO DESENVOLVIMENTO: Banco de dados em memória inicializado")
        print("📧 Usuários de teste disponíveis:")
        print("   - paciente@teste.com / 123456 (Paciente)")
        print("   - medico@teste.com / 123456 (Médico)")
        print("   - enfermeiro@teste.com / 123456 (Enfermeiro)")
        print("   - admin@teste.com / 123456 (Admin)")
    
    def _match_filters(self, record: Dict, filters: Dict[str, Any]) -> bool:
        """Check if record matches all filters"""
        for key, value in filters.items():
            if isinstance(value, dict):
                for op, val in value.items():
                    if op == "in":
                        if record.get(key) not in val:
                            return False
                    elif op == "neq":
                        if record.get(key) == val:
                            return False
                    elif op == "is":
                        if val == "null" and record.get(key) is not None:
                            return False
                    elif op == "gte":
                        if record.get(key) < val:
                            return False
                    elif op == "lte":
                        if record.get(key) > val:
                            return False
            else:
                if record.get(key) != value:
                    return False
        return True
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Insert a record"""
        if table not in self.tables:
            self.tables[table] = []
        
        # Add id if not present
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        if "created_at" not in data:
            data["created_at"] = datetime.now().isoformat()
        if "updated_at" not in data:
            data["updated_at"] = datetime.now().isoformat()
        
        self.tables[table].append(data)
        return data
    
    async def select(
        self,
        table: str,
        columns: str = "*",
        filters: Optional[Dict[str, Any]] = None,
        order: Optional[str] = None,
        limit: Optional[int] = None,
        single: bool = False
    ) -> Optional[Union[List[Dict], Dict]]:
        """Select records"""
        if table not in self.tables:
            return None if single else []
        
        records = self.tables[table]
        
        # Apply filters
        if filters:
            records = [r for r in records if self._match_filters(r, filters)]
        
        # Apply ordering
        if order:
            field = order.replace(".desc", "").replace(".asc", "")
            reverse = ".desc" in order
            records = sorted(records, key=lambda x: x.get(field, ""), reverse=reverse)
        
        # Apply limit
        if limit:
            records = records[:limit]
        
        if single:
            return records[0] if records else None
        return records
    
    async def update(
        self,
        table: str,
        data: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> Optional[List[Dict]]:
        """Update records"""
        if table not in self.tables:
            return None
        
        updated = []
        for record in self.tables[table]:
            if self._match_filters(record, filters):
                record.update(data)
                record["updated_at"] = datetime.now().isoformat()
                updated.append(record)
        
        return updated if updated else None
    
    async def delete(self, table: str, filters: Dict[str, Any]) -> bool:
        """Delete records"""
        if table not in self.tables:
            return False
        
        initial_len = len(self.tables[table])
        self.tables[table] = [r for r in self.tables[table] if not self._match_filters(r, filters)]
        return len(self.tables[table]) < initial_len
    
    async def count(self, table: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records"""
        if table not in self.tables:
            return 0
        
        records = self.tables[table]
        if filters:
            records = [r for r in records if self._match_filters(r, filters)]
        return len(records)
    
    async def rpc(self, function_name: str, params: Dict[str, Any] = None) -> Any:
        """Mock RPC - returns empty result"""
        return None


class SupabaseDB:
    """Supabase database client wrapper"""
    
    def __init__(self):
        self.url = SUPABASE_URL
        self.key = SUPABASE_KEY
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
    def _get_url(self, table: str) -> str:
        return f"{self.url}/rest/v1/{table}"
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Insert a single record"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self._get_url(table),
                headers=self.headers,
                json=data
            )
            if response.status_code in [200, 201]:
                result = response.json()
                return result[0] if result else data
            else:
                print(f"Insert error: {response.status_code} - {response.text}")
                return None
    
    async def select(
        self, 
        table: str, 
        columns: str = "*",
        filters: Optional[Dict[str, Any]] = None,
        order: Optional[str] = None,
        limit: Optional[int] = None,
        single: bool = False
    ) -> Optional[Union[List[Dict], Dict]]:
        """Select records from table"""
        url = f"{self._get_url(table)}?select={columns}"
        
        if filters:
            for key, value in filters.items():
                if isinstance(value, dict):
                    # Handle operators like {"in": [...], "neq": ..., etc}
                    for op, val in value.items():
                        if op == "in":
                            url += f"&{key}=in.({','.join(val)})"
                        elif op == "neq":
                            url += f"&{key}=neq.{val}"
                        elif op == "is":
                            url += f"&{key}=is.{val}"
                        elif op == "gte":
                            url += f"&{key}=gte.{val}"
                        elif op == "lte":
                            url += f"&{key}=lte.{val}"
                else:
                    url += f"&{key}=eq.{value}"
        
        if order:
            url += f"&order={order}"
        
        if limit:
            url += f"&limit={limit}"
        
        headers = self.headers.copy()
        if single:
            headers["Accept"] = "application/vnd.pgrst.object+json"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 406 and single:
                return None
            else:
                print(f"Select error: {response.status_code} - {response.text}")
                return [] if not single else None
    
    async def update(
        self, 
        table: str, 
        data: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> Optional[List[Dict]]:
        """Update records matching filters"""
        url = self._get_url(table)
        
        for key, value in filters.items():
            url += f"?{key}=eq.{value}"
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                url,
                headers=self.headers,
                json=data
            )
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Update error: {response.status_code} - {response.text}")
                return None
    
    async def delete(self, table: str, filters: Dict[str, Any]) -> bool:
        """Delete records matching filters"""
        url = self._get_url(table)
        
        for key, value in filters.items():
            url += f"?{key}=eq.{value}"
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=self.headers)
            return response.status_code in [200, 204]
    
    async def count(self, table: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records matching filters"""
        url = f"{self._get_url(table)}?select=count"
        
        if filters:
            for key, value in filters.items():
                if isinstance(value, dict):
                    for op, val in value.items():
                        if op == "in":
                            url += f"&{key}=in.({','.join(val)})"
                        elif op == "neq":
                            url += f"&{key}=neq.{val}"
                else:
                    url += f"&{key}=eq.{value}"
        
        headers = self.headers.copy()
        headers["Prefer"] = "count=exact"
        
        async with httpx.AsyncClient() as client:
            response = await client.head(url, headers=headers)
            count_header = response.headers.get("content-range", "0")
            # Format is "0-X/total" or "*/total"
            if "/" in count_header:
                return int(count_header.split("/")[1])
            return 0
    
    async def rpc(self, function_name: str, params: Dict[str, Any] = None) -> Any:
        """Call a Supabase RPC function"""
        url = f"{self.url}/rest/v1/rpc/{function_name}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=self.headers,
                json=params or {}
            )
            if response.status_code == 200:
                return response.json()
            return None


# Global database instance
db = SupabaseDB()


# Helper functions for common operations
async def find_one(table: str, filters: Dict[str, Any]) -> Optional[Dict]:
    """Find a single record"""
    result = await db.select(table, filters=filters, limit=1, single=True)
    return result


async def find_many(
    table: str, 
    filters: Optional[Dict[str, Any]] = None,
    order: str = "created_at.desc",
    limit: int = 100
) -> List[Dict]:
    """Find multiple records"""
    result = await db.select(table, filters=filters, order=order, limit=limit)
    return result if result else []


async def insert_one(table: str, data: Dict[str, Any]) -> Optional[Dict]:
    """Insert a single record"""
    return await db.insert(table, data)


async def update_one(table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> bool:
    """Update a single record"""
    result = await db.update(table, data, filters)
    return result is not None


async def delete_one(table: str, filters: Dict[str, Any]) -> bool:
    """Delete a single record"""
    return await db.delete(table, filters)


async def count_docs(table: str, filters: Optional[Dict[str, Any]] = None) -> int:
    """Count documents matching filters"""
    return await db.count(table, filters)
