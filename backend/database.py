"""
Supabase Database Module
Handles all database operations using Supabase Python client
"""

import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
import httpx
import json

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")  # Use service role for backend

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
    ) -> Optional[List[Dict] | Dict]:
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
