"""
RenoveJá+ API - Supabase Version
FastAPI backend with Supabase/PostgreSQL database
"""

from fastapi import FastAPI, APIRouter, HTTPException, Request
import hmac
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
import hashlib
import secrets
import httpx

# Import Supabase database module
from database import db, find_one, find_many, insert_one, update_one, delete_one, count_docs

# Import notifications helper
from notifications_helper import (
    notify_user, notify_users, notify_role,
    notify_available_doctors, notify_available_nurses, notify_admins,
    TEMPLATES, create_notification
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="RenoveJá+ API", version="2.0.0 - Supabase")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== ROOT ROUTE ==============
@app.get("/")
async def root():
    """Página inicial da API"""
    return {
        "app": "🏥 RenoveJá+ API",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
        "message": "Bem-vindo à API do RenoveJá!"
    }

# ============== MODELS ==============

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    cpf: Optional[str] = None
    role: Literal["patient", "doctor", "admin", "nurse"] = "patient"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class DoctorRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    cpf: Optional[str] = None
    crm: str
    crm_state: str
    specialty: str

class NurseRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    cpf: Optional[str] = None
    coren: str
    coren_state: str
    specialty: Optional[str] = "Enfermagem Geral"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class PrescriptionRequestCreate(BaseModel):
    prescription_type: Literal["simple", "controlled", "blue"]
    medications: Optional[List[dict]] = None
    prescription_images: Optional[List[str]] = None
    image_base64: Optional[str] = None
    notes: Optional[str] = None

class ExamRequestCreate(BaseModel):
    description: Optional[str] = None
    exam_images: Optional[List[str]] = None
    notes: Optional[str] = None
    exam_type: Optional[str] = None
    exams: Optional[List[str]] = None

class ConsultationRequestCreate(BaseModel):
    specialty: str
    duration: int = 30
    scheduled_at: Optional[str] = None
    schedule_type: Literal["immediate", "scheduled"] = "immediate"
    notes: Optional[str] = None

# Preços base por especialidade (para teleconsultas)
# Por enquanto apenas Clínico Geral ativo - estrutura pronta para futuras especialidades
SPECIALTY_PRICES = {
    "general": 59.90,  # Única especialidade ativa por enquanto
    # Futuras especialidades (comentadas):
    # "cardiology": 99.90,
    # "dermatology": 89.90,
    # "gynecology": 89.90,
    # "orthopedics": 89.90,
    # "psychiatry": 119.90,
    # "nutrition": 69.90,
    # "endocrinology": 99.90
}

# Multiplicadores por duração
DURATION_MULTIPLIERS = {
    15: 0.6,
    30: 1.0,
    45: 1.4,
    60: 1.8
}

def calculate_consultation_price(specialty: str, duration: int) -> float:
    """Calcula preço da consulta baseado na especialidade e duração"""
    base_price = SPECIALTY_PRICES.get(specialty, 79.90)
    multiplier = DURATION_MULTIPLIERS.get(duration, 1.0)
    return round(base_price * multiplier, 2)

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    request_id: str
    amount: float
    method: Literal["pix", "credit_card", "debit_card"] = "pix"

class MessageCreate(BaseModel):
    request_id: str
    message: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    cpf: Optional[str] = None
    birth_date: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[dict] = None

class DoctorApprovalRequest(BaseModel):
    price: Optional[float] = None
    notes: Optional[str] = None

class DoctorRejectionRequest(BaseModel):
    reason: str
    notes: Optional[str] = None

class NursingApprovalRequest(BaseModel):
    price: float
    exam_type: Optional[str] = None
    exams: Optional[List[str]] = None
    notes: Optional[str] = None

class NursingRejectionRequest(BaseModel):
    reason: str
    notes: Optional[str] = None

class NursingForwardRequest(BaseModel):
    reason: Optional[str] = None
    notes: Optional[str] = None

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def get_price(request_type: str, subtype: str = None) -> float:
    prices = {
        "prescription": {"simple": 49.90, "controlled": 69.90, "blue": 89.90},
        "exam": {"laboratory": 39.90, "imaging": 59.90},
        "consultation": 79.90
    }
    if request_type == "consultation":
        return prices["consultation"]
    return prices.get(request_type, {}).get(subtype, 49.90)

def generate_pix_code() -> str:
    return f"00020126580014BR.GOV.BCB.PIX0136{str(uuid.uuid4())}5204000053039865802BR5925RENOVEJA TELEMEDICINA6009SAO PAULO62070503***6304"

