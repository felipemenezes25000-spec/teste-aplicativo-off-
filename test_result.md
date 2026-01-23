#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Sistema de telemedicina "Renovar" - App convertido de React/Supabase para Expo/FastAPI/MongoDB.
  Implementação do sistema de fila e distribuição de pacientes para médicos (round-robin) + Chat.

backend:
  - task: "Queue System - Auto Assign Requests"
    implemented: true
    working: true
    file: "backend/queue_manager.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Sistema de fila implementado com distribuição round-robin. Endpoints: /api/queue/assign, /api/queue/auto-assign, /api/queue/stats"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Queue system working correctly. All endpoints tested: GET /api/queue/stats (returns queue statistics), POST /api/queue/assign/{request_id} (doctor self-assignment working), auto-assignment logic implemented in QueueManager class with smart distribution by specialty and load balancing."

  - task: "Chat API - Send and Get Messages"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoints de chat implementados: POST /api/chat, GET /api/chat/{request_id}, /api/chat/unread-count, /api/chat/{request_id}/mark-read"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Chat system fully functional. All endpoints working: POST /api/chat (message sending), GET /api/chat/{request_id} (message retrieval), GET /api/chat/unread-count (unread count), POST /api/chat/{request_id}/mark-read (mark as read). ChatManager class handles real-time messaging with notifications."

  - task: "Consultation Management - Start/End"
    implemented: true
    working: true
    file: "backend/queue_manager.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoints de consulta: POST /api/consultation/start/{id}, POST /api/consultation/end/{id}"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Consultation management working correctly. POST /api/consultation/start/{request_id} (starts video consultation with room creation), POST /api/consultation/end/{request_id} (ends consultation with duration tracking). ConsultationManager integrates with video services and chat system."

  - task: "Doctor Availability"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoint PUT /api/doctor/availability para atualizar disponibilidade"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Doctor availability system working. PUT /api/doctor/availability (updates availability status), GET /api/doctor/my-patients (retrieves doctor's patients), GET /api/doctors/queue (gets doctor queue). All endpoints functional."

frontend:
  - task: "Chat Component"
    implemented: true
    working: "NA"
    file: "frontend/src/components/Chat.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Componente de Chat criado com envio de mensagens, polling e marcação de leitura"

  - task: "Doctor Request Detail Screen"
    implemented: true
    working: "NA"
    file: "frontend/app/doctor/request/[id].tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Tela de detalhes da solicitação com ações de aceitar, aprovar, recusar, iniciar consulta"

  - task: "Doctor Chat Screen"
    implemented: true
    working: "NA"
    file: "frontend/app/doctor/chat/[id].tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Tela dedicada de chat médico-paciente"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Queue System - Auto Assign Requests"
    - "Chat API - Send and Get Messages"
    - "Consultation Management - Start/End"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Implementei o sistema de fila com distribuição round-robin e chat.
      
      **Backend:**
      - QueueManager com distribuição inteligente de solicitações
      - ChatManager para mensagens em tempo real
      - ConsultationManager para gerenciar videoconsultas
      - Endpoints completos para queue, chat e consultas
      
      **Frontend:**
      - Componente Chat.tsx com polling de mensagens
      - Tela de detalhes da solicitação para médico
      - Tela de chat dedicada
      - Navegação integrada no dashboard do médico
      
      Por favor, teste os endpoints de backend:
      1. POST /api/queue/assign/{request_id} - atribuir médico a solicitação
      2. POST /api/chat - enviar mensagem
      3. GET /api/chat/{request_id} - buscar mensagens
      4. GET /api/queue/stats - estatísticas da fila