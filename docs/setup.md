# Guia de Configuração Rápida

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Database (Supabase)
DATABASE_URL="postgresql://user:password@localhost:5432/relatorios_db?schema=public"

# Prisma Accelerate (Obrigatório para Supabase PgBouncer)
# Obtenha em: https://cloud.prisma.io
PRISMA_ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=SEU_API_KEY"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"
```

**Gerar NEXTAUTH_SECRET:**
```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32
```

### 3. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar tabelas no banco
npm run db:push
```

### 4. Executar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📝 Primeiros Passos

1. **Criar uma conta**
   - Acesse http://localhost:3000/register
   - Preencha os dados e cadastre-se

2. **Fazer login**
   - Acesse http://localhost:3000/login
   - Entre com suas credenciais

3. **Criar seu primeiro relatório**
   - Clique em "+ Novo Relatório"
   - Preencha os dados
   - Adicione itens e fotos
   - Finalize o relatório

4. **Gerar PDF**
   - Visualize o relatório
   - Clique em "Gerar PDF"
   - O PDF será baixado automaticamente

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar produção
npm run start

# Prisma Studio (interface visual do banco)
npm run db:studio

# Criar migration
npm run db:migrate
```

## 🐛 Solução de Problemas

### Erro: "Prisma Client not generated"
```bash
npm run db:generate
```

### Erro: "Database connection failed"
- Verifique se o PostgreSQL está rodando
- Verifique a `DATABASE_URL` no `.env.local`
- Teste a conexão manualmente

### Erro: "NEXTAUTH_SECRET is not set"
- Certifique-se de ter criado o `.env.local`
- Gere um novo secret e adicione ao arquivo

### Erro: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentação Adicional

- [README.md](../README.md) - Documentação completa
- [deployment.md](./deployment.md) - Guia de deploy
- [architecture.md](./architecture.md) - Arquitetura do sistema
- [database-modeling.md](./database-modeling.md) - Modelo de dados
- [screen-flow.md](./screen-flow.md) - Fluxo de telas

## ✅ Checklist de Configuração

- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env.local` criado
- [ ] `NEXTAUTH_SECRET` configurado
- [ ] Banco de dados configurado
- [ ] Prisma Client gerado (`npm run db:generate`)
- [ ] Tabelas criadas (`npm run db:push`)
- [ ] Servidor rodando (`npm run dev`)
- [ ] Conta criada e login funcionando

## 🎉 Pronto!

Agora você pode começar a usar o sistema de relatórios!
