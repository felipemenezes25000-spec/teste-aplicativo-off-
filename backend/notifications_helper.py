"""
🔔 Notification Helper Module
RenoveJá+ - Sistema de Notificações Completo

Fluxos de Notificação:

📋 RECEITA:
1. Paciente cria → Notifica médicos disponíveis
2. Médico aceita → Notifica paciente
3. Médico aprova → Notifica paciente (pagar)
4. Médico rejeita → Notifica paciente
5. Paciente paga → Notifica médico (assinar)
6. Médico assina → Notifica paciente (receita pronta)

🔬 EXAME:
1. Paciente cria → Notifica enfermeiros
2. Enfermeiro aceita → Notifica paciente
3. Enfermeiro aprova → Notifica paciente (pagar)
4. Enfermeiro encaminha → Notifica médicos + paciente
5. Enfermeiro rejeita → Notifica paciente
6. Paciente paga → Notifica quem aprovou
7. Assinatura → Notifica paciente

📹 CONSULTA:
1. Paciente agenda → Notifica médicos da especialidade
2. Médico aceita → Notifica paciente (pagar)
3. Paciente paga → Notifica médico
4. Consulta inicia → Notifica ambos
5. Consulta termina → Notifica paciente (avaliar)

👤 ADMIN:
- Novo usuário cadastrado
- Nova solicitação criada
- Pagamento recebido
- Consulta finalizada

📲 PUSH NOTIFICATIONS:
- Integração com Expo Push API
- Enviadas em paralelo com notificações in-app
"""

import uuid
import httpx
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any

# Notification types
NOTIFICATION_TYPES = {
    "info": "info",
    "success": "success", 
    "warning": "warning",
    "error": "error",
    "payment": "payment",
    "consultation": "consultation",
    "prescription": "prescription",
    "exam": "exam",
}

