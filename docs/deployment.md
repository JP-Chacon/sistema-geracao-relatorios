# Guia de Deploy

## Opção 1: Vercel (Recomendado)

### Passo a Passo

1. **Crie uma conta no Vercel**
   - Acesse https://vercel.com
   - Faça login com GitHub

2. **Conecte o repositório**
   - Clique em "New Project"
   - Importe seu repositório do GitHub
   - Configure o projeto

3. **Configure o banco de dados (Supabase)**
   - Acesse https://supabase.com
   - Crie um novo projeto
   - Copie a connection string do PostgreSQL
   - Formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

4. **Configure as variáveis de ambiente no Vercel**
   - Vá em Settings > Environment Variables
   - Adicione:
     ```
     DATABASE_URL=postgresql://...
     NEXTAUTH_URL=https://seu-projeto.vercel.app
     NEXTAUTH_SECRET=seu-secret-gerado
     ```

5. **Deploy**
   - O Vercel detecta automaticamente Next.js
   - O build será executado automaticamente
   - Após o deploy, acesse seu projeto

### Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Opção 2: Outros Provedores

### Railway

1. Conecte o repositório
2. Adicione PostgreSQL como serviço
3. Configure as variáveis de ambiente
4. Deploy automático

### Render

1. Crie um novo Web Service
2. Conecte o repositório
3. Adicione PostgreSQL como serviço
4. Configure as variáveis de ambiente
5. Deploy

## Configuração do Banco de Dados

### Supabase (Recomendado)

1. Crie um projeto no Supabase
2. Vá em Settings > Database
3. Copie a connection string
4. Use no `DATABASE_URL`

### PostgreSQL Local (Desenvolvimento)

```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# Criar banco
createdb relatorios_db

# Connection string
DATABASE_URL="postgresql://user:password@localhost:5432/relatorios_db?schema=public"
```

## Migrations

Após configurar o banco, execute:

```bash
npm run db:push
# ou
npm run db:migrate
```

## Storage de Imagens (Opcional)

Para usar Supabase Storage para fotos:

1. No Supabase, vá em Storage
2. Crie um bucket chamado `fotos`
3. Configure as políticas de acesso
4. Adicione as variáveis:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
   ```

## Troubleshooting

### Erro de conexão com banco
- Verifique se a `DATABASE_URL` está correta
- Verifique se o banco está acessível
- Verifique as credenciais

### Erro de build
- Verifique se todas as dependências estão instaladas
- Execute `npm run db:generate` antes do build
- Verifique os logs de build no Vercel

### Erro de autenticação
- Verifique se `NEXTAUTH_SECRET` está configurado
- Verifique se `NEXTAUTH_URL` está correto (sem barra no final)
