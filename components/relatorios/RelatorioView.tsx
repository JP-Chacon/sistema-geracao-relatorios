'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Toast } from '@/components/ui/Toast'
import { ItemList } from './ItemList'
import { ImageViewerModal } from '@/components/ui/ImageViewerModal'
import { formatDate } from '@/lib/utils'
import { RelatorioWithRelations, FotoListItem } from '@/types'
import Image from 'next/image'

interface RelatorioViewProps {
  relatorio: RelatorioWithRelations
}

export function RelatorioView({ relatorio }: RelatorioViewProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fotosComUrl, setFotosComUrl] = useState<Record<string, string>>({})
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // IMPORTANTE: Limpa estado quando o relatório muda (por ID)
  useEffect(() => {
    setFotosComUrl({})
    setImageViewerOpen(false)
    setSelectedImageIndex(0)
  }, [relatorio.id]) // Depende do ID do relatório, não do objeto completo

  // Carrega URLs das fotos sob demanda
  useEffect(() => {
    const carregarUrls = async () => {
      // IMPORTANTE: Filtra fotos do relatório atual pelo relatorioId
      const fotosDoRelatorio = relatorio.fotos.filter(
        (f) => f.relatorioId === relatorio.id
      )
      const fotosSemUrl = fotosDoRelatorio.filter((f) => !f.url)
      if (fotosSemUrl.length === 0) return

      // Carrega URLs em paralelo (limitado a 10 por vez para evitar sobrecarga)
      const batchSize = 10
      for (let i = 0; i < fotosSemUrl.length; i += batchSize) {
        const batch = fotosSemUrl.slice(i, i + batchSize)
        const promises = batch.map(async (foto) => {
          try {
            const response = await fetch(`/api/fotos/${foto.id}`)
            if (response.ok) {
              const data = await response.json()
              return { id: foto.id, url: data.url }
            }
          } catch (error) {
            console.error(`Erro ao carregar foto ${foto.id}:`, error)
          }
          return null
        })

        const resultados = await Promise.all(promises)
        const novasUrls: Record<string, string> = {}
        resultados.forEach((result) => {
          if (result) {
            novasUrls[result.id] = result.url
          }
        })
        setFotosComUrl((prev) => ({ ...prev, ...novasUrls }))
      }
    }

    carregarUrls()
  }, [relatorio.id, relatorio.fotos]) // Depende do ID e das fotos

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/relatorios/${relatorio.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/relatorios')
        router.refresh()
      } else {
        alert('Erro ao excluir relatório')
      }
    } catch (error) {
      alert('Erro ao excluir relatório')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleGeneratePDF = () => {
    window.open(`/api/relatorios/${relatorio.id}/pdf`, '_blank')
  }

  const handleFinalizar = async () => {
    if (!confirm('Tem certeza que deseja finalizar este relatório? Esta ação não pode ser desfeita.')) {
      return
    }

    setIsFinalizing(true)
    try {
      const response = await fetch(`/api/relatorios/${relatorio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FINALIZADO',
        }),
      })

      if (response.ok) {
        // Exibe toast de sucesso
        setSuccessMessage('Relatório finalizado com sucesso')
        // Atualiza a página para refletir o novo status
        router.refresh()
      } else {
        alert('Erro ao finalizar relatório')
      }
    } catch (error) {
      alert('Erro ao finalizar relatório')
    } finally {
      setIsFinalizing(false)
    }
  }

  return (
    <>
      {/* Toast fixo no canto superior direito */}
      <Toast
        message={successMessage || ''}
        type="success"
        isVisible={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        duration={3000}
      />

      <div className="space-y-6">
        {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {relatorio.titulo}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{formatDate(relatorio.data)}</span>
            <Badge
              variant={
                relatorio.status === 'FINALIZADO' ? 'success' : 'warning'
              }
            >
              {relatorio.status === 'FINALIZADO' ? 'Finalizado' : 'Pendente'}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {relatorio.status === 'RASCUNHO' && (
            <Button
              variant="primary"
              onClick={handleFinalizar}
              disabled={isFinalizing}
            >
              {isFinalizing ? 'Finalizando...' : 'Finalizar'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/relatorios/${relatorio.id}/editar`)}
          >
            Editar
          </Button>
          <Button variant="primary" onClick={handleGeneratePDF}>
            Gerar PDF
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            Excluir
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-800 mb-4">
            Tem certeza que deseja excluir este relatório? Esta ação não pode
            ser desfeita.
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Descrição */}
      {relatorio.descricao && (
        <Card>
          <h2 className="text-lg font-semibold mb-2">Descrição</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {relatorio.descricao}
          </p>
        </Card>
      )}

      {/* Itens */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Itens</h2>
        <ItemList
          items={relatorio.itens.map(item => ({
            ...item,
            observacao: item.observacao ?? undefined,
          }))}
          onItemsChange={() => {}}
          readonly
        />
      </Card>

      {/* Fotos */}
      {relatorio.fotos.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Fotos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatorio.fotos.map((foto, index) => {
              const url = foto.url || fotosComUrl[foto.id]
              return (
                <div
                  key={foto.id}
                  className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (url) {
                      // Calcula o índice na lista filtrada (apenas imagens com URL)
                      const imagesWithUrl = relatorio.fotos
                        .slice(0, index + 1)
                        .filter((f) => f.url || fotosComUrl[f.id])
                      const adjustedIndex = imagesWithUrl.length - 1
                      setSelectedImageIndex(adjustedIndex)
                      setImageViewerOpen(true)
                    }
                  }}
                >
                  {url ? (
                    <Image
                      src={url}
                      alt={foto.nome}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400 text-sm">Carregando...</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Image Viewer Modal */}
      {relatorio.fotos.length > 0 && (() => {
        const imagesWithUrl = relatorio.fotos
          .map((foto) => ({
            id: foto.id,
            url: foto.url || fotosComUrl[foto.id] || '',
            nome: foto.nome,
          }))
          .filter((img) => img.url) // Apenas imagens com URL carregada
        
        // Ajusta o índice para a lista filtrada
        const adjustedIndex = Math.min(selectedImageIndex, imagesWithUrl.length - 1)
        
        return (
          <ImageViewerModal
            images={imagesWithUrl}
            currentIndex={adjustedIndex >= 0 ? adjustedIndex : 0}
            isOpen={imageViewerOpen && imagesWithUrl.length > 0}
            onClose={() => setImageViewerOpen(false)}
          />
        )
      })()}
      </div>
    </>
  )
}

