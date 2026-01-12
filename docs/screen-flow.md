# Fluxo de Telas - Sistema de Relatórios

## Mapa de Navegação

```
┌─────────────────────────────────────────────────────────┐
│                    PÁGINA INICIAL                        │
│              (/) - Redireciona para /login               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    LOGIN (/login)                        │
│  - Email                                                │
│  - Senha                                                │
│  - Botão "Entrar"                                       │
│  - Link "Não tem conta? Cadastre-se"                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              CADASTRO (/register)                        │
│  - Nome (opcional)                                      │
│  - Email                                                │
│  - Senha                                                │
│  - Confirmar Senha                                      │
│  - Botão "Cadastrar"                                    │
│  - Link "Já tem conta? Faça login"                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│            DASHBOARD (/relatorios)                       │
│  ┌──────────────────────────────────────────────┐      │
│  │  SIDEBAR                                      │      │
│  │  - Logo                                       │      │
│  │  - Menu: Relatórios                          │      │
│  │  - Usuário: [Nome]                           │      │
│  │  - Botão Sair                                │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  CONTEÚDO PRINCIPAL                           │      │
│  │  - Título: "Meus Relatórios"                  │      │
│  │  - Botão: "+ Novo Relatório"                  │      │
│  │                                               │      │
│  │  ┌────────────────────────────────────┐      │      │
│  │  │  LISTA DE RELATÓRIOS               │      │      │
│  │  │  [Card] Título | Data | Status     │      │      │
│  │  │  [Card] Título | Data | Status     │      │      │
│  │  │  [Card] Título | Data | Status     │      │      │
│  │  └────────────────────────────────────┘      │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│        NOVO RELATÓRIO (/relatorios/novo)                │
│  ┌──────────────────────────────────────────────┐      │
│  │  FORMULÁRIO                                  │      │
│  │  - Título *                                  │      │
│  │  - Descrição (textarea)                      │      │
│  │  - Data *                                    │      │
│  │  - Status (select)                           │      │
│  │                                               │      │
│  │  ITENS DO RELATÓRIO                          │      │
│  │  [+ Adicionar Item]                          │      │
│  │  - Item 1 [checkbox] [remover]               │      │
│  │  - Item 2 [checkbox] [remover]               │      │
│  │                                               │      │
│  │  FOTOS                                       │      │
│  │  [Upload de múltiplas fotos]                 │      │
│  │  [Preview das fotos]                         │      │
│  │                                               │      │
│  │  [Cancelar] [Salvar Rascunho] [Finalizar]   │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      VISUALIZAR RELATÓRIO (/relatorios/[id])            │
│  ┌──────────────────────────────────────────────┐      │
│  │  HEADER                                       │      │
│  │  - Título                                     │      │
│  │  - Data                                       │      │
│  │  - Status (badge)                            │      │
│  │  [Editar] [Gerar PDF] [Excluir]              │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  CONTEÚDO                                     │      │
│  │  Descrição: [texto]                           │      │
│  │                                               │      │
│  │  Itens:                                       │      │
│  │  ✓ Item 1                                     │      │
│  │  ☐ Item 2                                     │      │
│  │                                               │      │
│  │  Fotos:                                       │      │
│  │  [Grid de fotos]                              │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Detalhamento das Telas

### 1. Login (`/login`)
**Componentes:**
- `LoginForm` - Formulário de login
- Inputs: email, senha
- Validação em tempo real
- Mensagens de erro

**Ações:**
- Submete para `/api/auth/signin`
- Redireciona para `/relatorios` em sucesso
- Mostra erro em caso de falha

---

### 2. Cadastro (`/register`)
**Componentes:**
- `RegisterForm` - Formulário de cadastro
- Inputs: nome (opcional), email, senha, confirmar senha
- Validação de senhas iguais

**Ações:**
- Submete para `/api/auth/signup` (custom)
- Redireciona para login após sucesso

---

### 3. Dashboard - Lista de Relatórios (`/relatorios`)
**Componentes:**
- `Sidebar` - Navegação lateral
- `RelatorioList` - Lista de cards
- `RelatorioCard` - Card individual

**Funcionalidades:**
- Lista todos os relatórios do usuário
- Ordenação por data (mais recente primeiro)
- Filtro por status (opcional)
- Busca por título (opcional)
- Paginação (opcional)

**Ações:**
- Clicar no card → Abre visualização
- Botão "+ Novo Relatório" → `/relatorios/novo`

---

### 4. Criar/Editar Relatório (`/relatorios/novo` ou `/relatorios/[id]/editar`)
**Componentes:**
- `RelatorioForm` - Formulário principal
- `ItemList` - Lista de itens editável
- `PhotoUpload` - Upload e preview de fotos

**Campos:**
- Título (obrigatório)
- Descrição (opcional, textarea)
- Data (date picker)
- Status (select: Rascunho/Finalizado)

**Itens:**
- Adicionar/remover itens dinamicamente
- Checkbox para marcar como concluído
- Ordem arrastável (opcional)

**Fotos:**
- Upload múltiplo (drag & drop ou botão)
- Preview antes de salvar
- Remover fotos antes de salvar
- Limite de tamanho (ex: 5MB por foto)

**Ações:**
- Cancelar → Volta para lista
- Salvar Rascunho → Status = RASCUNHO
- Finalizar → Status = FINALIZADO

---

### 5. Visualizar Relatório (`/relatorios/[id]`)
**Componentes:**
- `RelatorioView` - Visualização completa
- `PhotoGallery` - Grid de fotos

**Exibição:**
- Título, data, status (badge colorido)
- Descrição formatada
- Lista de itens com checkboxes (readonly)
- Galeria de fotos (lightbox ao clicar)

**Ações:**
- Editar → `/relatorios/[id]/editar`
- Gerar PDF → Download automático
- Excluir → Confirmação → Remove do banco

---

## Estados e Validações

### Estados do Formulário
- `loading` - Enviando dados
- `error` - Erro de validação ou API
- `success` - Dados salvos com sucesso

### Validações
- Email: formato válido
- Senha: mínimo 6 caracteres
- Título: obrigatório, mínimo 3 caracteres
- Data: não pode ser futura (opcional)
- Fotos: apenas imagens (jpg, png), máximo 5MB

## Responsividade

- Mobile: Sidebar vira menu hambúrguer
- Tablet: Layout adaptativo
- Desktop: Sidebar fixa, conteúdo expandido

## Feedback Visual

- Toasts para ações (salvar, excluir, etc)
- Loading states em botões
- Skeleton loaders durante carregamento
- Mensagens de erro claras