# Notification templates
TEMPLATES = {
    # ===== RECEITA =====
    "prescription_created_patient": {
        "title": "✅ Solicitação Criada",
        "message": "Sua solicitação de renovação de receita foi enviada e está aguardando análise médica.",
        "type": "success"
    },
    "prescription_created_doctors": {
        "title": "📋 Nova Solicitação de Receita",
        "message": "Nova solicitação de {patient_name} aguardando análise.",
        "type": "info"
    },
    "prescription_accepted": {
        "title": "👨‍⚕️ Médico Analisando",
        "message": "Dr(a). {doctor_name} está analisando sua solicitação.",
        "type": "info"
    },
    "prescription_approved": {
        "title": "✅ Receita Aprovada!",
        "message": "Sua receita foi aprovada por Dr(a). {doctor_name}. Realize o pagamento de R$ {price:.2f} para receber sua receita.",
        "type": "success"
    },
    "prescription_rejected": {
        "title": "❌ Solicitação Recusada",
        "message": "Sua solicitação foi recusada por Dr(a). {doctor_name}. Motivo: {reason}",
        "type": "error"
    },
    "prescription_paid_doctor": {
        "title": "💰 Pagamento Recebido",
        "message": "Paciente {patient_name} realizou o pagamento. Receita aguardando sua assinatura.",
        "type": "payment"
    },
    "prescription_signed": {
        "title": "📝 Receita Assinada!",
        "message": "Sua receita foi assinada digitalmente por Dr(a). {doctor_name} e está pronta!",
        "type": "success"
    },
    
    # ===== EXAME =====
    "exam_created_patient": {
        "title": "✅ Solicitação Enviada",
        "message": "Sua solicitação de exames foi enviada e será analisada pela equipe de enfermagem.",
        "type": "success"
    },
    "exam_created_nurses": {
        "title": "🔬 Nova Solicitação de Exame",
        "message": "Nova solicitação de exames de {patient_name} aguardando triagem.",
        "type": "info"
    },
    "exam_accepted": {
        "title": "🩺 Triagem Iniciada",
        "message": "Enf. {nurse_name} está analisando sua solicitação de exames.",
        "type": "info"
    },
    "exam_approved": {
        "title": "✅ Exames Aprovados!",
        "message": "Sua solicitação foi aprovada por Enf. {nurse_name}. Realize o pagamento de R$ {price:.2f}.",
        "type": "success"
    },
    "exam_forwarded_patient": {
        "title": "↗️ Encaminhado ao Médico",
        "message": "Sua solicitação foi encaminhada para avaliação médica.",
        "type": "info"
    },
    "exam_forwarded_doctors": {
        "title": "📋 Exame Encaminhado",
        "message": "Solicitação de exames de {patient_name} encaminhada pela enfermagem para avaliação médica.",
        "type": "info"
    },
    "exam_rejected": {
        "title": "❌ Solicitação Recusada",
        "message": "Sua solicitação de exames foi recusada. Motivo: {reason}",
        "type": "error"
    },
    "exam_paid": {
        "title": "💰 Pagamento Recebido",
        "message": "Paciente {patient_name} pagou pela solicitação de exames.",
        "type": "payment"
    },
    "exam_signed": {
        "title": "📝 Pedido de Exames Pronto!",
        "message": "Seu pedido de exames foi assinado e está disponível para download.",
        "type": "success"
    },
    
    # ===== CONSULTA =====
    "consultation_created_patient": {
        "title": "📅 Consulta Agendada",
        "message": "Sua consulta de {specialty} foi agendada. Aguarde a confirmação do médico.",
        "type": "success"
    },
    "consultation_created_doctors": {
        "title": "📹 Nova Consulta Agendada",
        "message": "Paciente {patient_name} agendou consulta de {specialty}.",
        "type": "consultation"
    },
    "consultation_accepted": {
        "title": "✅ Consulta Confirmada!",
        "message": "Dr(a). {doctor_name} confirmou sua consulta. Realize o pagamento para garantir seu horário.",
        "type": "success"
    },
    "consultation_paid_doctor": {
        "title": "💰 Consulta Paga",
        "message": "Paciente {patient_name} pagou pela consulta. Horário confirmado.",
        "type": "payment"
    },
    "consultation_starting": {
        "title": "🎥 Consulta Iniciando",
        "message": "Sua teleconsulta com Dr(a). {doctor_name} está começando. Toque para entrar.",
        "type": "consultation"
    },
    "consultation_starting_doctor": {
        "title": "🎥 Paciente Aguardando",
        "message": "Paciente {patient_name} está aguardando na sala de consulta.",
        "type": "consultation"
    },
    "consultation_ended": {
        "title": "✅ Consulta Finalizada",
        "message": "Sua consulta foi finalizada. Que tal avaliar o atendimento?",
        "type": "success"
    },
    "consultation_reminder": {
        "title": "⏰ Lembrete de Consulta",
        "message": "Sua consulta com Dr(a). {doctor_name} começa em {minutes} minutos.",
        "type": "warning"
    },
    
    # ===== PAGAMENTO =====
    "payment_confirmed": {
        "title": "✅ Pagamento Confirmado",
        "message": "Seu pagamento de R$ {amount:.2f} foi confirmado com sucesso!",
        "type": "success"
    },
    "payment_pending": {
        "title": "⏳ Pagamento Pendente",
        "message": "Seu pagamento de R$ {amount:.2f} está aguardando confirmação.",
        "type": "warning"
    },
    "payment_failed": {
        "title": "❌ Pagamento Falhou",
        "message": "Houve um problema com seu pagamento. Tente novamente.",
        "type": "error"
    },
    
    # ===== ADMIN =====
    "admin_new_user": {
        "title": "👤 Novo Usuário",
        "message": "Novo {role} cadastrado: {name} ({email})",
        "type": "info"
    },
    "admin_new_request": {
        "title": "📋 Nova Solicitação",
        "message": "Nova solicitação de {request_type} criada por {patient_name}.",
        "type": "info"
    },
    "admin_payment_received": {
        "title": "💰 Pagamento Recebido",
        "message": "Pagamento de R$ {amount:.2f} recebido de {patient_name}.",
        "type": "success"
    },
    
    # ===== REVIEW =====
    "review_received": {
        "title": "⭐ Nova Avaliação",
        "message": "Paciente {patient_name} avaliou sua consulta com {rating} estrelas.",
        "type": "info"
    },
    "review_reminder": {
        "title": "⭐ Avalie seu Atendimento",
        "message": "Como foi sua experiência com Dr(a). {doctor_name}? Avalie agora!",
        "type": "info"
    },
}


def create_notification(
    user_id: str,
    template_key: str,
    data: Dict[str, Any] = None,
    custom_title: str = None,
    custom_message: str = None,
    request_id: str = None
) -> Dict[str, Any]:
    """Create a notification dict from template"""
    
    template = TEMPLATES.get(template_key, {
        "title": custom_title or "Notificação",
        "message": custom_message or "",
        "type": "info"
    })
    
    title = custom_title or template["title"]
    message = custom_message or template["message"]
    
    # Format message with data
    if data:
        try:
            message = message.format(**data)
            title = title.format(**data)
        except KeyError:
            pass
    
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "notification_type": template.get("type", "info"),
        "data": {
            "request_id": request_id,
            "template": template_key,
            **(data or {})
        },
        "read": False,
        "created_at": datetime.utcnow().isoformat()
    }


