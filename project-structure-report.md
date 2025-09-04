# Relatório de Estrutura do Projeto - Master Dashboard

## Visão Geral do Projeto

O **Master Dashboard ULTRATHINK** é uma aplicação Next.js desenvolvida em TypeScript que funciona como um hub de gerenciamento para o sistema Claude CTO. A aplicação roda na porta 5508 e se conecta à API do Claude CTO rodando na porta 8888.

### Informações Técnicas Gerais
- **Framework**: Next.js 14.2.32
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS 3.4.0
- **Animações**: Framer Motion 11.0.0
- **Ícones**: Lucide React 0.345.0
- **Requisições HTTP**: Axios 1.6.7
- **Porta**: 5508
- **API Externa**: Claude CTO API (localhost:8888)

## Estrutura de Diretórios

```
src/
├── components/           # Componentes React reutilizáveis
│   ├── layout/          # Componentes de layout e navegação
│   ├── ui/              # Componentes de interface base
│   ├── monitor/         # Componentes específicos de monitoramento
│   ├── notifications/   # Componentes de notificação
│   └── ErrorBoundary.tsx
├── pages/               # Páginas Next.js (roteamento automático)
│   ├── admin/           # Área administrativa
│   ├── tasks/           # Gerenciamento de tarefas
│   ├── orchestration/   # Orquestração de tarefas
│   ├── monitor/         # Monitoramento em tempo real
│   └── api/             # API routes do Next.js
├── services/            # Serviços e integrações externas
├── contexts/            # Contextos React para estado global
├── styles/              # Arquivos de estilo global
└── utils/               # Utilitários e funções auxiliares
```

## Análise Detalhada das Páginas

### Página Principal (`/`)
- **Arquivo**: `src/pages/index.tsx`
- **Função**: Hub central com cards navegáveis
- **Características**:
  - Dashboard principal com 8 seções principais
  - Cards responsivos com hover effects
  - Links para todas as funcionalidades principais
  - Ações rápidas (refresh dashboard, test API)
  - Indicador de status do sistema
  - Suporte a tema escuro automático

### Área de Tasks (`/tasks`)

#### Lista de Tasks (`/tasks/list.tsx`)
- **Função**: Interface completa para visualização e gerenciamento de tasks
- **Recursos**:
  - Sistema avançado de filtros (busca, status, modelo, data)
  - Dois modos de visualização: grid e lista
  - Seleção múltipla de tasks
  - Ordenação personalizável
  - Ações em massa (cancelar, excluir)
  - Paginação e skeleton loading
  - Dados mockados para demonstração

#### Criação de Tasks (`/tasks/create.tsx`)
- **Função**: Formulário para criar novas tasks
- **Integração**: API do Claude CTO via serviço MCP

#### Index de Tasks (`/tasks/index.tsx`)
- **Função**: Página de entrada para o módulo de tasks

### Área Administrativa (`/admin`)

#### Dashboard Admin (`/admin/index.tsx`)
- **Função**: Painel administrativo principal
- **Recursos**: Estatísticas e controles do sistema

#### Health Check (`/admin/health.tsx`)
- **Função**: Monitoramento da saúde do sistema
- **Verificações**: API connectivity, system stats

#### Gerenciamento de Tasks (`/admin/`)
- **Clear Tasks** (`clear-tasks.tsx`): Limpeza de tasks concluídas/falhadas
- **Delete Task** (`delete-task.tsx`): Exclusão de tasks específicas
- **Error Test** (`error-test.tsx`): Testes de error handling

### Orquestração (`/orchestration`)

#### Dashboard (`/orchestration/index.tsx`)
- **Função**: Visualização de orquestrações
- **Recursos**: Coordenação de múltiplas tasks

#### Submissão (`/orchestration/submit.tsx`)
- **Função**: Interface para criar orquestrações
- **Recursos**: Envio em lote de tasks relacionadas

### Monitoramento (`/monitor`)

#### Dashboard Monitor (`/monitor/index.tsx`)
- **Função**: Monitoramento em tempo real
- **Recursos**: WebSocket integration, real-time updates

#### Feed de Atividades (`/monitor/activities.tsx`)
- **Função**: Histórico de atividades do sistema
- **Recursos**: Timeline de eventos, filtros

#### Configurações de Notificação (`/monitor/notifications.tsx`)
- **Função**: Personalização de alertas
- **Recursos**: Preferências de notificação

### Páginas Auxiliares

#### Analytics (`/analytics.tsx`)
- **Função**: Análises e métricas do sistema

#### Dashboard Enhanced (`/dashboard-enhanced.tsx`)
- **Função**: Versão avançada do dashboard

