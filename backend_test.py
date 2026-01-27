#!/usr/bin/env python3
"""
Comprehensive Backend Testing for RenoveJá Telemedicine Application
Tests all endpoints according to the review request specifications.
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

class RenoveJaBackendTester:
    def __init__(self, base_url: str = "https://medrenovar.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tokens = {}  # Store tokens for different user types
        self.users = {}   # Store user data
        self.requests_created = []  # Store created request IDs
        self.payments_created = []  # Store created payment IDs
        
        # Test results tracking
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": [],
            "details": []
        }
    
    def log_result(self, test_name: str, success: bool, details: str = "", error: str = ""):
        """Log test result"""
        if success:
            self.test_results["passed"] += 1
            status = "✅ PASS"
        else:
            self.test_results["failed"] += 1
            status = "❌ FAIL"
            if error:
                self.test_results["errors"].append(f"{test_name}: {error}")
        
        result_msg = f"{status} {test_name}"
        if details:
            result_msg += f" - {details}"
        if error:
            result_msg += f" - ERROR: {error}"
            
        print(result_msg)
        self.test_results["details"].append(result_msg)
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, error)"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            # Also try as query parameter (FastAPI style)
            if params is None:
                params = {}
            params["token"] = token
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=headers, json=data, params=params, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=headers, json=data, params=params, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, params=params, timeout=30)
            else:
                return False, None, f"Unsupported method: {method}"
            
            # Try to parse JSON response
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            if response.status_code >= 200 and response.status_code < 300:
                return True, response_data, ""
            else:
                return False, response_data, f"HTTP {response.status_code}: {response_data}"
                
        except requests.exceptions.RequestException as e:
            return False, None, f"Request failed: {str(e)}"
        except Exception as e:
            return False, None, f"Unexpected error: {str(e)}"
    
    def test_authentication(self):
        """Test all authentication endpoints"""
        print("\n🔐 TESTING AUTHENTICATION ENDPOINTS")
        print("=" * 50)
        
        # 1. Register Patient
        patient_data = {
            "name": "Maria Silva",
            "email": f"maria.silva.{uuid.uuid4().hex[:8]}@teste.com",
            "password": "senha123456",
            "phone": "11987654321",
            "cpf": "12345678901",
            "role": "patient"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", patient_data)
        if success and response.get("access_token"):
            self.tokens["patient"] = response["access_token"]
            self.users["patient"] = response["user"]
            self.log_result("POST /auth/register (Patient)", True, f"Patient registered: {patient_data['name']}")
        else:
            self.log_result("POST /auth/register (Patient)", False, error=error)
        
        # 2. Register Doctor
        doctor_data = {
            "name": "Dr. João Santos",
            "email": f"joao.santos.{uuid.uuid4().hex[:8]}@teste.com",
            "password": "senha123456",
            "phone": "11987654322",
            "cpf": "12345678902",
            "crm": "123456",
            "crm_state": "SP",
            "specialty": "Clínico Geral"
        }
        
        success, response, error = self.make_request("POST", "/auth/register-doctor", doctor_data)
        if success and response.get("access_token"):
            self.tokens["doctor"] = response["access_token"]
            self.users["doctor"] = response["user"]
            self.log_result("POST /auth/register-doctor", True, f"Doctor registered: {doctor_data['name']}")
        else:
            self.log_result("POST /auth/register-doctor", False, error=error)
        
        # 3. Register Nurse
        nurse_data = {
            "name": "Enfermeira Ana Costa",
            "email": f"ana.costa.{uuid.uuid4().hex[:8]}@teste.com",
            "password": "senha123456",
            "phone": "11987654323",
            "cpf": "12345678903",
            "coren": "123456",
            "coren_state": "SP",
            "specialty": "Enfermagem Geral"
        }
        
        success, response, error = self.make_request("POST", "/auth/register-nurse", nurse_data)
        if success and response.get("access_token"):
            self.tokens["nurse"] = response["access_token"]
            self.users["nurse"] = response["user"]
            self.log_result("POST /auth/register-nurse", True, f"Nurse registered: {nurse_data['name']}")
        else:
            self.log_result("POST /auth/register-nurse", False, error=error)
        
        # 4. Test Login
        login_data = {
            "email": patient_data["email"],
            "password": patient_data["password"]
        }
        
        success, response, error = self.make_request("POST", "/auth/login", login_data)
        if success and response.get("access_token"):
            self.log_result("POST /auth/login", True, "Login successful")
        else:
            self.log_result("POST /auth/login", False, error=error)
    
    def test_prescription_requests(self):
        """Test prescription request workflow"""
        print("\n💊 TESTING PRESCRIPTION REQUEST WORKFLOW")
        print("=" * 50)
        
        if "patient" not in self.tokens:
            self.log_result("Prescription Tests", False, error="No patient token available")
            return
        
        # 1. Create prescription request
        prescription_data = {
            "prescription_type": "simple",
            "medications": [
                {"name": "Paracetamol", "dosage": "500mg", "frequency": "8/8h", "duration": "7 dias"}
            ],
            "notes": "Paciente com dor de cabeça recorrente"
        }
        
        success, response, error = self.make_request(
            "POST", "/requests/prescription", 
            prescription_data, 
            token=self.tokens["patient"]
        )
        
        if success and response.get("id"):
            request_id = response["id"]
            self.requests_created.append(request_id)
            self.log_result("POST /requests/prescription", True, f"Request created: {request_id}")
            
            # 2. Get patient requests
            success, response, error = self.make_request(
                "GET", "/requests", 
                token=self.tokens["patient"]
            )
            
            if success and isinstance(response, list):
                self.log_result("GET /requests (Patient)", True, f"Found {len(response)} requests")
            else:
                self.log_result("GET /requests (Patient)", False, error=error)
            
            # 3. Get specific request details
            success, response, error = self.make_request(
                "GET", f"/requests/{request_id}", 
                token=self.tokens["patient"]
            )
            
            if success and response.get("id") == request_id:
                self.log_result("GET /requests/{id}", True, "Request details retrieved")
            else:
                self.log_result("GET /requests/{id}", False, error=error)
        else:
            self.log_result("POST /requests/prescription", False, error=error)
    
    def test_doctor_queue_workflow(self):
        """Test doctor queue and approval workflow"""
        print("\n👨‍⚕️ TESTING DOCTOR QUEUE WORKFLOW")
        print("=" * 50)
        
        if "doctor" not in self.tokens:
            self.log_result("Doctor Queue Tests", False, error="No doctor token available")
            return
        
        # 1. Get doctor queue
        success, response, error = self.make_request(
            "GET", "/doctors/queue", 
            token=self.tokens["doctor"]
        )
        
        if success:
            self.log_result("GET /doctors/queue", True, f"Queue retrieved with sections: {list(response.keys()) if isinstance(response, dict) else 'list format'}")
            
            # Try to find a request to work with
            request_id = None
            if isinstance(response, dict) and "pending" in response:
                pending_requests = response["pending"]
                if pending_requests and len(pending_requests) > 0:
                    request_id = pending_requests[0].get("id")
            
            # If no pending request, use one we created
            if not request_id and self.requests_created:
                request_id = self.requests_created[0]
            
            if request_id:
                # 2. Accept request (assign doctor)
                success, response, error = self.make_request(
                    "POST", f"/queue/assign/{request_id}", 
                    token=self.tokens["doctor"]
                )
                
                if success:
                    self.log_result("POST /queue/assign/{request_id}", True, "Request accepted by doctor")
                    
                    # 3. Approve request with price
                    approval_data = {"price": 49.90, "notes": "Receita aprovada"}
                    success, response, error = self.make_request(
                        "POST", f"/requests/{request_id}/approve", 
                        approval_data,
                        token=self.tokens["doctor"]
                    )
                    
                    if success:
                        self.log_result("POST /requests/{id}/approve", True, "Request approved with price")
                    else:
                        self.log_result("POST /requests/{id}/approve", False, error=error)
                else:
                    self.log_result("POST /queue/assign/{request_id}", False, error=error)
            else:
                self.log_result("Doctor Queue Workflow", False, error="No request ID available for testing")
        else:
            self.log_result("GET /doctors/queue", False, error=error)
        
        # 4. Test reject functionality (create another request first)
        if "patient" in self.tokens:
            # Create another prescription request to reject
            prescription_data = {
                "prescription_type": "controlled",
                "medications": [{"name": "Test Med", "dosage": "10mg"}],
                "notes": "Test rejection"
            }
            
            success, response, error = self.make_request(
                "POST", "/requests/prescription", 
                prescription_data, 
                token=self.tokens["patient"]
            )
            
            if success and response.get("id"):
                reject_request_id = response["id"]
                
                # Reject the request
                rejection_data = {"reason": "Medicação não indicada para o caso"}
                success, response, error = self.make_request(
                    "POST", f"/requests/{reject_request_id}/reject", 
                    rejection_data,
                    token=self.tokens["doctor"]
                )
                
                if success:
                    self.log_result("POST /requests/{id}/reject", True, "Request rejected successfully")
                else:
                    self.log_result("POST /requests/{id}/reject", False, error=error)
    
    def test_nursing_workflow(self):
        """Test nursing workflow for exam requests"""
        print("\n🩺 TESTING NURSING WORKFLOW")
        print("=" * 50)
        
        if "patient" not in self.tokens or "nurse" not in self.tokens:
            self.log_result("Nursing Workflow Tests", False, error="Missing patient or nurse tokens")
            return
        
        # 1. Patient creates exam request
        exam_data = {
            "description": "Preciso fazer exames de sangue para check-up anual",
            "exam_images": [],
            "notes": "Paciente solicita hemograma completo"
        }
        
        success, response, error = self.make_request(
            "POST", "/requests/exam", 
            exam_data, 
            token=self.tokens["patient"]
        )
        
        if success and response.get("id"):
            exam_request_id = response["id"]
            self.log_result("POST /requests/exam", True, f"Exam request created: {exam_request_id}")
            
            # 2. Get nursing queue
            success, response, error = self.make_request(
                "GET", "/nursing/queue", 
                token=self.tokens["nurse"]
            )
            
            if success:
                self.log_result("GET /nursing/queue", True, "Nursing queue retrieved")
                
                # 3. Nurse accepts exam request
                success, response, error = self.make_request(
                    "POST", f"/nursing/accept/{exam_request_id}", 
                    token=self.tokens["nurse"]
                )
                
                if success:
                    self.log_result("POST /nursing/accept/{id}", True, "Exam request accepted by nurse")
                    
                    # 4. Nurse approves exam
                    approval_data = {
                        "price": 39.90,
                        "exam_type": "laboratory",
                        "exams": ["Hemograma completo", "Glicemia"],
                        "notes": "Exames aprovados conforme protocolo"
                    }
                    
                    success, response, error = self.make_request(
                        "POST", f"/nursing/approve/{exam_request_id}", 
                        approval_data,
                        token=self.tokens["nurse"]
                    )
                    
                    if success:
                        self.log_result("POST /nursing/approve/{id}", True, "Exam approved by nurse")
                    else:
                        self.log_result("POST /nursing/approve/{id}", False, error=error)
                else:
                    self.log_result("POST /nursing/accept/{id}", False, error=error)
            else:
                self.log_result("GET /nursing/queue", False, error=error)
            
            # Test forward to doctor workflow
            # Create another exam request
            exam_data2 = {
                "description": "Exame complexo que precisa de validação médica",
                "notes": "Caso complexo"
            }
            
            success, response, error = self.make_request(
                "POST", "/requests/exam", 
                exam_data2, 
                token=self.tokens["patient"]
            )
            
            if success and response.get("id"):
                exam_request_id2 = response["id"]
                
                # Nurse accepts
                success, response, error = self.make_request(
                    "POST", f"/nursing/accept/{exam_request_id2}", 
                    token=self.tokens["nurse"]
                )
                
                if success:
                    # 5. Forward to doctor
                    forward_data = {
                        "reason": "Caso complexo requer validação médica",
                        "notes": "Encaminhado para análise médica"
                    }
                    
                    success, response, error = self.make_request(
                        "POST", f"/nursing/forward-to-doctor/{exam_request_id2}", 
                        forward_data,
                        token=self.tokens["nurse"]
                    )
                    
                    if success:
                        self.log_result("POST /nursing/forward-to-doctor/{id}", True, "Exam forwarded to doctor")
                    else:
                        self.log_result("POST /nursing/forward-to-doctor/{id}", False, error=error)
            
            # Test rejection
            exam_data3 = {
                "description": "Exame desnecessário",
                "notes": "Para teste de rejeição"
            }
            
            success, response, error = self.make_request(
                "POST", "/requests/exam", 
                exam_data3, 
                token=self.tokens["patient"]
            )
            
            if success and response.get("id"):
                exam_request_id3 = response["id"]
                
                # Nurse accepts then rejects
                success, response, error = self.make_request(
                    "POST", f"/nursing/accept/{exam_request_id3}", 
                    token=self.tokens["nurse"]
                )
                
                if success:
                    # 6. Reject exam
                    rejection_data = {
                        "reason": "Exame não indicado para o quadro clínico",
                        "notes": "Rejeitado conforme protocolo"
                    }
                    
                    success, response, error = self.make_request(
                        "POST", f"/nursing/reject/{exam_request_id3}", 
                        rejection_data,
                        token=self.tokens["nurse"]
                    )
                    
                    if success:
                        self.log_result("POST /nursing/reject/{id}", True, "Exam rejected by nurse")
                    else:
                        self.log_result("POST /nursing/reject/{id}", False, error=error)
        else:
            self.log_result("POST /requests/exam", False, error=error)
    
    def test_payments(self):
        """Test payment workflow"""
        print("\n💳 TESTING PAYMENT WORKFLOW")
        print("=" * 50)
        
        if "patient" not in self.tokens:
            self.log_result("Payment Tests", False, error="No patient token available")
            return
        
        # Use an existing request or create one
        request_id = self.requests_created[0] if self.requests_created else None
        
        if not request_id:
            # Create a simple prescription request for payment testing
            prescription_data = {
                "prescription_type": "simple",
                "medications": [{"name": "Test Med", "dosage": "10mg"}],
                "notes": "For payment testing"
            }
            
            success, response, error = self.make_request(
                "POST", "/requests/prescription", 
                prescription_data, 
                token=self.tokens["patient"]
            )
            
            if success and response.get("id"):
                request_id = response["id"]
            else:
                self.log_result("Payment Tests", False, error="Could not create request for payment testing")
                return
        
        # 1. Create PIX payment
        payment_data = {
            "request_id": request_id,
            "amount": 49.90,
            "method": "pix"
        }
        
        success, response, error = self.make_request(
            "POST", "/payments/create", 
            payment_data, 
            token=self.tokens["patient"]
        )
        
        if success and response.get("id"):
            payment_id = response["id"]
            self.payments_created.append(payment_id)
            self.log_result("POST /payments/create", True, f"PIX payment created: {payment_id}")
            
            # 2. Check payment status
            success, response, error = self.make_request(
                "GET", f"/payments/{payment_id}/status", 
                token=self.tokens["patient"]
            )
            
            if success:
                self.log_result("GET /payments/{id}/status", True, f"Payment status: {response.get('status', 'unknown')}")
            else:
                self.log_result("GET /payments/{id}/status", False, error=error)
        else:
            self.log_result("POST /payments/create", False, error=error)
    
    def test_digital_signature(self):
        """Test digital signature workflow"""
        print("\n✍️ TESTING DIGITAL SIGNATURE WORKFLOW")
        print("=" * 50)
        
        if "doctor" not in self.tokens:
            self.log_result("Digital Signature Tests", False, error="No doctor token available")
            return
        
        # Use an existing request or create one
        request_id = self.requests_created[0] if self.requests_created else None
        
        if not request_id:
            self.log_result("Digital Signature Tests", False, error="No request available for signing")
            return
        
        # 1. Sign prescription
        signature_data = {
            "request_id": request_id,
            "medications": [
                {
                    "name": "Paracetamol",
                    "dosage": "500mg",
                    "frequency": "8/8h",
                    "duration": "7 dias",
                    "instructions": "Tomar com água"
                }
            ],
            "notes": "Receita assinada digitalmente"
        }
        
        success, response, error = self.make_request(
            "POST", f"/requests/{request_id}/sign", 
            signature_data, 
            token=self.tokens["doctor"]
        )
        
        if success:
            self.log_result("POST /requests/{id}/sign", True, "Document signed successfully")
        else:
            self.log_result("POST /requests/{id}/sign", False, error=error)
    
    def test_additional_endpoints(self):
        """Test additional endpoints not covered in main workflows"""
        print("\n🔧 TESTING ADDITIONAL ENDPOINTS")
        print("=" * 50)
        
        # Test specialties
        success, response, error = self.make_request("GET", "/specialties")
        if success and isinstance(response, list):
            self.log_result("GET /specialties", True, f"Found {len(response)} specialties")
        else:
            self.log_result("GET /specialties", False, error=error)
        
        # Test doctors list
        success, response, error = self.make_request("GET", "/doctors")
        if success:
            self.log_result("GET /doctors", True, f"Doctors list retrieved")
        else:
            self.log_result("GET /doctors", False, error=error)
        
        # Test integration status
        success, response, error = self.make_request("GET", "/integrations/status")
        if success:
            self.log_result("GET /integrations/status", True, "Integration status retrieved")
        else:
            self.log_result("GET /integrations/status", False, error=error)
        
        # Test admin stats (may fail due to permissions, that's ok)
        success, response, error = self.make_request("GET", "/admin/stats")
        if success:
            self.log_result("GET /admin/stats", True, "Admin stats retrieved")
        else:
            self.log_result("GET /admin/stats", False, error="Expected - admin permissions required")
        
        # Test notifications (if patient token available)
        if "patient" in self.tokens:
            success, response, error = self.make_request(
                "GET", "/notifications", 
                token=self.tokens["patient"]
            )
            if success:
                self.log_result("GET /notifications", True, "Notifications retrieved")
            else:
                self.log_result("GET /notifications", False, error=error)
    
    def run_complete_test_suite(self):
        """Run all tests in the correct order"""
        print("🚀 STARTING COMPREHENSIVE RENOVEJA BACKEND TESTING")
        print("=" * 60)
        print(f"Base URL: {self.base_url}")
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        try:
            # Run tests in logical order
            self.test_authentication()
            self.test_prescription_requests()
            self.test_doctor_queue_workflow()
            self.test_nursing_workflow()
            self.test_payments()
            self.test_digital_signature()
            self.test_additional_endpoints()
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR during testing: {str(e)}")
            self.test_results["errors"].append(f"Critical error: {str(e)}")
        
        # Print final summary
        self.print_final_summary()
    
    def print_final_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 60)
        print("📊 FINAL TEST SUMMARY")
        print("=" * 60)
        
        total_tests = self.test_results["passed"] + self.test_results["failed"]
        pass_rate = (self.test_results["passed"] / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        
        if self.test_results["errors"]:
            print(f"\n🚨 CRITICAL ERRORS ({len(self.test_results['errors'])}):")
            for i, error in enumerate(self.test_results["errors"], 1):
                print(f"{i}. {error}")
        
        print(f"\n📋 DETAILED RESULTS:")
        for detail in self.test_results["details"]:
            print(f"  {detail}")
        
        print(f"\n🏁 Testing completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Determine overall status
        if self.test_results["failed"] == 0:
            print("🎉 ALL TESTS PASSED - SYSTEM FULLY FUNCTIONAL")
        elif pass_rate >= 80:
            print("⚠️  MOSTLY WORKING - Some issues need attention")
        else:
            print("🚨 CRITICAL ISSUES - System needs significant fixes")

def main():
    """Main function to run the tests"""
    print("RenoveJá Backend Comprehensive Testing Suite")
    print("Testing all endpoints as specified in review request")
    
    # Initialize tester with the correct base URL
    tester = RenoveJaBackendTester()
    
    # Run complete test suite
    tester.run_complete_test_suite()
    
    return tester.test_results

if __name__ == "__main__":
    main()