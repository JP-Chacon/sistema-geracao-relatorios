import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { extractIdFromParams } from '@/lib/api/route-helpers'

// POST - Adicionar fotos ao relatório
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Usa helper para desempacotar params de forma segura
    const relatorioId = await extractIdFromParams(params, 'id')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o relatório pertence ao usuário
    const relatorio = await prisma.relatorio.findUnique({
      where: { id: relatorioId },
    })

    if (!relatorio || relatorio.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { fotos } = body

    if (!Array.isArray(fotos) || fotos.length === 0) {
      return NextResponse.json(
        { error: 'Fotos são obrigatórias' },
        { status: 400 }
      )
    }

    /* ======================================================
       Deduplicação no payload (URL normalizada)
       ====================================================== */
    const fotosUnicas = new Map<
      string,
      { url: string; nome: string; ordem: number }
    >()

    for (const foto of fotos) {
      const urlNormalizada = String(foto.url).trim().toLowerCase()

      if (urlNormalizada && !fotosUnicas.has(urlNormalizada)) {
        fotosUnicas.set(urlNormalizada, {
          url: String(foto.url).trim(),
          nome: String(foto.nome).trim(),
          ordem: Number(foto.ordem) || 0,
        })
      }
    }

    if (fotosUnicas.size < fotos.length) {
      console.log('[FOTOS] ⚠️ Fotos duplicadas removidas no backend:', {
        recebidas: fotos.length,
        unicas: fotosUnicas.size,
        removidas: fotos.length - fotosUnicas.size,
      })
    }

    /* ======================================================
       Prepara dados para criação
       ====================================================== */
    const fotosParaCriar = Array.from(fotosUnicas.values()).map((foto) => ({
      url: foto.url,
      nome: foto.nome,
      ordem: foto.ordem,
      relatorioId,
    }))

    // Validação de campos obrigatórios
    const fotosInvalidas = fotosParaCriar.filter(
      (f) => !f.url || !f.nome || !f.relatorioId
    )

    if (fotosInvalidas.length > 0) {
      return NextResponse.json(
        { error: 'Algumas fotos têm dados inválidos' },
        { status: 400 }
      )
    }

    /* ======================================================
       Deduplicação no banco (URLs já existentes)
       ====================================================== */
    const urlsParaVerificar = fotosParaCriar.map((f) => f.url)

    const fotosExistentes = await prisma.foto.findMany({
      where: {
        relatorioId,
        url: { in: urlsParaVerificar },
      },
      select: { url: true },
    })

    if (fotosExistentes.length > 0) {
      const urlsExistentes = new Set<string>(
        fotosExistentes.map((f: { url: string }) =>
          f.url.trim().toLowerCase()
        )
      )
      

      const fotosParaCriarFiltradas = fotosParaCriar.filter(
        (f) => !urlsExistentes.has(f.url.trim().toLowerCase())
      )

      if (fotosParaCriarFiltradas.length < fotosParaCriar.length) {
        console.log('[FOTOS] ⚠️ Fotos já existentes ignoradas:', {
          tentadas: fotosParaCriar.length,
          criadas: fotosParaCriarFiltradas.length,
          ignoradas:
            fotosParaCriar.length - fotosParaCriarFiltradas.length,
        })
      }

      // Atualiza array original (mantém referência)
      fotosParaCriar.splice(
        0,
        fotosParaCriar.length,
        ...fotosParaCriarFiltradas
      )
    }

    // Nada novo para criar
    if (fotosParaCriar.length === 0) {
      return NextResponse.json(
        {
          message: 'Todas as fotos já existem no relatório',
          count: 0,
          fotos: [],
        },
        { status: 200 }
      )
    }

    /* ======================================================
       Criação individual (para retornar IDs)
       ====================================================== */
    const fotosCriadas = []

    for (const fotoData of fotosParaCriar) {
      const fotoCriada = await prisma.foto.create({
        data: fotoData,
        select: {
          id: true,
          url: true,
          nome: true,
          ordem: true,
          relatorioId: true,
          createdAt: true,
        },
      })

      fotosCriadas.push(fotoCriada)
    }

    console.log('[FOTOS] Fotos adicionadas:', {
      relatorioId,
      count: fotosCriadas.length,
    })

    return NextResponse.json(
      {
        message: 'Fotos adicionadas com sucesso',
        count: fotosCriadas.length,
        fotos: fotosCriadas,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[FOTOS] ===== ERRO AO ADICIONAR FOTOS =====')
    console.error('[FOTOS] Erro:', error)

    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage =
      error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: isDevelopment
          ? `Erro ao adicionar fotos: ${errorMessage}`
          : 'Erro ao adicionar fotos',
        ...(isDevelopment && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    )
  }
}
