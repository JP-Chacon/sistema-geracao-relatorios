# Prisma + Supabase Session Pooler - Documentação Técnica

## Solução Implementada

O código em `lib/db/client.ts` adiciona automaticamente `?pgbouncer=true` à connection string quando detecta uso do Supabase Session Pooler.

## Como Funciona

1. **Detecção automática**: Identifica pooler pela porta `:6543` ou hostname `pooler.supabase.com`
2. **Adição do parâmetro**: Adiciona `?pgbouncer=true` (ou `&pgbouncer=true` se já houver parâmetros)
3. **Desabilitação de prepared statements**: O Prisma detecta `pgbouncer=true` e desabilita prepared statements automaticamente

## Limitações Técnicas Conhecidas

### ⚠️ Limitação do PgBouncer Session Mode

O **Supabase Session Pooler (PgBouncer em modo session)** tem limitações inerentes:

- ❌ Não suporta prepared statements (resolvido com `?pgbouncer=true`)
- ❌ Não suporta transações nomeadas
- ❌ Limitações com algumas operações DDL
- ⚠️ Pode ter problemas com conexões de longa duração

### ✅ O que funciona perfeitamente

- Queries simples (SELECT, INSERT, UPDATE, DELETE)
- Operações CRUD básicas
- Relações do Prisma
- Migrations via Prisma CLI (usa connection direta)

## Alternativas Oficiais (se necessário)

### 1. Prisma Accelerate (Recomendado para produção)

**Serviço oficial do Prisma** que funciona como proxy entre sua aplicação e o banco:

```bash
npm install @prisma/extension-accelerate
```

**Vantagens:**
- ✅ Funciona perfeitamente com Supabase Pooler
- ✅ Connection pooling otimizado
- ✅ Cache de queries
- ✅ Suporte oficial do Prisma

**Desvantagens:**
- ⚠️ Serviço pago (há plano gratuito limitado)
- ⚠️ Requer configuração adicional

### 2. Connection Direta (Alternativa simples)

Usar a connection string direta do Supabase (porta 5432) ao invés do pooler:

**Vantagens:**
- ✅ Funciona 100% com Prisma
- ✅ Sem limitações de prepared statements
- ✅ Gratuito

**Desvantagens:**
- ⚠️ Mais conexões simultâneas ao banco
- ⚠️ Pode atingir limite de conexões do Supabase em alta escala

**Como obter:**
- Supabase Dashboard > Settings > Database > Connection string > **Direct connection**

## Verificação

Para verificar se está funcionando:

1. Execute uma query simples:
```typescript
const user = await prisma.user.findUnique({ where: { email: 'test@test.com' } })
```

2. Se não houver erro "FATAL: Tenant or user not found", está funcionando ✅

## Referências

- [Prisma + PgBouncer Documentation](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate)
