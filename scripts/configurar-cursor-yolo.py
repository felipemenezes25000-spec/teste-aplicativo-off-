#!/usr/bin/env python3
"""
Configura YOLO mode e Command Allowlist no Cursor via SQLite.
Execute com: python scripts/configurar-cursor-yolo.py
"""
import sqlite3
import json
import os

DB_PATH = os.path.expandvars(
    r"%APPDATA%\Cursor\User\globalStorage\state.vscdb"
)
KEY = "src.vs.platform.reactivestorage.browser.reactiveStorageServiceImpl.persistentStorage.applicationUser"

# Lista ampla de comandos liberados para execução automática (YOLO mode)
ALLOWLIST = [
    # Node / Frontend / Expo
    "yarn", "npm", "node", "npx", "expo",
    # Python / Backend
    "python", "pip", "pip3", "python3", "pytest",
    # Navegação e shell
    "cd", "Set-Location", "pwsh", "powershell", "cmd", "bash", "sh",
    # Versionamento
    "git",
    # Docker
    "docker", "docker-compose",
    # Banco de dados
    "psql", "sqlite3", "supabase",
    # Testes e ferramentas
    "jest", "eslint", "tsc",
    # Utilitários
    "curl", "wget", "rg", "grep", "find", "echo", "type", "Get-Content",
    # Build e outros
    "dotnet", "ng", "vite", "webpack", "winget", "choco",
]

def main():
    if not os.path.exists(DB_PATH):
        print(f"Banco não encontrado: {DB_PATH}")
        return 1

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute("SELECT value FROM ItemTable WHERE key = ?", (KEY,))
    row = cur.fetchone()
    if not row:
        print("Chave de configuração não encontrada no banco.")
        conn.close()
        return 1

    data = json.loads(row[0])
    
    if "composerState" not in data:
        data["composerState"] = {}
    
    cs = data["composerState"]
    cs["useYoloMode"] = True
    cs["yoloCommandAllowlist"] = ALLOWLIST
    cs["yoloEnableRunEverything"] = True  # Permite executar qualquer comando
    
    new_value = json.dumps(data, ensure_ascii=False)
    cur.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (new_value, KEY))
    conn.commit()
    conn.close()

    print("Configuração aplicada com sucesso!")
    print("- useYoloMode: True")
    print("- yoloCommandAllowlist:", ", ".join(ALLOWLIST))
    print("\nReinicie o Cursor para as alterações terem efeito.")
    return 0

if __name__ == "__main__":
    exit(main())
