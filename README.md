# Sistema de Geração de Relatórios

Sistema web profissional para criação, gerenciamento e geração automática de PDFs de relatórios com fotos.

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Prisma ORM**
- **PostgreSQL** (Supabase)
- **NextAuth.js** (Autenticação)
- **PDFKit** (Geração de PDFs)
- **React Hook Form** + **Zod** (Formulários e validação)

## 📋 Funcionalidades

- ✅ Autenticação por email e senha
- ✅ Criação e edição de relatórios
- ✅ Upload de múltiplas fotos
- ✅ Itens do relatório (checklist)
- ✅ Geração automática de PDF profissional
- ✅ Histórico de relatórios
- ✅ Interface responsiva e moderna

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd relatorios-app
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/relatorios_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# Supabase (opcional - para storage de imagens)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Configure o Prisma

```bash
# Gerar o cliente Prisma
npm run db:generate

# Criar as tabelas no banco
npm run db:push

# Ou usar migrations
npm run db:migrate
```

### 5. Execute o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
relatorios-app/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rotas de autenticação
│   ├── (dashboard)/        # Rotas protegidas
│   └── api/                # API Routes
├── components/             # Componentes React
│   ├── ui/                 # Componentes base
│   ├── auth/               # Componentes de autenticação
│   ├── relatorios/         # Componentes de relatórios
│   └── layout/              # Layout e navegação
├── lib/                    # Utilitários
│   ├── prisma.ts           # Cliente Prisma
│   ├── auth.ts             # Config NextAuth
│   └── pdf/                # Geração de PDFs
├── prisma/                 # Schema Prisma
└── types/                  # Tipos TypeScript
```

## 🗄️ Modelo de Dados

- **User**: Usuários do sistema
- **Relatorio**: Relatórios criados
- **ItemRelatorio**: Itens/checklist do relatório
- **Foto**: Fotos anexadas aos relatórios

## 🔐 Autenticação

O sistema usa NextAuth.js com autenticação por credenciais (email/senha). As senhas são hasheadas com bcrypt.

## 📄 Geração de PDF

Os PDFs são gerados usando PDFKit e incluem:
- Logo (opcional)
- Dados do relatório
- Lista de itens
- Fotos (URLs listadas)
- Rodapé com data de geração

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Configure o banco de dados (Supabase recomendado)
4. Deploy automático

### Variáveis de Ambiente no Vercel

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL` (opcional)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (opcional)
- `SUPABASE_SERVICE_ROLE_KEY` (opcional)

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia o servidor de produção
- `npm run db:push` - Sincroniza schema com o banco
- `npm run db:studio` - Abre Prisma Studio
- `npm run db:generate` - Gera o cliente Prisma


## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Desenvolvimento

Sistema desenvolvido por João Pedro Chacon de Souza













