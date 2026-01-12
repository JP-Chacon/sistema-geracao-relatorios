'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { ItemList } from './ItemList'
import { PhotoUpload, type Photo } from './PhotoUpload'

const relatorioSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  tipoRelatorio: z.enum(['INSPECAO', 'VISTORIA', 'LAUDO', 'OUTRO']).optional(),
  observacoesGerais: z.string().optional(),
  conclusao: z.string().optional(),
  recomendacoes: z.string().optional(),
  data: z.string(),
  status: z.enum(['RASCUNHO', 'FINALIZADO']),
})

type RelatorioFormData = z.infer<typeof relatorioSchema>

interface Item {
  id?: string
  descricao: string
  concluido: boolean
  ordem: number
}

interface RelatorioFormProps {
  relatorioId?: string
  initialData?: {
    numeroRelatorio?: string
    titulo: string
    descricao?: string
    tipoRelatorio?: 'INSPECAO' | 'VISTORIA' | 'LAUDO' | 'OUTRO'
    observacoesGerais?: string
    conclusao?: string
    recomendacoes?: string
    data: string
    status: 'RASCUNHO' | 'FINALIZADO'
    itens: Item[]
    fotos: Photo[]
  }
}

export function RelatorioForm({ relatorioId, initialData }: RelatorioFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [items, setItems] = useState<Item[]>(initialData?.itens || [])
  const [photos, setPhotos] = useState<Photo[]>(initialData?.fotos || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const isFinalizado = initialData?.status === 'FINALIZADO'
  const isReadonly = isFinalizado

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RelatorioFormData>({
    resolver: zodResolver(relatorioSchema),
    defaultValues: initialData || {
      titulo: '',
      descricao: '',
      tipoRelatorio: 'INSPECAO',
      observacoesGerais: '',
      conclusao: '',
      recomendacoes: '',
      data: new Date().toISOString().split('T')[0],
      status: 'RASCUNHO',
    },
  })

  // IMPORTANTE: Limpa e atualiza estado quando relatorioId ou initialData mudarem
  // Isso garante que fotos e itens de um relatório não sejam reutilizados em outro
  useEffect(() => {
    // IMPORTANTE: Não sobrescreve fotos novas (com tempId) ao atualizar initialData
    // Isso evita que fotos recém-adicionadas sejam perdidas
    if (relatorioId) {
      // Modo edição: usa dados iniciais do relatório
      // IMPORTANTE: Preserva fotos novas (sem id, com tempId) ao atualizar
      if (initialData) {
        setItems(initialData.itens || [])
        
        // IMPORTANTE: Preserva fotos novas (sem id, com tempId) ao atualizar initialData
        // Usa forma funcional do setState para garantir que usa o estado atual
        setPhotos((fotosAtuais) => {
          const fotosNovasNoEstado = fotosAtuais.filter(p => !p.id && p.tempId)
          if (fotosNovasNoEstado.length === 0) {
            // Não há fotos novas, pode atualizar normalmente
            // Deduplica fotos de initialData baseado em ID ou URL
            const fotosUnicas = new Map<string, Photo>()
            for (const foto of (initialData.fotos || [])) {
              if (foto.id) {
                fotosUnicas.set(foto.id, foto)
              } else if (foto.url) {
                const urlKey = `url-${foto.url.trim().toLowerCase()}`
                if (!fotosUnicas.has(urlKey)) {
                  fotosUnicas.set(urlKey, foto)
                }
              }
            }
            return Array.from(fotosUnicas.values())
          } else {
            // Há fotos novas, preserva-as e mescla com fotos existentes
            // Deduplica para evitar duplicatas
            const fotosUnicas = new Map<string, Photo>()
            
            // Primeiro adiciona fotos existentes (com ID)
            for (const foto of (initialData.fotos || [])) {
              if (foto.id) {
                fotosUnicas.set(foto.id, foto)
              }
            }
            
            // Depois adiciona fotos novas (sem ID, com tempId), evitando duplicatas por URL
            for (const fotoNova of fotosNovasNoEstado) {
              if (fotoNova.url) {
                const urlKey = `url-${fotoNova.url.trim().toLowerCase()}`
                // Só adiciona se não houver foto existente com mesma URL
                const urlJaExiste = Array.from(fotosUnicas.values()).some(
                  f => f.url?.trim().toLowerCase() === fotoNova.url?.trim().toLowerCase()
                )
                if (!urlJaExiste) {
                  fotosUnicas.set(`temp-${fotoNova.tempId}`, fotoNova)
                }
              } else {
                // Foto sem URL, adiciona com tempId como chave
                fotosUnicas.set(`temp-${fotoNova.tempId}`, fotoNova)
              }
            }
            
            return Array.from(fotosUnicas.values())
          }
        })
      }
    } else {
      // Modo criação: limpa tudo
      setItems([])
      setPhotos([])
    }

    // Atualiza formulário
    if (initialData) {
      setValue('titulo', initialData.titulo)
      setValue('descricao', initialData.descricao || '')
      setValue('tipoRelatorio', initialData.tipoRelatorio || 'INSPECAO')
      setValue('observacoesGerais', initialData.observacoesGerais || '')
      setValue('conclusao', initialData.conclusao || '')
      setValue('recomendacoes', initialData.recomendacoes || '')
      // IMPORTANTE: Converte data ISO para formato yyyy-MM-dd (requerido por input type="date")
      const dataFormatada = initialData.data 
        ? new Date(initialData.data).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      setValue('data', dataFormatada)
      setValue('status', initialData.status)
    } else {
      // Limpa formulário em modo criação
      setValue('titulo', '')
      setValue('descricao', '')
      setValue('tipoRelatorio', 'INSPECAO')
      setValue('observacoesGerais', '')
      setValue('conclusao', '')
      setValue('recomendacoes', '')
      setValue('data', new Date().toISOString().split('T')[0])
      setValue('status', 'RASCUNHO')
    }

    // Limpa erro ao trocar de relatório
    setError(null)
    // IMPORTANTE: Dependências: apenas relatorioId e setValue
    // NÃO inclui initialData para evitar sobrescrever fotos novas
  }, [relatorioId, setValue]) // Removido initialData das dependências

  const onSubmit = async (data: RelatorioFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // IMPORTANTE: Usa photos e items do estado ATUAL
      // React garante que o estado é sempre atualizado, mas para garantir,
      // vamos criar uma cópia imutável dos arrays
      let currentPhotos = [...photos] // Cria cópia imutável
      const currentItems = [...items] // Cria cópia imutável

      // PASSO 0: Deduplica fotos antes de processar
      // Remove duplicatas baseadas em URL (para fotos sem ID) ou ID (para fotos com ID)
      const fotosUnicas: Photo[] = []
      const urlsVistas = new Set<string>()
      const idsVistos = new Set<string>()
      
      for (const photo of currentPhotos) {
        // Se tem ID, usa ID como chave única
        if (photo.id) {
          if (!idsVistos.has(photo.id)) {
            idsVistos.add(photo.id)
            fotosUnicas.push(photo)
          }
        } 
        // Se não tem ID mas tem URL, usa URL como chave única
        else if (photo.url) {
          const urlNormalizada = photo.url.trim()
          if (!urlsVistas.has(urlNormalizada)) {
            urlsVistas.add(urlNormalizada)
            fotosUnicas.push(photo)
          }
        }
        // Se não tem nem ID nem URL, mantém apenas uma (primeira ocorrência)
        else {
          // Mantém apenas se não houver outra foto sem ID/URL já adicionada
          const jaExisteSemIdUrl = fotosUnicas.some(f => !f.id && !f.url)
          if (!jaExisteSemIdUrl) {
            fotosUnicas.push(photo)
          }
        }
      }
      
      // Atualiza currentPhotos com fotos deduplicadas
      currentPhotos = fotosUnicas
      
      // Log de deduplicação
      if (photos.length !== currentPhotos.length) {
        console.log('[FORM] ⚠️ Fotos duplicadas removidas:', {
          antes: photos.length,
          depois: currentPhotos.length,
          removidas: photos.length - currentPhotos.length,
        })
      }

      // PASSO 1: Identifica fotos novas (sem id) que precisam ser salvas
      // IMPORTANTE: Fotos novas são identificadas por:
      // - NÃO ter id (não foram salvas no banco ainda)
      // - Ter tempId (marcadas explicitamente como novas no upload)
      // - Ter URL válida (já foi feito upload para /api/upload)
      const novasFotos = currentPhotos
        .filter((photo) => {
          // Foto nova: NÃO tem id (critério principal)
          // tempId é apenas um marcador adicional, mas o critério é não ter id
          const isNova = !photo.id // Foto nova não tem id (não foi salva no banco)
          const temUrl = !!photo.url && photo.url.trim() !== '' // URL válida e não vazia
          const urlValida = photo.url && (
            photo.url.startsWith('http://') || 
            photo.url.startsWith('https://') || 
            photo.url.startsWith('/') ||
            photo.url.startsWith('data:') // Base64 data URL
          ) // URL válida (http, https, caminho relativo ou data URL)
          
          const deveIncluir = isNova && temUrl && urlValida
          
          if (isNova && !deveIncluir) {
            console.warn('[FORM] Foto nova descartada no filtro:', {
              nome: photo.nome,
              temId: !!photo.id,
              temTempId: !!photo.tempId,
              temUrl,
              urlValida,
              url: photo.url ? photo.url.substring(0, 50) : 'SEM URL',
            })
          }
          
          return deveIncluir
        })
        .map((photo) => {
          // IMPORTANTE: Cria novo objeto para garantir imutabilidade
          const url = String(photo.url).trim()
          if (!url || url === '') {
            throw new Error(`Foto "${photo.nome}" não possui URL válida`)
          }
          
          return {
            url, // URL válida e validada
            nome: String(photo.nome).trim(), // Garante string válida
            ordem: Number(photo.ordem) || 0, // Garante número válido
          }
        })

      console.log('[FORM] ===== INÍCIO DO FLUXO DE SALVAMENTO =====')
      console.log('[FORM] Modo:', relatorioId ? 'edição' : 'criação')
      console.log('[FORM] Total de fotos no estado:', currentPhotos.length)
      console.log('[FORM] Fotos no estado:', currentPhotos.map((p, idx) => ({
        index: idx,
        id: p.id || 'SEM ID',
        tempId: p.tempId || 'SEM TEMP_ID',
        nome: p.nome,
        temUrl: !!p.url,
        url: p.url ? p.url.substring(0, 50) : 'SEM URL',
        isNova: !p.id,
      })))
      console.log('[FORM] Fotos novas identificadas:', novasFotos.length)
      console.log('[FORM] Detalhes das fotos novas:', novasFotos.map(f => ({
        nome: f.nome,
        ordem: f.ordem,
        url: f.url ? f.url.substring(0, 50) : 'SEM URL',
      })))
      console.log('[FORM] ===========================================')

      // PASSO 2: Se for criação, cria o relatório PRIMEIRO para obter o ID
      let relatorioIdFinal = relatorioId
      
      if (!relatorioId) {
        // Modo criação: cria relatório primeiro
        const payload = {
          ...data,
          itens: currentItems,
        }
        
        const response = await fetch('/api/relatorios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        let result: any = {}
        try {
          const text = await response.text()
          if (text) {
            result = JSON.parse(text)
          }
        } catch (jsonError) {
          console.error('[FORM] Erro ao parsear JSON da resposta:', jsonError)
        }

        if (!response.ok) {
          let errorMessage = 'Erro ao criar relatório'
          if (result?.message) errorMessage = result.message
          else if (result?.error) errorMessage = result.error
          setError(errorMessage)
          return
        }

        relatorioIdFinal = result?.id || null
        if (!relatorioIdFinal) {
          setError('Erro: ID do relatório não foi obtido. Tente novamente.')
          return
        }
      }

      // PASSO 3: Faz upload das fotos novas SEMPRE que houver fotos novas
      // IMPORTANTE: Em modo edição, faz ANTES de salvar o relatório
      // Em modo criação, faz DEPOIS de criar o relatório
      // Isso garante que as fotos estejam persistidas antes de atualizar o estado
      
      // Variável para armazenar fotos atualizadas após upload
      let fotosAposUpload = currentPhotos
      
      if (novasFotos.length > 0 && relatorioIdFinal) {
        console.log('[FORM] ✅ INICIANDO upload de fotos novas:', {
          relatorioId: relatorioIdFinal,
          count: novasFotos.length,
          modo: relatorioId ? 'edição (antes de salvar)' : 'criação (após criar)',
        })
        
        try {
          const fotoResponse = await fetch(
            `/api/relatorios/${relatorioIdFinal}/fotos`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fotos: novasFotos }),
            }
          )

          console.log('[FORM] Resposta do upload:', {
            status: fotoResponse.status,
            ok: fotoResponse.ok,
          })

          if (!fotoResponse.ok) {
            let fotoError = 'Erro ao adicionar fotos'
            try {
              const fotoText = await fotoResponse.text()
              if (fotoText) {
                const fotoResult = JSON.parse(fotoText)
                if (fotoResult?.message) fotoError = fotoResult.message
                else if (fotoResult?.error) fotoError = fotoResult.error
              }
            } catch {}
            
            console.error('[FORM] ❌ Erro ao fazer upload de fotos:', fotoError)
            setError(`Erro ao adicionar fotos: ${fotoError}`)
            return // IMPORTANTE: Aborta o fluxo se upload de fotos falhar
          }

          // IMPORTANTE: Obtém as fotos criadas da resposta
          const fotoResult = await fotoResponse.json()
          const fotosCriadas = fotoResult.fotos || []
          
          console.log('[FORM] ✅ Fotos salvas com sucesso:', {
            relatorioId: relatorioIdFinal,
            count: fotosCriadas.length,
            fotosCriadas: fotosCriadas.map((f: any) => ({ id: f.id, nome: f.nome })),
          })

          // PASSO 4: Atualiza o estado local com as fotos persistidas (com IDs)
          // Substitui fotos temporárias (sem id) pelas fotos salvas (com id)
          // IMPORTANTE: Remove duplicatas durante a atualização
          const fotosAtualizadasMap = new Map<string, Photo>()
          
          // Primeiro, adiciona todas as fotos existentes (com ID) ao mapa
          for (const photo of currentPhotos) {
            if (photo.id) {
              fotosAtualizadasMap.set(photo.id, photo)
            }
          }
          
          // Depois, substitui fotos sem ID pelas fotos criadas (com ID)
          for (const photo of currentPhotos) {
            if (!photo.id && photo.url) {
              const fotoCriada = fotosCriadas.find(
                (fc: any) => fc.url === photo.url && fc.nome === photo.nome
              )
              if (fotoCriada && !fotosAtualizadasMap.has(fotoCriada.id)) {
                // Adiciona foto com ID do banco (evita duplicatas)
                fotosAtualizadasMap.set(fotoCriada.id, {
                  id: fotoCriada.id,
                  nome: fotoCriada.nome,
                  ordem: fotoCriada.ordem,
                  url: fotoCriada.url,
                })
              }
            }
          }
          
          // Converte mapa para array e ordena por ordem
          fotosAposUpload = Array.from(fotosAtualizadasMap.values()).sort(
            (a, b) => a.ordem - b.ordem
          )
          
          // Atualiza estado com fotos persistidas (sem duplicatas)
          setPhotos(fotosAposUpload)
          
          console.log('[FORM] Estado atualizado com fotos persistidas:', {
            totalFotos: fotosAposUpload.length,
            fotosComId: fotosAposUpload.filter(p => p.id).length,
          })
          
        } catch (fotoError) {
          console.error('[FORM] ❌ Erro ao fazer upload de fotos:', fotoError)
          setError(`Erro ao adicionar fotos: ${fotoError instanceof Error ? fotoError.message : 'Erro desconhecido'}`)
          return // Aborta o fluxo
        }
      }

      // PASSO 5: Salva/atualiza o relatório (após fotos serem persistidas)
      if (relatorioId) {
        // Modo edição: atualiza relatório
        // IMPORTANTE: Usa fotos atualizadas (após upload) para calcular fotos deletadas
        const initialPhotoIds = new Set(
          (initialData?.fotos || []).filter((f) => f.id).map((f) => f.id!)
        )
        const currentPhotoIds = new Set(
          fotosAposUpload.filter((p) => p.id).map((p) => p.id!)
        )
        const fotosParaDeletar = Array.from(initialPhotoIds).filter(
          (id) => !currentPhotoIds.has(id)
        )

        const payload = {
          ...data,
          itens: currentItems,
          ...(fotosParaDeletar.length > 0 ? { fotosParaDeletar } : {}),
        }

        const response = await fetch(`/api/relatorios/${relatorioId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        // Tratamento defensivo de response.json()
        let result: any = {}
        try {
          const text = await response.text()
          if (text) {
            result = JSON.parse(text)
          }
        } catch (jsonError) {
          console.error('[FORM] Erro ao parsear JSON da resposta:', jsonError)
        }

        if (!response.ok) {
          let errorMessage = 'Erro ao salvar relatório'
          if (result?.message) errorMessage = result.message
          else if (result?.error) errorMessage = result.error
          setError(errorMessage)
          setIsLoading(false)
          return
        }
        
        // IMPORTANTE: Em modo edição, após PUT bem-sucedido, já podemos considerar sucesso
        // O refetch abaixo vai atualizar os dados, mas não devemos bloquear o fluxo
        console.log('[FORM] ✅ Relatório atualizado com sucesso (PUT)')
      }

      // PASSO 6: Faz upload de fotos novas se ainda houver (modo criação)
      // Em modo criação, as fotos são enviadas após criar o relatório
      if (novasFotos.length > 0 && relatorioIdFinal && !relatorioId) {
        console.log('[FORM] ✅ Fazendo upload de fotos novas após criar relatório:', {
          relatorioId: relatorioIdFinal,
          count: novasFotos.length,
        })
        
        try {
          const fotoResponse = await fetch(
            `/api/relatorios/${relatorioIdFinal}/fotos`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fotos: novasFotos }),
            }
          )

          if (!fotoResponse.ok) {
            let fotoError = 'Erro ao adicionar fotos'
            try {
              const fotoText = await fotoResponse.text()
              if (fotoText) {
                const fotoResult = JSON.parse(fotoText)
                if (fotoResult?.message) fotoError = fotoResult.message
                else if (fotoResult?.error) fotoError = fotoResult.error
              }
            } catch {}
            
            console.error('[FORM] ❌ Erro ao fazer upload de fotos:', fotoError)
            setError(`Relatório salvo, mas houve erro ao adicionar fotos: ${fotoError}`)
            // Não retorna - relatório já foi salvo
          } else {
            // IMPORTANTE: Obtém as fotos criadas da resposta
            const fotoResult = await fotoResponse.json()
            const fotosCriadas = fotoResult.fotos || []
            
            console.log('[FORM] ✅ Fotos salvas com sucesso:', {
              relatorioId: relatorioIdFinal,
              count: fotosCriadas.length,
            })

            // Atualiza o estado local com as fotos persistidas (com IDs)
            // IMPORTANTE: Remove duplicatas durante a atualização
            const fotosAtualizadasMap = new Map<string, Photo>()
            
            // Primeiro, adiciona todas as fotos existentes (com ID) ao mapa
            for (const photo of currentPhotos) {
              if (photo.id) {
                fotosAtualizadasMap.set(photo.id, photo)
              }
            }
            
            // Depois, substitui fotos sem ID pelas fotos criadas (com ID)
            for (const photo of currentPhotos) {
              if (!photo.id && photo.url) {
                const fotoCriada = fotosCriadas.find(
                  (fc: any) => fc.url === photo.url && fc.nome === photo.nome
                )
                if (fotoCriada && !fotosAtualizadasMap.has(fotoCriada.id)) {
                  // Adiciona foto com ID do banco (evita duplicatas)
                  fotosAtualizadasMap.set(fotoCriada.id, {
                    id: fotoCriada.id,
                    nome: fotoCriada.nome,
                    ordem: fotoCriada.ordem,
                    url: fotoCriada.url,
                  })
                }
              }
            }
            
            // Converte mapa para array e ordena por ordem
            const fotosAtualizadas = Array.from(fotosAtualizadasMap.values()).sort(
              (a, b) => a.ordem - b.ordem
            )
            
            setPhotos(fotosAtualizadas)
          }
        } catch (fotoError) {
          console.error('[FORM] ❌ Erro ao fazer upload de fotos:', fotoError)
          setError(`Relatório salvo, mas houve erro ao adicionar fotos`)
          // Não retorna - relatório já foi salvo
        }
      }

      // PASSO 7: Finaliza o fluxo (toast, scroll e navegação)

      // Determina a mensagem de sucesso baseada no status e se é criação ou edição
      const mensagemSucesso = data.status === 'FINALIZADO' 
        ? 'Relatório finalizado com sucesso' 
        : relatorioId 
          ? 'Relatório atualizado com sucesso' 
          : 'Relatório criado com sucesso'

      // Exibe toast de sucesso
      setSuccessMessage(mensagemSucesso)

      // Faz scroll para o topo da página
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Redireciona para a página de visualização após um breve delay
      // Isso permite que o usuário veja o toast antes do redirecionamento
      setTimeout(() => {
        router.push(`/relatorios/${relatorioIdFinal}`)
        router.refresh()
      }, 1500) // 1.5 segundos para o usuário ver o feedback
    } catch (err) {
      console.error('[FORM] Erro ao salvar relatório:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao salvar relatório. Tente novamente.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

      {/* Cabeçalho com informações do relatório */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
        {initialData?.numeroRelatorio && (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Número do Relatório:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {initialData.numeroRelatorio}
              </span>
            </div>
            <Badge
              variant={initialData.status === 'FINALIZADO' ? 'success' : 'warning'}
            >
              {initialData.status === 'FINALIZADO' ? 'Finalizado' : 'Pendente'}
            </Badge>
          </div>
        )}
        {session?.user && (
          <div>
            <span className="text-sm text-gray-600">Responsável Técnico:</span>
            <span className="ml-2 font-medium text-gray-900">
              {session.user.name || session.user.email}
            </span>
          </div>
        )}
      </div>

      {isReadonly && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
          <p className="text-sm font-medium">
            ⚠️ Este relatório está finalizado e não pode ser editado.
          </p>
        </div>
      )}

      <Input
        label="Título *"
        {...register('titulo')}
        error={errors.titulo?.message}
        placeholder="Digite o título do relatório"
        disabled={isReadonly}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Tipo de Relatório *"
          {...register('tipoRelatorio')}
          error={errors.tipoRelatorio?.message}
          disabled={isReadonly}
          options={[
            { value: 'INSPECAO', label: 'Inspeção' },
            { value: 'VISTORIA', label: 'Vistoria' },
            { value: 'LAUDO', label: 'Laudo' },
            { value: 'OUTRO', label: 'Outro' },
          ]}
        />

        <Input
          label="Data *"
          type="date"
          {...register('data')}
          error={errors.data?.message}
          disabled={isReadonly}
        />
      </div>

      <Textarea
        label="Descrição"
        {...register('descricao')}
        error={errors.descricao?.message}
        placeholder="Descreva o relatório..."
        rows={4}
        disabled={isReadonly}
      />

      <ItemList items={items} onItemsChange={setItems} readonly={isReadonly} />

      <PhotoUpload photos={photos} onPhotosChange={setPhotos} readonly={isReadonly} />

      {/* Seções adicionais */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900">Informações Adicionais</h3>
        
        <Textarea
          label="Observações Gerais"
          {...register('observacoesGerais')}
          error={errors.observacoesGerais?.message}
          placeholder="Adicione observações gerais sobre o relatório..."
          rows={4}
          disabled={isReadonly}
        />

        <Textarea
          label="Conclusão / Parecer Técnico"
          {...register('conclusao')}
          error={errors.conclusao?.message}
          placeholder="Descreva a conclusão ou parecer técnico..."
          rows={4}
          disabled={isReadonly}
        />

        <Textarea
          label="Recomendações Finais"
          {...register('recomendacoes')}
          error={errors.recomendacoes?.message}
          placeholder="Adicione recomendações finais..."
          rows={4}
          disabled={isReadonly}
        />
      </div>

      {!isReadonly && (
        <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setValue('status', 'RASCUNHO')
            handleSubmit(onSubmit)()
          }}
          disabled={isLoading}
        >
          {relatorioId ? 'Salvar alterações' : 'Salvar relatório'}
        </Button>
        {/* Botão "Finalizar" só aparece na edição (quando relatorioId existe) */}
        {relatorioId && (
          <Button
            type="button"
            onClick={() => {
              setValue('status', 'FINALIZADO')
              handleSubmit(onSubmit)()
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Finalizar'}
          </Button>
        )}
        </div>
      )}

      {isReadonly && (
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Voltar
          </Button>
        </div>
      )}
    </form>
    </>
  )
}

