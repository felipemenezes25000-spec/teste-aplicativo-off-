"""
Testes Básicos - RenoveJá+ API
Testes unitários e de integração para funcionalidades principais
"""

import pytest
from fastapi.testclient import TestClient
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import app

# Test client
client = TestClient(app)

# Test data
TEST_USER = {
    "name": "Test User",
    "email": f"test_{datetime.now().timestamp()}@example.com",
    "password": "Test123456!",
    "phone": "11999999999"
}

TEST_DOCTOR = {
    "name": "Dr. Test Doctor",
    "email": f"doctor_{datetime.now().timestamp()}@example.com",
    "password": "Doctor123456!",
    "phone": "11988888888",
    "crm": "123456",
    "crm_state": "SP",
    "specialty": "general"
}

class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["app"] == "🏥 RenoveJá+ API"
    
    def test_health_endpoint(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_register_patient(self):
        response = client.post("/api/auth/register", json=TEST_USER)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == TEST_USER["email"].lower()
        assert data["user"]["role"] == "patient"
        return data["access_token"]
    
    def test_register_doctor(self):
        response = client.post("/api/auth/register-doctor", json=TEST_DOCTOR)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == TEST_DOCTOR["email"].lower()
        assert data["user"]["role"] == "doctor"
        assert "doctor_profile" in data["user"]
    
    def test_login_valid_credentials(self):
        # First register
        register_response = client.post("/api/auth/register", json={
            **TEST_USER,
            "email": f"login_test_{datetime.now().timestamp()}@example.com"
        })
        assert register_response.status_code == 200
        
        # Then login
        login_response = client.post("/api/auth/login", json={
            "email": register_response.json()["user"]["email"],
            "password": TEST_USER["password"]
        })
        assert login_response.status_code == 200
        data = login_response.json()
        assert "access_token" in data
        assert "user" in data
    
    def test_login_invalid_credentials(self):
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert "detail" in response.json()
    
    def test_get_me_authenticated(self):
        # Register and get token
        register_response = client.post("/api/auth/register", json={
            **TEST_USER,
            "email": f"me_test_{datetime.now().timestamp()}@example.com"
        })
        token = register_response.json()["access_token"]
        
        # Get user info
        response = client.get("/api/auth/me", params={"token": token})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == register_response.json()["user"]["email"]
    
    def test_get_me_unauthenticated(self):
        response = client.get("/api/auth/me")
        assert response.status_code == 400
        assert response.json()["detail"] == "Token obrigatório"

class TestValidation:
    """Test input validation"""
    
    def test_register_invalid_email(self):
        response = client.post("/api/auth/register", json={
            **TEST_USER,
            "email": "invalid-email"
        })
        assert response.status_code == 422
    
    def test_register_weak_password(self):
        response = client.post("/api/auth/register", json={
            **TEST_USER,
            "password": "weak"
        })
        assert response.status_code == 400
        assert "pelo menos 8 caracteres" in response.json()["detail"]
    
    def test_register_invalid_cpf(self):
        response = client.post("/api/auth/register", json={
            **TEST_USER,
            "cpf": "11111111111"  # Invalid CPF (all same digits)
        })
        assert response.status_code == 400
        assert "CPF inválido" in response.json()["detail"]
    
    def test_register_doctor_invalid_crm(self):
        response = client.post("/api/auth/register-doctor", json={
            **TEST_DOCTOR,
            "crm": "123"  # Too short
        })
        assert response.status_code == 400
        assert "CRM inválido" in response.json()["detail"]

class TestRequestEndpoints:
    """Test request creation endpoints"""
    
    def setup_method(self):
        # Create a test user and get token
        register_response = client.post("/api/auth/register", json={
            **TEST_USER,
            "email": f"request_test_{datetime.now().timestamp()}@example.com"
        })
        self.token = register_response.json()["access_token"]
        self.user = register_response.json()["user"]
    
    def test_create_prescription_request(self):
        response = client.post("/api/requests/prescription", 
            json={
                "prescription_type": "simple",
                "medications": [
                    {
                        "name": "Paracetamol",
                        "dosage": "500mg",
                        "frequency": "6/6h",
                        "duration": "5 dias"
                    }
                ],
                "notes": "Dor de cabeça frequente"
            },
            params={"token": self.token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["request_type"] == "prescription"
        assert data["status"] == "pending_payment"
        assert data["prescription_type"] == "simple"
    
    def test_create_exam_request(self):
        response = client.post("/api/requests/exam",
            json={
                "exam_type": "laboratory",
                "exams": ["Hemograma completo", "Glicemia"],
                "notes": "Checkup anual"
            },
            params={"token": self.token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["request_type"] == "exam"
        assert data["status"] == "pending_payment"
        assert data["exam_type"] == "laboratory"
    
    def test_create_consultation_request(self):
        response = client.post("/api/requests/consultation",
            json={
                "specialty": "general",
                "duration": 30,
                "schedule_type": "immediate",
                "notes": "Consulta de rotina"
            },
            params={"token": self.token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["request_type"] == "consultation"
        assert data["status"] == "pending_payment"
        assert data["specialty"] == "general"
        assert data["duration"] == 30

class TestPriceCalculation:
    """Test price calculation logic"""
    
    def test_prescription_prices(self):
        # Test data structure
        from server import PRESCRIPTION_PRICES
        
        assert PRESCRIPTION_PRICES["simple"] == 39.90
        assert PRESCRIPTION_PRICES["controlled"] == 59.90
        assert PRESCRIPTION_PRICES["blue"] == 79.90
    
    def test_exam_prices(self):
        from server import EXAM_PRICES
        
        assert EXAM_PRICES["laboratory"] == 29.90
        assert EXAM_PRICES["imaging"] == 49.90
        assert EXAM_PRICES["specialized"] == 69.90
    
    def test_consultation_price_calculation(self):
        from server import calculate_consultation_price
        
        # Test general consultation prices
        assert calculate_consultation_price("general", 15) == 35.94  # 59.90 * 0.6
        assert calculate_consultation_price("general", 30) == 59.90  # 59.90 * 1.0
        assert calculate_consultation_price("general", 45) == 83.86  # 59.90 * 1.4
        assert calculate_consultation_price("general", 60) == 107.82  # 59.90 * 1.8

if __name__ == "__main__":
    pytest.main([__file__, "-v"])