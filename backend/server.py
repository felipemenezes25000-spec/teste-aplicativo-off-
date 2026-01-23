from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
import hashlib
import secrets
import base64
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Helper function to clean MongoDB documents
def clean_mongo_doc(doc):
    """Remove _id or convert ObjectId to string"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [clean_mongo_doc(d) for d in doc]
    if isinstance(doc, dict):
        cleaned = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip _id field
            if isinstance(value, ObjectId):
                cleaned[key] = str(value)
            elif isinstance(value, datetime):
                cleaned[key] = value.isoformat()
            elif isinstance(value, dict):
                cleaned[key] = clean_mongo_doc(value)
            elif isinstance(value, list):
                cleaned[key] = clean_mongo_doc(value)
            else:
                cleaned[key] = value
        return cleaned
    return doc

# Create the main app
app = FastAPI(title="RenoveJá+ API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

# Auth Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    cpf: Optional[str] = None
    role: Literal["patient", "doctor", "admin"] = "patient"

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

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    cpf: Optional[str] = None
    birth_date: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "patient"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    crm: str
    crm_state: str
    specialty: str
    bio: Optional[str] = None
    rating: float = 5.0
    total_consultations: int = 0
    available: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Request Models
class PrescriptionRequestCreate(BaseModel):
    prescription_type: Literal["simple", "controlled", "blue"]
    medications: Optional[List[dict]] = None
    image_base64: Optional[str] = None
    notes: Optional[str] = None

class ExamRequestCreate(BaseModel):
    exam_type: Literal["laboratory", "imaging"]
    exams: List[str]
    image_base64: Optional[str] = None
    notes: Optional[str] = None

class ConsultationRequestCreate(BaseModel):
    specialty: str
    duration: int = 15
    scheduled_at: Optional[str] = None
    notes: Optional[str] = None

class Request(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str
    request_type: Literal["prescription", "exam", "consultation"]
    status: Literal["pending", "analyzing", "approved", "rejected", "completed"] = "pending"
    price: float = 0.0
    notes: Optional[str] = None
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    # Prescription specific
    prescription_type: Optional[str] = None
    medications: Optional[List[dict]] = None
    image_url: Optional[str] = None
    # Exam specific
    exam_type: Optional[str] = None
    exams: Optional[List[str]] = None
    # Consultation specific
    specialty: Optional[str] = None
    duration: Optional[int] = None
    scheduled_at: Optional[str] = None
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None

# Payment Models
class PaymentCreate(BaseModel):
    request_id: str
    amount: float
    method: Literal["pix", "credit_card", "debit_card"] = "pix"

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    amount: float
    method: str
    status: Literal["pending", "processing", "completed", "failed"] = "pending"
    pix_code: Optional[str] = None
    pix_qr_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    paid_at: Optional[datetime] = None

# Chat Models
class MessageCreate(BaseModel):
    request_id: str
    message: str

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    sender_id: str
    sender_name: str
    sender_type: Literal["patient", "doctor", "support"]
    message: str
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Notification Models
class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    notification_type: Literal["success", "warning", "info", "error"] = "info"
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Profile Update
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    cpf: Optional[str] = None
    birth_date: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[dict] = None

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

# Token storage (in production, use Redis or similar)
active_tokens = {}

async def get_current_user(token: str = None):
    if not token or token not in active_tokens:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    user_id = active_tokens[token]
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=Token)
async def register(data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")
    
    # Create user
    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        cpf=data.cpf,
        role=data.role
    )
    user_dict = user.dict()
    user_dict["password_hash"] = hash_password(data.password)
    
    await db.users.insert_one(user_dict)
    
    # Generate token
    token = generate_token()
    active_tokens[token] = user.id
    
    return Token(
        access_token=token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "cpf": user.cpf,
            "role": user.role,
            "avatar_url": user.avatar_url
        }
    )

@api_router.post("/auth/register-doctor", response_model=Token)
async def register_doctor(data: DoctorRegister):
    # Check if email exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")
    
    # Create user
    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        cpf=data.cpf,
        role="doctor"
    )
    user_dict = user.dict()
    user_dict["password_hash"] = hash_password(data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create doctor profile
    doctor_profile = DoctorProfile(
        user_id=user.id,
        crm=data.crm,
        crm_state=data.crm_state,
        specialty=data.specialty
    )
    await db.doctor_profiles.insert_one(doctor_profile.dict())
    
    # Generate token
    token = generate_token()
    active_tokens[token] = user.id
    
    return Token(
        access_token=token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": "doctor",
            "avatar_url": user.avatar_url,
            "doctor_profile": doctor_profile.dict()
        }
    )

@api_router.post("/auth/login", response_model=Token)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Generate token
    token = generate_token()
    active_tokens[token] = user["id"]
    
    # Get doctor profile if doctor
    doctor_profile = None
    if user.get("role") == "doctor":
        dp = await db.doctor_profiles.find_one({"user_id": user["id"]})
        doctor_profile = clean_mongo_doc(dp)
    
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
            "doctor_profile": doctor_profile
        }
    )

@api_router.post("/auth/logout")
async def logout(token: str):
    if token in active_tokens:
        del active_tokens[token]
    return {"message": "Logout realizado com sucesso"}

@api_router.get("/auth/me")
async def get_me(token: str):
    user = await get_current_user(token)
    doctor_profile = None
    if user.get("role") == "doctor":
        doctor_profile = await db.doctor_profiles.find_one({"user_id": user["id"]})
    
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
        "doctor_profile": doctor_profile
    }

# ============== PROFILE ROUTES ==============

@api_router.put("/profile")
async def update_profile(token: str, data: ProfileUpdate):
    user = await get_current_user(token)
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": user["id"]})
    return {"message": "Perfil atualizado com sucesso", "user": updated_user}

# ============== REQUEST ROUTES ==============

@api_router.post("/requests/prescription")
async def create_prescription_request(token: str, data: PrescriptionRequestCreate):
    user = await get_current_user(token)
    
    price = get_price("prescription", data.prescription_type)
    
    request = Request(
        patient_id=user["id"],
        patient_name=user["name"],
        request_type="prescription",
        prescription_type=data.prescription_type,
        medications=data.medications,
        image_url=data.image_base64,
        notes=data.notes,
        price=price
    )
    
    await db.requests.insert_one(request.dict())
    
    # Create notification
    notification = Notification(
        user_id=user["id"],
        title="Solicitação Criada",
        message=f"Sua solicitação de renovação de receita foi criada com sucesso.",
        notification_type="success"
    )
    await db.notifications.insert_one(notification.dict())
    
    return request.dict()

@api_router.post("/requests/exam")
async def create_exam_request(token: str, data: ExamRequestCreate):
    user = await get_current_user(token)
    
    price = get_price("exam", data.exam_type)
    
    request = Request(
        patient_id=user["id"],
        patient_name=user["name"],
        request_type="exam",
        exam_type=data.exam_type,
        exams=data.exams,
        image_url=data.image_base64,
        notes=data.notes,
        price=price
    )
    
    await db.requests.insert_one(request.dict())
    
    return request.dict()

@api_router.post("/requests/consultation")
async def create_consultation_request(token: str, data: ConsultationRequestCreate):
    user = await get_current_user(token)
    
    price = get_price("consultation")
    
    request = Request(
        patient_id=user["id"],
        patient_name=user["name"],
        request_type="consultation",
        specialty=data.specialty,
        duration=data.duration,
        scheduled_at=data.scheduled_at,
        notes=data.notes,
        price=price
    )
    
    await db.requests.insert_one(request.dict())
    
    return request.dict()

@api_router.get("/requests")
async def get_requests(token: str, status: Optional[str] = None):
    user = await get_current_user(token)
    
    query = {}
    if user.get("role") == "patient":
        query["patient_id"] = user["id"]
    elif user.get("role") == "doctor":
        query["$or"] = [{"doctor_id": user["id"]}, {"doctor_id": None, "status": "pending"}]
    
    if status:
        query["status"] = status
    
    requests = await db.requests.find(query).sort("created_at", -1).to_list(100)
    return clean_mongo_doc(requests)

@api_router.get("/requests/{request_id}")
async def get_request(request_id: str, token: str):
    user = await get_current_user(token)
    request = await db.requests.find_one({"id": request_id})
    
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    return clean_mongo_doc(request)

@api_router.put("/requests/{request_id}")
async def update_request(request_id: str, token: str, data: RequestUpdate):
    user = await get_current_user(token)
    
    request = await db.requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    # Create notification for patient
    if data.status:
        status_messages = {
            "analyzing": "Sua solicitação está sendo analisada por um médico.",
            "approved": "Sua solicitação foi aprovada!",
            "rejected": "Sua solicitação foi recusada. Entre em contato para mais informações.",
            "completed": "Sua solicitação foi concluída com sucesso!"
        }
        if data.status in status_messages:
            notification = Notification(
                user_id=request["patient_id"],
                title="Atualização de Solicitação",
                message=status_messages[data.status],
                notification_type="success" if data.status in ["approved", "completed"] else "info"
            )
            await db.notifications.insert_one(notification.dict())
    
    updated_request = await db.requests.find_one({"id": request_id})
    return clean_mongo_doc(updated_request)

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments")
async def create_payment(token: str, data: PaymentCreate):
    user = await get_current_user(token)
    
    request = await db.requests.find_one({"id": data.request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    # Generate PIX code
    pix_code = generate_pix_code()
    
    payment = Payment(
        request_id=data.request_id,
        amount=data.amount,
        method=data.method,
        pix_code=pix_code if data.method == "pix" else None
    )
    
    await db.payments.insert_one(payment.dict())
    
    return payment.dict()

@api_router.get("/payments/{payment_id}")
async def get_payment(payment_id: str, token: str):
    user = await get_current_user(token)
    payment = await db.payments.find_one({"id": payment_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    return clean_mongo_doc(payment)

@api_router.post("/payments/{payment_id}/confirm")
async def confirm_payment(payment_id: str, token: str):
    user = await get_current_user(token)
    
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Update payment status
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {"status": "completed", "paid_at": datetime.utcnow()}}
    )
    
    # Update request status
    await db.requests.update_one(
        {"id": payment["request_id"]},
        {"$set": {"status": "pending", "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Pagamento confirmado com sucesso", "status": "completed"}

# ============== CHAT ROUTES ==============

@api_router.post("/chat")
async def send_message(token: str, data: MessageCreate):
    user = await get_current_user(token)
    
    message = ChatMessage(
        request_id=data.request_id,
        sender_id=user["id"],
        sender_name=user["name"],
        sender_type=user.get("role", "patient"),
        message=data.message
    )
    
    await db.chat_messages.insert_one(message.dict())
    
    return message.dict()

@api_router.get("/chat/{request_id}")
async def get_messages(request_id: str, token: str):
    user = await get_current_user(token)
    
    messages = await db.chat_messages.find({"request_id": request_id}).sort("created_at", 1).to_list(100)
    return clean_mongo_doc(messages)

# ============== NOTIFICATION ROUTES ==============

@api_router.get("/notifications")
async def get_notifications(token: str):
    user = await get_current_user(token)
    
    notifications = await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    return clean_mongo_doc(notifications)

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, token: str):
    user = await get_current_user(token)
    
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notificação marcada como lida"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(token: str):
    user = await get_current_user(token)
    
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "Todas as notificações marcadas como lidas"}

# ============== DOCTOR ROUTES ==============

@api_router.get("/doctors")
async def get_doctors(specialty: Optional[str] = None):
    query = {"available": True}
    if specialty:
        query["specialty"] = specialty
    
    doctor_profiles = await db.doctor_profiles.find(query).to_list(50)
    
    # Get user info for each doctor
    doctors = []
    for dp in doctor_profiles:
        user = await db.users.find_one({"id": dp["user_id"]})
        if user:
            doctors.append(clean_mongo_doc({
                **dp,
                "name": user["name"],
                "email": user["email"],
                "avatar_url": user.get("avatar_url")
            }))
    
    return doctors

@api_router.get("/doctors/queue")
async def get_doctor_queue(token: str):
    user = await get_current_user(token)
    
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get pending requests
    pending = await db.requests.find({"status": "pending"}).sort("created_at", 1).to_list(50)
    
    # Get requests being analyzed by this doctor
    analyzing = await db.requests.find({"doctor_id": user["id"], "status": "analyzing"}).to_list(50)
    
    return {"pending": clean_mongo_doc(pending), "analyzing": clean_mongo_doc(analyzing)}

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

# ============== VIDEO CONFERENCE ROUTES ==============

class VideoRoomCreate(BaseModel):
    request_id: str
    room_name: Optional[str] = None

@api_router.post("/video/create-room")
async def create_video_room(token: str, data: VideoRoomCreate):
    """Create a video conference room for consultation"""
    user = await get_current_user(token)
    
    try:
        from integrations import get_video_service
        video_service = get_video_service()
        
        room_name = data.room_name or f"consulta-{data.request_id[:8]}"
        room_data = await video_service.create_room(room_name, user["name"])
        
        # Update request with room info
        await db.requests.update_one(
            {"id": data.request_id},
            {"$set": {
                "video_room": room_data,
                "video_room_created_at": datetime.utcnow()
            }}
        )
        
        return {
            "success": True,
            "room": room_data,
            "message": "Sala de vídeo criada com sucesso"
        }
    except Exception as e:
        # Fallback to Jitsi (always works)
        import uuid
        room_id = f"RenoveJa-consulta-{uuid.uuid4().hex[:8]}"
        return {
            "success": True,
            "room": {
                "room_url": f"https://meet.jit.si/{room_id}",
                "room_name": room_id,
                "embed_url": f"https://meet.jit.si/{room_id}#config.prejoinPageEnabled=false",
                "is_free": True
            },
            "message": "Sala de vídeo criada (Jitsi gratuito)"
        }

@api_router.get("/video/room/{request_id}")
async def get_video_room(request_id: str, token: str):
    """Get video room info for a consultation"""
    user = await get_current_user(token)
    
    request = await db.requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    if not request.get("video_room"):
        raise HTTPException(status_code=404, detail="Sala de vídeo não criada ainda")
    
    return clean_mongo_doc(request.get("video_room"))

# ============== DIGITAL SIGNATURE ROUTES ==============

class SignPrescriptionRequest(BaseModel):
    request_id: str
    medications: List[dict]
    notes: Optional[str] = None

@api_router.post("/prescription/sign")
async def sign_prescription(token: str, data: SignPrescriptionRequest):
    """Sign a prescription digitally"""
    user = await get_current_user(token)
    
    if user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Apenas médicos podem assinar receitas")
    
    # Get doctor profile
    doctor_profile = await db.doctor_profiles.find_one({"user_id": user["id"]})
    if not doctor_profile:
        raise HTTPException(status_code=400, detail="Perfil médico não encontrado")
    
    # Get the request
    request = await db.requests.find_one({"id": data.request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    # Get patient info
    patient = await db.users.find_one({"id": request["patient_id"]})
    
    try:
        from integrations import get_signature_service
        signature_service = get_signature_service()
        
        prescription_data = {
            "medications": data.medications,
            "prescription_type": request.get("prescription_type", "simple"),
            "notes": data.notes
        }
        
        signed_result = await signature_service.sign_prescription(
            prescription_data,
            doctor_profile["crm"],
            user["name"]
        )
        
        # Update request with signed prescription
        await db.requests.update_one(
            {"id": data.request_id},
            {"$set": {
                "status": "completed",
                "signed_prescription": signed_result,
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Create notification for patient
        notification = Notification(
            user_id=request["patient_id"],
            title="Receita Pronta!",
            message="Sua receita foi assinada digitalmente e está disponível para download.",
            notification_type="success"
        )
        await db.notifications.insert_one(notification.dict())
        
        return {
            "success": True,
            "prescription_id": signed_result["prescription"]["id"],
            "signature": signed_result["signature"],
            "document_hash": signed_result["signed_document_hash"],
            "verification_url": signed_result["signature"]["verification_url"],
            "is_icp_brasil": signed_result["signature"]["is_icp_brasil"],
            "message": "Receita assinada com sucesso!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao assinar receita: {str(e)}")

@api_router.get("/prescription/{request_id}")
async def get_signed_prescription(request_id: str, token: str):
    """Get signed prescription details"""
    user = await get_current_user(token)
    
    request = await db.requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    # Check authorization
    if user["id"] != request["patient_id"] and user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if not request.get("signed_prescription"):
        raise HTTPException(status_code=404, detail="Receita ainda não foi assinada")
    
    return clean_mongo_doc(request.get("signed_prescription"))

@api_router.get("/prescription/verify/{document_hash}")
async def verify_prescription(document_hash: str):
    """Verify a prescription signature (public endpoint)"""
    
    # Find the prescription by hash
    request = await db.requests.find_one({
        "signed_prescription.signed_document_hash": {"$regex": f"^{document_hash}"}
    })
    
    if not request:
        return {
            "valid": False,
            "message": "Documento não encontrado"
        }
    
    signed_prescription = request.get("signed_prescription", {})
    signature = signed_prescription.get("signature", {})
    
    return {
        "valid": True,
        "document_type": "Receita Médica Digital",
        "signed_at": signature.get("timestamp"),
        "signer_crm": signature.get("signer_crm"),
        "is_icp_brasil": signature.get("is_icp_brasil", False),
        "message": "Documento verificado com sucesso"
    }

# ============== INTEGRATION STATUS ==============

@api_router.get("/integrations/status")
async def get_integrations_status():
    """Check which integrations are configured"""
    try:
        from integrations import (
            MercadoPagoService, StripeService,
            AgoraService, DailyService, JitsiService,
            DigitalSignatureService, SendGridService
        )
        
        return {
            "payments": {
                "mercadopago": MercadoPagoService().is_configured,
                "stripe": StripeService().is_configured,
                "simulated_available": True
            },
            "video": {
                "agora": AgoraService().is_configured,
                "daily": DailyService().is_configured,
                "jitsi": True  # Always available (free)
            },
            "signature": {
                "icp_brasil": DigitalSignatureService().is_configured,
                "simulated_available": True
            },
            "email": {
                "sendgrid": SendGridService().is_configured
            },
            "notifications": {
                "expo_push": True  # Always available
            }
        }
    except Exception as e:
        return {"error": str(e), "message": "Some integrations not loaded"}

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "RenoveJá+ API", "version": "1.0.0", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
