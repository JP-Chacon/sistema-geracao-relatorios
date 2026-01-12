import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { extractIdFromParams } from '@/lib/api/route-helpers'

/**
 * GET - Buscar URL de foto específica
 * Busca sob demanda para evitar carregar URLs grandes na listagem
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // IMPORTANTE: Usa helper para garantir desempacotamento seguro de params
    const fotoId = await extractIdFromParams(params, 'id')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Busca apenas a URL da foto
    const foto = await prisma.foto.findFirst({
      where: {
        id: fotoId, // Usa fotoId validado
        relatorio: {
          userId: session.user.id, // Verifica se o relatório pertence ao usuário
        },
      },
      select: {
        id: true,
        url: true,
        nome: true,
      },
    })

    if (!foto) {
      return NextResponse.json(
        { error: 'Foto não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(foto)
  } catch (error) {
    console.error('[FOTOS] Erro ao buscar foto:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar foto' },
      { status: 500 }
    )
  }
}