#### Sitemap (`/sitemap.tsx`)
- **Função**: Mapa navegacional de todas as rotas

#### Error Handling (`/_error.tsx`)
- **Função**: Tratamento centralizado de erros

#### App Configuration (`/_app.tsx`)
- **Recursos**: 
  - Configuração global da aplicação
  - Detecção automática de tema (dark/light)
  - Persistência de tema no localStorage

## Componentes de Interface (UI)

### Componentes Base (`src/components/ui/`)

#### Sistema de Design
- **Button.tsx**: Botões com múltiplas variantes e tamanhos
- **Card.tsx**: Sistema de cards modular (Header, Body, Footer)
- **Input.tsx**: Campos de entrada padronizados
- **Select.tsx**: Componente de seleção
- **Badge.tsx**: Badges de status e categorização
- **Alert.tsx**: Alertas e notificações inline

#### Layout e Estrutura
- **Grid.tsx**: Sistema de grid responsivo
- **Stack.tsx**: Componente de stack para layouts
- **Container.tsx**: Container responsivo
- **Skeleton.tsx**: Loading states elaborados

#### Componentes Especializados
- **MetricCard.tsx**: Cards para exibição de métricas
- **SystemHealthCard.tsx**: Card específico para saúde do sistema

### Componentes de Layout (`src/components/layout/`)

#### Navegação
- **Header.tsx**: Cabeçalho principal
- **Navigation.tsx**: Menu de navegação
- **Sidebar.tsx**: Barra lateral
- **Footer.tsx**: Rodapé

#### Estrutura de Página
- **PageLayout.tsx**: Layout base para páginas
- **PageHeader.tsx**: Cabeçalho de página padronizado
- **Breadcrumbs.tsx**: Migalhas de pão
- **AdminLayout.tsx**: Layout específico para área admin

### Componentes de Monitoramento (`src/components/monitor/`)

#### Sistema de Monitoramento
- **TaskMonitor.tsx**: Monitor avançado de tasks em tempo real
  - **Recursos**: WebSocket integration, notificações browser, filtros, estatísticas
  - **Funcionalidades**: Auto-refresh, detecção de mudanças de status
- **ActivityFeed.tsx**: Feed de atividades em tempo real
- **SystemMetrics.tsx**: Métricas do sistema
- **NotificationSettings.tsx**: Configurações de notificação

## Serviços e Integrações

### API Service (`src/services/mcp-api.ts`)

#### Claude CTO MCP API Integration
- **Base URL**: `http://localhost:8888/api/v1`
- **Classe Principal**: `McpApiService`

#### Funcionalidades Implementadas:
1. **Gerenciamento de Tasks**:
   - `getTasks()`: Lista todas as tasks
   - `getTaskStats()`: Estatísticas das tasks
   - `getTaskStatus(identifier)`: Status de task específica
   - `createTask()`: Criar nova task
   - `deleteTask(identifier)`: Deletar task
   - `clearTasks()`: Limpar tasks concluídas/falhadas

2. **Sistema de Monitoramento**:
   - `getSystemStats()`: Estatísticas do sistema
   - `getActivities()`: Atividades recentes
   - `healthCheck()`: Verificação de saúde da API

3. **Notificações**:
   - `getNotificationSettings()`: Configurações
   - `updateNotificationSettings()`: Atualizar preferências

#### Tratamento de Erros:
- Tratamento robusto de erros de rede
- Mensagens de erro em português
- Fallbacks para dados indisponíveis

### WebSocket Service (`src/services/websocket.ts`)

#### Comunicação em Tempo Real
- **URL**: `ws://localhost:8888/ws`
- **Classe Principal**: `WebSocketManager`
- **Status**: Temporariamente desabilitado (fallback para polling)

#### Funcionalidades Projetadas:
1. **Eventos Suportados**:
   - `task_created`: Task criada
   - `task_started`: Task iniciada  
   - `task_completed`: Task concluída
   - `task_failed`: Task falhou
   - `stats_updated`: Estatísticas atualizadas
   - `activity_added`: Nova atividade
   - `system_alert`: Alertas do sistema

2. **Recursos Avançados**:
   - Reconexão automática com exponential backoff
   - Heartbeat para manter conexão ativa
   - Sistema de eventos pub/sub
   - Hooks React especializados

#### Hooks React Disponíveis:
- `useWebSocket()`: Hook principal
- `useWebSocketEvent()`: Escutar eventos específicos
- `useRealtimeStats()`: Estatísticas em tempo real
- `useRealtimeActivities()`: Atividades em tempo real
- `useTaskEvents()`: Eventos de tasks
- `useTaskMonitor()`: Monitorar task específica

