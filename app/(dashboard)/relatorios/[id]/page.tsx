import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { RelatorioView } from '@/components/relatorios/RelatorioView'
import { RelatorioWithRelations, ItemRelatorio, FotoListItem } from '@/types'

/**
 * Busca relatório com queries separadas para evitar P6009
 * Arquitetura escalável: cada relação em query própria
 */
async function getRelatorio(
  id: string,
  userId: string
): Promise<RelatorioWithRelations | null> {
  // Query 1: Relatório principal (apenas campos essenciais)
  // IMPORTANTE: Usa findUnique para garantir que busca pelo ID específico
  const relatorio = await prisma.relatorio.findUnique({
    where: {
      id,
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
  if (!relatorio || relatorio.userId !== userId) {
    return null
  }

  // Query 2: Itens (query separada)
  const itens = await prisma.itemRelatorio.findMany({
    where: {
      relatorioId: id,
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
  // URL será buscada sob demanda via API route
  const fotos = await prisma.foto.findMany({
    where: {
      relatorioId: id,
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
  // Nota: fotos não incluem URL - será carregada sob demanda no componente
  return {
    ...relatorio,
    itens: itens as ItemRelatorio[],
    fotos: fotos as FotoListItem[],
  }
}

export default async function RelatorioDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  // Resolve params se for Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params
  
  // Validação: Garante que params.id existe
  if (!resolvedParams?.id) {
    redirect('/relatorios')
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const relatorio = await getRelatorio(resolvedParams.id, session.user.id)

  if (!relatorio) {
    redirect('/relatorios')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <RelatorioView relatorio={relatorio} />
    </div>
  )
}

