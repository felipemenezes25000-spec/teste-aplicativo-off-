# Como rodar o RenoveJá+

## Pré-requisitos

- **Python 3.10+** instalado ([python.org](https://www.python.org/downloads/))
- **Node.js 18+** e **Yarn** ([nodejs.org](https://nodejs.org/))
- Arquivo **backend\.env** configurado (copie de `backend\.env.example`)

---

## Opção mais fácil: um único clique

1. Dê **duplo clique** em **`INICIAR_AQUI.bat`** (na raiz do projeto)
2. Vão abrir **duas janelas** (Backend e Frontend)
3. Aguarde ~10 segundos
4. Acesse: **http://localhost:8081** (app) e **http://localhost:8001/docs** (API)

---

## Opção 2: Scripts separados

### Backend
1. Dê **duplo clique** em **`run-backend.bat`** (na raiz do projeto)
2. Uma janela do terminal vai abrir
3. Aguarde aparecer: `Uvicorn running on http://0.0.0.0:8001`
4. Acesse: **http://localhost:8001/docs**

### Frontend
1. Dê **duplo clique** em **`run-frontend.bat`**
2. Uma janela do terminal vai abrir
3. Aguarde o Metro Bundler iniciar
4. Pressione **`w`** para abrir no navegador ou **`a`** para Android
5. Ou acesse: **http://localhost:8081**

---

## Opção 2: Pelo terminal do Cursor

### Terminal 1 – Backend
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Terminal 2 – Frontend
```powershell
cd frontend
yarn install
yarn start
```

Depois pressione **`w`** (web) ou **`a`** (Android) no terminal do frontend.

---

## URLs

| Serviço        | URL                      |
|----------------|--------------------------|
| API Backend    | http://localhost:8001    |
| Documentação   | http://localhost:8001/docs |
| Frontend (web) | http://localhost:8081    |

---

## Se der erro

### Backend não inicia
- Confirme que existe **backend\.env** (copie de `backend\.env.example`)
- Coloque pelo menos: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (ou deixe vazio para modo mock)
- Rode: `pip install -r backend\requirements.txt`

### Frontend não inicia
- Rode: `yarn install` dentro da pasta **frontend**
- Se faltar o Node: instale em [nodejs.org](https://nodejs.org/)

### "Port already in use"
- Feche outros terminais que estejam rodando o projeto
- Ou mude a porta: backend `--port 8002`, frontend use outra porta no Expo
