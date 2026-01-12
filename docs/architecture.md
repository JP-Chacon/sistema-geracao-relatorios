# Arquitetura do Sistema - Geração de Relatórios

## Visão Geral
Sistema web full-stack para criação, gerenciamento e geração de PDFs de relatórios com fotos.

## Stack Tecnológica

### Frontend
- **Next.js 14** (App Router) - Framework React com SSR/SSG
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização utilitária
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **Prisma ORM** - Gerenciamento de banco de dados
- **PostgreSQL** (Supabase) - Banco de dados relacional
- **NextAuth.js** - Autenticação (email/senha)
- **PDFKit ou jsPDF** - Geração de PDFs
- **Sharp** - Processamento de imagens

### Infraestrutura
- **Supabase** - PostgreSQL + Storage para imagens
- **Vercel** - Deploy (recomendado)

## Estrutura de Pastas

```
relatorios-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/              # Grupo de rotas protegidas
│   │   ├── layout.tsx            # Layout com sidebar/navbar
│   │   ├── relatorios/
│   │   │   ├── page.tsx          # Lista de relatórios
│   │   │   ├── novo/
│   │   │   │   └── page.tsx      # Criar novo relatório
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Visualizar relatório
│   │   │       └── pdf/
│   │   │           └── route.ts  # API route para gerar PDF
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── relatorios/
│   │       │   ├── route.ts      # GET, POST
│   │       │   └── [id]/
│   │       │       ├── route.ts  # GET, PUT, DELETE
│   │       │       └── fotos/
│   │       │           └── route.ts  # Upload de fotos
│   ├── api/
│   │   └── upload/
│   │       └── route.ts           # Upload de imagens
│   ├── layout.tsx                 # Layout raiz
│   └── page.tsx                   # Home/Redirect
│
├── components/                    # Componentes React
│   ├── ui/                        # Componentes base (botões, inputs, etc)
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── relatorios/
│   │   ├── RelatorioForm.tsx
│   │   ├── RelatorioList.tsx
│   │   ├── RelatorioView.tsx
│   │   ├── ItemList.tsx
│   │   └── PhotoUpload.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Navbar.tsx
│
├── lib/                           # Utilitários e configurações
│   ├── prisma.ts                  # Cliente Prisma
│   ├── auth.ts                    # Config NextAuth
│   ├── pdf/
│   │   └── generator.ts          # Função de geração de PDF
│   └── utils.ts                   # Funções auxiliares
│
├── prisma/
│   ├── schema.prisma              # Schema do banco
│   └── seed.ts                    # Seed (opcional)
│
├── public/
│   └── logo.png                   # Logo para PDFs
│
├── types/                         # Tipos TypeScript
│   └── index.ts
│
├── .env.local                     # Variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Fluxo de Dados

### Autenticação
1. Usuário faz login → NextAuth valida → Cria sessão
2. Rotas protegidas verificam sessão via middleware
3. Dados do usuário disponíveis via `useSession()`

### Criação de Relatório
1. Usuário preenche formulário
2. Upload de fotos → API route salva no Supabase Storage
3. POST /api/relatorios → Prisma cria registro
4. Relaciona fotos com relatório
5. Redireciona para visualização

### Geração de PDF
1. Usuário clica "Gerar PDF"
2. GET /api/relatorios/[id]/pdf
3. Backend busca relatório + fotos
4. PDFKit/jsPDF monta documento
5. Retorna PDF como download

## Segurança

- Middleware protege rotas `/dashboard/*`
- Validação de dados com Zod
- Sanitização de uploads
- Verificação de propriedade (usuário só vê seus relatórios)
- Rate limiting (opcional)

## Performance

- Server Components quando possível
- Client Components apenas para interatividade
- Otimização de imagens com Next.js Image
- Lazy loading de componentes pesados