def serialize_datetime(obj):
    """Convert datetime objects to ISO format strings"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

async def get_current_user(token: str = None):
    if not token:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    
    token_record = await find_one("active_tokens", {"token": token})
    if not token_record:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    
    user = await find_one("users", {"id": token_record["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=Token)
async def register(data: UserCreate):
    existing = await find_one("users", {"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")
    
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "phone": data.phone,
        "cpf": data.cpf,
        "role": data.role,
        "active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await insert_one("users", user_data)
    
    token = generate_token()
    await insert_one("active_tokens", {"token": token, "user_id": user_id})
    
    # Notificar admins sobre novo usuário
    await notify_admins(
        insert_one, find_many, "admin_new_user",
        {"role": "paciente", "name": data.name, "email": data.email}
    )
    
    return Token(
        access_token=token,
        user={
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "phone": data.phone,
            "cpf": data.cpf,
            "role": data.role,
            "avatar_url": None
        }
    )

@api_router.post("/auth/register-doctor", response_model=Token)
async def register_doctor(data: DoctorRegister):
    existing = await find_one("users", {"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")
    
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "phone": data.phone,
        "cpf": data.cpf,
        "role": "doctor"
    }
    
    await insert_one("users", user_data)
    
    profile_id = str(uuid.uuid4())
    doctor_profile = {
        "id": profile_id,
        "user_id": user_id,
        "crm": data.crm,
        "crm_state": data.crm_state,
        "specialty": data.specialty
    }
    await insert_one("doctor_profiles", doctor_profile)
    
    token = generate_token()
    await insert_one("active_tokens", {"token": token, "user_id": user_id})
    
    return Token(
        access_token=token,
        user={
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "phone": data.phone,
            "role": "doctor",
            "avatar_url": None,
            "doctor_profile": doctor_profile
        }
    )

@api_router.post("/auth/register-nurse", response_model=Token)
async def register_nurse(data: NurseRegister):
    existing = await find_one("users", {"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")
    
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "phone": data.phone,
        "cpf": data.cpf,
        "role": "nurse"
    }
    
    await insert_one("users", user_data)
    
    profile_id = str(uuid.uuid4())
    nurse_profile = {
        "id": profile_id,
        "user_id": user_id,
        "coren": data.coren,
        "coren_state": data.coren_state,
        "specialty": data.specialty or "Enfermagem Geral"
    }
    await insert_one("nurse_profiles", nurse_profile)
    
    token = generate_token()
    await insert_one("active_tokens", {"token": token, "user_id": user_id})
    
    return Token(
        access_token=token,
        user={
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "phone": data.phone,
            "role": "nurse",
            "avatar_url": None,
            "nurse_profile": nurse_profile
        }
    )

@api_router.post("/auth/login", response_model=Token)
async def login(data: UserLogin):
    user = await find_one("users", {"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = generate_token()
    await insert_one("active_tokens", {"token": token, "user_id": user["id"]})
    
    doctor_profile = None
    if user.get("role") == "doctor":
        doctor_profile = await find_one("doctor_profiles", {"user_id": user["id"]})
    
    nurse_profile = None
    if user.get("role") == "nurse":
        nurse_profile = await find_one("nurse_profiles", {"user_id": user["id"]})
    
    return Token(
        access_token=token,
        user={
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone"),
            "cpf": user.get("cpf"),
            "role": user.get("role", "patient"),
            "avatar_url": user.get("avatar_url"),
            "doctor_profile": doctor_profile,
            "nurse_profile": nurse_profile
        }
    )

class GoogleAuthRequest(BaseModel):
    id_token: str

@api_router.post("/auth/google", response_model=Token)
async def google_auth(data: GoogleAuthRequest):
    """Authenticate with Google OAuth"""
    try:
        # Verify Google token and get user info
        async with httpx.AsyncClient() as client:
            # Get user info from Google
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {data.id_token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Token do Google inválido")
            
            google_user = response.json()
            
            email = google_user.get("email")
            name = google_user.get("name", email.split("@")[0])
            google_id = google_user.get("sub")
            avatar_url = google_user.get("picture")
            
            if not email:
                raise HTTPException(status_code=400, detail="Email não fornecido pelo Google")
            
            # Check if user exists
            existing_user = await find_one("users", {"email": email})
            
            if existing_user:
                # Update google_id and avatar if needed
                updates = {"updated_at": datetime.utcnow().isoformat()}
                if not existing_user.get("google_id"):
                    updates["google_id"] = google_id
                if avatar_url and not existing_user.get("avatar_url"):
                    updates["avatar_url"] = avatar_url
                
                await update_one("users", {"id": existing_user["id"]}, updates)
                user = existing_user
            else:
                # Create new user
                user_id = str(uuid.uuid4())
                user_data = {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "password_hash": "",  # No password for Google users
                    "google_id": google_id,
                    "avatar_url": avatar_url,
                    "role": "patient",
                    "active": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                await insert_one("users", user_data)
                user = user_data
            
            # Generate token
            token = generate_token()
            await insert_one("active_tokens", {"token": token, "user_id": user["id"]})
            
            # Get profiles if doctor/nurse
            doctor_profile = None
            if user.get("role") == "doctor":
                doctor_profile = await find_one("doctor_profiles", {"user_id": user["id"]})
            
            nurse_profile = None
            if user.get("role") == "nurse":
                nurse_profile = await find_one("nurse_profiles", {"user_id": user["id"]})
            
            return Token(
                access_token=token,
                user={
                    "id": user["id"],
                    "name": user.get("name", name),
                    "email": user.get("email", email),
                    "phone": user.get("phone"),
                    "cpf": user.get("cpf"),
                    "role": user.get("role", "patient"),
                    "avatar_url": user.get("avatar_url", avatar_url),
                    "doctor_profile": doctor_profile,
                    "nurse_profile": nurse_profile
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Erro ao autenticar com Google")

@api_router.post("/auth/logout")
async def logout(token: str):
    await delete_one("active_tokens", {"token": token})
    return {"message": "Logout realizado com sucesso"}

@api_router.get("/auth/me")
async def get_me(token: str):
    user = await get_current_user(token)
    
    doctor_profile = None
    if user.get("role") == "doctor":
        doctor_profile = await find_one("doctor_profiles", {"user_id": user["id"]})
    
    nurse_profile = None
    if user.get("role") == "nurse":
        nurse_profile = await find_one("nurse_profiles", {"user_id": user["id"]})
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "cpf": user.get("cpf"),
        "birth_date": user.get("birth_date"),
        "role": user.get("role", "patient"),
        "avatar_url": user.get("avatar_url"),
        "address": user.get("address"),
        "doctor_profile": doctor_profile,
        "nurse_profile": nurse_profile
    }

# ============== PROFILE ROUTES ==============

@api_router.put("/profile")
async def update_profile(token: str, data: ProfileUpdate):
    user = await get_current_user(token)
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if update_data:
        await update_one("users", {"id": user["id"]}, update_data)
    
    updated_user = await find_one("users", {"id": user["id"]})
    return {"message": "Perfil atualizado com sucesso", "user": updated_user}

# ============== REQUEST ROUTES ==============

@api_router.post("/requests/prescription")
async def create_prescription_request(token: str, data: PrescriptionRequestCreate):
    user = await get_current_user(token)
    
    price = get_price("prescription", data.prescription_type)
    images = data.prescription_images if data.prescription_images else ([data.image_base64] if data.image_base64 else [])
    
    request_id = str(uuid.uuid4())
    request_data = {
        "id": request_id,
        "patient_id": user["id"],
        "patient_name": user["name"],
        "request_type": "prescription",
        "prescription_type": data.prescription_type,
        "medications": data.medications,
        "prescription_images": images,
        "image_url": images[0] if images else None,
        "notes": data.notes,
        "price": price,
        "status": "submitted"
    }
    
    await insert_one("requests", request_data)
    
    # Notificar paciente
    await notify_user(insert_one, user["id"], "prescription_created_patient", request_id=request_id)
    
    # Notificar médicos disponíveis
    await notify_available_doctors(
        insert_one, find_many, "prescription_created_doctors",
        {"patient_name": user["name"]}, request_id=request_id
    )
    
    # Notificar admins
    await notify_admins(
        insert_one, find_many, "admin_new_request",
        {"request_type": "receita", "patient_name": user["name"]}, request_id=request_id
    )
    
    return request_data

@api_router.post("/requests/exam")
async def create_exam_request(token: str, data: ExamRequestCreate):
    user = await get_current_user(token)
    
    images = data.exam_images if data.exam_images else []
    
    request_id = str(uuid.uuid4())
    request_data = {
        "id": request_id,
        "patient_id": user["id"],
        "patient_name": user["name"],
        "request_type": "exam",
        "exam_images": images,
        "exam_description": data.description,
        "exam_type": data.exam_type,
        "exams": data.exams,
        "notes": data.notes,
        "price": 0.0,
        "status": "submitted"
    }
    
    await insert_one("requests", request_data)
    
    # Notificar paciente
    await notify_user(insert_one, user["id"], "exam_created_patient", request_id=request_id)
    
    # Notificar enfermeiros disponíveis
    await notify_available_nurses(
        insert_one, find_many, "exam_created_nurses",
        {"patient_name": user["name"]}, request_id=request_id
    )
    
    # Notificar admins
    await notify_admins(
        insert_one, find_many, "admin_new_request",
        {"request_type": "exame", "patient_name": user["name"]}, request_id=request_id
    )
    
    return request_data

@api_router.post("/requests/consultation")
async def create_consultation_request(token: str, data: ConsultationRequestCreate):
    user = await get_current_user(token)
    
    # Calcular preço baseado na especialidade e duração
    price = calculate_consultation_price(data.specialty, data.duration)
    
    request_id = str(uuid.uuid4())
    request_data = {
        "id": request_id,
        "patient_id": user["id"],
        "patient_name": user["name"],
        "request_type": "consultation",
        "specialty": data.specialty,
        "duration": data.duration,
        "scheduled_at": data.scheduled_at,
        "schedule_type": data.schedule_type,
        "notes": data.notes,
        "price": price,
        "status": "submitted",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await insert_one("requests", request_data)
    
    # Notificar paciente
    schedule_info = "imediata" if data.schedule_type == "immediate" else f"agendada para {data.scheduled_at}"
    await notify_user(
        insert_one, user["id"], "consultation_created_patient",
        {"specialty": data.specialty}, request_id=request_id
    )
    
    # Notificar médicos da especialidade
    await notify_available_doctors(
        insert_one, find_many, "consultation_created_doctors",
        {"patient_name": user["name"], "specialty": data.specialty},
        specialty=data.specialty, request_id=request_id
    )
    
    # Notificar admins
    await notify_admins(
        insert_one, find_many, "admin_new_request",
        {"request_type": "teleconsulta", "patient_name": user["name"]}, request_id=request_id
    )
    
    return request_data

@api_router.get("/requests")
async def get_requests(token: str, status: Optional[str] = None):
    user = await get_current_user(token)
    
    filters = {}
    if user.get("role") == "patient":
        filters["patient_id"] = user["id"]
    
    if status:
        filters["status"] = status
    
    requests = await find_many("requests", filters=filters if filters else None, order="created_at.desc")
    return requests

@api_router.get("/requests/{request_id}")
async def get_request(request_id: str, token: str):
    user = await get_current_user(token)
    request = await find_one("requests", {"id": request_id})
    
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    return request

@api_router.put("/requests/{request_id}")
async def update_request(request_id: str, token: str, data: RequestUpdate):
    user = await get_current_user(token)
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    if update_data:
        await update_one("requests", {"id": request_id}, update_data)
    
    updated_request = await find_one("requests", {"id": request_id})
    return updated_request

# ============== DOCTOR WORKFLOW ROUTES ==============

@api_router.post("/requests/{request_id}/accept")
async def doctor_accept_request(request_id: str, token: str):
    user = await get_current_user(token)
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Apenas médicos podem aceitar solicitações")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    if request.get("status") not in ["submitted", "pending", "forwarded_to_doctor"]:
        raise HTTPException(status_code=400, detail="Solicitação não está disponível para análise")
    
    await update_one("requests", {"id": request_id}, {
        "status": "in_review",
        "doctor_id": user["id"],
        "doctor_name": user["name"],
        "assigned_at": datetime.utcnow().isoformat()
    })
    
    # Notificar paciente
    await notify_user(
        insert_one, request["patient_id"], "prescription_accepted",
        {"doctor_name": user["name"]}, request_id=request_id
    )
    
    return {"success": True, "message": "Solicitação aceita para análise", "status": "in_review"}

@api_router.post("/requests/{request_id}/approve")
async def doctor_approve_request(request_id: str, token: str, data: DoctorApprovalRequest = None):
    user = await get_current_user(token)
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Apenas médicos podem aprovar solicitações")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    if request.get("doctor_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Você não está atribuído a esta solicitação")
    
    if request.get("status") not in ["in_review", "analyzing"]:
        raise HTTPException(status_code=400, detail="Solicitação não está em análise")
    
    price = (data.price if data and data.price else request.get("price", 49.90))
    
    update_data = {
        "status": "approved_pending_payment",
        "approved_at": datetime.utcnow().isoformat(),
        "approved_by": "doctor",
        "price": price
    }
    
    if data and data.notes:
        update_data["notes"] = data.notes
    
    await update_one("requests", {"id": request_id}, update_data)
    
    # Notificar paciente - aprovado, aguardando pagamento
    await notify_user(
        insert_one, request["patient_id"], "prescription_approved",
        {"doctor_name": user["name"], "price": price}, request_id=request_id
    )
    
    return {
        "success": True,
        "message": "Solicitação aprovada. Aguardando pagamento do paciente.",
        "status": "approved_pending_payment"
    }

@api_router.post("/requests/{request_id}/reject")
async def doctor_reject_request(request_id: str, token: str, data: DoctorRejectionRequest):
    user = await get_current_user(token)
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Apenas médicos podem rejeitar solicitações")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    if request.get("doctor_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Você não está atribuído a esta solicitação")
    
    await update_one("requests", {"id": request_id}, {
        "status": "rejected",
        "rejection_reason": data.reason
    })
    
    # Notificar paciente
    await notify_user(
        insert_one, request["patient_id"], "prescription_rejected",
        {"doctor_name": user["name"], "reason": data.reason}, request_id=request_id
    )
    
    return {"success": True, "message": "Solicitação rejeitada", "status": "rejected"}

@api_router.post("/requests/{request_id}/sign")
async def sign_prescription(request_id: str, token: str):
    user = await get_current_user(token)
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Apenas médicos podem assinar receitas")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    if request.get("status") != "paid":
        raise HTTPException(status_code=400, detail="Pagamento ainda não foi confirmado")
    
    doctor_profile = await find_one("doctor_profiles", {"user_id": user["id"]})
    crm = f"{doctor_profile.get('crm', '')}/{doctor_profile.get('crm_state', '')}" if doctor_profile else ""
    
    # Generate signature
    signature_data = {
        "signer_name": user["name"],
        "signer_crm": crm,
        "signed_at": datetime.utcnow().isoformat(),
        "document_hash": hashlib.sha256(f"{request_id}{user['id']}{datetime.utcnow()}".encode()).hexdigest()
    }
    
    await update_one("requests", {"id": request_id}, {
        "status": "signed",
        "signed_at": datetime.utcnow().isoformat(),
        "signature_data": signature_data,
        "completed_at": datetime.utcnow().isoformat()
    })
    
    # Notificar paciente - receita pronta!
    await notify_user(
        insert_one, request["patient_id"], "prescription_signed",
        {"doctor_name": user["name"]}, request_id=request_id
    )
    
    # Notificar paciente para avaliar
    await notify_user(
        insert_one, request["patient_id"], "review_reminder",
        {"doctor_name": user["name"]}, request_id=request_id
    )
    
    return {"success": True, "message": "Receita assinada com sucesso", "status": "signed", "signature": signature_data}

# ============== DOCTOR ROUTES ==============

@api_router.get("/doctors/queue")
async def get_doctor_queue(token: str):
    user = await get_current_user(token)
    
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Pending requests (prescriptions and consultations, not exams)
    all_requests = await find_many("requests", order="created_at.asc", limit=200)
    
    pending = [r for r in all_requests if r.get("status") in ["submitted", "pending"] 
               and r.get("request_type") != "exam" and not r.get("doctor_id")]
    
    analyzing = [r for r in all_requests if r.get("doctor_id") == user["id"] 
                 and r.get("status") in ["in_review", "analyzing"]]
    
    forwarded_from_nursing = [r for r in all_requests if r.get("status") == "in_medical_review"]
    
    awaiting_payment = [r for r in all_requests if r.get("doctor_id") == user["id"] 
                        and r.get("status") == "approved_pending_payment"]
    
    awaiting_signature = [r for r in all_requests if r.get("doctor_id") == user["id"] 
                          and r.get("status") == "paid"]
    
    return {
        "pending": pending,
        "analyzing": analyzing,
        "forwarded_from_nursing": forwarded_from_nursing,
        "awaiting_payment": awaiting_payment,
        "awaiting_signature": awaiting_signature
    }

@api_router.get("/doctors")
async def get_doctors(specialty: Optional[str] = None):
    filters = {"available": True}
    if specialty:
        filters["specialty"] = specialty
    
    doctor_profiles = await find_many("doctor_profiles", filters=filters)
    
    doctors = []
    for dp in doctor_profiles:
        user = await find_one("users", {"id": dp["user_id"]})
        if user:
            doctors.append({
                **dp,
                "name": user["name"],
                "email": user["email"],
                "avatar_url": user.get("avatar_url")
            })
    
    return doctors

# ============== DOCTOR CONSULTATION QUEUE ==============

@api_router.get("/doctor/consultation-queue")
async def get_doctor_consultation_queue(token: str):
    """Fila de teleconsultas para médicos"""
    user = await get_current_user(token)
    
    if user.get("role") not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso permitido apenas para médicos")
    
    # Buscar todas as consultas
    all_requests = await find_many("requests", order="created_at.asc", limit=100)
    
    # Filtrar apenas teleconsultas
    consultations = [r for r in all_requests if r.get("request_type") == "consultation"]
    
    # Obter perfil do médico para ver especialidades
    doctor_profile = await find_one("doctor_profiles", {"user_id": user["id"]})
    doctor_specialties = doctor_profile.get("specialties", []) if doctor_profile else []
    
    # Aguardando atendimento (pagas, status paid ou submitted após pagamento)
    # Filtra por especialidade do médico se disponível
    waiting = []
    for c in consultations:
        # Consulta paga aguardando início
        if c.get("status") == "paid":
            # Se médico tem especialidades definidas, filtrar
            if doctor_specialties and c.get("specialty") not in doctor_specialties:
                continue
            waiting.append(c)
    
    # Ordenar por tipo (imediatas primeiro) e depois por tempo de espera
    waiting.sort(key=lambda x: (
        0 if x.get("schedule_type") == "immediate" else 1,
        x.get("paid_at", x.get("created_at", ""))
    ))
    
    # Em andamento (do médico atual)
    in_progress = [c for c in consultations 
                   if c.get("status") == "in_consultation" 
                   and c.get("doctor_id") == user["id"]]
    
    # Completadas hoje (do médico atual)
    today = datetime.utcnow().strftime("%Y-%m-%d")
    completed = [c for c in consultations 
                 if c.get("status") == "completed" 
                 and c.get("doctor_id") == user["id"]
                 and c.get("completed_at", "").startswith(today)]
    
    return {
        "waiting": waiting,
        "in_progress": in_progress,
        "completed": completed
    }

# ============== NURSING ROUTES ==============

@api_router.get("/nursing/queue")
async def get_nursing_queue(token: str):
    user = await get_current_user(token)
    
    if user.get("role") != "nurse":
        raise HTTPException(status_code=403, detail="Acesso permitido apenas para enfermeiros")
    
    all_requests = await find_many("requests", order="created_at.asc", limit=200)
    
    pending = [r for r in all_requests if r.get("request_type") == "exam" 
               and r.get("status") == "submitted" and not r.get("nurse_id")]
    
    in_review = [r for r in all_requests if r.get("request_type") == "exam" 
                 and r.get("nurse_id") == user["id"] and r.get("status") == "in_nursing_review"]
    
    awaiting_payment = [r for r in all_requests if r.get("nurse_id") == user["id"] 
                        and r.get("status") == "approved_by_nursing_pending_payment"]
    
    return {
        "pending": pending,
        "in_review": in_review,
        "awaiting_payment": awaiting_payment
    }

@api_router.post("/nursing/accept/{request_id}")
async def nursing_accept_request(request_id: str, token: str):
    user = await get_current_user(token)
    
    if user.get("role") != "nurse":
        raise HTTPException(status_code=403, detail="Acesso permitido apenas para enfermeiros")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    await update_one("requests", {"id": request_id}, {
        "status": "in_nursing_review",
        "nurse_id": user["id"],
        "nurse_name": user["name"]
    })
    
    # Notificar paciente
    await notify_user(
        insert_one, request["patient_id"], "exam_accepted",
        {"nurse_name": user["name"]}, request_id=request_id
    )
    
    return {"success": True, "message": "Solicitação aceita para triagem"}

@api_router.post("/nursing/approve/{request_id}")
async def nursing_approve_request(request_id: str, token: str, data: NursingApprovalRequest):
    user = await get_current_user(token)
    
    if user.get("role") != "nurse":
        raise HTTPException(status_code=403, detail="Acesso permitido apenas para enfermeiros")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    await update_one("requests", {"id": request_id}, {
        "status": "approved_by_nursing_pending_payment",
        "price": data.price,
        "exam_type": data.exam_type,
        "exams": data.exams,
        "approved_by": "nurse",
        "approved_at": datetime.utcnow().isoformat()
    })
    
    # Notificar paciente - exames aprovados
    await notify_user(
        insert_one, request["patient_id"], "exam_approved",
        {"nurse_name": user["name"], "price": data.price}, request_id=request_id
    )
    
    return {"success": True, "message": "Solicitação aprovada pela enfermagem"}

@api_router.post("/nursing/forward-to-doctor/{request_id}")
async def nursing_forward_to_doctor(request_id: str, token: str, data: NursingForwardRequest):
    user = await get_current_user(token)
    
    if user.get("role") != "nurse":
        raise HTTPException(status_code=403, detail="Acesso permitido apenas para enfermeiros")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    await update_one("requests", {"id": request_id}, {
        "status": "forwarded_to_doctor",
        "notes": f"Encaminhado pela enfermagem: {data.reason or 'Requer validação médica'}"
    })
    
    # Notificar paciente
    await notify_user(
        insert_one, request["patient_id"], "exam_forwarded_patient",
        request_id=request_id
    )
    
    # Notificar médicos disponíveis
    await notify_available_doctors(
        insert_one, find_many, "exam_forwarded_doctors",
        {"patient_name": request.get("patient_name", "Paciente")}, request_id=request_id
    )
    
    return {"success": True, "message": "Solicitação encaminhada para médico"}

@api_router.post("/nursing/reject/{request_id}")
async def nursing_reject_request(request_id: str, token: str, data: NursingRejectionRequest):
    user = await get_current_user(token)
    
    if user.get("role") != "nurse":
        raise HTTPException(status_code=403, detail="Acesso permitido apenas para enfermeiros")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    await update_one("requests", {"id": request_id}, {
        "status": "rejected",
        "rejection_reason": data.reason,
        "approved_by": "nurse"
    })
    
    # Notificar paciente
    await notify_user(
        insert_one, request["patient_id"], "exam_rejected",
        {"reason": data.reason}, request_id=request_id
    )
    
    return {"success": True, "message": "Solicitação recusada"}

# ============== MERCADOPAGO CONFIG ==============

MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
MERCADOPAGO_PUBLIC_KEY = os.getenv("MERCADOPAGO_PUBLIC_KEY", "")
MERCADOPAGO_WEBHOOK_SECRET = os.getenv("MERCADOPAGO_WEBHOOK_SECRET", "")

def verify_mercadopago_signature(x_signature: str, x_request_id: str, data_id: str) -> bool:
    """Verify MercadoPago webhook signature"""
    if not MERCADOPAGO_WEBHOOK_SECRET or not x_signature:
        return True  # Skip validation if not configured
    
    try:
        # Parse x-signature header (format: ts=xxx,v1=xxx)
        parts = dict(p.split("=") for p in x_signature.split(","))
        ts = parts.get("ts", "")
        v1 = parts.get("v1", "")
        
        # Build manifest string
        manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
        
        # Calculate expected signature
        expected = hmac.new(
            MERCADOPAGO_WEBHOOK_SECRET.encode(),
            manifest.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected, v1)
    except Exception as e:
        print(f"Webhook signature verification error: {e}")
        return False

async def create_mercadopago_pix(amount: float, description: str, payer_email: str, external_reference: str):
    """Create a PIX payment using MercadoPago API"""
    if not MERCADOPAGO_ACCESS_TOKEN:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.mercadopago.com/v1/payments",
                headers={
                    "Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": str(uuid.uuid4())
                },
                json={
                    "transaction_amount": float(amount),
                    "description": description,
                    "payment_method_id": "pix",
                    "payer": {
                        "email": payer_email
                    },
                    "external_reference": external_reference
                },
                timeout=30.0
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    "mp_payment_id": str(data.get("id")),
                    "status": data.get("status"),
                    "pix_code": data.get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code"),
                    "pix_qr_base64": data.get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code_base64"),
                    "ticket_url": data.get("point_of_interaction", {}).get("transaction_data", {}).get("ticket_url")
                }
            else:
                print(f"MercadoPago error: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        print(f"MercadoPago exception: {e}")
        return None

async def check_mercadopago_payment(mp_payment_id: str):
    """Check payment status on MercadoPago"""
    if not MERCADOPAGO_ACCESS_TOKEN or not mp_payment_id:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.mercadopago.com/v1/payments/{mp_payment_id}",
                headers={"Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}"},
                timeout=15.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": data.get("status"),
                    "status_detail": data.get("status_detail"),
                    "date_approved": data.get("date_approved")
                }
            return None
    except Exception as e:
        print(f"MercadoPago check error: {e}")
        return None

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments")
async def create_payment(token: str, data: PaymentCreate):
    user = await get_current_user(token)
    
    request = await find_one("requests", {"id": data.request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    payment_id = str(uuid.uuid4())
    is_real_payment = bool(MERCADOPAGO_ACCESS_TOKEN)
    
    # Try to create real MercadoPago payment
    mp_data = None
    if is_real_payment and data.method == "pix":
        mp_data = await create_mercadopago_pix(
            amount=data.amount,
            description=f"RenoveJá+ - {request.get('request_type', 'Serviço')}",
            payer_email=user.get("email", "cliente@renoveja.com"),
            external_reference=payment_id
        )
    
    payment_data = {
        "id": payment_id,
        "request_id": data.request_id,
        "patient_id": user["id"],
        "amount": data.amount,
        "method": data.method,
        "status": "pending",
        "pix_code": mp_data.get("pix_code") if mp_data else generate_pix_code(),
        "pix_qr_base64": mp_data.get("pix_qr_base64") if mp_data else None,
        "qr_code_base64": mp_data.get("pix_qr_base64") if mp_data else None,
        "external_id": mp_data.get("mp_payment_id") if mp_data else None,
        "ticket_url": mp_data.get("ticket_url") if mp_data else None,
        "is_real_payment": is_real_payment and mp_data is not None
    }
    
    await insert_one("payments", payment_data)
    
    return payment_data

@api_router.get("/payments/{payment_id}")
async def get_payment(payment_id: str, token: str):
    user = await get_current_user(token)
    payment = await find_one("payments", {"id": payment_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Check real payment status if applicable
    if payment.get("is_real_payment") and payment.get("external_id") and payment.get("status") == "pending":
        mp_status = await check_mercadopago_payment(payment["external_id"])
        if mp_status and mp_status.get("status") == "approved":
            # Update payment and request status
            await update_one("payments", {"id": payment_id}, {
                "status": "completed",
                "paid_at": mp_status.get("date_approved") or datetime.utcnow().isoformat()
            })
            await update_one("requests", {"id": payment["request_id"]}, {
                "status": "paid",
                "paid_at": datetime.utcnow().isoformat()
            })
            payment["status"] = "completed"
    
    return payment

@api_router.get("/payments/{payment_id}/status")
async def check_payment_status(payment_id: str, token: str):
    user = await get_current_user(token)
    payment = await find_one("payments", {"id": payment_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Check real payment status
    mp_status = None
    if payment.get("is_real_payment") and payment.get("external_id"):
        mp_status = await check_mercadopago_payment(payment["external_id"])
        
        if mp_status and mp_status.get("status") == "approved" and payment.get("status") != "completed":
            await update_one("payments", {"id": payment_id}, {
                "status": "completed",
                "paid_at": mp_status.get("date_approved") or datetime.utcnow().isoformat()
            })
            await update_one("requests", {"id": payment["request_id"]}, {
                "status": "paid",
                "paid_at": datetime.utcnow().isoformat()
            })
            payment["status"] = "completed"
    
    return {
        "payment_id": payment_id,
        "status": payment.get("status"),
        "amount": payment.get("amount"),
        "is_real_payment": payment.get("is_real_payment", False),
        "mp_status": mp_status
    }

@api_router.post("/payments/{payment_id}/confirm")
async def confirm_payment(payment_id: str, token: str):
    """Manual confirmation (for simulated payments or admin override)"""
    user = await get_current_user(token)
    
    payment = await find_one("payments", {"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    await update_one("payments", {"id": payment_id}, {
        "status": "completed",
        "paid_at": datetime.utcnow().isoformat()
    })
    
    await update_one("requests", {"id": payment["request_id"]}, {
        "status": "paid",
        "paid_at": datetime.utcnow().isoformat()
    })
    
    request = await find_one("requests", {"id": payment["request_id"]})
    
    # Notificar paciente - pagamento confirmado
    if request:
        await notify_user(
            insert_one, request["patient_id"], "payment_confirmed",
            {"amount": payment.get("amount", 0)}, request_id=payment["request_id"]
        )
    
    # Notificar médico ou enfermeiro para assinar
    if request and request.get("doctor_id"):
        await notify_user(
            insert_one, request["doctor_id"], "prescription_paid_doctor",
            {"patient_name": request.get("patient_name", "Paciente")}, request_id=payment["request_id"]
        )
    elif request and request.get("nurse_id"):
        await notify_user(
            insert_one, request["nurse_id"], "exam_paid",
            {"patient_name": request.get("patient_name", "Paciente")}, request_id=payment["request_id"]
        )
    
    # Notificar admin
    if request:
        await notify_admins(
            insert_one, find_many, "admin_payment_received",
            {"amount": payment.get("amount", 0), "patient_name": request.get("patient_name", "Paciente")},
            request_id=payment["request_id"]
        )
    
    return {"message": "Pagamento confirmado com sucesso", "status": "paid"}

class WebhookData(BaseModel):
    action: Optional[str] = None
    api_version: Optional[str] = None
    data: Optional[dict] = None
    date_created: Optional[str] = None
    id: Optional[str] = None
    live_mode: Optional[bool] = None
    type: Optional[str] = None
    user_id: Optional[str] = None

@api_router.post("/payments/webhook/mercadopago")
async def mercadopago_webhook(
    request: Request,
    data: WebhookData
):
    """Webhook to receive MercadoPago payment notifications"""
    try:
        # Verify webhook signature if configured
        x_signature = request.headers.get("x-signature", "")
        x_request_id = request.headers.get("x-request-id", "")
        data_id = str(data.data.get("id", "")) if data.data else ""
        
        if MERCADOPAGO_WEBHOOK_SECRET and not verify_mercadopago_signature(x_signature, x_request_id, data_id):
            print(f"⚠️ Webhook signature verification failed")
            # Continue anyway for now, just log
        
        # MercadoPago sends payment.created, payment.updated events
        if data.type == "payment" and data.data:
            mp_payment_id = data.data.get("id")
            if mp_payment_id:
                # Check payment status
                mp_status = await check_mercadopago_payment(str(mp_payment_id))
                
                if mp_status and mp_status.get("status") == "approved":
                    # Find payment by external_id
                    payments = await find_many("payments", filters={"external_id": str(mp_payment_id)}, limit=1)
                    
                    if payments:
                        payment = payments[0]
                        if payment.get("status") != "completed":
                            # Update payment
                            await update_one("payments", {"id": payment["id"]}, {
                                "status": "completed",
                                "paid_at": mp_status.get("date_approved") or datetime.utcnow().isoformat()
                            })
                            
                            # Update request
                            await update_one("requests", {"id": payment["request_id"]}, {
                                "status": "paid",
                                "paid_at": datetime.utcnow().isoformat()
                            })
                            
                            # Get request for notifications
                            req = await find_one("requests", {"id": payment["request_id"]})
                            
                            # Notify patient
                            if req:
                                await notify_user(
                                    insert_one, req["patient_id"], "payment_confirmed",
                                    {"amount": payment.get("amount", 0)}, request_id=payment["request_id"]
                                )
                            
                            # Notify doctor or nurse
                            if req and req.get("doctor_id"):
                                await notify_user(
                                    insert_one, req["doctor_id"], "prescription_paid_doctor",
                                    {"patient_name": req.get("patient_name", "Paciente")},
                                    request_id=payment["request_id"]
                                )
                            elif req and req.get("nurse_id"):
                                await notify_user(
                                    insert_one, req["nurse_id"], "exam_paid",
                                    {"patient_name": req.get("patient_name", "Paciente")},
                                    request_id=payment["request_id"]
                                )
                            
                            # Notify admins
                            if req:
                                await notify_admins(
                                    insert_one, find_many, "admin_payment_received",
                                    {"amount": payment.get("amount", 0), "patient_name": req.get("patient_name", "Paciente")},
                                    request_id=payment["request_id"]
                                )
                            
                            print(f"✅ Webhook: Payment {mp_payment_id} approved and processed")
        
        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ============== CHAT ROUTES ==============

@api_router.post("/chat")
async def send_message(token: str, data: MessageCreate):
    user = await get_current_user(token)
    
    message_id = str(uuid.uuid4())
    message_data = {
        "id": message_id,
        "request_id": data.request_id,
        "sender_id": user["id"],
        "sender_name": user["name"],
        "sender_type": user.get("role", "patient"),
        "message": data.message
    }
    
    await insert_one("chat_messages", message_data)
    
    return message_data

@api_router.get("/chat/{request_id}")
async def get_messages(request_id: str, token: str):
    user = await get_current_user(token)
    
    messages = await find_many("chat_messages", filters={"request_id": request_id}, order="created_at.asc")
    return messages

@api_router.get("/chat/unread-count")
async def get_unread_count(token: str):
    user = await get_current_user(token)
    # Simplified - return 0 for now
    return {"unread_count": 0}

@api_router.post("/chat/{request_id}/mark-read")
async def mark_chat_read(request_id: str, token: str):
    user = await get_current_user(token)
    # Mark all messages as read (simplified)
    return {"marked_read": 0}

# ============== NOTIFICATION ROUTES ==============

@api_router.get("/notifications")
async def get_notifications(token: str):
    user = await get_current_user(token)
    
    notifications = await find_many("notifications", filters={"user_id": user["id"]}, order="created_at.desc", limit=50)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, token: str):
    user = await get_current_user(token)
    
    await update_one("notifications", {"id": notification_id}, {"read": True})
    
    return {"message": "Notificação marcada como lida"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(token: str):
    user = await get_current_user(token)
    
    # This is simplified - would need to update all notifications for user
    return {"message": "Todas as notificações marcadas como lidas"}

# ============== QUEUE ROUTES ==============

@api_router.get("/queue/stats")
async def get_queue_stats(token: str):
    user = await get_current_user(token)
    
    total_pending = await count_docs("requests", {"status": {"in": ["pending", "submitted"]}})
    total_analyzing = await count_docs("requests", {"status": {"in": ["analyzing", "in_review"]}})
    
    return {
        "pending": total_pending,
        "analyzing": total_analyzing,
        "completed_today": 0,
        "available_doctors": 0,
        "average_wait_minutes": 15
    }

@api_router.post("/queue/assign/{request_id}")
async def assign_doctor_to_request(request_id: str, token: str, doctor_id: Optional[str] = None):
    user = await get_current_user(token)
    
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Apenas médicos podem atender solicitações")
    
    assigned_doctor_id = doctor_id or user["id"]
    
    await update_one("requests", {"id": request_id}, {
        "doctor_id": assigned_doctor_id,
        "doctor_name": user["name"],
        "status": "analyzing",
        "assigned_at": datetime.utcnow().isoformat()
    })
    
    return {"success": True, "message": "Solicitação atribuída com sucesso"}

# ============== DOCTOR AVAILABILITY ==============

@api_router.put("/doctor/availability")
async def update_doctor_availability(token: str, available: bool = True):
    """Update doctor availability status"""
    user = await get_current_user(token)
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Apenas médicos podem alterar disponibilidade")
    
    doctor_profile = await find_one("doctor_profiles", {"user_id": user["id"]})
    if doctor_profile:
        await update_one("doctor_profiles", {"user_id": user["id"]}, {"available": available, "updated_at": datetime.utcnow().isoformat()})
    
    return {"message": f"Disponibilidade atualizada para {'disponível' if available else 'indisponível'}"}

# ============== VIDEO / CONSULTATION ==============

@api_router.post("/video/create-room")
async def create_video_room(token: str, request_id: str, room_name: str = None):
    """Create a Jitsi video room for consultation"""
    user = await get_current_user(token)
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    # Generate room name if not provided
    if not room_name:
        room_name = f"renoveja-{request_id[:8]}-{secrets.token_hex(4)}"
    
    room_url = f"https://meet.jit.si/{room_name}"
    
    video_room = {
        "room_name": room_name,
        "room_url": room_url,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": user["id"]
    }
    
    await update_one("requests", {"id": request_id}, {"video_room": video_room})
    
    return {"video_room": video_room}

@api_router.get("/video/room/{request_id}")
async def get_video_room(request_id: str, token: str):
    """Get video room info for a consultation"""
    user = await get_current_user(token)
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    return request.get("video_room")

@api_router.post("/consultation/start/{request_id}")
async def start_consultation(request_id: str, token: str):
    """Start a consultation (doctor only)"""
    user = await get_current_user(token)
    if user["role"] not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Apenas médicos podem iniciar consultas")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    await update_one("requests", {"id": request_id}, {
        "status": "in_consultation",
        "consultation_started_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Notificar paciente - consulta iniciando
    await notify_user(
        insert_one, request["patient_id"], "consultation_starting",
        {"doctor_name": user["name"]}, request_id=request_id
    )
    
    return {"message": "Consulta iniciada", "started_at": datetime.utcnow().isoformat()}

@api_router.post("/consultation/end/{request_id}")
async def end_consultation(request_id: str, token: str, notes: str = None):
    """End a consultation (doctor only)"""
    user = await get_current_user(token)
    if user["role"] not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Apenas médicos podem encerrar consultas")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    started_at = request.get("consultation_started_at")
    duration_minutes = 0
    if started_at:
        try:
            start_time = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
            duration_minutes = int((datetime.utcnow() - start_time.replace(tzinfo=None)).total_seconds() / 60)
        except:
            pass
    
    update_data = {
        "status": "completed",
        "consultation_ended_at": datetime.utcnow().isoformat(),
        "consultation_duration_minutes": duration_minutes,
        "completed_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    if notes:
        update_data["consultation_notes"] = notes
    
    await update_one("requests", {"id": request_id}, update_data)
    
    # Update doctor stats
    doctor_profile = await find_one("doctor_profiles", {"user_id": user["id"]})
    if doctor_profile:
        total = doctor_profile.get("total_consultations", 0) + 1
        await update_one("doctor_profiles", {"user_id": user["id"]}, {"total_consultations": total})
    
    # Notificar paciente - consulta finalizada, pedir avaliação
    await notify_user(
        insert_one, request["patient_id"], "consultation_ended",
        request_id=request_id
    )
    
    # Lembrete para avaliar
    await notify_user(
        insert_one, request["patient_id"], "review_reminder",
        {"doctor_name": user["name"]}, request_id=request_id
    )
    
    return {"message": "Consulta encerrada", "duration_minutes": duration_minutes}

@api_router.post("/queue/auto-assign")
async def auto_assign_queue(token: str):
    """Auto-assign pending requests to available doctors"""
    user = await get_current_user(token)
    if user["role"] not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get pending requests
    pending = await find_many("requests", filters={"status": "submitted"}, order="created_at.asc", limit=10)
    
    # Get available doctors
    available_doctors = await find_many("doctor_profiles", filters={"available": True}, limit=10)
    
    assigned_count = 0
    for request in pending:
        if not available_doctors:
            break
        
        doctor_profile = available_doctors.pop(0)
        doctor = await find_one("users", {"id": doctor_profile["user_id"]})
        
        if doctor:
            await update_one("requests", {"id": request["id"]}, {
                "status": "analyzing",
                "doctor_id": doctor["id"],
                "doctor_name": doctor["name"],
                "assigned_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            })
            assigned_count += 1
    
    return {"message": f"{assigned_count} solicitações atribuídas automaticamente", "assigned": assigned_count}

# ============== SPECIALTIES ==============

@api_router.get("/specialties")
async def get_specialties():
    return [
        {"id": "1", "name": "Clínico Geral", "icon": "stethoscope", "price_per_minute": 5.30},
        {"id": "2", "name": "Cardiologia", "icon": "heart", "price_per_minute": 6.50},
        {"id": "3", "name": "Dermatologia", "icon": "sun", "price_per_minute": 6.00},
        {"id": "4", "name": "Endocrinologia", "icon": "activity", "price_per_minute": 6.50},
        {"id": "5", "name": "Ginecologia", "icon": "user", "price_per_minute": 6.00},
        {"id": "6", "name": "Neurologia", "icon": "brain", "price_per_minute": 7.00},
        {"id": "7", "name": "Ortopedia", "icon": "bone", "price_per_minute": 6.50},
        {"id": "8", "name": "Pediatria", "icon": "baby", "price_per_minute": 5.50},
        {"id": "9", "name": "Psiquiatria", "icon": "brain", "price_per_minute": 7.50},
        {"id": "10", "name": "Urologia", "icon": "droplet", "price_per_minute": 6.50},
    ]

# ============== REVIEWS ROUTES ==============

class ReviewCreate(BaseModel):
    rating: int
    tags: Optional[List[str]] = None
    comment: Optional[str] = None

@api_router.post("/reviews/{request_id}")
async def submit_review(request_id: str, token: str, data: ReviewCreate):
    """Submit a review for a completed request"""
    user = await get_current_user(token)
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    if request.get("patient_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Apenas o paciente pode avaliar")
    
    # Update request with review
    review_data = {
        "rating": data.rating,
        "tags": data.tags or [],
        "comment": data.comment,
        "reviewed_at": datetime.utcnow().isoformat()
    }
    
    await update_one("requests", {"id": request_id}, {"review": review_data})
    
    # Update doctor's average rating if applicable
    if request.get("doctor_id"):
        doctor_requests = await find_many("requests", filters={"doctor_id": request["doctor_id"]}, limit=100)
        ratings = [r.get("review", {}).get("rating") for r in doctor_requests if r.get("review", {}).get("rating")]
        if ratings:
            avg_rating = sum(ratings) / len(ratings)
            await update_one("doctor_profiles", {"user_id": request["doctor_id"]}, {
                "rating": round(avg_rating, 2),
                "updated_at": datetime.utcnow().isoformat()
            })
    
    return {"message": "Avaliação enviada com sucesso", "review": review_data}

@api_router.get("/reviews/doctor/{doctor_id}")
async def get_doctor_reviews(doctor_id: str, limit: int = 20):
    """Get reviews for a specific doctor"""
    requests = await find_many("requests", filters={"doctor_id": doctor_id}, order="created_at.desc", limit=limit)
    
    reviews = []
    for r in requests:
        if r.get("review"):
            reviews.append({
                "id": r["id"],
                "patient_name": r.get("patient_name", "Paciente"),
                "rating": r["review"].get("rating"),
                "tags": r["review"].get("tags", []),
                "comment": r["review"].get("comment"),
                "date": r["review"].get("reviewed_at"),
                "request_type": r.get("request_type")
            })
    
    return reviews

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/stats")
async def get_admin_stats(token: str = None):
    total_users = await count_docs("users", {})
    total_patients = await count_docs("users", {"role": "patient"})
    total_doctors = await count_docs("users", {"role": "doctor"})
    
    # Count requests by status
    pending = await count_docs("requests", {"status": "submitted"})
    analyzing = await count_docs("requests", {"status": {"in": ["analyzing", "in_review"]}})
    
    # Get completed today
    today = datetime.utcnow().strftime("%Y-%m-%d")
    all_completed = await find_many("requests", filters={"status": "completed"}, limit=500)
    completed_today = sum(1 for r in all_completed if r.get("completed_at", "").startswith(today))
    
    # Calculate revenue
    all_payments = await find_many("payments", filters={"status": "completed"}, limit=500)
    total_revenue = sum(float(p.get("amount", 0)) for p in all_payments)
    
    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "pending_requests": pending,
        "analyzing_requests": analyzing,
        "completed_today": completed_today,
        "total_revenue": total_revenue
    }

@api_router.get("/admin/reports")
async def get_admin_reports(token: str, period: str = "month"):
    """Get detailed reports (admin only)"""
    user = await get_current_user(token)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get all data
    all_requests = await find_many("requests", limit=1000)
    all_payments = await find_many("payments", filters={"status": "completed"}, limit=500)
    all_doctors = await find_many("doctor_profiles", limit=100)
    
    # Calculate totals
    total_revenue = sum(float(p.get("amount", 0)) for p in all_payments)
    completed_requests = [r for r in all_requests if r.get("status") == "completed"]
    
    # Requests by type
    prescription_count = sum(1 for r in all_requests if r.get("request_type") == "prescription")
    consultation_count = sum(1 for r in all_requests if r.get("request_type") == "consultation")
    exam_count = sum(1 for r in all_requests if r.get("request_type") == "exam")
    total_count = len(all_requests) or 1
    
    # Top doctors
    doctor_stats = {}
    for r in completed_requests:
        doc_id = r.get("doctor_id")
        if doc_id:
            if doc_id not in doctor_stats:
                doctor_stats[doc_id] = {"name": r.get("doctor_name", "N/A"), "count": 0, "ratings": []}
            doctor_stats[doc_id]["count"] += 1
            if r.get("review", {}).get("rating"):
                doctor_stats[doc_id]["ratings"].append(r["review"]["rating"])
    
    top_doctors = []
    for doc_id, stats in sorted(doctor_stats.items(), key=lambda x: x[1]["count"], reverse=True)[:5]:
        avg_rating = sum(stats["ratings"]) / len(stats["ratings"]) if stats["ratings"] else 0
        top_doctors.append({
            "name": stats["name"],
            "consultations": stats["count"],
            "rating": round(avg_rating, 1)
        })
    
    # Average rating
    all_ratings = [r.get("review", {}).get("rating") for r in all_requests if r.get("review", {}).get("rating")]
    avg_rating = round(sum(all_ratings) / len(all_ratings), 1) if all_ratings else 0
    
    return {
        "totalRevenue": total_revenue,
        "monthlyRevenue": total_revenue * 0.3,  # Simplified
        "totalRequests": len(all_requests),
        "completedRequests": len(completed_requests),
        "pendingRequests": len(all_requests) - len(completed_requests),
        "averageRating": avg_rating,
        "topDoctors": top_doctors,
        "requestsByType": [
            {"type": "Receitas", "count": prescription_count, "percentage": round(prescription_count / total_count * 100)},
            {"type": "Consultas", "count": consultation_count, "percentage": round(consultation_count / total_count * 100)},
            {"type": "Exames", "count": exam_count, "percentage": round(exam_count / total_count * 100)},
        ]
    }

@api_router.get("/admin/users")
async def get_admin_users(token: str, role: str = None):
    """Get all users (admin only)"""
    user = await get_current_user(token)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    filters = {"role": role} if role else None
    users = await find_many("users", filters=filters, order="created_at.desc", limit=500)
    
    # Remove sensitive data
    for u in users:
        u.pop("password_hash", None)
    
    return users

@api_router.put("/admin/users/{user_id}/status")
async def update_user_status(user_id: str, token: str, active: bool = True):
    """Activate/deactivate user (admin only)"""
    user = await get_current_user(token)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    target_user = await find_one("users", {"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    await update_one("users", {"id": user_id}, {"active": active, "updated_at": datetime.utcnow().isoformat()})
    
    return {"message": f"Usuário {'ativado' if active else 'desativado'} com sucesso"}

@api_router.get("/integrations/status")
async def get_integrations_status():
    return {
        "payments": {"mercadopago": False, "stripe": False, "simulated_available": True},
        "video": {"jitsi": True},
        "signature": {"simulated_available": True}
    }

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "RenoveJá+ API", "version": "2.0.0", "database": "Supabase", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "supabase", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
