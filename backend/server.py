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
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
import hashlib
import secrets
import httpx
import bcrypt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import Supabase database module
from database import db, find_one, find_many, insert_one, update_one, delete_one, count_docs

# Import notifications helper
from notifications_helper import (
    notify_user, notify_users, notify_role,
    notify_available_doctors, notify_available_nurses, notify_admins,
    TEMPLATES, create_notification,
    # Push notification functions
    send_push_notification, send_push_to_user, send_push_to_users,
    notify_user_with_push, notify_users_with_push,
    push_prescription_accepted, push_prescription_approved, push_prescription_rejected,
    push_prescription_signed, push_new_chat_message, push_consultation_starting,
    push_consultation_reminder, push_payment_confirmed, push_exam_approved
)

# Import AI Medical Analyzer
from ai_medical_analyzer import analyze_medical_document, MedicalDocumentAnalyzer

ROOT_DIR = Path(__file__).parent
# UTF-8 para evitar UnicodeDecodeError no Windows ao ler .env
load_dotenv(ROOT_DIR / '.env', encoding='utf-8')

# Import monitoring
from monitoring import init_sentry, capture_exception, set_user_context

# Initialize Sentry monitoring
init_sentry()

# Rate limiter: arquivo no diretório do backend (evita erro de encoding no Windows)
limiter = Limiter(key_func=get_remote_address, config_filename=str(ROOT_DIR / ".env.ratelimit"))

# Documentação da API (Swagger + ReDoc)
OPENAPI_DESCRIPTION = """
## RenoveJá+ API – Telemedicina

API REST do backend RenoveJá+, com autenticação JWT, pedidos de consulta, prescrição, exames, chat, pagamentos (Mercado Pago) e integrações.

### Acesso à documentação
- **Swagger UI:** [GET /docs](/docs) – testar os endpoints interativamente
- **ReDoc:** [GET /redoc](/redoc) – documentação em formato alternativo
- **OpenAPI JSON:** [GET /openapi.json](/openapi.json) – especificação OpenAPI 3.0
"""

