# Configuração MCP (Model Context Protocol)

## Onde o Cursor procura o MCP

| Escopo   | Caminho |
|----------|---------|
| **Projeto** (este repo) | `.cursor/mcp.json` |
| **Global** (todas as pastas) | `~/.cursor/mcp.json` (Windows: `C:\Users\<seu_usuario>\.cursor\mcp.json`) |

## Configuração do Supabase MCP neste projeto

O arquivo **`.cursor/mcp.json`** foi criado na raiz do projeto com:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=cnfadyhxczrldavmlobh"
    }
  }
}
```

- **project_ref**: `cnfadyhxczrldavmlobh` (seu projeto Supabase).

## Como ativar / verificar

1. **Reinicie o Cursor** depois de criar ou alterar `.cursor/mcp.json`.
2. Abra **Cursor Settings** → **Features** → **MCP** (ou **Installed MCP Servers**).
3. Confira se o servidor **supabase** aparece e está **ativado** (toggle verde).

## Se o MCP não aparecer

- Confirme que o arquivo está em `.cursor/mcp.json` na raiz do projeto (mesmo nível que `README.md`).
- Use o projeto que você abriu no Cursor (File → Open Folder) como raiz.
- Tente a configuração **global**: crie ou edite `C:\Users\<seu_usuario>\.cursor\mcp.json` com o mesmo conteúdo e reinicie o Cursor.

## Ferramentas do MCP Supabase (quando conectado)

- `list_tables` – listar tabelas
- `execute_sql` – executar SQL
- `get_project_url` – URL do projeto
- `get_publishable_keys` – chaves públicas
- `apply_migration` – aplicar migrações
- Entre outras listadas no painel do Cursor.
