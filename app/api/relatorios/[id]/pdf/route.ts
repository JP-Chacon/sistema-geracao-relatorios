import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { generatePDF } from '@/lib/pdf/generator'
import { RelatorioWithRelations, ItemRelatorio, FotoListItem } from '@/types'
import { extractIdFromParams } from '@/lib/api/route-helpers'

export const runtime = 'nodejs'

/**
 * GET - Gerar PDF do relatório
 * 
 * Busca dados com queries separadas para evitar P6009
 * Compatível com Prisma Accelerate
 * IMPORTANTE: Garante isolamento total dos dados por relatorioId
 */
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

    // IMPORTANTE: Usa relatorioId validado (do relatório encontrado) para garantir isolamento
    const validatedRelatorioId = relatorio.id

    console.log('[PDF] Buscando dados para PDF:', {
      relatorioId: validatedRelatorioId,
      userId: session.user.id,
    })

    // Query 2: Itens (query separada)
    // IMPORTANTE: Sempre filtra por relatorioId validado para evitar mistura de itens
    const itens = await prisma.itemRelatorio.findMany({
      where: {
        relatorioId: validatedRelatorioId, // Usa relatorioId validado do relatório encontrado
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
      orderBy: { ordem: 'asc' }, // Ordena por ordem
    })

    console.log('[PDF] Itens encontrados:', {
      relatorioId: validatedRelatorioId,
      quantidade: itens.length,
      itensIds: itens.map((i: ItemRelatorio) => i.id),
      itensRelatorioIds: itens.map((i: ItemRelatorio) => i.relatorioId),
    })

    // Query 3: Fotos (apenas metadados - URLs serão buscadas no gerador se necessário)
    // IMPORTANTE: Sempre filtra por relatorioId validado para evitar mistura de fotos
    const fotos = await prisma.foto.findMany({
      where: {
        relatorioId: validatedRelatorioId, // Usa relatorioId validado do relatório encontrado
      },
      select: {
        id: true,
        url: true, // URL necessária para PDF, mas limitamos quantidade
        nome: true,
        ordem: true,
        relatorioId: true,
        createdAt: true,
      },
      orderBy: { ordem: 'asc' }, // Ordena por ordem
      take: 20, // Limita a 20 fotos para evitar P6009
    })

    console.log('[PDF] Fotos encontradas:', {
      relatorioId: validatedRelatorioId,
      quantidade: fotos.length,
      fotosIds: fotos.map((f: FotoListItem) => f.id),
      fotosRelatorioIds: fotos.map((f: FotoListItem) => f.relatorioId),
    })

    // Filtra apenas fotos com URL (necessário para PDF)
    const fotosComUrl = fotos.filter((foto: FotoListItem) => foto.url) as Array<
      FotoListItem & { url: string }
    >

    // Validação final: Garante que todos os itens e fotos pertencem ao relatório
    const itensInvalidos = itens.filter((item: ItemRelatorio) => item.relatorioId !== validatedRelatorioId)
    const fotosInvalidas = fotos.filter((foto: FotoListItem) => foto.relatorioId !== validatedRelatorioId)

    if (itensInvalidos.length > 0) {
      console.error('[PDF] ERRO: Itens com relatorioId incorreto encontrados:', itensInvalidos)
      throw new Error(`Itens inválidos encontrados: ${itensInvalidos.length} itens não pertencem ao relatório ${validatedRelatorioId}`)
    }

    if (fotosInvalidas.length > 0) {
      console.error('[PDF] ERRO: Fotos com relatorioId incorreto encontradas:', fotosInvalidas)
      throw new Error(`Fotos inválidas encontradas: ${fotosInvalidas.length} fotos não pertencem ao relatório ${validatedRelatorioId}`)
    }

    // Combina os resultados
    const relatorioCompleto: RelatorioWithRelations = {
      ...relatorio,
      itens: itens as ItemRelatorio[],
      fotos: fotosComUrl as FotoListItem[],
    }

    console.log('[PDF] Dados validados, gerando PDF:', {
      relatorioId: validatedRelatorioId,
      titulo: relatorio.titulo,
      itensCount: relatorioCompleto.itens.length,
      fotosCount: relatorioCompleto.fotos.length,
    })

    // Gera o PDF
    const pdfBuffer = await generatePDF(relatorioCompleto)

    // Retorna PDF com headers para abrir no navegador
    // Converte Buffer para Uint8Array para NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="relatorio-${relatorio.titulo.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    // Log completo do erro no servidor
    console.error('=== ERRO AO GERAR PDF ===')
    console.error('Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Mensagem:', error instanceof Error ? error.message : String(error))
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    console.error('Erro completo:', error)
    console.error('========================')

    // Retorna mensagem detalhada em desenvolvimento, genérica em produção
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: isDevelopment ? errorMessage : 'Erro ao gerar PDF',
        ...(isDevelopment && errorStack && { stack: errorStack }),
        ...(isDevelopment && { details: error }),
      },
      { status: 500 }
    )
  }
}

