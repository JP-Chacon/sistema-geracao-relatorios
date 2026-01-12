'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { RelatorioListItem } from '@/types'

interface RelatorioCardProps {
  relatorio: RelatorioListItem
}

const tipoLabels: Record<string, string> = {
  INSPECAO: 'Inspeção',
  VISTORIA: 'Vistoria',
  LAUDO: 'Laudo',
  OUTRO: 'Outro',
}

export function RelatorioCard({ relatorio }: RelatorioCardProps) {
  const router = useRouter()

  // Validação: Garante que relatorio e relatorio.id existem
  if (!relatorio) {
    console.error('[RelatorioCard] Relatório não fornecido')
    return null
  }

  const relatorioId = relatorio.id

  // Validação: ID deve ser string não vazia
  if (!relatorioId || typeof relatorioId !== 'string' || relatorioId.trim() === '') {
    console.error('[RelatorioCard] ID inválido:', {
      id: relatorioId,
      type: typeof relatorioId,
      relatorio: relatorio,
    })
    return null
  }

  const isFinalizado = relatorio.status === 'FINALIZADO'
  const tipoLabel = relatorio.tipoRelatorio ? tipoLabels[relatorio.tipoRelatorio] || relatorio.tipoRelatorio : null

  const handleVer = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/relatorios/${relatorioId}`)
  }

  const handleEditar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/relatorios/${relatorioId}/editar`)
  }

  const handlePDF = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(`/api/relatorios/${relatorioId}/pdf`, '_blank')
  }

  return (
    <Card
      className={`h-full flex flex-col transition-all ${
        isFinalizado
          ? 'border-l-4 border-l-green-500 bg-green-50/30'
          : 'border-l-4 border-l-gray-300'
      }`}
      data-relatorio-id={relatorioId}
    >
      {/* Cabeçalho do card */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {relatorio.numeroRelatorio && (
            <p className="text-xs font-mono text-gray-500 mb-1">
              {relatorio.numeroRelatorio}
            </p>
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {relatorio.titulo}
          </h3>
          {tipoLabel && (
            <span className="inline-block text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {tipoLabel}
            </span>
          )}
        </div>
        <Badge
          variant={isFinalizado ? 'success' : 'warning'}
          className="ml-2 flex-shrink-0"
        >
          {isFinalizado ? 'Finalizado' : 'Pendente'}
        </Badge>
      </div>

      {/* Descrição */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
        {relatorio.descricao || 'Sem descrição'}
      </p>

      {/* Informações e estatísticas */}
      <div className="flex justify-between items-center text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
        <span>{formatDate(relatorio.data)}</span>
        <div className="flex gap-3">
          <span>{relatorio._count.itens} itens</span>
          <span>{relatorio._count.fotos} fotos</span>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleVer}
          className="flex-1 text-xs"
        >
          Ver
        </Button>
        {!isFinalizado && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleEditar}
            className="flex-1 text-xs"
          >
            Editar
          </Button>
        )}
        {isFinalizado && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePDF}
            className="flex-1 text-xs"
          >
            PDF
          </Button>
        )}
      </div>
    </Card>
  )
}