async def notify_user(db_insert_func, user_id: str, template_key: str, data: Dict = None, request_id: str = None):
    """Send notification to a single user"""
    notification = create_notification(user_id, template_key, data, request_id=request_id)
    await db_insert_func("notifications", notification)
    return notification


async def notify_users(db_insert_func, user_ids: List[str], template_key: str, data: Dict = None, request_id: str = None):
    """Send notification to multiple users"""
    notifications = []
    for user_id in user_ids:
        notification = create_notification(user_id, template_key, data, request_id=request_id)
        await db_insert_func("notifications", notification)
        notifications.append(notification)
    return notifications


async def notify_role(db_insert_func, db_find_func, role: str, template_key: str, data: Dict = None, request_id: str = None, limit: int = 50):
    """Send notification to all users with a specific role"""
    users = await db_find_func("users", filters={"role": role, "active": True}, limit=limit)
    user_ids = [u["id"] for u in users]
    return await notify_users(db_insert_func, user_ids, template_key, data, request_id)


async def notify_available_doctors(db_insert_func, db_find_func, template_key: str, data: Dict = None, specialty: str = None, request_id: str = None):
    """Send notification to available doctors, optionally filtered by specialty"""
    filters = {"available": True}
    if specialty:
        filters["specialty"] = specialty
    
    doctor_profiles = await db_find_func("doctor_profiles", filters=filters, limit=20)
    user_ids = [dp["user_id"] for dp in doctor_profiles]
    return await notify_users(db_insert_func, user_ids, template_key, data, request_id)


async def notify_available_nurses(db_insert_func, db_find_func, template_key: str, data: Dict = None, request_id: str = None):
    """Send notification to available nurses"""
    nurse_profiles = await db_find_func("nurse_profiles", filters={"available": True}, limit=20)
    user_ids = [np["user_id"] for np in nurse_profiles]
    return await notify_users(db_insert_func, user_ids, template_key, data, request_id)


async def notify_admins(db_insert_func, db_find_func, template_key: str, data: Dict = None, request_id: str = None):
    """Send notification to all admins"""
    return await notify_role(db_insert_func, db_find_func, "admin", template_key, data, request_id)


# ============== PUSH NOTIFICATIONS (EXPO) ==============

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notification(
    push_token: str,
    title: str,
    body: str,
    data: Dict = None,
    sound: str = "default",
    badge: int = None,
    channel_id: str = "default"
) -> Dict:
    """
    Envia uma push notification via Expo Push API.
    
    Args:
        push_token: Expo push token (ExponentPushToken[xxx])
        title: Título da notificação
        body: Corpo da notificação
        data: Dados extras para deep linking
        sound: Som da notificação (default, null, ou custom)
        badge: Número do badge no ícone do app
        channel_id: Android notification channel
    
    Returns:
        Resposta da API do Expo ou erro
    """
    if not push_token or not push_token.startswith("ExponentPushToken"):
        return {"success": False, "error": "Invalid push token"}
    
    message = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": sound,
        "channelId": channel_id,
    }
    
    if data:
        message["data"] = data
    
    if badge is not None:
        message["badge"] = badge
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=message,
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return {"success": True, "result": result}
            else:
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
    except Exception as e:
        print(f"Push notification error: {e}")
        return {"success": False, "error": str(e)}


async def send_push_to_user(
    db_find_func,
    user_id: str,
    title: str,
    body: str,
    data: Dict = None
) -> Dict:
    """
    Envia push notification para um usuário específico pelo ID.
    Busca o push_token no banco e envia se disponível.
    """
    try:
        user = await db_find_func("users", {"id": user_id})
        if not user:
            return {"success": False, "error": "User not found"}
        
        # user pode ser dict ou lista
        if isinstance(user, list):
            user = user[0] if user else None
        
        if not user:
            return {"success": False, "error": "User not found"}
            
        push_token = user.get("push_token")
        if not push_token:
            return {"success": False, "error": "User has no push token"}
        
        return await send_push_notification(push_token, title, body, data)
    except Exception as e:
        print(f"Error sending push to user {user_id}: {e}")
        return {"success": False, "error": str(e)}


async def send_push_to_users(
    db_find_func,
    user_ids: List[str],
    title: str,
    body: str,
    data: Dict = None
) -> List[Dict]:
    """
    Envia push notification para múltiplos usuários.
    """
    results = []
    for user_id in user_ids:
        result = await send_push_to_user(db_find_func, user_id, title, body, data)
        results.append({"user_id": user_id, **result})
    return results


# ============== NOTIFICAÇÃO COMPLETA (IN-APP + PUSH) ==============

