# 📸 Screenshots Pendentes

## ✅ Status Atual

- **Total de telas (código):** 52 arquivos .tsx
- **Screenshots existentes:** 25 imagens
- **Cobertura:** ~48%

---

## ❌ Telas SEM Screenshot (27)

### Dinâmicas (com parâmetros [id])

1. `app/chat/[requestId].tsx` - Chat com médico/paciente
2. `app/video/[id].tsx` - Sala de vídeo chamada
3. `app/doctor/analyze/[id].tsx` - Análise de documento (médico)
4. `app/doctor/chat/[id].tsx` - Chat médico
5. `app/doctor/request/[id].tsx` - Detalhes da solicitação (médico)
6. `app/nurse/request/[id].tsx` - Detalhes da solicitação (enfermeiro)
7. `app/request/[id].tsx` - Detalhes da solicitação (geral)
8. `app/review/[id].tsx` - Avaliar atendimento
9. `app/prescription/view/[id].tsx` - Visualizar receita completa
10. `app/consultation/waiting/[id].tsx` - Sala de espera da consulta

### Layouts (navegação)

11. `app/(auth)/_layout.tsx`
12. `app/(tabs)/_layout.tsx`
13. `app/_layout.tsx`
14. `app/admin/_layout.tsx`
15. `app/chat/_layout.tsx`
16. `app/consultation/_layout.tsx`
17. `app/doctor/_layout.tsx`
18. `app/doctor/analyze/_layout.tsx`
19. `app/exam/_layout.tsx`
20. `app/legal/_layout.tsx`
21. `app/prescription/_layout.tsx`
22. `app/review/_layout.tsx`
23. `app/settings/_layout.tsx`
24. `app/video/_layout.tsx`
25. `app/pharmacies/_layout.tsx`

### Outras Telas

26. `app/index.tsx` - Splash/Router (já tem screenshot)
27. `app/nurse/index.tsx` - Dashboard enfermeiro (já tem screenshot)
28. `app/consultation/index.tsx` - Tela de consultas (já tem screenshot)
29. `app/doctor/index.tsx` - Dashboard médico (já tem screenshot)
30. `app/exam/index.tsx` - Tela de exames (já tem screenshot)
31. `app/prescription/index.tsx` - Tela de receitas (já tem screenshot)
32. `app/pharmacies/index.tsx` - Farmácias (já tem screenshot)

---

## 🎯 Telas Mais Importantes Sem Screenshot (10)

### Alta Prioridade

1. **Chat Médico-Paciente** (`chat/[requestId].tsx`)
   - Troca de mensagens em tempo real
   - Anexos, imagens, áudios

2. **Videochamada** (`video/[id].tsx`)
   - Tela de consulta por vídeo
   - Controles (mute, câmera, encerrar)

3. **Análise de Documento (Médico)** (`doctor/analyze/[id].tsx`)
   - IA médica analisando receita
   - Aprovação/rejeição

4. **Sala de Espera** (`consultation/waiting/[id].tsx`)
   - Aguardando médico entrar
   - Timer, instruções

5. **Visualizar Receita** (`prescription/view/[id].tsx`)
   - PDF da receita
   - Assinatura digital
   - Download

6. **Avaliação** (`review/[id].tsx`)
   - Avaliar médico/atendimento
   - Estrelas, comentários

7. **Detalhes Solicitação** (`request/[id].tsx`)
   - Timeline do pedido
   - Status, pagamento, chat

### Média Prioridade

8. **Chat do Médico** (`doctor/chat/[id].tsx`)
9. **Request Médico** (`doctor/request/[id].tsx`)
10. **Request Enfermeiro** (`nurse/request/[id].tsx`)

---

## 📝 Nota

**Por que layouts não têm screenshot?**  
Layouts (`_layout.tsx`) são componentes estruturais que não renderizam UI diretamente - apenas organizam navegação.

**Por que telas dinâmicas são difíceis?**  
Telas com `[id]` precisam de dados reais (solicitação, consulta, etc.) para renderizar. Sem backend rodando, aparecem vazias ou em loading.

---

## 🎨 Como Capturar Screenshots das Telas Faltantes

### Opção 1: Rodar o App (Recomendado)

1. **Rodar Backend:**
   ```bash
   cd backend && python server.py
   ```

2. **Rodar Frontend:**
   ```bash
   cd frontend && npm start
   ```

3. **Navegar pelo app:**
   - Criar conta
   - Fazer solicitação
   - Entrar em chat
   - Etc.

4. **Capturar:**
   - Android: Volume Down + Power
   - iOS Simulator: Cmd + S
   - Web: Screenshot do browser

### Opção 2: Usar Storybook/Figma

Renderizar componentes isolados com dados mockados.

### Opção 3: Deixar como está

As 25 telas principais já cobrem os fluxos essenciais para apresentação.

---

## ✅ Conclusão

**Screenshots atuais (25) cobrem:**
- ✅ Autenticação completa
- ✅ Dashboard de todos os usuários (paciente, médico, enfermeiro, admin)
- ✅ Fluxo completo de receitas (4 telas)
- ✅ Telas legais/termos
- ✅ Configurações e farmácias

**Faltam principalmente:**
- ⏳ Telas dinâmicas (chat, vídeo, análise)
- ⏳ Layouts (estruturais, não visuais)

**Para demo/apresentação:** Screenshots existentes são suficientes! ✅
