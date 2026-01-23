#!/usr/bin/env python3
"""
Backend API Testing for Telemedicine System
Tests queue system, chat, and medical consultation endpoints
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://health-connect-92.preview.emergentagent.com/api"
TIMEOUT = 30

class BackendTester:
    def __init__(self):
        self.patient_token = None
        self.doctor_token = None
        self.request_id = None
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        # Add token as query parameter if provided
        if token:
            if params is None:
                params = {}
            params["token"] = token
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, params=params, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, params=params, headers=headers, timeout=TIMEOUT)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.Timeout:
            return None, "Request timeout"
        except requests.exceptions.ConnectionError:
            return None, "Connection error"
        except Exception as e:
            return None, f"Request error: {str(e)}"
    
    def test_health_check(self):
        """Test basic API health"""
        response, error = self.make_request("GET", "/health")
        
        if error:
            self.log_result("Health Check", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            self.log_result("Health Check", True, "API is healthy")
            return True
        else:
            self.log_result("Health Check", False, f"Health check failed: {response.status_code}")
            return False
    
    def test_patient_registration(self):
        """Test patient registration"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        data = {
            "name": "Maria Silva",
            "email": f"maria.silva.{unique_id}@test.com",
            "password": "123456"
        }
        
        response, error = self.make_request("POST", "/auth/register", data)
        
        if error:
            self.log_result("Patient Registration", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.patient_token = result.get("access_token")
                if self.patient_token:
                    self.log_result("Patient Registration", True, "Patient registered successfully")
                    return True
                else:
                    self.log_result("Patient Registration", False, "No token in response")
                    return False
            except json.JSONDecodeError:
                self.log_result("Patient Registration", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Patient Registration", False, f"Registration failed: {error_detail}")
            return False
    
    def test_doctor_registration(self):
        """Test doctor registration"""
        data = {
            "name": "Dr. João Santos",
            "email": "joao.santos@test.com",
            "password": "123456",
            "crm": "123456",
            "crm_state": "SP",
            "specialty": "Clínico Geral"
        }
        
        response, error = self.make_request("POST", "/auth/register-doctor", data)
        
        if error:
            self.log_result("Doctor Registration", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.doctor_token = result.get("access_token")
                if self.doctor_token:
                    self.log_result("Doctor Registration", True, "Doctor registered successfully")
                    return True
                else:
                    self.log_result("Doctor Registration", False, "No token in response")
                    return False
            except json.JSONDecodeError:
                self.log_result("Doctor Registration", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Doctor Registration", False, f"Registration failed: {error_detail}")
            return False
    
    def test_create_prescription_request(self):
        """Test creating a prescription request"""
        if not self.patient_token:
            self.log_result("Create Prescription Request", False, "No patient token available")
            return False
            
        data = {
            "prescription_type": "simple",
            "notes": "Teste de receita médica"
        }
        
        response, error = self.make_request("POST", "/requests/prescription", data, self.patient_token)
        
        if error:
            self.log_result("Create Prescription Request", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.request_id = result.get("id")
                if self.request_id:
                    self.log_result("Create Prescription Request", True, f"Request created with ID: {self.request_id}")
                    return True
                else:
                    self.log_result("Create Prescription Request", False, "No request ID in response")
                    return False
            except json.JSONDecodeError:
                self.log_result("Create Prescription Request", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Create Prescription Request", False, f"Request creation failed: {error_detail}")
            return False
    
    def test_queue_stats(self):
        """Test queue statistics endpoint"""
        if not self.doctor_token:
            self.log_result("Queue Stats", False, "No doctor token available")
            return False
            
        response, error = self.make_request("GET", "/queue/stats", token=self.doctor_token)
        
        if error:
            self.log_result("Queue Stats", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.log_result("Queue Stats", True, "Queue stats retrieved successfully", result)
                return True
            except json.JSONDecodeError:
                self.log_result("Queue Stats", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Queue Stats", False, f"Queue stats failed: {error_detail}")
            return False
    
    def test_assign_request(self):
        """Test assigning doctor to request"""
        if not self.doctor_token or not self.request_id:
            self.log_result("Assign Request", False, "Missing doctor token or request ID")
            return False
            
        response, error = self.make_request("POST", f"/queue/assign/{self.request_id}", token=self.doctor_token)
        
        if error:
            self.log_result("Assign Request", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.log_result("Assign Request", True, "Request assigned successfully", result)
                return True
            except json.JSONDecodeError:
                self.log_result("Assign Request", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Assign Request", False, f"Assignment failed: {error_detail}")
            return False
    
    def test_send_chat_message_patient(self):
        """Test sending chat message as patient"""
        if not self.patient_token or not self.request_id:
            self.log_result("Send Chat Message (Patient)", False, "Missing patient token or request ID")
            return False
            
        data = {
            "request_id": self.request_id,
            "message": "Olá doutor, preciso de ajuda com minha receita!"
        }
        
        response, error = self.make_request("POST", "/chat", data, self.patient_token)
        
        if error:
            self.log_result("Send Chat Message (Patient)", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.log_result("Send Chat Message (Patient)", True, "Patient message sent successfully")
                return True
            except json.JSONDecodeError:
                self.log_result("Send Chat Message (Patient)", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Send Chat Message (Patient)", False, f"Message send failed: {error_detail}")
            return False
    
    def test_send_chat_message_doctor(self):
        """Test sending chat message as doctor"""
        if not self.doctor_token or not self.request_id:
            self.log_result("Send Chat Message (Doctor)", False, "Missing doctor token or request ID")
            return False
            
        data = {
            "request_id": self.request_id,
            "message": "Olá! Vou analisar sua solicitação e te ajudar."
        }
        
        response, error = self.make_request("POST", "/chat", data, self.doctor_token)
        
        if error:
            self.log_result("Send Chat Message (Doctor)", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.log_result("Send Chat Message (Doctor)", True, "Doctor message sent successfully")
                return True
            except json.JSONDecodeError:
                self.log_result("Send Chat Message (Doctor)", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Send Chat Message (Doctor)", False, f"Message send failed: {error_detail}")
            return False
    
    def test_get_chat_messages(self):
        """Test retrieving chat messages"""
        if not self.patient_token or not self.request_id:
            self.log_result("Get Chat Messages", False, "Missing patient token or request ID")
            return False
            
        response, error = self.make_request("GET", f"/chat/{self.request_id}", token=self.patient_token)
        
        if error:
            self.log_result("Get Chat Messages", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                message_count = len(result) if isinstance(result, list) else 0
                self.log_result("Get Chat Messages", True, f"Retrieved {message_count} messages")
                return True
            except json.JSONDecodeError:
                self.log_result("Get Chat Messages", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Get Chat Messages", False, f"Get messages failed: {error_detail}")
            return False
    
    def test_unread_count(self):
        """Test getting unread message count"""
        if not self.patient_token:
            self.log_result("Unread Count", False, "No patient token available")
            return False
            
        response, error = self.make_request("GET", "/chat/unread-count", token=self.patient_token)
        
        if error:
            self.log_result("Unread Count", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                # Handle both dict and list responses
                if isinstance(result, dict):
                    count = result.get("unread_count", 0)
                elif isinstance(result, list):
                    count = len(result)
                else:
                    count = 0
                self.log_result("Unread Count", True, f"Unread count: {count}")
                return True
            except json.JSONDecodeError:
                self.log_result("Unread Count", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Unread Count", False, f"Unread count failed: {error_detail}")
            return False
    
    def test_mark_chat_read(self):
        """Test marking chat messages as read"""
        if not self.patient_token or not self.request_id:
            self.log_result("Mark Chat Read", False, "Missing patient token or request ID")
            return False
            
        response, error = self.make_request("POST", f"/chat/{self.request_id}/mark-read", token=self.patient_token)
        
        if error:
            self.log_result("Mark Chat Read", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                marked = result.get("marked_read", 0)
                self.log_result("Mark Chat Read", True, f"Marked {marked} messages as read")
                return True
            except json.JSONDecodeError:
                self.log_result("Mark Chat Read", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Mark Chat Read", False, f"Mark read failed: {error_detail}")
            return False
    
    def test_doctor_availability(self):
        """Test updating doctor availability"""
        if not self.doctor_token:
            self.log_result("Doctor Availability", False, "No doctor token available")
            return False
            
        params = {"available": "true"}
        response, error = self.make_request("PUT", "/doctor/availability", token=self.doctor_token, params=params)
        
        if error:
            self.log_result("Doctor Availability", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.log_result("Doctor Availability", True, "Availability updated successfully", result)
                return True
            except json.JSONDecodeError:
                self.log_result("Doctor Availability", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Doctor Availability", False, f"Availability update failed: {error_detail}")
            return False
    
    def test_my_patients(self):
        """Test getting doctor's patients"""
        if not self.doctor_token:
            self.log_result("My Patients", False, "No doctor token available")
            return False
            
        response, error = self.make_request("GET", "/doctor/my-patients", token=self.doctor_token)
        
        if error:
            self.log_result("My Patients", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                patient_count = len(result) if isinstance(result, list) else 0
                self.log_result("My Patients", True, f"Retrieved {patient_count} patients")
                return True
            except json.JSONDecodeError:
                self.log_result("My Patients", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("My Patients", False, f"Get patients failed: {error_detail}")
            return False
    
    def test_doctors_queue(self):
        """Test getting doctor queue"""
        if not self.doctor_token:
            self.log_result("Doctors Queue", False, "No doctor token available")
            return False
            
        response, error = self.make_request("GET", "/doctors/queue", token=self.doctor_token)
        
        if error:
            self.log_result("Doctors Queue", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.log_result("Doctors Queue", True, "Queue retrieved successfully", result)
                return True
            except json.JSONDecodeError:
                self.log_result("Doctors Queue", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Doctors Queue", False, f"Queue retrieval failed: {error_detail}")
            return False
    
    def test_start_consultation(self):
        """Test starting a consultation"""
        if not self.doctor_token or not self.request_id:
            self.log_result("Start Consultation", False, "Missing doctor token or request ID")
            return False
            
        response, error = self.make_request("POST", f"/consultation/start/{self.request_id}", token=self.doctor_token)
        
        if error:
            self.log_result("Start Consultation", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.log_result("Start Consultation", True, "Consultation started successfully", result)
                return True
            except json.JSONDecodeError:
                self.log_result("Start Consultation", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Start Consultation", False, f"Start consultation failed: {error_detail}")
            return False
    
    def test_end_consultation(self):
        """Test ending a consultation"""
        if not self.doctor_token or not self.request_id:
            self.log_result("End Consultation", False, "Missing doctor token or request ID")
            return False
            
        params = {"notes": "Consulta finalizada com sucesso"}
        response, error = self.make_request("POST", f"/consultation/end/{self.request_id}", token=self.doctor_token, params=params)
        
        if error:
            self.log_result("End Consultation", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                self.log_result("End Consultation", True, "Consultation ended successfully", result)
                return True
            except json.JSONDecodeError:
                self.log_result("End Consultation", False, "Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("End Consultation", False, f"End consultation failed: {error_detail}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("=" * 60)
        print("BACKEND API TESTING - TELEMEDICINE SYSTEM")
        print("=" * 60)
        print(f"Base URL: {BASE_URL}")
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return self.generate_summary()
        
        # Authentication flow
        self.test_patient_registration()
        self.test_doctor_registration()
        
        # Request creation
        self.test_create_prescription_request()
        
        # Queue system tests
        self.test_queue_stats()
        self.test_assign_request()
        
        # Chat system tests
        self.test_send_chat_message_patient()
        self.test_send_chat_message_doctor()
        self.test_get_chat_messages()
        self.test_unread_count()
        self.test_mark_chat_read()
        
        # Doctor management
        self.test_doctor_availability()
        self.test_my_patients()
        self.test_doctors_queue()
        
        # Consultation management
        self.test_start_consultation()
        self.test_end_consultation()
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print()
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        print()
        
        if failed_tests > 0:
            print("FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
            print()
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests/total_tests*100) if total_tests > 0 else 0,
            "results": self.results
        }

if __name__ == "__main__":
    tester = BackendTester()
    summary = tester.run_all_tests()