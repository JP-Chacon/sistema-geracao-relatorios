import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { RelatorioForm } from '@/components/relatorios/RelatorioForm'
import { Card } from '@/components/ui/Card'

export default async function NovoRelatorioPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Novo Relatório
      </h1>
      <Card>
        <RelatorioForm />
      </Card>
    </div>
  )
}













