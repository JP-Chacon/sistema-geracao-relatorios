import { StatusRelatorio, TipoRelatorio } from '@prisma/client'

export type RelatorioWithRelations = {
  id: string
  numeroRelatorio?: string | null
  titulo: string
  descricao: string | null
  tipoRelatorio?: TipoRelatorio | null
  observacoesGerais?: string | null
  conclusao?: string | null
  recomendacoes?: string | null
  data: Date
  status: StatusRelatorio
  userId: string
  createdAt: Date
  updatedAt: Date
  itens: ItemRelatorio[]
  fotos: FotoListItem[] // URLs carregadas sob demanda
}

// Tipo otimizado para listagem (compatível com Prisma Accelerate)
export type RelatorioListItem = {
  id: string
  numeroRelatorio?: string | null
  titulo: string
  descricao: string | null
  tipoRelatorio?: TipoRelatorio | null
  data: Date
  status: StatusRelatorio
  _count: {
    itens: number
    fotos: number
  }
}

export type ItemRelatorio = {
  id: string
  descricao: string
  concluido: boolean
  ordem: number
  observacao?: string | null
  relatorioId: string
  createdAt: Date
}

export type Foto = {
  id: string
  url: string
  nome: string
  ordem: number
  relatorioId: string
  createdAt: Date
}

// Tipo para foto sem URL (usado na listagem para evitar P6009)
export type FotoListItem = {
  id: string
  nome: string
  descricao?: string | null
  ordem: number
  relatorioId: string
  itemRelatorioId?: string | null
  createdAt: Date
  url?: string // Opcional - carregado sob demanda
}

export type CreateRelatorioInput = {
  titulo: string
  descricao?: string
  data: Date
  status: StatusRelatorio
  itens: Omit<ItemRelatorio, 'id' | 'relatorioId' | 'createdAt'>[]
  fotos?: Omit<Foto, 'id' | 'relatorioId' | 'createdAt'>[]
}

