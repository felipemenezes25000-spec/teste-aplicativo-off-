"""Queue Management System for Medical Requests

This module handles:
- Smart distribution of requests to doctors
- Queue management based on specialty and availability
- Real-time notifications
- Load balancing between doctors
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import random


class QueueManager:
    """
    Manages the distribution of patient requests to available doctors.
    
    Distribution Rules:
    1. Match by specialty (if applicable)
    2. Prioritize doctors with fewer active cases
    3. Consider doctor availability status
    4. Round-robin for equal load distribution
    5. Urgent cases go to the front of queue
    """
    
    def __init__(self, db):
        self.db = db
    
    async def get_available_doctors(self, specialty: Optional[str] = None) -> List[Dict]:
        """
        Get list of available doctors, optionally filtered by specialty.
        """
        query = {"available": True}
        if specialty:
            query["specialty"] = specialty
        
        doctor_profiles = await self.db.doctor_profiles.find(query).to_list(100)
        
        doctors = []
        for dp in doctor_profiles:
            user = await self.db.users.find_one({"id": dp["user_id"]})
            if user:
                # Count active cases for this doctor
                active_cases = await self.db.requests.count_documents({
                    "doctor_id": dp["user_id"],
                    "status": {"$in": ["analyzing", "in_progress"]}
                })
                
                doctors.append({
                    "user_id": dp["user_id"],
                    "name": user["name"],
                    "specialty": dp["specialty"],
                    "crm": dp["crm"],
                    "crm_state": dp["crm_state"],
                    "rating": dp.get("rating", 5.0),
                    "total_consultations": dp.get("total_consultations", 0),
                    "active_cases": active_cases,
                    "available": dp.get("available", True),
                    "max_concurrent_cases": dp.get("max_concurrent_cases", 5)
                })
        
        return doctors
    
    async def find_best_doctor(self, request: Dict) -> Optional[Dict]:
        """
        Find the best available doctor for a request.
        
        Algorithm:
        1. Filter by specialty (for consultations)
        2. Exclude doctors at max capacity
        3. Sort by: active_cases (asc), rating (desc), total_consultations (desc)
        4. Return the best match
        """
        specialty = None
        if request.get("request_type") == "consultation":
            specialty = request.get("specialty")
        
        doctors = await self.get_available_doctors(specialty)
        
        # Filter doctors who have capacity
        available_doctors = [
            d for d in doctors 
            if d["active_cases"] < d["max_concurrent_cases"]
        ]
        
        if not available_doctors:
            return None
        
        # Sort by best match
        # Priority: fewer active cases, higher rating, more experience
        sorted_doctors = sorted(
            available_doctors,
            key=lambda d: (
                d["active_cases"],  # Lower is better
                -d["rating"],       # Higher is better (negative for ascending sort)
                -d["total_consultations"]  # More experience is better
            )
        )
        
        return sorted_doctors[0] if sorted_doctors else None
    
    async def assign_doctor_to_request(self, request_id: str, doctor_id: str, doctor_name: str) -> bool:
        """
        Assign a doctor to a request and notify both parties.
        """
        # Update the request
        result = await self.db.requests.update_one(
            {"id": request_id},
            {"$set": {
                "doctor_id": doctor_id,
                "doctor_name": doctor_name,
                "status": "analyzing",
                "assigned_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            return False
        
        # Get request details for notifications
        request = await self.db.requests.find_one({"id": request_id})
        
        # Notify the patient
        await self.db.notifications.insert_one({
            "id": str(datetime.utcnow().timestamp()),
            "user_id": request["patient_id"],
            "title": "Médico Atribuído!",
            "message": f"Dr(a). {doctor_name} irá analisar sua solicitação.",
            "notification_type": "success",
            "read": False,
            "created_at": datetime.utcnow(),
            "data": {"request_id": request_id}
        })
        
        # Notify the doctor
        await self.db.notifications.insert_one({
            "id": str(datetime.utcnow().timestamp() + 1),
            "user_id": doctor_id,
            "title": "Nova Solicitação!",
            "message": f"Você recebeu uma nova solicitação de {request['patient_name']}.",
            "notification_type": "info",
            "read": False,
            "created_at": datetime.utcnow(),
            "data": {"request_id": request_id}
        })
        
        return True
    
    async def auto_assign_pending_requests(self) -> Dict[str, int]:
        """
        Automatically assign pending requests to available doctors.
        Returns count of assigned requests.
        """
        # Get all pending/submitted requests without a doctor
        pending_requests = await self.db.requests.find({
            "status": {"$in": ["pending", "submitted"]},
            "doctor_id": None,
            "request_type": {"$ne": "exam"}  # Exams go to nursing first
        }).sort("created_at", 1).to_list(100)
        
        assigned = 0
        failed = 0
        
        for request in pending_requests:
            doctor = await self.find_best_doctor(request)
            if doctor:
                success = await self.assign_doctor_to_request(
                    request["id"],
                    doctor["user_id"],
                    doctor["name"]
                )
                if success:
                    assigned += 1
                else:
                    failed += 1
            else:
                failed += 1
        
        return {"assigned": assigned, "failed": failed, "total_pending": len(pending_requests)}
    
    async def get_queue_stats(self) -> Dict[str, Any]:
        """
        Get overall queue statistics.
        """
        total_pending = await self.db.requests.count_documents({"status": {"$in": ["pending", "submitted"]}})
        total_analyzing = await self.db.requests.count_documents({"status": {"$in": ["analyzing", "in_review"]}})
        total_completed_today = await self.db.requests.count_documents({
            "status": "completed",
            "completed_at": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0)}
        })
        
        available_doctors = await self.db.doctor_profiles.count_documents({"available": True})
        
        # Average wait time (for requests assigned in last 24h)
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_assigned = await self.db.requests.find({
            "assigned_at": {"$gte": yesterday},
            "status": {"$in": ["analyzing", "completed"]}
        }).to_list(100)
        
        avg_wait_minutes = 0
        if recent_assigned:
            wait_times = []
            for r in recent_assigned:
                if r.get("assigned_at") and r.get("created_at"):
                    wait = (r["assigned_at"] - r["created_at"]).total_seconds() / 60
                    wait_times.append(wait)
            if wait_times:
                avg_wait_minutes = sum(wait_times) / len(wait_times)
        
        return {
            "pending": total_pending,
            "analyzing": total_analyzing,
            "completed_today": total_completed_today,
            "available_doctors": available_doctors,
            "average_wait_minutes": round(avg_wait_minutes, 1)
        }
    
    async def get_doctor_queue(self, doctor_id: str) -> Dict[str, List]:
        """
        Get the queue for a specific doctor.
        """
        # Requests assigned to this doctor
        my_requests = await self.db.requests.find({
            "doctor_id": doctor_id,
            "status": {"$in": ["analyzing", "in_review", "in_progress"]}
        }).sort("assigned_at", 1).to_list(50)
        
        # Unassigned requests this doctor could take (excluding exams which go to nursing)
        available_requests = await self.db.requests.find({
            "status": {"$in": ["pending", "submitted"]},
            "doctor_id": None,
            "request_type": {"$ne": "exam"}
        }).sort("created_at", 1).to_list(50)
        
        return {
            "my_requests": my_requests,
            "available_requests": available_requests
        }


class ChatManager:
    """
    Manages real-time chat between doctors and patients.
    """
    
    def __init__(self, db):
        self.db = db
    
    async def send_message(
        self,
        request_id: str,
        sender_id: str,
        sender_name: str,
        sender_type: str,
        message: str,
        attachment: Optional[Dict] = None
    ) -> Dict:
        """
        Send a message in the chat for a specific request.
        """
        import uuid
        
        chat_message = {
            "id": str(uuid.uuid4()),
            "request_id": request_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "sender_type": sender_type,  # "patient", "doctor", "system"
            "message": message,
            "attachment": attachment,  # {"type": "image/pdf", "url": "..."}
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        await self.db.chat_messages.insert_one(chat_message)
        
        # Notify the other party
        request = await self.db.requests.find_one({"id": request_id})
        if request:
            recipient_id = request["doctor_id"] if sender_type == "patient" else request["patient_id"]
            if recipient_id:
                await self.db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": recipient_id,
                    "title": "Nova Mensagem",
                    "message": f"{sender_name}: {message[:50]}{'...' if len(message) > 50 else ''}",
                    "notification_type": "info",
                    "read": False,
                    "created_at": datetime.utcnow(),
                    "data": {"request_id": request_id, "message_id": chat_message["id"]}
                })
        
        return chat_message
    
    async def get_chat_history(self, request_id: str, limit: int = 100) -> List[Dict]:
        """
        Get chat history for a request.
        """
        messages = await self.db.chat_messages.find(
            {"request_id": request_id}
        ).sort("created_at", 1).to_list(limit)
        
        return messages
    
    async def mark_messages_read(self, request_id: str, user_id: str) -> int:
        """
        Mark all messages in a chat as read for a user.
        """
        result = await self.db.chat_messages.update_many(
            {
                "request_id": request_id,
                "sender_id": {"$ne": user_id},
                "read": False
            },
            {"$set": {"read": True}}
        )
        return result.modified_count
    
    async def get_unread_count(self, user_id: str) -> int:
        """
        Get total unread messages for a user across all chats.
        """
        # Find all requests where user is patient or doctor
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            return 0
        
        if user.get("role") == "doctor":
            requests = await self.db.requests.find({"doctor_id": user_id}).to_list(100)
        else:
            requests = await self.db.requests.find({"patient_id": user_id}).to_list(100)
        
        request_ids = [r["id"] for r in requests]
        
        count = await self.db.chat_messages.count_documents({
            "request_id": {"$in": request_ids},
            "sender_id": {"$ne": user_id},
            "read": False
        })
        
        return count
    
    async def send_system_message(self, request_id: str, message: str) -> Dict:
        """
        Send a system message (automated notification in chat).
        """
        return await self.send_message(
            request_id=request_id,
            sender_id="system",
            sender_name="Sistema",
            sender_type="system",
            message=message
        )


class ConsultationManager:
    """
    Manages video consultations between doctors and patients.
    """
    
    def __init__(self, db):
        self.db = db
        self.chat_manager = ChatManager(db)
    
    async def start_consultation(self, request_id: str, doctor_id: str) -> Dict:
        """
        Start a video consultation.
        """
        import uuid
        from integrations import get_video_service
        
        request = await self.db.requests.find_one({"id": request_id})
        if not request:
            return {"error": "Solicitação não encontrada"}
        
        if request.get("doctor_id") != doctor_id:
            return {"error": "Você não está atribuído a esta consulta"}
        
        # Create video room
        video_service = get_video_service()
        room_data = await video_service.create_room(
            f"consulta-{request_id[:8]}",
            request.get("doctor_name", "Médico")
        )
        
        # Update request
        await self.db.requests.update_one(
            {"id": request_id},
            {"$set": {
                "status": "in_progress",
                "video_room": room_data,
                "consultation_started_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Notify patient
        await self.db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": request["patient_id"],
            "title": "Consulta Iniciada!",
            "message": "O médico está pronto. Clique para entrar na videochamada.",
            "notification_type": "success",
            "read": False,
            "created_at": datetime.utcnow(),
            "data": {"request_id": request_id, "video_room": room_data}
        })
        
        # Send system message in chat
        await self.chat_manager.send_system_message(
            request_id,
            "📹 Consulta por vídeo iniciada. Clique no botão de vídeo para entrar."
        )
        
        return {
            "success": True,
            "video_room": room_data,
            "message": "Consulta iniciada com sucesso"
        }
    
    async def end_consultation(self, request_id: str, doctor_id: str, notes: str = None) -> Dict:
        """
        End a video consultation.
        """
        request = await self.db.requests.find_one({"id": request_id})
        if not request:
            return {"error": "Solicitação não encontrada"}
        
        started_at = request.get("consultation_started_at")
        duration_minutes = 0
        if started_at:
            duration = datetime.utcnow() - started_at
            duration_minutes = int(duration.total_seconds() / 60)
        
        # Update request
        await self.db.requests.update_one(
            {"id": request_id},
            {"$set": {
                "status": "completed",
                "consultation_ended_at": datetime.utcnow(),
                "consultation_duration_minutes": duration_minutes,
                "consultation_notes": notes,
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Update doctor's stats
        await self.db.doctor_profiles.update_one(
            {"user_id": doctor_id},
            {"$inc": {"total_consultations": 1}}
        )
        
        # Send system message
        await self.chat_manager.send_system_message(
            request_id,
            f"✅ Consulta finalizada. Duração: {duration_minutes} minutos."
        )
        
        return {
            "success": True,
            "duration_minutes": duration_minutes,
            "message": "Consulta finalizada com sucesso"
        }
