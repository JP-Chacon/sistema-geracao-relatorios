'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { ImageViewerModal } from '@/components/ui/ImageViewerModal'

export interface Photo {
  url?: string
  nome: string
  ordem: number
  id?: string
  tempId?: string
}

interface PhotoUploadProps {
  photos: Photo[]
  onPhotosChange: React.Dispatch<React.SetStateAction<Photo[]>>
  readonly?: boolean
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  readonly = false,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fotosComUrl, setFotosComUrl] = useState<Record<string, string>>({})
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  /* ======================================================
     Reset e sincronização quando fotos mudam
     ====================================================== */
  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    const fotoIdsAtuais = new Set(photos.filter(f => f.id).map(f => f.id!))

    setFotosComUrl(prev => {
      const novasUrls: Record<string, string> = {}
      Object.keys(prev).forEach(id => {
        if (fotoIdsAtuais.has(id)) {
          novasUrls[id] = prev[id]
        }
      })
      return novasUrls
    })

    setImageViewerOpen(false)
    setSelectedImageIndex(0)
  }, [photos])

  /* ======================================================
     Carrega URLs sob demanda
     ====================================================== */
  useEffect(() => {
    const carregarUrls = async () => {
      const fotosSemUrl = photos.filter(f => f.id && !f.url)
      if (fotosSemUrl.length === 0) return

      const batchSize = 10

      for (let i = 0; i < fotosSemUrl.length; i += batchSize) {
        const batch = fotosSemUrl.slice(i, i + batchSize)

        const resultados = await Promise.all(
          batch.map(async foto => {
            if (!foto.id) return null
            try {
              const res = await fetch(`/api/fotos/${foto.id}`)
              if (res.ok) {
                const data = await res.json()
                return { id: foto.id, url: data.url }
              }
            } catch {
              return null
            }
            return null
          })
        )

        const novasUrls: Record<string, string> = {}
        resultados.forEach(r => {
          if (r) novasUrls[r.id] = r.url
        })

        setFotosComUrl(prev => ({ ...prev, ...novasUrls }))
      }
    }

    carregarUrls()
  }, [photos])

  /* ======================================================
     Upload de arquivos
     ====================================================== */
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Erro ao fazer upload')
        }

        const data = await response.json()

        return {
          url: data.url,
          nome: data.nome,
          ordem: photos.length + index,
          tempId: `temp-${Date.now()}-${index}`,
        } as Photo
      })

      const newPhotos = await Promise.all(uploadPromises)

      const fotosNovas = newPhotos.filter(np => {
        const urlNormalizada = np.url?.trim().toLowerCase() || ''
        return !photos.some(p =>
          (p.url?.trim().toLowerCase() || '') === urlNormalizada
        )
      })

      if (fotosNovas.length > 0) {
        onPhotosChange(prevPhotos => {
          const urlsExistentes = new Set(
            prevPhotos
              .map(p => p.url?.trim().toLowerCase())
              .filter(Boolean)
          )

          const fotosParaAdicionar = fotosNovas.filter(
            f => !urlsExistentes.has(f.url?.trim().toLowerCase() || '')
          )

          return fotosParaAdicionar.length > 0
            ? [...prevPhotos, ...fotosParaAdicionar]
            : prevPhotos
        })
      }
    } catch (error) {
      console.error('[PhotoUpload] Erro ao fazer upload:', error)
      alert('Erro ao fazer upload das fotos')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removePhoto = (index: number) => {
    onPhotosChange(prev =>
      prev
        .filter((_, i) => i !== index)
        .map((photo, i) => ({ ...photo, ordem: i }))
    )
  }

  /* ======================================================
     Render
     ====================================================== */
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fotos
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {!readonly && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Enviando...' : '+ Adicionar Fotos'}
          </Button>
        )}
      </div>

      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => {
              const key = photo.id || photo.tempId || `photo-${index}`
              const url =
                photo.url ||
                (photo.id ? fotosComUrl[photo.id] : undefined)

              return (
                <div key={key} className="relative group">
                  <div className="aspect-square relative rounded-lg overflow-hidden border">
                    {url && (
                      <Image
                        src={url}
                        alt={photo.nome}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => {
                          setSelectedImageIndex(index)
                          setImageViewerOpen(true)
                        }}
                      />
                    )}
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <ImageViewerModal
            images={photos
              .map(p => ({
                id: p.id || '',
                url: p.url || (p.id ? fotosComUrl[p.id] : '') || '',
                nome: p.nome,
              }))
              .filter(i => i.url)}
            currentIndex={selectedImageIndex}
            isOpen={imageViewerOpen}
            onClose={() => setImageViewerOpen(false)}
          />
        </>
      )}
    </div>
  )
}
