# Dashboard Claude CTO 🚀

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)

Dashboard web moderno para monitoramento e gerenciamento do Claude CTO em tempo real.

## 🚀 Features

### 📈 Dashboard em Tempo Real
- **Monitoramento ao vivo** de tarefas em execução
- **Status updates instantâneos** com auto-refresh
- **Visualização gráfica** de progresso e métricas
- **Interface responsiva** para desktop e mobile

### 🔍 Visualização Detalhada de Tarefas
- **Lista completa** de todas as tarefas
- **Filtros avançados** por status (running, completed, failed)
- **Detalhes expandidos** com informações completas
- **Ações rápidas** para deletar tarefas travadas

### 🐛 Debug Completo com Métricas
- **Performance monitoring** em tempo real
- **Uso de tokens** detalhado (input, output, cache)
- **Custos em USD e BRL** com cálculo por 1K tokens
- **Timestamps completos** de todas as operações
- **Session IDs** e identificadores únicos

### 📨 Histórico de Mensagens
- **Total de mensagens processadas** por tarefa
- **Tipo da última mensagem** (AssistantMessage, UserMessage, ResultMessage)
- **Conteúdo completo** sem truncamento
- **Detalhes expandíveis** para análise profunda

### 🚫 Gerenciamento de Tarefas Travadas
- **Detecção automática** de tarefas paradas há mais de 1 hora
- **Botão de exclusão individual** 🗑️ em cada tarefa travada
- **Excluir todas travadas** com um clique
- **Confirmação** antes de deletar

### 🔔 Notificações Web
- **Alertas em tempo real** para eventos importantes
- **Sistema de toast** não intrusivo
- **Notificações de browser** para status de tarefas
- **Configurações personalizáveis** de alerta

## 📊 Debug & Performance

### 🔍 Como Visualizar Métricas de Performance
Acesse qualquer tarefa em `/tasks/{id}` para ver:

#### 🔑 IDENTIFICADORES
- Task ID, Identifier, Session ID, Orchestration Group

#### ⏰ TIMESTAMPS
- Created, Started, Updated, Ended (formato completo)

#### 📊 MÉTRICAS DE PERFORMANCE
- Duração Total, Tempo API, Turnos, Exec Time, Tempo Real, Latência

#### 🎯 USO DE TOKENS
- Input Tokens, Output Tokens, Cache Created, Cache Read, Total

#### 💰 ANÁLISE DE CUSTOS
- Custo USD (6 casas decimais)
- Custo BRL (conversão automática)
- Custo por 1K tokens

### 📝 Como Acessar o Histórico de Mensagens
Na página de detalhes da tarefa, procure pela seção **📨 HISTÓRICO DE MENSAGENS**:

- **Total de Mensagens**: Quantas mensagens foram processadas
- **Status Final**: COMPLETED ou FAILED
- **Última Mensagem**: Tipo e conteúdo completo
- **Detalhes Expandíveis**: Clique para ver o conteúdo integral

### 💰 Como Ver Custos e Uso de Tokens
A seção **🎯 USO DE TOKENS** mostra:
- Tokens de entrada, saída e cache
- Total de tokens utilizados
- Custo em USD com precisão de 6 casas
- Conversão automática para BRL
- Custo médio por 1000 tokens

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Claude CTO API rodando na porta 8001

### Configuração

1. **Clone o repositório**:
```bash
git clone <repository-url>
cd dashboard-claude-cto
```

2. **Instale as dependências**:
```bash
npm install
# ou
yarn install
```

3. **Execute o servidor de desenvolvimento**:
```bash
npm run dev
# ou
yarn dev
```

4. **Acesse o dashboard**:
Abra [http://localhost:5508](http://localhost:5508) no seu navegador.

## 🚀 Uso

### Conectando ao Claude CTO
1. Certifique-se de que o Claude CTO API está rodando na porta 8001
2. O dashboard conectará automaticamente
3. Use o botão "Auto-refresh" para atualizações em tempo real

### Navegação Principal
- **Home** (`/`): Dashboard principal com estatísticas
- **Tasks List** (`/tasks/list`): Lista completa de tarefas
- **Task Details** (`/tasks/{id}`): Detalhes e debug de cada tarefa
- **Notifications** (`/notifications`): Configuração de notificações
- **Sitemap** (`/sitemap`): Mapa completo do site

### Funcionalidades Principais
- **Monitor em tempo real**: Veja tarefas sendo executadas ao vivo
- **Debug avançado**: Acesse informações completas de cada tarefa
- **Gestão de travadas**: Delete tarefas que travaram facilmente
- **Histórico completo**: Analise todas as mensagens processadas

## 🏗️ Tecnologias Utilizadas

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **Framer Motion**: Animações suaves
- **Lucide Icons**: Ícones modernos e consistentes
- **Axios**: Cliente HTTP para API calls

## 📱 Responsividade

O dashboard é totalmente responsivo:
- **Desktop**: Experiência completa com todos os recursos
- **Tablet**: Layout adaptado para telas médias
- **Mobile**: Interface otimizada para smartphones

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no repositório
- Entre em contato através do projeto principal Claude CTO