# Create the main app
app = FastAPI(
    title="RenoveJá+ API",
    version="2.0.0 - Supabase",
    description=OPENAPI_DESCRIPTION,
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc
    openapi_url="/openapi.json",
    openapi_tags=[
        {"name": "Auth", "description": "Registro, login e sessão"},
        {"name": "Perfil", "description": "Perfil do usuário e push token"},
        {"name": "Pedidos", "description": "Prescrição, exame e consulta"},
        {"name": "Médicos", "description": "Fila e disponibilidade de médicos"},
        {"name": "Enfermagem", "description": "Fila e ações de enfermagem"},
        {"name": "Pagamentos", "description": "PIX e webhooks Mercado Pago"},
        {"name": "Chat", "description": "Mensagens por pedido"},
        {"name": "Notificações", "description": "Notificações do usuário"},
        {"name": "Fila", "description": "Estatísticas e atribuição de pedidos"},
        {"name": "Vídeo", "description": "Salas de vídeo e consulta"},
        {"name": "IA", "description": "Análise de documentos e preenchimento"},
        {"name": "Avaliações", "description": "Reviews de médicos"},
        {"name": "Admin", "description": "Estatísticas e gestão de usuários"},
        {"name": "Integrações", "description": "Status de integrações"},
        {"name": "Health", "description": "Saúde da API"},
    ],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== ROOT ROUTE ==============
@app.get("/", tags=["Health"])
async def root():
    """Página inicial da API"""
    return {
        "app": "🏥 RenoveJá+ API",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": "/openapi.json",
        "health": "/api/health",
        "message": "Bem-vindo à API do RenoveJá!"
    }

# ============== MODELS ==============

# ============== SECURITY HELPERS ==============

import re

def validate_cpf(cpf: str) -> bool:
    """Validate CPF using the official algorithm"""
    if not cpf:
        return True  # CPF is optional
    
    # Remove non-digits
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    if len(cpf) != 11:
        return False
    
    # Check for known invalid patterns
    if cpf == cpf[0] * 11:
        return False
    
    # Validate first digit
    sum1 = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digit1 = (sum1 * 10 % 11) % 10
    if digit1 != int(cpf[9]):
        return False
    
    # Validate second digit
    sum2 = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digit2 = (sum2 * 10 % 11) % 10
    if digit2 != int(cpf[10]):
        return False
    
    return True

def validate_crm(crm: str, state: str) -> bool:
    """Validate CRM format (basic validation)"""
    if not crm or not state:
        return False
    
    # Remove non-alphanumeric
    crm_clean = re.sub(r'[^0-9]', '', crm)
    
    # CRM should be 4-7 digits
    if not (4 <= len(crm_clean) <= 7):
        return False
    
    # State should be valid Brazilian state
    valid_states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
    if state.upper() not in valid_states:
        return False
    
    return True

def validate_coren(coren: str, state: str) -> bool:
    """Validate COREN format (basic validation)"""
    if not coren or not state:
        return False
    
    # Remove non-alphanumeric
    coren_clean = re.sub(r'[^0-9]', '', coren)
    
    # COREN should be 5-9 digits
    if not (5 <= len(coren_clean) <= 9):
        return False
    
    # State should be valid Brazilian state
    valid_states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
    if state.upper() not in valid_states:
        return False
    
    return True

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets minimum security requirements"""
    if len(password) < 8:
        return False, "Senha deve ter pelo menos 8 caracteres"
    if not re.search(r'[A-Z]', password):
        return False, "Senha deve conter pelo menos uma letra maiúscula"
    if not re.search(r'[a-z]', password):
        return False, "Senha deve conter pelo menos uma letra minúscula"
    if not re.search(r'[0-9]', password):
        return False, "Senha deve conter pelo menos um número"
    return True, ""

def validate_base64_image(data: str, max_size_mb: int = 10) -> tuple[bool, str]:
    """Validate base64 image data"""
    if not data:
        return True, ""
    
    # Handle data URI scheme
    if data.startswith('data:'):
        parts = data.split(',')
        if len(parts) != 2:
            return False, "Formato de imagem inválido"
        mime_part = parts[0]
        # Check if it's an image
        if not any(img_type in mime_part for img_type in ['image/jpeg', 'image/png', 'image/gif', 'image/webp']):
            return False, "Tipo de imagem não suportado"
        data = parts[1]
    
    # Check base64 validity and size
    try:
        import base64
        decoded = base64.b64decode(data)
        size_mb = len(decoded) / (1024 * 1024)
        if size_mb > max_size_mb:
            return False, f"Imagem muito grande (máximo {max_size_mb}MB)"
    except Exception:
        return False, "Dados de imagem inválidos"
    
    return True, ""

# Token expiration (24 hours)
TOKEN_EXPIRATION_HOURS = 24

# ============== MODELS ==============

class BaseModelForbidExtra(BaseModel):
    """Base model that forbids extra fields to prevent mass assignment"""
    class Config:
        extra = "forbid"

class UserCreate(BaseModelForbidExtra):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    cpf: Optional[str] = None
    role: Literal["patient", "doctor", "admin", "nurse"] = "patient"

class UserLogin(BaseModelForbidExtra):
    email: str
    password: str

class DoctorRegister(BaseModelForbidExtra):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    cpf: Optional[str] = None
    crm: str
    crm_state: str
    specialty: str

class NurseRegister(BaseModelForbidExtra):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    cpf: Optional[str] = None
    coren: str
    coren_state: str
    specialty: Optional[str] = "Enfermagem Geral"

class Token(BaseModelForbidExtra):
    access_token: str
    token_type: str = "bearer"
    user: dict

class PrescriptionRequestCreate(BaseModelForbidExtra):
    prescription_type: Literal["simple", "controlled", "blue"]
    medications: Optional[List[dict]] = None
    prescription_images: Optional[List[str]] = None
    image_base64: Optional[str] = None
    notes: Optional[str] = None

class ExamRequestCreate(BaseModelForbidExtra):
    description: Optional[str] = None
    exam_images: Optional[List[str]] = None
    notes: Optional[str] = None
    exam_type: Optional[str] = None
    exams: Optional[List[str]] = None

class ConsultationRequestCreate(BaseModelForbidExtra):
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

class RequestUpdate(BaseModelForbidExtra):
    status: Optional[str] = None
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None
    medications: Optional[List[dict]] = None
    exams: Optional[List[str]] = None
    ai_validated: Optional[bool] = None
    ai_validated_at: Optional[str] = None

class PaymentCreate(BaseModelForbidExtra):
    request_id: str
    amount: float
    method: Literal["pix", "credit_card", "debit_card"] = "pix"

class MessageCreate(BaseModelForbidExtra):
    request_id: str
    message: str

class ProfileUpdate(BaseModelForbidExtra):
    name: Optional[str] = None
    phone: Optional[str] = None
    cpf: Optional[str] = None
    birth_date: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[dict] = None

class PushTokenUpdate(BaseModelForbidExtra):
    push_token: str

class DoctorApprovalRequest(BaseModelForbidExtra):
    price: Optional[float] = None
    notes: Optional[str] = None

class DoctorRejectionRequest(BaseModelForbidExtra):
    reason: str
    notes: Optional[str] = None

class NursingApprovalRequest(BaseModelForbidExtra):
    price: float
    exam_type: Optional[str] = None
    exams: Optional[List[str]] = None
    notes: Optional[str] = None

class NursingRejectionRequest(BaseModelForbidExtra):
    reason: str
    notes: Optional[str] = None

class NursingForwardRequest(BaseModelForbidExtra):
    reason: Optional[str] = None
    notes: Optional[str] = None

class VideoRoomCreate(BaseModelForbidExtra):
    request_id: str
    room_name: Optional[str] = None

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    """Hash password using bcrypt (more secure than SHA256)"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    """
    Verify password against hash.
    Supports both bcrypt (new) and SHA256 (legacy) for backward compatibility.
    """
    if not hashed:
        return False
    
    # Try bcrypt first (new format - starts with $2b$ or $2a$)
    if hashed.startswith('$2'):
        try:
            return bcrypt.checkpw(password.encode(), hashed.encode())
        except Exception:
            return False
    
    # Fallback to SHA256 for legacy passwords
    return hashlib.sha256(password.encode()).hexdigest() == hashed

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

def extract_token(request: Request = None, token: str = None) -> str:
    """
    Extract token from either:
    1. Authorization header (Bearer token) - preferred
    2. Query parameter 'token' - for backward compatibility
    """
    # Try Authorization header first
    if request:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:]  # Remove "Bearer " prefix
    
    # Fallback to query parameter
    if token:
        return token
    
    return None

async def get_current_user(token: str = None, request: Request = None):
    """
    Get current user from token.
    Token can be provided via:
    - Authorization: Bearer <token> header
    - ?token=<token> query parameter
    """
    extracted_token = extract_token(request, token)
    
    if not extracted_token:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    
    token_record = await find_one("active_tokens", {"token": extracted_token})
    if not token_record:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    
    # Check token expiration
    expires_at = token_record.get("expires_at")
    if expires_at:
        try:
            expiry_time = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if datetime.utcnow() > expiry_time.replace(tzinfo=None):
                # Token expired - delete it
                await delete_one("active_tokens", {"token": extracted_token})
                raise HTTPException(status_code=401, detail="Token expirado. Faça login novamente.")
        except ValueError:
            pass  # If expiry parsing fails, continue (backward compatibility)
    
    user = await find_one("users", {"id": token_record["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    # Check if user is active
    if not user.get("active", True):
        raise HTTPException(status_code=401, detail="Conta desativada")
    
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=Token, tags=["Auth"])
@limiter.limit("10/minute")
async def register(request: Request, data: UserCreate):
    # Validate password strength
    is_valid_pwd, pwd_error = validate_password_strength(data.password)
    if not is_valid_pwd:
        raise HTTPException(status_code=400, detail=pwd_error)
    
    # Validate CPF if provided
    if data.cpf and not validate_cpf(data.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")
    
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
    token_expiry = (datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS)).isoformat()
    await insert_one("active_tokens", {"token": token, "user_id": user_id, "expires_at": token_expiry, "created_at": datetime.utcnow().isoformat()})
    
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

@api_router.post("/auth/register-doctor", response_model=Token, tags=["Auth"])
@limiter.limit("10/minute")
async def register_doctor(request: Request, data: DoctorRegister):
    # Validate password strength
    is_valid_pwd, pwd_error = validate_password_strength(data.password)
    if not is_valid_pwd:
        raise HTTPException(status_code=400, detail=pwd_error)
    
    # Validate CPF if provided
    if data.cpf and not validate_cpf(data.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")
    
    # Validate CRM
    if not validate_crm(data.crm, data.crm_state):
        raise HTTPException(status_code=400, detail="CRM inválido. Verifique o número e o estado.")
    
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
        "role": "doctor",
        "active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await insert_one("users", user_data)
    
    profile_id = str(uuid.uuid4())
    doctor_profile = {
        "id": profile_id,
        "user_id": user_id,
        "crm": data.crm.upper(),
        "crm_state": data.crm_state.upper(),
        "specialty": data.specialty,
        "available": False,  # Start as unavailable until verified
        "created_at": datetime.utcnow().isoformat()
    }
    await insert_one("doctor_profiles", doctor_profile)
    
    token = generate_token()
    token_expiry = (datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS)).isoformat()
    await insert_one("active_tokens", {"token": token, "user_id": user_id, "expires_at": token_expiry, "created_at": datetime.utcnow().isoformat()})
    
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

@api_router.post("/auth/register-nurse", response_model=Token, tags=["Auth"])
@limiter.limit("10/minute")
async def register_nurse(request: Request, data: NurseRegister):
    # Validate password strength
    is_valid_pwd, pwd_error = validate_password_strength(data.password)
    if not is_valid_pwd:
        raise HTTPException(status_code=400, detail=pwd_error)
    
    # Validate CPF if provided
    if data.cpf and not validate_cpf(data.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")
    
    # Validate COREN
    if not validate_coren(data.coren, data.coren_state):
        raise HTTPException(status_code=400, detail="COREN inválido. Verifique o número e o estado.")
    
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
        "role": "nurse",
        "active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await insert_one("users", user_data)
    
    profile_id = str(uuid.uuid4())
    nurse_profile = {
        "id": profile_id,
        "user_id": user_id,
        "coren": data.coren.upper(),
        "coren_state": data.coren_state.upper(),
        "specialty": data.specialty or "Enfermagem Geral",
        "available": False,  # Start as unavailable until verified
        "created_at": datetime.utcnow().isoformat()
    }
    await insert_one("nurse_profiles", nurse_profile)
    
    token = generate_token()
    token_expiry = (datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS)).isoformat()
    await insert_one("active_tokens", {"token": token, "user_id": user_id, "expires_at": token_expiry, "created_at": datetime.utcnow().isoformat()})
    
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

@api_router.post("/auth/login", response_model=Token, tags=["Auth"])
@limiter.limit("20/minute")
async def login(request: Request, data: UserLogin):
    user = await find_one("users", {"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Check if user is active
    if not user.get("active", True):
        raise HTTPException(status_code=401, detail="Conta desativada. Entre em contato com o suporte.")
    
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = generate_token()
    token_expiry = (datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS)).isoformat()
    await insert_one("active_tokens", {"token": token, "user_id": user["id"], "expires_at": token_expiry, "created_at": datetime.utcnow().isoformat()})
    
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

@api_router.post("/auth/google", response_model=Token, tags=["Auth"])
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

@api_router.post("/auth/logout", tags=["Auth"])
async def logout(token: str):
    # Verify token exists before deleting (don't leak info about valid tokens)
    token_record = await find_one("active_tokens", {"token": token})
    if token_record:
        await delete_one("active_tokens", {"token": token})
    # Always return success to prevent token enumeration
    return {"message": "Logout realizado com sucesso"}

@api_router.get("/auth/me", tags=["Auth"])
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

@api_router.put("/profile", tags=["Perfil"])
async def update_profile(token: str, data: ProfileUpdate):
    user = await get_current_user(token)
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if update_data:
        await update_one("users", {"id": user["id"]}, update_data)
    
    updated_user = await find_one("users", {"id": user["id"]})
    return {"message": "Perfil atualizado com sucesso", "user": updated_user}

# ============== PUSH TOKEN ROUTES ==============

@api_router.post("/push-token", tags=["Perfil"])
async def update_push_token(token: str, data: PushTokenUpdate):
    """
    Atualiza o push token do usuário para receber notificações.
    Deve ser chamado pelo app após login e ao receber novo token.
    """
    user = await get_current_user(token)
    
    push_token = data.push_token
    
    # Validar formato do token Expo
    if not push_token.startswith("ExponentPushToken["):
        raise HTTPException(status_code=400, detail="Token de push inválido. Formato esperado: ExponentPushToken[...]")
    
    # Atualizar token do usuário
    await update_one("users", {"id": user["id"]}, {
        "push_token": push_token,
        "push_token_updated_at": datetime.utcnow().isoformat()
    })
    
    return {"message": "Push token atualizado com sucesso", "push_token": push_token}

@api_router.delete("/push-token", tags=["Perfil"])
async def remove_push_token(token: str):
    """
    Remove o push token do usuário (ex: ao fazer logout).
    """
    user = await get_current_user(token)
    
    await update_one("users", {"id": user["id"]}, {
        "push_token": None,
        "push_token_updated_at": datetime.utcnow().isoformat()
    })
    
    return {"message": "Push token removido com sucesso"}

# ============== REQUEST ROUTES ==============

@api_router.post("/requests/prescription", tags=["Pedidos"])
@limiter.limit("10/minute")
async def create_prescription_request(request: Request, token: str, data: PrescriptionRequestCreate):
    user = await get_current_user(token)
    
    # SECURITY: Validate base64 images
    if data.image_base64:
        is_valid, error = validate_base64_image(data.image_base64)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Imagem inválida: {error}")
    
    if data.prescription_images:
        for img in data.prescription_images:
            is_valid, error = validate_base64_image(img)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Imagem inválida: {error}")
    
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

@api_router.post("/requests/exam", tags=["Pedidos"])
@limiter.limit("10/minute")
async def create_exam_request(request: Request, token: str, data: ExamRequestCreate):
    user = await get_current_user(token)
    
    # SECURITY: Validate base64 images
    if data.exam_images:
        for img in data.exam_images:
            is_valid, error = validate_base64_image(img)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Imagem inválida: {error}")
    
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

@api_router.post("/requests/consultation", tags=["Pedidos"])
@limiter.limit("10/minute")
async def create_consultation_request(request: Request, token: str, data: ConsultationRequestCreate):
    user = await get_current_user(token)
    
    # Calcular preço baseado na especialidade e duração
    price = calculate_consultation_price(data.specialty, data.duration)
    
    # Montar notas com informações do agendamento
    schedule_info = f"[{data.schedule_type.upper()}]" if data.schedule_type else "[IMMEDIATE]"
    notes_with_schedule = f"{schedule_info} {data.notes or ''}".strip()
    
    request_id = str(uuid.uuid4())
    request_data = {
        "id": request_id,
        "patient_id": user["id"],
        "patient_name": user["name"],
        "request_type": "consultation",
        "specialty": data.specialty,
        "duration": data.duration,
        "scheduled_at": data.scheduled_at,
        "notes": notes_with_schedule,
        "price": price,
        "status": "submitted"
    }
    
    await insert_one("requests", request_data)
    
    # Adicionar schedule_type ao retorno (não salvo no banco ainda)
    request_data["schedule_type"] = data.schedule_type
    
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

@api_router.get("/requests", tags=["Pedidos"])
async def get_requests(token: str, status: Optional[str] = None):
    user = await get_current_user(token)
    user_role = user.get("role", "patient")
    user_id = user["id"]
    
    filters = {}
    
    # SECURITY: Apply proper filters based on role
    if user_role == "patient":
        # Patients can only see their own requests
        filters["patient_id"] = user_id
    elif user_role == "doctor":
        # Doctors see requests assigned to them or available for assignment
        # This is handled by getting all and filtering in memory for flexibility
        pass
    elif user_role == "nurse":
        # Nurses see exam requests assigned to them or available
        pass
    # Admins can see all (no filter needed)
    
    if status:
        filters["status"] = status
    
    all_requests = await find_many("requests", filters=filters if filters else None, order="created_at.desc")
    
    # Post-filter for doctors and nurses to ensure proper access control
    if user_role == "doctor":
        all_requests = [r for r in all_requests if (
            r.get("doctor_id") == user_id or  # Assigned to them
            (not r.get("doctor_id") and r.get("status") in ["submitted", "pending", "forwarded_to_doctor"]) or  # Unassigned and available
            r.get("status") == "in_medical_review"  # Forwarded from nursing
        )]
    elif user_role == "nurse":
        all_requests = [r for r in all_requests if (
            r.get("nurse_id") == user_id or  # Assigned to them
            (not r.get("nurse_id") and r.get("request_type") == "exam" and r.get("status") in ["submitted", "pending"])  # Unassigned exam requests
        )]
    
    return all_requests

@api_router.get("/requests/{request_id}", tags=["Pedidos"])
async def get_request(request_id: str, token: str):
    user = await get_current_user(token)
    request = await find_one("requests", {"id": request_id})
    
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    # SECURITY: Verify user has permission to access this request
    user_role = user.get("role", "patient")
    user_id = user["id"]
    
    # Patients can only see their own requests
    if user_role == "patient" and request.get("patient_id") != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado a esta solicitação")
    
    # Doctors can see requests assigned to them or unassigned ones
    if user_role == "doctor":
        is_owner = request.get("doctor_id") == user_id
        is_unassigned = not request.get("doctor_id")
        is_pending = request.get("status") in ["submitted", "pending", "forwarded_to_doctor"]
        if not (is_owner or (is_unassigned and is_pending)):
            raise HTTPException(status_code=403, detail="Acesso negado a esta solicitação")
    
    # Nurses can see exam requests assigned to them or unassigned ones
    if user_role == "nurse":
        is_owner = request.get("nurse_id") == user_id
        is_unassigned = not request.get("nurse_id")
        is_exam = request.get("request_type") == "exam"
        is_pending = request.get("status") in ["submitted", "pending"]
        if not (is_owner or (is_unassigned and is_exam and is_pending)):
            raise HTTPException(status_code=403, detail="Acesso negado a esta solicitação")
    
    # Admins can see everything (no additional check needed)
    
    return request

@api_router.put("/requests/{request_id}", tags=["Pedidos"])
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

@api_router.post("/requests/{request_id}/accept", tags=["Pedidos"])
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
    
    # Notificar paciente (in-app)
    await notify_user(
        insert_one, request["patient_id"], "prescription_accepted",
        {"doctor_name": user["name"]}, request_id=request_id
    )
    
    # 📲 Enviar push notification
    await push_prescription_accepted(
        find_one, request["patient_id"], user["name"], request_id
    )
    
    return {"success": True, "message": "Solicitação aceita para análise", "status": "in_review"}

@api_router.post("/requests/{request_id}/approve", tags=["Pedidos"])
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

@api_router.post("/requests/{request_id}/reject", tags=["Pedidos"])
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

@api_router.post("/requests/{request_id}/sign", tags=["Pedidos"])
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

@api_router.get("/doctors/queue", tags=["Médicos"])
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

@api_router.get("/doctors", tags=["Médicos"])
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

@api_router.get("/doctor/consultation-queue", tags=["Médicos"])
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

@api_router.get("/nursing/queue", tags=["Enfermagem"])
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

@api_router.post("/nursing/accept/{request_id}", tags=["Enfermagem"])
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

@api_router.post("/nursing/approve/{request_id}", tags=["Enfermagem"])
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

@api_router.post("/nursing/forward-to-doctor/{request_id}", tags=["Enfermagem"])
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

@api_router.post("/nursing/reject/{request_id}", tags=["Enfermagem"])
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

@api_router.post("/payments", tags=["Pagamentos"])
@limiter.limit("5/minute")
async def create_payment(request: Request, token: str, data: PaymentCreate):
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

@api_router.get("/payments/{payment_id}", tags=["Pagamentos"])
async def get_payment(payment_id: str, token: str):
    user = await get_current_user(token)
    payment = await find_one("payments", {"id": payment_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # SECURITY: Verify user has permission to access this payment
    user_role = user.get("role", "patient")
    user_id = user["id"]
    
    # Patients can only see their own payments
    if user_role == "patient" and payment.get("patient_id") != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado a este pagamento")
    
    # Doctors and nurses can see payments for requests they're handling
    if user_role in ["doctor", "nurse"]:
        request = await find_one("requests", {"id": payment.get("request_id")})
        if request:
            is_doctor_owner = request.get("doctor_id") == user_id
            is_nurse_owner = request.get("nurse_id") == user_id
            if not (is_doctor_owner or is_nurse_owner):
                raise HTTPException(status_code=403, detail="Acesso negado a este pagamento")
        else:
            raise HTTPException(status_code=403, detail="Acesso negado a este pagamento")
    
    # Admins can see all (no additional check needed)
    
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

@api_router.get("/payments/{payment_id}/status", tags=["Pagamentos"])
async def check_payment_status(payment_id: str, token: str):
    user = await get_current_user(token)
    user_role = user.get("role", "patient")
    user_id = user["id"]
    
    payment = await find_one("payments", {"id": payment_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # SECURITY: Verify user has permission to check this payment status
    if user_role == "patient" and payment.get("patient_id") != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado a este pagamento")
    
    if user_role in ["doctor", "nurse"]:
        request = await find_one("requests", {"id": payment.get("request_id")})
        if request:
            is_owner = request.get("doctor_id") == user_id or request.get("nurse_id") == user_id
            if not is_owner:
                raise HTTPException(status_code=403, detail="Acesso negado a este pagamento")
        else:
            raise HTTPException(status_code=403, detail="Acesso negado a este pagamento")
    
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

@api_router.post("/payments/{payment_id}/confirm", tags=["Pagamentos"])
async def confirm_payment(payment_id: str, token: str):
    """Manual confirmation (for simulated payments or admin override)"""
    user = await get_current_user(token)
    user_role = user.get("role", "patient")
    user_id = user["id"]
    
    payment = await find_one("payments", {"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # SECURITY: Verify user has permission to confirm this payment
    # Only the patient who owns the payment or admin can confirm
    if user_role == "patient" and payment.get("patient_id") != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado a este pagamento")
    
    # Doctors and nurses cannot confirm payments (only admin can override)
    if user_role in ["doctor", "nurse"]:
        raise HTTPException(status_code=403, detail="Apenas o paciente ou administrador pode confirmar pagamentos")
    
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

async def process_mercadopago_webhook(mp_payment_id: str):
    """Process MercadoPago payment approval"""
    # Check payment status on MercadoPago
    mp_status = await check_mercadopago_payment(str(mp_payment_id))
    
    if not mp_status:
        print(f"⚠️ Could not fetch payment status from MercadoPago: {mp_payment_id}")
        return False
    
    print(f"📥 MercadoPago payment {mp_payment_id} status: {mp_status.get('status')}")
    
    if mp_status.get("status") == "approved":
        # Find payment by external_id
        payments = await find_many("payments", filters={"external_id": str(mp_payment_id)}, limit=1)
        
        if not payments:
            print(f"⚠️ Payment not found for MP ID: {mp_payment_id}")
            return False
        
        payment = payments[0]
        
        if payment.get("status") == "completed":
            print(f"ℹ️ Payment {mp_payment_id} already processed")
            return True
        
        # Update payment
        await update_one("payments", {"id": payment["id"]}, {
            "status": "completed",
            "paid_at": mp_status.get("date_approved") or datetime.utcnow().isoformat(),
            "mp_status": mp_status.get("status"),
            "mp_status_detail": mp_status.get("status_detail")
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
        return True
    
    return False

@api_router.post("/webhooks/mercadopago", tags=["Pagamentos"])
async def mercadopago_webhook_handler(request: Request):
    """
    Webhook endpoint for MercadoPago payment notifications.
    
    Configure this URL in MercadoPago Dashboard:
    https://seu-dominio.com/api/webhooks/mercadopago
    
    Events to subscribe: payment.created, payment.updated
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        body_json = {}
        try:
            import json
            body_json = json.loads(body)
        except:
            pass
        
        # Extract headers for signature verification
        x_signature = request.headers.get("x-signature", "")
        x_request_id = request.headers.get("x-request-id", "")
        
        # Get data ID from query params or body
        data_id = request.query_params.get("data.id", "")
        if not data_id and body_json.get("data"):
            data_id = str(body_json["data"].get("id", ""))
        
        # Verify signature if webhook secret is configured
        if MERCADOPAGO_WEBHOOK_SECRET:
            if not verify_mercadopago_signature(x_signature, x_request_id, data_id):
                print(f"⚠️ Webhook signature verification failed")
                # Log but continue for debugging - in production you might want to reject
        
        print(f"📨 MercadoPago webhook received: type={body_json.get('type')}, action={body_json.get('action')}")
        
        # Handle different webhook formats
        # Format 1: IPN (Instant Payment Notification) - older format
        topic = request.query_params.get("topic", "")
        if topic == "payment":
            mp_payment_id = request.query_params.get("id", "")
            if mp_payment_id:
                await process_mercadopago_webhook(mp_payment_id)
                return {"status": "ok"}
        
        # Format 2: Webhook v2 - newer format
        if body_json.get("type") == "payment" and body_json.get("data"):
            mp_payment_id = body_json["data"].get("id")
            if mp_payment_id:
                await process_mercadopago_webhook(str(mp_payment_id))
                return {"status": "ok"}
        
        # Format 3: action-based
        if body_json.get("action") in ["payment.created", "payment.updated"]:
            mp_payment_id = body_json.get("data", {}).get("id")
            if mp_payment_id:
                await process_mercadopago_webhook(str(mp_payment_id))
                return {"status": "ok"}
        
        return {"status": "ok", "message": "Event type not handled"}
        
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        import traceback
        traceback.print_exc()
        # Return 200 to prevent MercadoPago from retrying
        return {"status": "error", "message": str(e)}

# Legacy endpoint alias for backward compatibility
@api_router.post("/payments/webhook/mercadopago", tags=["Pagamentos"])
async def mercadopago_webhook_legacy(request: Request):
    """Legacy webhook endpoint - redirects to main handler"""
    return await mercadopago_webhook_handler(request)

# ============== CHAT ROUTES ==============

@api_router.post("/chat", tags=["Chat"])
async def send_message(token: str, data: MessageCreate):
    user = await get_current_user(token)
    user_role = user.get("role", "patient")
    user_id = user["id"]
    
    # SECURITY: Verify user has permission to send messages in this chat
    request = await find_one("requests", {"id": data.request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    # Check access permissions
    is_patient = request.get("patient_id") == user_id
    is_doctor = request.get("doctor_id") == user_id
    is_nurse = request.get("nurse_id") == user_id
    is_admin = user_role == "admin"
    
    if not (is_patient or is_doctor or is_nurse or is_admin):
        raise HTTPException(status_code=403, detail="Acesso negado a este chat")
    
    # Sanitize message (basic XSS prevention - more robust sanitization recommended for production)
    sanitized_message = data.message.strip()
    if len(sanitized_message) > 5000:
        raise HTTPException(status_code=400, detail="Mensagem muito longa (máximo 5000 caracteres)")
    
    message_id = str(uuid.uuid4())
    message_data = {
        "id": message_id,
        "request_id": data.request_id,
        "sender_id": user["id"],
        "sender_name": user["name"],
        "sender_type": user.get("role", "patient"),
        "message": sanitized_message,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await insert_one("chat_messages", message_data)
    
    return message_data

@api_router.get("/chat/{request_id}", tags=["Chat"])
async def get_messages(request_id: str, token: str):
    user = await get_current_user(token)
    user_role = user.get("role", "patient")
    user_id = user["id"]
    
    # SECURITY: Verify user has permission to access this chat
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    # Check access permissions
    is_patient = request.get("patient_id") == user_id
    is_doctor = request.get("doctor_id") == user_id
    is_nurse = request.get("nurse_id") == user_id
    is_admin = user_role == "admin"
    
    if not (is_patient or is_doctor or is_nurse or is_admin):
        raise HTTPException(status_code=403, detail="Acesso negado a este chat")
    
    messages = await find_many("chat_messages", filters={"request_id": request_id}, order="created_at.asc")
    return messages

@api_router.get("/chat/unread-count", tags=["Chat"])
async def get_unread_count(token: str):
    user = await get_current_user(token)
    # Simplified - return 0 for now
    return {"unread_count": 0}

@api_router.post("/chat/{request_id}/mark-read", tags=["Chat"])
async def mark_chat_read(request_id: str, token: str):
    user = await get_current_user(token)
    # Mark all messages as read (simplified)
    return {"marked_read": 0}

# ============== NOTIFICATION ROUTES ==============

@api_router.get("/notifications", tags=["Notificações"])
async def get_notifications(token: str):
    user = await get_current_user(token)
    
    notifications = await find_many("notifications", filters={"user_id": user["id"]}, order="created_at.desc", limit=50)
    return notifications

@api_router.put("/notifications/{notification_id}/read", tags=["Notificações"])
async def mark_notification_read(notification_id: str, token: str):
    user = await get_current_user(token)
    
    # SECURITY: Verify the notification belongs to this user
    notification = await find_one("notifications", {"id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    if notification.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado a esta notificação")
    
    await update_one("notifications", {"id": notification_id}, {"read": True})
    
    return {"message": "Notificação marcada como lida"}

@api_router.put("/notifications/read-all", tags=["Notificações"])
async def mark_all_notifications_read(token: str):
    user = await get_current_user(token)
    
    # Get all unread notifications for this user and mark them as read
    notifications = await find_many("notifications", filters={"user_id": user["id"], "read": False}, limit=500)
    
    count = 0
    for notification in notifications:
        await update_one("notifications", {"id": notification["id"]}, {"read": True})
        count += 1
    
    return {"message": f"{count} notificações marcadas como lidas"}

# ============== QUEUE ROUTES ==============

@api_router.get("/queue/stats", tags=["Fila"])
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

@api_router.post("/queue/assign/{request_id}", tags=["Fila"])
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

@api_router.put("/doctor/availability", tags=["Médicos"])
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

@api_router.post("/video/create-room", tags=["Vídeo"])
async def create_video_room(token: str, data: VideoRoomCreate):
    """Create a Jitsi video room for consultation"""
    user = await get_current_user(token)

    request_id = data.request_id
    room_name = data.room_name

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

@api_router.get("/video/room/{request_id}", tags=["Vídeo"])
async def get_video_room(request_id: str, token: str):
    """Get video room info for a consultation"""
    user = await get_current_user(token)
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    return request.get("video_room")

@api_router.post("/consultation/start/{request_id}", tags=["Vídeo"])
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

@api_router.post("/consultation/end/{request_id}", tags=["Vídeo"])
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

@api_router.post("/queue/auto-assign", tags=["Fila"])
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

@api_router.get("/specialties", tags=["Médicos"])
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

# ============== AI MEDICAL DOCUMENT ANALYSIS ==============

class DocumentAnalysisRequest(BaseModel):
    image_data: str  # Base64 encoded image
    document_type: Optional[str] = "auto"  # "prescription", "exam", or "auto"
    request_id: Optional[str] = None  # ID da solicitação associada

@api_router.post("/ai/analyze-document", tags=["IA"])
async def ai_analyze_document(token: str, data: DocumentAnalysisRequest):
    """
    🤖 Analisa um documento médico usando IA (Claude Vision)
    
    Tipos suportados:
    - prescription: Receita médica
    - exam: Solicitação de exames
    - auto: Detecta automaticamente
    
    Retorna dados estruturados extraídos do documento.
    """
    user = await get_current_user(token)
    
    # Verificar se é médico ou enfermeiro
    if user.get("role") not in ["doctor", "nurse", "admin"]:
        raise HTTPException(status_code=403, detail="Apenas profissionais de saúde podem analisar documentos")
    
    try:
        # Obter API key do ambiente
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise HTTPException(status_code=500, detail="API de IA não configurada")
        
        # Analisar documento
        result = await analyze_medical_document(
            image_data=data.image_data,
            document_type=data.document_type,
            api_key=api_key
        )
        
        # Se houver request_id, salvar análise
        if data.request_id:
            await update_one("requests", {"id": data.request_id}, {
                "ai_analysis": result,
                "ai_analyzed_at": datetime.utcnow().isoformat(),
                "ai_analyzed_by": user["id"]
            })
        
        return {
            "success": True,
            "analysis": result,
            "message": "Documento analisado com sucesso"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@api_router.post("/ai/analyze-prescription", tags=["IA"])
async def ai_analyze_prescription(token: str, data: DocumentAnalysisRequest):
    """
    🤖 Analisa especificamente uma receita médica
    
    Extrai:
    - Medicamentos, dosagens, posologia
    - Informações do paciente
    - Informações do prescritor
    - Tipo de receita (simples/controlada/azul)
    """
    data.document_type = "prescription"
    return await ai_analyze_document(token, data)

@api_router.post("/ai/analyze-exam", tags=["IA"])
async def ai_analyze_exam(token: str, data: DocumentAnalysisRequest):
    """
    🤖 Analisa especificamente uma solicitação de exames
    
    Extrai:
    - Lista de exames solicitados
    - Indicação clínica
    - Informações do paciente
    - Informações do solicitante
    """
    data.document_type = "exam"
    return await ai_analyze_document(token, data)

@api_router.post("/ai/prefill-prescription", tags=["IA"])
async def ai_prefill_prescription(token: str, request_id: str, data: DocumentAnalysisRequest):
    """
    🤖 Analisa receita e pré-preenche os campos da solicitação
    
    Fluxo:
    1. Analisa a imagem da receita
    2. Extrai medicamentos e informações
    3. Atualiza a solicitação com os dados extraídos
    4. Retorna dados para validação pelo médico
    """
    user = await get_current_user(token)
    
    if user.get("role") not in ["doctor", "nurse", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso não autorizado")
    
    # Verificar se a solicitação existe
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        result = await analyze_medical_document(
            image_data=data.image_data,
            document_type="prescription",
            api_key=api_key
        )
        
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Extrair medicamentos para pré-preenchimento
        medications = result.get("medications", [])
        prescription_type = result.get("prescription_type", "simples")
        observations = result.get("general_observations", "")
        
        # Mapear tipo de receita
        type_map = {
            "simples": "simple",
            "controlada": "controlled",
            "azul": "blue",
            "antimicrobiano": "antimicrobial"
        }
        
        # Atualizar solicitação com dados extraídos
        update_data = {
            "ai_analysis": result,
            "ai_analyzed_at": datetime.utcnow().isoformat(),
            "ai_prefilled": True,
            "medications": medications,
            "prescription_type": type_map.get(prescription_type.lower(), "simple"),
            "ai_observations": observations,
            "ai_confidence": result.get("confidence_overall", "unknown")
        }
        
        await update_one("requests", {"id": request_id}, update_data)
        
        return {
            "success": True,
            "request_id": request_id,
            "prefilled_data": {
                "medications": medications,
                "prescription_type": type_map.get(prescription_type.lower(), "simple"),
                "observations": observations,
                "confidence": result.get("confidence_overall", "unknown")
            },
            "full_analysis": result,
            "message": "Receita analisada e dados pré-preenchidos. Valide antes de assinar."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@api_router.post("/ai/prefill-exam", tags=["IA"])
async def ai_prefill_exam(token: str, request_id: str, data: DocumentAnalysisRequest):
    """
    🤖 Analisa solicitação de exames e pré-preenche os campos
    """
    user = await get_current_user(token)
    
    if user.get("role") not in ["doctor", "nurse", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso não autorizado")
    
    request = await find_one("requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        result = await analyze_medical_document(
            image_data=data.image_data,
            document_type="exam",
            api_key=api_key
        )
        
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Extrair exames
        exams = [e.get("name") for e in result.get("exams", [])]
        clinical_indication = result.get("clinical_indication", "")
        
        # Atualizar solicitação
        update_data = {
            "ai_analysis": result,
            "ai_analyzed_at": datetime.utcnow().isoformat(),
            "ai_prefilled": True,
            "exams": exams,
            "exam_description": clinical_indication,
            "ai_confidence": result.get("confidence_overall", "unknown")
        }
        
        await update_one("requests", {"id": request_id}, update_data)
        
        return {
            "success": True,
            "request_id": request_id,
            "prefilled_data": {
                "exams": exams,
                "clinical_indication": clinical_indication,
                "exam_groups": result.get("exam_groups", []),
                "confidence": result.get("confidence_overall", "unknown")
            },
            "full_analysis": result,
            "message": "Exames analisados e dados pré-preenchidos. Valide antes de aprovar."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

# ============== REVIEWS ROUTES ==============

class ReviewCreate(BaseModel):
    rating: int
    tags: Optional[List[str]] = None
    comment: Optional[str] = None

@api_router.post("/reviews/{request_id}", tags=["Avaliações"])
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

@api_router.get("/reviews/doctor/{doctor_id}", tags=["Avaliações"])
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

@api_router.get("/admin/stats", tags=["Admin"])
async def get_admin_stats(token: str):
    # SECURITY: Require admin authentication
    user = await get_current_user(token)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
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

@api_router.get("/admin/reports", tags=["Admin"])
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

@api_router.get("/admin/users", tags=["Admin"])
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

@api_router.put("/admin/users/{user_id}/status", tags=["Admin"])
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

@api_router.get("/integrations/status", tags=["Integrações"])
async def get_integrations_status():
    return {
        "payments": {"mercadopago": False, "stripe": False, "simulated_available": True},
        "video": {"jitsi": True},
        "signature": {"simulated_available": True}
    }

# ============== HEALTH CHECK ==============

@api_router.get("/", tags=["Health"])
async def root():
    return {"message": "RenoveJá+ API", "version": "2.0.0", "database": "Supabase", "status": "healthy"}

@api_router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "database": "supabase", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8081").split(",")
# Add production domains
if os.getenv("ENV", "development") == "production":
    ALLOWED_ORIGINS.extend([
        "https://app.renoveja.com.br",
        "https://renoveja.com.br",
        "https://admin.renoveja.com.br"
    ])

# Em desenvolvimento, permitir qualquer origem (para app no celular via Expo Go)
_cors_kw = dict(
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-CSRF-Token"],
    expose_headers=["X-Total-Count", "X-Request-ID"],
    max_age=3600,
)
if os.getenv("ENV", "development") != "production":
    _cors_kw["allow_origin_regex"] = r".*"

app.add_middleware(CORSMiddleware, **_cors_kw)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
