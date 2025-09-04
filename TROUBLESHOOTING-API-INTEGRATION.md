# 🔧 Guia de Solução de Problemas - Integração com API

## Problema: "Erro ao carregar dados. Verifique se o servidor está rodando"

Este erro geralmente ocorre quando o frontend não consegue se comunicar com o backend. Aqui estão as causas e soluções:

## 🚨 Causas Comuns e Soluções

### 1. ❌ Content Security Policy (CSP) Bloqueando Requisições
**Sintoma:** No console do navegador você vê:
```
Refused to connect to 'http://localhost:8888/...' because it violates the following Content Security Policy directive
```

**Solução:** Ajustar a CSP no arquivo `src/pages/_document.tsx`:

```tsx
// ❌ ANTES - CSP muito restritiva
<meta httpEquiv="Content-Security-Policy" 
  content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" />

// ✅ DEPOIS - Permite conexões com localhost
<meta httpEquiv="Content-Security-Policy" 
  content="default-src 'self' http://localhost:* ws://localhost:*; 
          script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
          style-src 'self' 'unsafe-inline'; 
          connect-src 'self' http://localhost:* ws://localhost:*; 
          font-src 'self' data:;" />
```

### 2. ❌ CORS não Configurado no Backend
**Sintoma:** Erro de CORS no console do navegador

**Solução:** Adicionar middleware CORS no FastAPI (`claude_cto/server/main.py`):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5508", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. ❌ Mapeamento Incorreto dos Dados da API
**Sintoma:** Dados chegam mas aparecem como undefined ou null

**Solução:** Verificar e ajustar o mapeamento em `src/services/mcp-api.ts`:

```typescript
// Exemplo: A API retorna campos diferentes do esperado
// Verificar estrutura real com curl:
// curl http://localhost:8888/api/v1/tasks

// Ajustar mapeamento:
return response.map((task: any) => ({
  id: String(task.id),
  identifier: task.identifier || `task_${task.id}`, // Fallback se campo não existir
  status: task.status,
  created_at: task.created_at || new Date().toISOString(),
  // ... mapear outros campos com fallbacks
}));
```

### 4. ❌ Servidor API não Está Rodando
**Sintoma:** Connection refused

**Solução:** Verificar e iniciar o servidor:

```bash
# Verificar se está rodando
lsof -i :8888

# Iniciar servidor API
cd /home/suthub/.claude/claude-cto
uvicorn claude_cto.server.main:app --host 0.0.0.0 --port 8888 --reload
```

### 5. ❌ Servidor Next.js não Está Rodando
**Sintoma:** Página não carrega

**Solução:**
```bash
# Verificar se está rodando
lsof -i :5508

# Iniciar servidor Next.js
cd master_dashboard-5508
npm run dev
```

## 🔍 Como Debugar Problemas de Integração

### 1. Teste Direto da API
Crie um arquivo HTML de teste para verificar se a API responde:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test API</title>
</head>
<body>
    <h1>Teste de API</h1>
    <div id="result">Carregando...</div>
    
    <script>
        async function testApi() {
            try {
                const response = await fetch('http://localhost:8888/api/v1/tasks');
                const data = await response.json();
                document.getElementById('result').innerHTML = `
                    <h2>✅ Sucesso! ${data.length} tasks encontradas</h2>
                    <pre>${JSON.stringify(data.slice(0, 2), null, 2)}</pre>
                `;
            } catch (error) {
                document.getElementById('result').innerHTML = `
                    <h2>❌ Erro: ${error.message}</h2>
                `;
            }
        }
        testApi();
    </script>
</body>
</html>
```

### 2. Verificar Logs do Console
Abra o DevTools (F12) e verifique:
- **Aba Console**: Erros de JavaScript e CSP
- **Aba Network**: Status das requisições HTTP
- **Aba Console > Filtro "Failed"**: Apenas erros

### 3. Testar Endpoints com curl
```bash
# Testar se API responde
curl -v http://localhost:8888/api/v1/tasks

# Verificar headers CORS
curl -I http://localhost:8888/api/v1/tasks

# Testar com origin header (simula browser)
curl -H "Origin: http://localhost:5508" \
     -I http://localhost:8888/api/v1/tasks
```

## ✅ Checklist de Verificação

- [ ] Servidor API rodando na porta 8888
- [ ] Servidor Next.js rodando na porta 5508
- [ ] CORS configurado no backend permitindo localhost:5508
- [ ] CSP no frontend permite conexões com localhost:8888
- [ ] Endpoints da API retornando dados no formato esperado
- [ ] Mapeamento de dados no frontend compatível com resposta da API
- [ ] Sem erros de tipo TypeScript no console
- [ ] Network tab mostra requisições com status 200

## 📝 Resumo da Solução Aplicada

No nosso caso, o problema era a **Content Security Policy (CSP)** muito restritiva que estava bloqueando todas as requisições para `localhost:8888`. 

**O que fizemos:**
1. **Identificamos o problema** através dos erros no console: `Refused to connect... violates Content Security Policy`
2. **Localizamos a CSP** em `src/pages/_document.tsx`
3. **Ajustamos a política** para permitir:
   - `connect-src 'self' http://localhost:* ws://localhost:*` - Permite requisições HTTP/WS
   - `default-src 'self' http://localhost:*` - Permite recursos de localhost
4. **Recarregamos a página** e tudo funcionou!

## 🎯 Dica Pro

Sempre que criar uma aplicação com frontend e backend separados:

1. **Configure CORS primeiro** no backend
2. **Ajuste CSP** no frontend para permitir conexões necessárias
3. **Teste com curl** antes de testar no browser
4. **Use ferramentas de debug** (Console, Network tab)
5. **Crie páginas de teste** simples para isolar problemas

## 🔗 Links Úteis

- [MDN - Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [FastAPI - CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [Next.js - Custom Document](https://nextjs.org/docs/pages/building-your-application/routing/custom-document)