async def notify_user_with_push(
    db_insert_func,
    db_find_func,
    user_id: str,
    template_key: str,
    data: Dict = None,
    request_id: str = None
):
    """
    Envia notificação in-app E push notification para um usuário.
    """
    # 1. Criar notificação in-app
    notification = await notify_user(db_insert_func, user_id, template_key, data, request_id)
    
    # 2. Enviar push notification
    push_data = {
        "type": template_key,
        "request_id": request_id,
        **(data or {})
    }
    
    push_result = await send_push_to_user(
        db_find_func,
        user_id,
        notification["title"],
        notification["message"],
        push_data
    )
    
    return {
        "notification": notification,
        "push_result": push_result
    }


async def notify_users_with_push(
    db_insert_func,
    db_find_func,
    user_ids: List[str],
    template_key: str,
    data: Dict = None,
    request_id: str = None
):
    """
    Envia notificação in-app E push notification para múltiplos usuários.
    """
    results = []
    for user_id in user_ids:
        result = await notify_user_with_push(
            db_insert_func, db_find_func, user_id, template_key, data, request_id
        )
        results.append(result)
    return results


# ============== NOTIFICAÇÕES ESPECÍFICAS COM PUSH ==============

async def push_prescription_accepted(db_find_func, user_id: str, doctor_name: str, request_id: str):
    """Push: Médico aceitou a solicitação"""
    return await send_push_to_user(
        db_find_func, user_id,
        "👨‍⚕️ Médico Analisando",
        f"Dr(a). {doctor_name} está analisando sua solicitação.",
        {"type": "prescription_accepted", "request_id": request_id}
    )


async def push_prescription_approved(db_find_func, user_id: str, doctor_name: str, price: float, request_id: str):
    """Push: Receita aprovada, aguardando pagamento"""
    return await send_push_to_user(
        db_find_func, user_id,
        "✅ Receita Aprovada!",
        f"Dr(a). {doctor_name} aprovou. Pague R$ {price:.2f} para receber.",
        {"type": "prescription_approved", "request_id": request_id, "price": price}
    )


async def push_prescription_rejected(db_find_func, user_id: str, doctor_name: str, reason: str, request_id: str):
    """Push: Solicitação rejeitada"""
    return await send_push_to_user(
        db_find_func, user_id,
        "❌ Solicitação Recusada",
        f"Motivo: {reason}",
        {"type": "prescription_rejected", "request_id": request_id, "reason": reason}
    )


async def push_prescription_signed(db_find_func, user_id: str, doctor_name: str, request_id: str):
    """Push: Receita assinada e pronta"""
    return await send_push_to_user(
        db_find_func, user_id,
        "📝 Receita Pronta!",
        f"Sua receita foi assinada por Dr(a). {doctor_name}. Faça o download!",
        {"type": "prescription_signed", "request_id": request_id}
    )


async def push_new_chat_message(db_find_func, user_id: str, sender_name: str, request_id: str):
    """Push: Nova mensagem no chat"""
    return await send_push_to_user(
        db_find_func, user_id,
        f"💬 Nova mensagem de {sender_name}",
        "Toque para ver a mensagem",
        {"type": "new_message", "request_id": request_id}
    )


async def push_consultation_starting(db_find_func, user_id: str, doctor_name: str, request_id: str):
    """Push: Teleconsulta prestes a começar"""
    return await send_push_to_user(
        db_find_func, user_id,
        "🎥 Teleconsulta Iniciando!",
        f"Sua consulta com Dr(a). {doctor_name} está começando. Toque para entrar.",
        {"type": "consultation_starting", "request_id": request_id}
    )


async def push_consultation_reminder(db_find_func, user_id: str, doctor_name: str, minutes: int, request_id: str):
    """Push: Lembrete de consulta"""
    return await send_push_to_user(
        db_find_func, user_id,
        "⏰ Lembrete de Consulta",
        f"Sua consulta com Dr(a). {doctor_name} começa em {minutes} minutos.",
        {"type": "consultation_reminder", "request_id": request_id, "minutes": minutes}
    )


async def push_payment_confirmed(db_find_func, user_id: str, amount: float, request_id: str):
    """Push: Pagamento confirmado"""
    return await send_push_to_user(
        db_find_func, user_id,
        "✅ Pagamento Confirmado!",
        f"Seu pagamento de R$ {amount:.2f} foi confirmado.",
        {"type": "payment_confirmed", "request_id": request_id, "amount": amount}
    )


async def push_exam_approved(db_find_func, user_id: str, nurse_name: str, price: float, request_id: str):
    """Push: Exames aprovados"""
    return await send_push_to_user(
        db_find_func, user_id,
        "✅ Exames Aprovados!",
        f"Aprovado por Enf. {nurse_name}. Pague R$ {price:.2f}.",
        {"type": "exam_approved", "request_id": request_id, "price": price}
    )
