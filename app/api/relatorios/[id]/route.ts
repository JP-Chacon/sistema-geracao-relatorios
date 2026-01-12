import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'
import { Prisma } from '@prisma/client' // Importa Prisma para tipagem de TransactionClient
import { extractIdFromParams } from '@/lib/api/route-helpers'

const updateRelatorioSchema = z.object({
  titulo: z.string().min(3).optional(),
  descricao: z.string().nullable().optional(), // Aceita string, null ou undefined
  tipoRelatorio: z.enum(['INSPECAO', 'VISTORIA', 'LAUDO', 'OUTRO']).nullable().optional(),
  observacoesGerais: z.string().nullable().optional(),
  conclusao: z.string().nullable().optional(),
  recomendacoes: z.string().nullable().optional(),
  data: z.string().optional(),
  status: z.enum(['RASCUNHO', 'FINALIZADO']).optional(),
  itens: z
    .array(
      z.object({
        id: z.string().optional(),
        descricao: z.string().min(1), // Descrição do item é obrigatória
        concluido: z.boolean(),
        ordem: z.coerce.number().int().nonnegative(), // Converte para número automaticamente
        observacao: z.string().nullable().optional(),
      })
    )
    .optional(),
  fotosParaDeletar: z.array(z.string()).optional(), // IDs das fotos a serem deletadas
})

