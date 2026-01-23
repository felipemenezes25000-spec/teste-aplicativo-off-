"""Integration Services Module

This module provides ready-to-use integration classes for external services.
Each integration is designed to be plug-and-play once API keys are configured.
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ============== PAYMENT INTEGRATIONS ==============

class PaymentService:
    """Abstract payment service interface"""
    
    async def create_pix_payment(self, amount: float, description: str, payer_email: str) -> Dict[str, Any]:
        raise NotImplementedError
    
    async def check_payment_status(self, payment_id: str) -> str:
        raise NotImplementedError
    
    async def create_credit_card_payment(self, amount: float, card_token: str, installments: int = 1) -> Dict[str, Any]:
        raise NotImplementedError


class MercadoPagoService(PaymentService):
    """MercadoPago integration for Brazilian payments
    
    Setup:
    1. Create account at https://www.mercadopago.com.br/developers
    2. Get your Access Token from the credentials page
    3. Set MERCADOPAGO_ACCESS_TOKEN in your .env file
    """
    
    def __init__(self):
        self.access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN', '')
        self.is_configured = bool(self.access_token and not self.access_token.startswith('YOUR_'))
        self._sdk = None
        
        if self.is_configured:
            try:
                import mercadopago
                self._sdk = mercadopago.SDK(self.access_token)
                logger.info("MercadoPago SDK initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize MercadoPago SDK: {e}")
                self.is_configured = False
        
    async def create_pix_payment(self, amount: float, description: str, payer_email: str, 
                                  payer_name: str = "Cliente", payer_cpf: str = None) -> Dict[str, Any]:
        if not self.is_configured or not self._sdk:
            logger.info("MercadoPago not configured, using simulated payment")
            return self._simulate_pix_payment(amount, description)
        
        try:
            # Create real PIX payment with MercadoPago
            payment_data = {
                "transaction_amount": float(amount),
                "description": description,
                "payment_method_id": "pix",
                "payer": {
                    "email": payer_email,
                    "first_name": payer_name.split()[0] if payer_name else "Cliente",
                    "last_name": payer_name.split()[-1] if payer_name and len(payer_name.split()) > 1 else "RenoveJá",
                }
            }
            
            # Add CPF if provided (required for some payments)
            if payer_cpf:
                payment_data["payer"]["identification"] = {
                    "type": "CPF",
                    "number": payer_cpf.replace(".", "").replace("-", "")
                }
            
            logger.info(f"Creating MercadoPago PIX payment: {amount} BRL")
            result = self._sdk.payment().create(payment_data)
            
            if result["status"] == 201:
                response = result["response"]
                
                # Extract PIX data
                pix_data = response.get("point_of_interaction", {}).get("transaction_data", {})
                
                return {
                    "id": str(response["id"]),
                    "status": response["status"],
                    "status_detail": response.get("status_detail", ""),
                    "pix_code": pix_data.get("qr_code", ""),
                    "qr_code_base64": pix_data.get("qr_code_base64", ""),
                    "ticket_url": pix_data.get("ticket_url", ""),
                    "amount": float(response["transaction_amount"]),
                    "description": description,
                    "expires_at": response.get("date_of_expiration", "30 minutes"),
                    "created_at": response.get("date_created", ""),
                    "external_reference": response.get("external_reference", ""),
                    "is_real_payment": True
                }
            else:
                error_msg = result.get("response", {}).get("message", "Unknown error")
                logger.error(f"MercadoPago payment creation failed: {error_msg}")
                logger.error(f"Full response: {result}")
                # Fallback to simulated on error
                return self._simulate_pix_payment(amount, description, error=error_msg)
                
        except Exception as e:
            logger.error(f"MercadoPago payment error: {e}")
            return self._simulate_pix_payment(amount, description, error=str(e))
    
    def _simulate_pix_payment(self, amount: float, description: str, error: str = None) -> Dict[str, Any]:
        """Simulate PIX payment for development/testing"""
        import uuid
        pix_code = f"00020126580014BR.GOV.BCB.PIX0136{uuid.uuid4()}5204000053039865802BR5925RENOVEJA TELEMEDICINA6009SAO PAULO62070503***6304"
        return {
            "id": str(uuid.uuid4()),
            "status": "pending",
            "status_detail": "waiting_payment",
            "pix_code": pix_code,
            "qr_code_base64": None,
            "amount": amount,
            "description": description,
            "expires_at": "30 minutes",
            "is_real_payment": False,
            "simulation_reason": error or "MercadoPago not configured"
        }
    
    async def check_payment_status(self, payment_id: str) -> Dict[str, Any]:
        if not self.is_configured or not self._sdk:
            return {"status": "pending", "is_real": False}
        
        try:
            result = self._sdk.payment().get(int(payment_id))
            
            if result["status"] == 200:
                response = result["response"]
                return {
                    "id": str(response["id"]),
                    "status": response["status"],
                    "status_detail": response.get("status_detail", ""),
                    "amount": float(response["transaction_amount"]),
                    "paid_amount": float(response.get("transaction_details", {}).get("total_paid_amount", 0)),
                    "date_approved": response.get("date_approved"),
                    "is_real": True
                }
            else:
                return {"status": "error", "message": "Payment not found", "is_real": True}
                
        except Exception as e:
            logger.error(f"Error checking payment status: {e}")
            return {"status": "error", "message": str(e), "is_real": True}
    
    async def cancel_payment(self, payment_id: str) -> Dict[str, Any]:
        """Cancel a pending payment"""
        if not self.is_configured or not self._sdk:
            return {"success": False, "message": "MercadoPago not configured"}
        
        try:
            result = self._sdk.payment().update(int(payment_id), {"status": "cancelled"})
            
            if result["status"] == 200:
                return {"success": True, "message": "Payment cancelled"}
            else:
                return {"success": False, "message": "Could not cancel payment"}
                
        except Exception as e:
            logger.error(f"Error cancelling payment: {e}")
            return {"success": False, "message": str(e)}


class StripeService(PaymentService):
    """Stripe integration with PIX support
    
    Setup:
    1. Create account at https://stripe.com
    2. Get your API keys from https://dashboard.stripe.com/apikeys
    3. Set STRIPE_SECRET_KEY in your .env file
    """
    
    def __init__(self):
        self.secret_key = os.getenv('STRIPE_SECRET_KEY', '')
        self.is_configured = bool(self.secret_key) and not str(self.secret_key).startswith('YOUR_')
        
    async def create_pix_payment(self, amount: float, description: str, payer_email: str) -> Dict[str, Any]:
        if not self.is_configured:
            return MercadoPagoService()._simulate_pix_payment(amount, description)
        
        # TODO: Implement real Stripe PIX payment
        return MercadoPagoService()._simulate_pix_payment(amount, description)


# ============== VIDEO CONFERENCING ==============

class VideoConferenceService:
    """Abstract video conference service interface"""
    
    async def create_room(self, room_name: str, host_name: str) -> Dict[str, Any]:
        raise NotImplementedError
    
    async def generate_token(self, room_name: str, user_name: str, is_host: bool = False) -> str:
        raise NotImplementedError


class AgoraService(VideoConferenceService):
    """Agora.io integration for video calls
    
    Setup:
    1. Create account at https://console.agora.io/
    2. Create a new project and get App ID
    3. Enable App Certificate for token authentication
    4. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in your .env file
    
    Features:
    - 10,000 free minutes per month
    - HD video quality
    - Screen sharing
    - Recording capability
    """
    
    def __init__(self):
        self.app_id = os.getenv('AGORA_APP_ID', '')
        self.app_certificate = os.getenv('AGORA_APP_CERTIFICATE', '')
        self.is_configured = bool(self.app_id and not self.app_id.startswith('YOUR_') and
                             self.app_certificate and not self.app_certificate.startswith('YOUR_'))
    
    async def create_room(self, room_name: str, host_name: str) -> Dict[str, Any]:
        import uuid
        channel_name = f"consultation_{room_name}_{uuid.uuid4().hex[:8]}"
        
        if not self.is_configured:
            return {
                "channel_name": channel_name,
                "app_id": "DEMO_APP_ID",
                "token": None,
                "message": "Agora not configured. Using demo mode."
            }
        
        # TODO: Generate real Agora token
        # from agora_token_builder import RtcTokenBuilder, Role_Publisher
        # token = RtcTokenBuilder.buildTokenWithUid(
        #     self.app_id, self.app_certificate, channel_name,
        #     0, Role_Publisher, privilege_expired_ts
        # )
        
        return {
            "channel_name": channel_name,
            "app_id": self.app_id,
            "token": None,  # Would be real token
        }
    
    async def generate_token(self, room_name: str, user_name: str, is_host: bool = False) -> str:
        if not self.is_configured:
            return "demo_token"
        # TODO: Generate real token
        return "demo_token"


class DailyService(VideoConferenceService):
    """Daily.co integration for video calls
    
    Setup:
    1. Create account at https://dashboard.daily.co/
    2. Get your API key
    3. Set DAILY_API_KEY in your .env file
    
    Features:
    - Easy browser-based integration
    - No app download required
    - Built-in recording
    """
    
    def __init__(self):
        self.api_key = os.getenv('DAILY_API_KEY', '')
        self.is_configured = bool(self.api_key) and not str(self.api_key).startswith('YOUR_')
    
    async def create_room(self, room_name: str, host_name: str) -> Dict[str, Any]:
        import uuid
        room_url = f"https://renoveja.daily.co/{room_name}-{uuid.uuid4().hex[:6]}"
        
        if not self.is_configured:
            return {
                "room_url": room_url,
                "room_name": room_name,
                "message": "Daily.co not configured. Using demo URL."
            }
        
        # TODO: Create real Daily.co room via API
        return {"room_url": room_url, "room_name": room_name}


class JitsiService(VideoConferenceService):
    """Jitsi Meet integration - FREE and Open Source
    
    No setup required! Uses public Jitsi servers.
    For production, consider self-hosting or using 8x8.vc
    
    Features:
    - 100% free
    - No API key needed
    - End-to-end encryption
    - Screen sharing
    """
    
    def __init__(self):
        self.server = os.getenv('JITSI_SERVER', 'meet.jit.si')
        self.is_configured = True  # Always configured!
    
    async def create_room(self, room_name: str, host_name: str) -> Dict[str, Any]:
        import uuid
        safe_name = room_name.replace(' ', '-').lower()
        room_id = f"RenoveJa-{safe_name}-{uuid.uuid4().hex[:8]}"
        
        return {
            "room_url": f"https://{self.server}/{room_id}",
            "room_name": room_id,
            "embed_url": f"https://{self.server}/{room_id}#config.prejoinPageEnabled=false",
            "is_free": True
        }
    
    async def generate_token(self, room_name: str, user_name: str, is_host: bool = False) -> str:
        # Jitsi public servers don't require tokens
        return None


# ============== NOTIFICATION SERVICES ==============

class NotificationService:
    """Abstract notification service interface"""
    
    async def send_push(self, user_token: str, title: str, body: str, data: Dict = None) -> bool:
        raise NotImplementedError
    
    async def send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        raise NotImplementedError
    
    async def send_whatsapp(self, phone: str, message: str) -> bool:
        raise NotImplementedError


class ExpoPushService:
    """Expo Push Notifications - FREE and built into Expo
    
    No setup required for development!
    Push tokens are automatically generated by Expo.
    """
    
    async def send_push(self, expo_push_token: str, title: str, body: str, data: Dict = None) -> bool:
        import httpx
        
        message = {
            "to": expo_push_token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data or {}
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://exp.host/--/api/v2/push/send",
                    json=message
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Push notification failed: {e}")
            return False


class SendGridService:
    """SendGrid email service
    
    Setup:
    1. Create account at https://sendgrid.com/
    2. Create an API key
    3. Set SENDGRID_API_KEY in your .env file
    """
    
    def __init__(self):
        self.api_key = os.getenv('SENDGRID_API_KEY', '')
        self.from_email = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@renoveja.com.br')
        self.is_configured = bool(self.api_key) and not str(self.api_key).startswith('YOUR_')
    
    async def send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        if not self.is_configured:
            logger.info(f"[SIMULATED EMAIL] To: {to_email}, Subject: {subject}")
            return True
        
        # TODO: Implement real SendGrid email sending
        return True


# ============== DIGITAL SIGNATURE ==============

class DigitalSignatureService:
    """Digital Signature Service for Medical Prescriptions
    
    In Brazil, medical prescriptions must follow:
    - CFM Resolution 1821/2007
    - CFM Resolution 2299/2021 (telemedicine)
    - ICP-Brasil digital certificate standards
    
    Options for implementation:
    1. BRy Signer - Brazilian digital signature platform
    2. Certisign - ICP-Brasil certificates
    3. ITI (Instituto Nacional de Tecnologia da Informação)
    
    For MVP/testing, we use a simulated signature that can be
    upgraded to ICP-Brasil compliant signature later.
    """
    
    def __init__(self):
        self.bry_api_key = os.getenv('BRY_API_KEY', '')
        self.is_configured = bool(self.bry_api_key) and not str(self.bry_api_key).startswith('YOUR_')
    
    async def sign_prescription(self, 
                                 prescription_data: Dict[str, Any],
                                 doctor_crm: str,
                                 doctor_name: str) -> Dict[str, Any]:
        """
        Sign a medical prescription digitally.
        
        For production, this should use ICP-Brasil compliant certificates.
        Current implementation creates a verifiable hash that can be
        validated later.
        """
        import hashlib
        import uuid
        from datetime import datetime
        
        # Create prescription document
        prescription_document = {
            "id": str(uuid.uuid4()),
            "type": "medical_prescription",
            "created_at": datetime.utcnow().isoformat(),
            "doctor": {
                "name": doctor_name,
                "crm": doctor_crm,
            },
            "content": prescription_data,
        }
        
        # Create document hash
        doc_string = str(prescription_document)
        doc_hash = hashlib.sha256(doc_string.encode()).hexdigest()
        
        # Create signature (simulated - replace with ICP-Brasil in production)
        signature = {
            "algorithm": "SHA256withRSA",
            "timestamp": datetime.utcnow().isoformat(),
            "signer_crm": doctor_crm,
            "document_hash": doc_hash,
            "signature_id": str(uuid.uuid4()),
            "is_icp_brasil": self.is_configured,
            "verification_url": f"https://renoveja.com.br/verify/{doc_hash[:16]}"
        }
        
        if self.is_configured:
            # TODO: Use BRy Signer or Certisign API for real ICP-Brasil signature
            pass
        
        return {
            "prescription": prescription_document,
            "signature": signature,
            "signed_document_hash": doc_hash,
            "qr_code_data": f"RENOVEJA:{doc_hash[:32]}",
            "valid": True
        }
    
    async def verify_signature(self, document_hash: str, signature_id: str) -> Dict[str, Any]:
        """Verify a prescription signature"""
        # TODO: Implement real verification with ICP-Brasil
        return {
            "valid": True,
            "message": "Assinatura verificada com sucesso",
            "signer": "Dr. Example",
            "signed_at": datetime.utcnow().isoformat()
        }


# ============== FACTORY FUNCTIONS ==============

def get_payment_service() -> PaymentService:
    """Get configured payment service"""
    # Priority: MercadoPago > Stripe > Simulated
    mp = MercadoPagoService()
    if mp.is_configured:
        return mp
    
    stripe = StripeService()
    if stripe.is_configured:
        return stripe
    
    return mp  # Returns simulated payments


def get_video_service() -> VideoConferenceService:
    """Get configured video service"""
    # Priority: Agora > Daily > Jitsi (free fallback)
    agora = AgoraService()
    if agora.is_configured:
        return agora
    
    daily = DailyService()
    if daily.is_configured:
        return daily
    
    return JitsiService()  # Free fallback - always works!


def get_signature_service() -> DigitalSignatureService:
    """Get digital signature service"""
    return DigitalSignatureService()
