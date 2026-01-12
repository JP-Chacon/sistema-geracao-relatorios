import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { RelatorioList } from '@/components/relatorios/RelatorioList'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { RelatorioListItem } from '@/types'

// Query otimizada para listagem (compatível com Prisma Accelerate)
// Usa select ao invés de include para evitar carregar dados grandes
async function getRelatorios(userId: string): Promise<RelatorioListItem[]> {
  const relatorios = await prisma.relatorio.findMany({
    where: { userId },
    select: {
      id: true,
      numeroRelatorio: true,
      titulo: true,
      descricao: true,
      tipoRelatorio: true,
      data: true,
      status: true,
      _count: {
        select: {
          itens: true,
          fotos: true,
        },
      },
    },
    orderBy: { data: 'desc' },
    take: 100, // Aumentado para 100 (campos são leves)
  })

  return relatorios
}

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const relatorios = await getRelatorios(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Meus Relatórios</h1>
        <Link href="/relatorios/novo">
          <Button>+ Novo Relatório</Button>
        </Link>
      </div>

      <RelatorioList relatorios={relatorios} />
    </div>
  )
}

