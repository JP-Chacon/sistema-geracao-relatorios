import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

import { RelatorioForm } from '@/components/relatorios/RelatorioForm'
import { Card } from '@/components/ui/Card'

import {
  RelatorioWithRelations,
  ItemRelatorio,
  FotoListItem,
} from '@/types'

/**
 * Busca relatório para edição
 */
async function getRelatorio(
  id: string,
  userId: string
): Promise<RelatorioWithRelations | null> {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id },
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

  if (!relatorio || relatorio.userId !== userId) {
    return null
  }

  const itens = await prisma.itemRelatorio.findMany({
    where: { relatorioId: id },
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

  const fotos = await prisma.foto.findMany({
    where: { relatorioId: id },
    select: {
      id: true,
      nome: true,
      ordem: true,
      relatorioId: true,
      createdAt: true,
    },
    orderBy: { ordem: 'asc' },
  })

  return {
    ...relatorio,
    itens: itens as ItemRelatorio[],
    fotos: fotos as FotoListItem[],
  }
}

/* ======================================================
   Next.js 16 — assinatura CORRETA exigida pelo build
   ====================================================== */
export default async function EditarRelatorioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!id) {
    redirect('/relatorios')
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const relatorio = await getRelatorio(id, session.user.id)

  if (!relatorio) {
    redirect('/relatorios')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Editar Relatório
      </h1>

      <Card>
        <RelatorioForm
          relatorioId={relatorio.id}
          initialData={{
            numeroRelatorio: relatorio.numeroRelatorio || undefined,
            titulo: relatorio.titulo,
            descricao: relatorio.descricao || '',
            tipoRelatorio: relatorio.tipoRelatorio || undefined,
            observacoesGerais: relatorio.observacoesGerais || '',
            conclusao: relatorio.conclusao || '',
            recomendacoes: relatorio.recomendacoes || '',
            data: new Date(relatorio.data).toISOString().split('T')[0],
            status: relatorio.status,
            itens: relatorio.itens,
            fotos: relatorio.fotos,
          }}
        />
      </Card>
    </div>
  )
}
