import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

const createRelatorioSchema = z.object({
  titulo: z.string().min(3),
  descricao: z.string().optional(),
  tipoRelatorio: z.enum(['INSPECAO', 'VISTORIA', 'LAUDO', 'OUTRO']).optional(),
  observacoesGerais: z.string().optional(),
  conclusao: z.string().optional(),
  recomendacoes: z.string().optional(),
  data: z.string(),
  status: z.enum(['RASCUNHO', 'FINALIZADO']),
  itens: z.array(
    z.object({
      descricao: z.string(),
      concluido: z.boolean(),
      ordem: z.number(),
      observacao: z.string().optional(),
    })
  ),
})

// GET - Listar relatórios do usuário
// Query otimizada para Prisma Accelerate (evita P6009)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: session.user.id,
    }

    if (status && (status === 'RASCUNHO' || status === 'FINALIZADO')) {
      where.status = status
    }

    // Usa select ao invés de include para evitar carregar dados grandes
    // Retorna apenas campos necessários para listagem
    const relatorios = await prisma.relatorio.findMany({
      where,
      select: {
        id: true,
        titulo: true,
        descricao: true,
        data: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            itens: true,
            fotos: true,
          },
        },
      },
      orderBy: { data: 'desc' },
      take: Math.min(limit, 100), // Limita a 100 resultados (máximo)
    })

    return NextResponse.json(relatorios)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar relatórios' },
      { status: 500 }
    )
  }
}

// POST - Criar novo relatório
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = createRelatorioSchema.parse(body)

    // Gera número do relatório no formato REL-YYYY-NNNN
    // Busca o último número do ano atual para garantir unicidade
    const currentYear = new Date().getFullYear()
    const prefix = `REL-${currentYear}-`
    
    // Busca o último número do ano atual
    const lastRelatorio = await prisma.relatorio.findFirst({
      where: {
        numeroRelatorio: {
          startsWith: prefix,
        },
      },
      orderBy: {
        numeroRelatorio: 'desc',
      },
      select: {
        numeroRelatorio: true,
      },
    })

    // Extrai o número sequencial do último relatório ou começa em 1
    let nextNumber = 1
    if (lastRelatorio?.numeroRelatorio) {
      const lastNumber = parseInt(
        lastRelatorio.numeroRelatorio.replace(prefix, ''),
        10
      )
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    // Formata o número com 4 dígitos (ex: REL-2026-0001)
    const numeroRelatorio = `${prefix}${String(nextNumber).padStart(4, '0')}`

    const relatorio = await prisma.relatorio.create({
      data: {
        numeroRelatorio, // Gerado automaticamente no backend
        titulo: data.titulo,
        descricao: data.descricao || null,
        tipoRelatorio: data.tipoRelatorio || null,
        observacoesGerais: data.observacoesGerais || null,
        conclusao: data.conclusao || null,
        recomendacoes: data.recomendacoes || null,
        data: new Date(data.data),
        status: data.status,
        userId: session.user.id,
        itens: {
          create: data.itens.map((item) => ({
            descricao: item.descricao,
            concluido: item.concluido,
            ordem: item.ordem,
            observacao: item.observacao || null,
          })),
        },
      },
      include: {
        itens: true,
        fotos: true,
      },
    })

    return NextResponse.json(relatorio, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar relatório' },
      { status: 500 }
    )
  }
}

