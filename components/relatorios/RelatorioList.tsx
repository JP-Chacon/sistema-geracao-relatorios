'use client'

import { useState, useMemo } from 'react'
import { RelatorioCard } from './RelatorioCard'
import { RelatorioListItem } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface RelatorioListProps {
  relatorios: RelatorioListItem[]
}

export function RelatorioList({ relatorios }: RelatorioListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('TODOS')
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Valida e filtra relatórios com IDs válidos
  const relatoriosValidos = relatorios.filter((relatorio) => {
    const hasValidId = relatorio?.id && typeof relatorio.id === 'string' && relatorio.id.trim() !== ''
    return hasValidId
  })

  // Filtra e ordena relatórios
  const relatoriosFiltrados = useMemo(() => {
    let filtered = [...relatoriosValidos]

    // Filtro por busca (título ou número)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((r) => {
        const tituloMatch = r.titulo?.toLowerCase().includes(term)
        const numeroMatch = r.numeroRelatorio?.toLowerCase().includes(term)
        return tituloMatch || numeroMatch
      })
    }

    // Filtro por status
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }

    // Filtro por tipo
    if (tipoFilter !== 'TODOS') {
      filtered = filtered.filter((r) => r.tipoRelatorio === tipoFilter)
    }

    // Ordenação por data
    filtered.sort((a, b) => {
      const dateA = new Date(a.data).getTime()
      const dateB = new Date(b.data).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [relatoriosValidos, searchTerm, statusFilter, tipoFilter, sortOrder])

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('TODOS')
    setTipoFilter('TODOS')
    setSortOrder('desc')
  }

  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'TODOS' || tipoFilter !== 'TODOS'

  if (relatorios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhum relatório encontrado</p>
        <p className="text-gray-400 text-sm mt-2">
          Crie seu primeiro relatório clicando no botão acima
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros e busca */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="md:col-span-2">
            <Input
              placeholder="Buscar por título ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filtro por status */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'TODOS', label: 'Todos os status' },
              { value: 'RASCUNHO', label: 'Pendente' },
              { value: 'FINALIZADO', label: 'Finalizado' },
            ]}
          />

          {/* Filtro por tipo */}
          <Select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            options={[
              { value: 'TODOS', label: 'Todos os tipos' },
              { value: 'INSPECAO', label: 'Inspeção' },
              { value: 'VISTORIA', label: 'Vistoria' },
              { value: 'LAUDO', label: 'Laudo' },
              { value: 'OUTRO', label: 'Outro' },
            ]}
          />
        </div>

        {/* Ordenação e limpar filtros */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Ordenar por data:</span>
            <Button
              type="button"
              variant={sortOrder === 'desc' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('desc')}
            >
              Mais recentes
            </Button>
            <Button
              type="button"
              variant={sortOrder === 'asc' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('asc')}
            >
              Mais antigos
            </Button>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="text-sm text-gray-600">
          {relatoriosFiltrados.length === relatoriosValidos.length ? (
            <span>{relatoriosFiltrados.length} relatório(s) encontrado(s)</span>
          ) : (
            <span>
              Mostrando {relatoriosFiltrados.length} de {relatoriosValidos.length} relatório(s)
            </span>
          )}
        </div>
      </div>

      {/* Lista de relatórios */}
      {relatoriosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum relatório encontrado com os filtros aplicados</p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClearFilters}
            className="mt-4"
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatoriosFiltrados.map((relatorio, index) => {
            const relatorioId = relatorio.id
            return (
              <RelatorioCard
                key={`relatorio-${relatorioId}-${index}`}
                relatorio={relatorio}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