// GET - Buscar relatório específico
// Query otimizada com queries separadas para evitar P6009
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // IMPORTANTE: Usa helper para garantir desempacotamento seguro de params
    const relatorioId = await extractIdFromParams(params, 'id')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Query 1: Relatório principal
    // IMPORTANTE: Usa findUnique para garantir que busca pelo ID específico
    const relatorio = await prisma.relatorio.findUnique({
      where: {
        id: relatorioId,
      },
      select: {
        id: true,
        numeroRelatorio: true,
        titulo: true,
        descricao: true,
        tipoRelatorio: true,
        observacoesGerais: true,
        conclusao: true,
        recomendacoes: true,
        data: true,
        status: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Valida se o relatório existe e pertence ao usuário
    if (!relatorio || relatorio.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    // Query 2: Itens (query separada)
    // IMPORTANTE: Sempre filtra por relatorioId para evitar mistura de itens
    const itens = await prisma.itemRelatorio.findMany({
      where: {
        relatorioId: relatorioId, // Usa relatorioId validado
      },
      select: {
        id: true,
        descricao: true,
        concluido: true,
        ordem: true,
        observacao: true,
        relatorioId: true,
        createdAt: true,
      },
      orderBy: { ordem: 'asc' },
    })

    // Query 3: Fotos (query separada - SEM url para evitar P6009)
    // URL deve ser buscada sob demanda via /api/fotos/[id]
    // IMPORTANTE: Sempre filtra por relatorioId para evitar mistura de fotos
    const fotos = await prisma.foto.findMany({
      where: {
        relatorioId: relatorioId, // Usa relatorioId validado
      },
      select: {
        id: true,
        // url: NÃO incluído - muito grande, causa P6009
        nome: true,
        ordem: true,
        relatorioId: true,
        createdAt: true,
      },
      orderBy: { ordem: 'asc' },
      take: 50, // Pode aumentar pois não carrega URLs
    })

    // Combina os resultados
    return NextResponse.json({
      ...relatorio,
      itens,
      fotos,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar relatório' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar relatório
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // IMPORTANTE: Usa helper para garantir desempacotamento seguro de params
    const relatorioId = await extractIdFromParams(params, 'id')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o relatório pertence ao usuário
    const existingRelatorio = await prisma.relatorio.findFirst({
      where: {
        id: relatorioId,
        userId: session.user.id,
      },
    })

    if (!existingRelatorio) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    // Log do payload recebido
    const body = await request.json()
    console.log('[UPDATE] Payload recebido:', JSON.stringify(body, null, 2))

    // Valida dados
    let data
    try {
      data = updateRelatorioSchema.parse(body)
      console.log('[UPDATE] Dados validados:', JSON.stringify(data, null, 2))
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('[UPDATE] Erro de validação:', validationError.errors)
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: validationError.errors,
          },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Prepara dados de atualização do relatório
    const updateData: any = {}
    if (data.titulo) updateData.titulo = data.titulo
    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.tipoRelatorio !== undefined) updateData.tipoRelatorio = data.tipoRelatorio
    if (data.observacoesGerais !== undefined) updateData.observacoesGerais = data.observacoesGerais
    if (data.conclusao !== undefined) updateData.conclusao = data.conclusao
    if (data.recomendacoes !== undefined) updateData.recomendacoes = data.recomendacoes
    if (data.data) updateData.data = new Date(data.data)
    if (data.status) updateData.status = data.status

    console.log('[UPDATE] Dados para atualizar relatório:', updateData)

    // IMPORTANTE: relatorioId já foi validado e extraído no início da função
    // Usa diretamente o relatorioId validado
    
    console.log('[UPDATE] relatorioId validado e convertido:', {
      relatorioId,
      type: typeof relatorioId,
      length: relatorioId.length,
    })

    // Usa transação para garantir atomicidade
    await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      // 1. Deleta fotos primeiro (se especificado)
      if (data.fotosParaDeletar && data.fotosParaDeletar.length > 0) {
        console.log('[UPDATE] Deletando fotos:', data.fotosParaDeletar)
        const deletedFotos = await tx.foto.deleteMany({
          where: {
            id: { in: data.fotosParaDeletar },
            relatorioId: relatorioId, // Usa variável capturada
          },
        })
        console.log('[UPDATE] Fotos deletadas:', deletedFotos.count)
      }

      // 2. Atualiza itens se fornecidos
      if (data.itens !== undefined) {
        console.log('[UPDATE] Atualizando itens. Total:', data.itens.length)

        // Remove itens antigos
        const deletedItems = await tx.itemRelatorio.deleteMany({
          where: { relatorioId: relatorioId },
        })
        console.log('[UPDATE] Itens antigos deletados:', deletedItems.count)

        // Cria novos itens
        if (data.itens.length > 0) {
          // VALIDAÇÃO: Verifica relatorioId antes de criar itens
          if (!relatorioId) {
            throw new Error('relatorioId é obrigatório para criar itens')
          }

          // OBRIGATÓRIO: Sempre injeta relatorioId do params, ignora qualquer valor do frontend
          // NÃO usa connect (createMany não suporta)
          const itemsToCreate = data.itens.map((item, index) => {
            // Valida campos obrigatórios
            if (!item.descricao || typeof item.descricao !== 'string') {
              throw new Error(`Item ${index}: descricao é obrigatória`)
            }
            if (typeof item.concluido !== 'boolean') {
              throw new Error(`Item ${index}: concluido deve ser boolean`)
            }
            if (typeof item.ordem !== 'number' && isNaN(Number(item.ordem))) {
              throw new Error(`Item ${index}: ordem deve ser um número`)
            }

            // Retorna objeto com TODOS os campos obrigatórios
            const itemToCreate = {
              descricao: String(item.descricao).trim(),
              concluido: Boolean(item.concluido),
              ordem: Number(item.ordem),
              observacao: item.observacao ? String(item.observacao).trim() : null,
              relatorioId: String(relatorioId), // SEMPRE injeta relatorioId como string
            }

            // Validação final: garante que relatorioId não está undefined
            if (!itemToCreate.relatorioId) {
              throw new Error(`Item ${index}: relatorioId não pode ser undefined`)
            }

            return itemToCreate
          })

          // Validação final antes do createMany
          const invalidItems = itemsToCreate.filter(item => !item.relatorioId || item.relatorioId.trim() === '')
          if (invalidItems.length > 0) {
            console.error('[UPDATE] ERRO: Itens sem relatorioId válido:', invalidItems)
            throw new Error(`Encontrados ${invalidItems.length} itens sem relatorioId válido`)
          }

          // Log detalhado antes do createMany
          console.log('[UPDATE] ===== VALIDAÇÃO FINAL ANTES DE createMany =====')
          console.log('[UPDATE] Total de itens:', itemsToCreate.length)
          console.log('[UPDATE] relatorioId usado:', relatorioId)
          console.log('[UPDATE] Tipo do relatorioId:', typeof relatorioId)
          console.log('[UPDATE] Verificando relatorioId em cada item:')
          itemsToCreate.forEach((item, idx) => {
            console.log(`[UPDATE]   Item ${idx}:`, {
              descricao: item.descricao?.substring(0, 30),
              relatorioId: item.relatorioId,
              relatorioIdType: typeof item.relatorioId,
              relatorioIdValid: !!item.relatorioId && item.relatorioId.trim() !== '',
              concluido: item.concluido,
              ordem: item.ordem,
            })
          })
          console.log('[UPDATE] ===============================================')
          
          // Executa createMany com validação garantida
          const createdItems = await tx.itemRelatorio.createMany({
            data: itemsToCreate,
          })
          console.log('[UPDATE] ✅ Itens criados com sucesso:', createdItems.count)
        } else {
          console.log('[UPDATE] Nenhum item para criar (array vazio)')
        }
      }

      // 3. Atualiza o relatório (sem include - resposta leve)
      // SEM include - evita P6009
      if (Object.keys(updateData).length > 0) {
        console.log('[UPDATE] Atualizando relatório com:', updateData)
        await tx.relatorio.update({
          where: { id: relatorioId },
          data: updateData,
        })
        console.log('[UPDATE] Relatório atualizado com sucesso')
      } else {
        console.log('[UPDATE] Nenhum dado para atualizar no relatório')
      }
    })

    // Retorna apenas confirmação leve (sem dados grandes)
    return NextResponse.json({
      success: true,
      id: relatorioId,
      message: 'Relatório atualizado com sucesso',
    })
  } catch (error) {
    // Log completo do erro
    console.error('[UPDATE] ===== ERRO AO ATUALIZAR RELATÓRIO =====')
    console.error('[UPDATE] Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[UPDATE] Mensagem:', error instanceof Error ? error.message : String(error))
    console.error('[UPDATE] Stack:', error instanceof Error ? error.stack : 'N/A')
    console.error('[UPDATE] Erro completo:', error)
    console.error('[UPDATE] ========================================')

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    // Retorna mensagem real do erro em desenvolvimento, genérica em produção
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: isDevelopment
          ? `Erro ao atualizar relatório: ${errorMessage}`
          : 'Erro ao atualizar relatório',
        ...(isDevelopment && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    )
  }
}

// DELETE - Deletar relatório
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // IMPORTANTE: Usa helper para garantir desempacotamento seguro de params
    const relatorioId = await extractIdFromParams(params, 'id')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o relatório pertence ao usuário
    const existingRelatorio = await prisma.relatorio.findFirst({
      where: {
        id: relatorioId,
        userId: session.user.id,
      },
      select: {
        id: true,
        titulo: true,
      },
    })

    if (!existingRelatorio) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    console.log('[DELETE] Iniciando deleção do relatório:', {
      relatorioId,
      titulo: existingRelatorio.titulo,
      userId: session.user.id,
    })

    // Usa transação para garantir atomicidade
    // Deleta relações primeiro, depois o relatório
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Deleta todos os itens do relatório
      const deletedItems = await tx.itemRelatorio.deleteMany({
        where: { relatorioId: relatorioId },
      })
      console.log('[DELETE] Itens deletados:', deletedItems.count)

      // 2. Deleta todas as fotos do relatório
      const deletedFotos = await tx.foto.deleteMany({
        where: { relatorioId: relatorioId },
      })
      console.log('[DELETE] Fotos deletadas:', deletedFotos.count)

      // 3. Deleta o relatório (após deletar relações)
      await tx.relatorio.delete({
        where: { id: relatorioId },
      })
      console.log('[DELETE] Relatório deletado com sucesso')
    })

    return NextResponse.json({ 
      success: true,
      message: 'Relatório deletado com sucesso' 
    })
  } catch (error) {
    // Log completo do erro
    console.error('[DELETE] ===== ERRO AO DELETAR RELATÓRIO =====')
    console.error('[DELETE] Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[DELETE] Mensagem:', error instanceof Error ? error.message : String(error))
    console.error('[DELETE] Stack:', error instanceof Error ? error.stack : 'N/A')
    console.error('[DELETE] Erro completo:', error)
    console.error('[DELETE] ========================================')

    // Retorna mensagem real do erro em desenvolvimento, genérica em produção
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: isDevelopment
          ? `Erro ao deletar relatório: ${errorMessage}`
          : 'Erro ao deletar relatório',
        ...(isDevelopment && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    )
  }
}

