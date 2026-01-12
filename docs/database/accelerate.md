# Configurar Prisma Accelerate

## Passo a Passo

### 1. Criar Conta no Prisma Cloud

1. Acesse: https://cloud.prisma.io
2. Crie uma conta (plano gratuito disponível)
3. Faça login

### 2. Criar Projeto no Prisma Cloud

1. Clique em "Create Project"
2. Dê um nome ao projeto (ex: "relatorios-app")
3. Escolha o plano (Free tier é suficiente para desenvolvimento)

### 3. Obter Connection String do Accelerate

1. No projeto criado, vá em "Settings"
2. Copie a **Accelerate Connection String**
3. Formato: `prisma://accelerate.prisma-data.net/?api_key=SEU_API_KEY`

### 4. Configurar .env.local

**IMPORTANTE**: Substitua a `DATABASE_URL` pela connection string do Accelerate:

```env
# Prisma Accelerate (substitui DATABASE_URL)
# O Accelerate gerencia a conexão com Supabase internamente
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=SEU_API_KEY"

# Connection direta para migrations (opcional, mas recomendado)
# Use a connection string direta do Supabase (porta 5432)
DIRECT_URL="postgresql://usuario:senha@host:5432/banco?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"
```

**Nota**: Se você configurar `DIRECT_URL`, o Prisma usará automaticamente para migrations (`prisma migrate`, `prisma db push`).

### 5. Reiniciar Servidor de Desenvolvimento

```bash
npm run dev
```

## Verificação

Se tudo estiver configurado corretamente, você verá no console:

```
✓ Prisma Accelerate ativado
```

## Limites do Plano Gratuito

- ✅ 1 milhão de queries/mês
- ✅ Cache de queries
- ✅ Connection pooling otimizado
- ✅ Suporte para desenvolvimento

**Suficiente para desenvolvimento e pequenas aplicações em produção.**

## Troubleshooting

### Erro: "PRISMA_ACCELERATE_URL não definida"

- Verifique se adicionou `PRISMA_ACCELERATE_URL` no `.env.local`
- Reinicie o servidor após adicionar a variável

### Erro: "Invalid API key"

- Verifique se copiou a connection string completa do Prisma Cloud
- Certifique-se de que o projeto está ativo no Prisma Cloud

### Ainda vê aviso sobre PgBouncer

- Isso é normal se `PRISMA_ACCELERATE_URL` não estiver configurada
- Configure o Accelerate para resolver

## Documentação Oficial

- https://www.prisma.io/data-platform/accelerate
- https://www.prisma.io/docs/accelerate/getting-started
