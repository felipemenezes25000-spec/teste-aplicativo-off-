"""
RenoveJá+ API - Supabase Version
FastAPI backend with Supabase/PostgreSQL database
"""

from fastapi import FastAPI, APIRouter, HTTPException
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

# Import Supabase database module
from database import db, find_one, find_many, insert_one, update_one, delete_one, count_docs

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
    duration: int = 15
    scheduled_at: Optional[str] = None
    notes: Optional[str] = None

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
        "role": data.role
    }
    
    await insert_one("users", user_data)
    
    token = generate_token()
    await insert_one("active_tokens", {"token": token, "user_id": user_id})
    
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
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": user["id"],
        "title": "✅ Solicitação Criada",
        "message": "Sua solicitação de renovação de receita foi enviada e está aguardando análise médica.",
        "notification_type": "success"
    })
    
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
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": user["id"],
        "title": "✅ Solicitação Enviada",
        "message": "Sua solicitação de exames foi enviada e será analisada pela equipe de enfermagem.",
        "notification_type": "success"
    })
    
    return request_data

@api_router.post("/requests/consultation")
async def create_consultation_request(token: str, data: ConsultationRequestCreate):
    user = await get_current_user(token)
    
    price = get_price("consultation")
    
    request_id = str(uuid.uuid4())
    request_data = {
        "id": request_id,
        "patient_id": user["id"],
        "patient_name": user["name"],
        "request_type": "consultation",
        "specialty": data.specialty,
        "duration": data.duration,
        "scheduled_at": data.scheduled_at,
        "notes": data.notes,
        "price": price,
        "status": "submitted"
    }
    
    await insert_one("requests", request_data)
    
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
    
    if request.get("status") not in ["submitted", "pending"]:
        raise HTTPException(status_code=400, detail="Solicitação não está disponível para análise")
    
    await update_one("requests", {"id": request_id}, {
        "status": "in_review",
        "doctor_id": user["id"],
        "doctor_name": user["name"],
        "assigned_at": datetime.utcnow().isoformat()
    })
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": request["patient_id"],
        "title": "Solicitação em análise",
        "message": f"Dr(a). {user['name']} está analisando sua solicitação.",
        "notification_type": "info"
    })
    
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
    
    update_data = {
        "status": "approved_pending_payment",
        "approved_at": datetime.utcnow().isoformat()
    }
    
    if data and data.price:
        update_data["price"] = data.price
    if data and data.notes:
        update_data["notes"] = data.notes
    
    await update_one("requests", {"id": request_id}, update_data)
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": request["patient_id"],
        "title": "✅ Solicitação Aprovada!",
        "message": f"Sua solicitação foi aprovada por Dr(a). {user['name']}. Realize o pagamento para receber sua receita assinada.",
        "notification_type": "success"
    })
    
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
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": request["patient_id"],
        "title": "❌ Solicitação Recusada",
        "message": f"Sua solicitação foi recusada. Motivo: {data.reason}",
        "notification_type": "error"
    })
    
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
        "signature_data": signature_data
    })
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": request["patient_id"],
        "title": "📝 Receita Assinada!",
        "message": "Sua receita foi assinada digitalmente e está pronta para download.",
        "notification_type": "success"
    })
    
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
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": request["patient_id"],
        "title": "🩺 Triagem Iniciada",
        "message": "Sua solicitação de exames está sendo analisada pela equipe de enfermagem.",
        "notification_type": "info"
    })
    
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
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": request["patient_id"],
        "title": "✅ Exames Aprovados!",
        "message": f"Sua solicitação de exames foi aprovada. Realize o pagamento de R$ {data.price:.2f} para receber o pedido.",
        "notification_type": "success"
    })
    
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
        "status": "in_medical_review",
        "notes": f"Encaminhado pela enfermagem: {data.reason or 'Requer validação médica'}"
    })
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": request["patient_id"],
        "title": "🔄 Encaminhado ao Médico",
        "message": "Sua solicitação foi encaminhada para validação médica.",
        "notification_type": "info"
    })
    
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
    
    notification_id = str(uuid.uuid4())
    await insert_one("notifications", {
        "id": notification_id,
        "user_id": request["patient_id"],
        "title": "❌ Solicitação Recusada",
        "message": f"Sua solicitação de exames foi recusada. Motivo: {data.reason}",
        "notification_type": "error"
    })
    
    return {"success": True, "message": "Solicitação recusada"}

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments")
async def create_payment(token: str, data: PaymentCreate):
    user = await get_current_user(token)
    
    request = await find_one("requests", {"id": data.request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    payment_id = str(uuid.uuid4())
    payment_data = {
        "id": payment_id,
        "request_id": data.request_id,
        "patient_id": user["id"],
        "amount": data.amount,
        "method": data.method,
        "status": "pending",
        "pix_code": generate_pix_code() if data.method == "pix" else None,
        "is_real_payment": False
    }
    
    await insert_one("payments", payment_data)
    
    return payment_data

@api_router.get("/payments/{payment_id}")
async def get_payment(payment_id: str, token: str):
    user = await get_current_user(token)
    payment = await find_one("payments", {"id": payment_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    return payment

@api_router.get("/payments/{payment_id}/status")
async def check_payment_status(payment_id: str, token: str):
    user = await get_current_user(token)
    payment = await find_one("payments", {"id": payment_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    return {
        "payment_id": payment_id,
        "status": payment.get("status"),
        "amount": payment.get("amount"),
        "is_real_payment": payment.get("is_real_payment", False)
    }

@api_router.post("/payments/{payment_id}/confirm")
async def confirm_payment(payment_id: str, token: str):
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
    if request and request.get("doctor_id"):
        notification_id = str(uuid.uuid4())
        await insert_one("notifications", {
            "id": notification_id,
            "user_id": request["doctor_id"],
            "title": "💰 Pagamento Recebido!",
            "message": f"O paciente {request.get('patient_name', 'N/A')} realizou o pagamento. A receita precisa ser assinada.",
            "notification_type": "success"
        })
    
    return {"message": "Pagamento confirmado com sucesso", "status": "paid"}

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

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/stats")
async def get_admin_stats(token: str = None):
    total_users = await count_docs("users", {})
    total_patients = await count_docs("users", {"role": "patient"})
    total_doctors = await count_docs("users", {"role": "doctor"})
    
    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "pending_requests": 0,
        "analyzing_requests": 0,
        "completed_today": 0,
        "total_revenue": 0.0
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
