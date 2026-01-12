import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

/**
 * Prisma Client com Accelerate
 * 
 * Prisma Accelerate é o proxy oficial do Prisma que resolve problemas de
 * compatibilidade com poolers como Supabase PgBouncer, especialmente em
 * ambientes Windows sem IPv6 funcional.
 * 
 * CONFIGURAÇÃO:
 * - DATABASE_URL deve começar com "prisma://" para usar Accelerate
 * - Exemplo: DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=SEU_API_KEY"
 * 
 * Documentação: https://www.prisma.io/data-platform/accelerate
 */
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não está definida no .env.local')
  }

  // Detecta se está usando Accelerate (URL começa com prisma://)
  const isUsingAccelerate = databaseUrl.startsWith('prisma://')

  if (isUsingAccelerate) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Prisma Accelerate ativado')
    }

    // Prisma Client com Accelerate
    // O Prisma detecta automaticamente o protocolo prisma:// e usa Accelerate
    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl, // Connection string do Accelerate (prisma://...)
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
    }).$extends(withAccelerate())
  }

  // Fallback: Prisma Client padrão (sem Accelerate)
  // Usa connection string direta (postgresql://...)
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️  DATABASE_URL não usa Accelerate (não começa com prisma://).\n' +
      '   Usando Prisma Client padrão. Para usar Accelerate, configure:\n' +
      '   DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=SEU_API_KEY"'
    )
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