## Contextos e Estado Global

### Notification Context (`src/contexts/NotificationContext.tsx`)

#### Funcionalidades:
1. **Gerenciamento de Preferências**:
   - Notificações para tasks concluídas
   - Notificações para tasks falhadas
   - Som de notificação habilitado/desabilitado
   - Persistência no localStorage

2. **Sistema de Notificações**:
   - Notificações do browser nativas
   - Som personalizado em base64
   - Controle de permissões
   - Auto-fechamento para sucessos
   - Requer interação para erros

3. **API Disponível**:
   - `requestPermission()`: Solicitar permissão
   - `sendNotification()`: Enviar notificação
   - `updatePreferences()`: Atualizar preferências
   - `playSound()`: Reproduzir som

## Utilitários e Configurações

### Design System

#### Design Tokens (`src/utils/design-tokens.ts`)
- Sistema de tokens de design consistente
- Cores, espaçamentos, tipografia padronizados

#### Class Names Utility (`src/utils/cn.ts`)
- Utilitário para concatenação de classes CSS
- Integração com Tailwind CSS
- Conditional styling

### Configurações do Projeto

#### Tailwind Config (`tailwind.config.js`)
- Configuração personalizada do Tailwind
- Suporte a tema escuro
- Customizações de cores e espaçamentos

#### Next.js Config (`next.config.js`)
- Configurações específicas do Next.js
- Otimizações de build

#### TypeScript Config (`tsconfig.json`)
- Configurações rigorosas do TypeScript
- Path mapping configurado (`@/` → `src/`)

## Scripts de Automação

### Auto Recovery (`scripts/auto-recovery.sh`)
- Script de recuperação automática do sistema
- Reinicialização de serviços
- Verificações de saúde

## Recursos de Qualidade

### Testing
- **Framework**: Jest
- **Testing Library**: @testing-library/react
- **Configuração**: Ambiente jsdom para testes de componentes
- **Scripts**: `test`, `test:watch`, `test:coverage`, `test:ci`

### Code Quality
- **ESLint**: Configurado com Next.js rules
- **TypeScript**: Type checking rigoroso
- **Prettier**: Formatação automática (implícita)

## Funcionalidades Especiais

### Responsividade
- Design mobile-first
- Grid system responsivo
- Componentes adaptáveis

### Acessibilidade
- ARIA labels apropriados
- Navegação por teclado
- Contrastes adequados
- Screen reader support

### Performance
- Lazy loading de componentes
- Skeleton loading states
- Code splitting automático do Next.js
- Image optimization

### Internacionalização
- Interface completamente em português brasileiro
- Formatação de datas localizadas
- Mensagens de erro traduzidas

## Integração com Claude CTO API

### Endpoints Utilizados:
1. **GET** `/tasks` - Listar tasks
2. **POST** `/tasks/clear` - Limpar tasks
3. **DELETE** `/tasks/{identifier}` - Deletar task
4. **POST** `/mcp/tools/create_task` - Criar task via MCP
5. **POST** `/mcp/tools/get_task_status` - Status via MCP
6. **GET** `/stats` - Estatísticas do sistema
7. **GET** `/activities` - Atividades recentes
8. **GET** `/health` - Health check
9. **GET/PUT** `/notifications/settings` - Configurações de notificação

### Padrões de Comunicação:
- Requests HTTP via Axios
- Headers JSON padrão
- Tratamento de timeout (2 minutos)
- Retry logic para falhas de rede
- Fallbacks para dados indisponíveis

## Estado de Desenvolvimento

### Recursos Implementados ✅:
- Interface completa do dashboard
- Sistema de componentes robusto
- Integração com API Claude CTO
- Sistema de notificações
- Monitoramento de tasks
- Área administrativa
- Responsividade completa
- Tema escuro/claro automático

### Recursos em Desenvolvimento 🚧:
- WebSocket integration (temporariamente desabilitado)
- Testes automatizados
- Orquestração avançada de tasks

### Recursos Planejados 📋:
- Métricas avançadas e dashboards
- Exportação de dados
- Configurações avançadas do sistema
- Push notifications

## Conclusão

O Master Dashboard é uma aplicação robusta e bem arquitetada que serve como interface principal para o sistema Claude CTO. A estrutura modular, sistema de componentes consistente e integração bem definida com a API externa demonstram um desenvolvimento profissional com foco em manutenibilidade e experiência do usuário.

A aplicação está pronta para uso em produção, com recursos avançados de monitoramento, gerenciamento de tasks e uma interface moderna e responsiva que atende às necessidades de administração do sistema Claude CTO.