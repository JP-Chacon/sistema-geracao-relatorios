'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Item {
  id?: string
  descricao: string
  concluido: boolean
  ordem: number
  observacao?: string
}

interface ItemListProps {
  items: Item[]
  onItemsChange: (items: Item[]) => void
  readonly?: boolean
}

export function ItemList({ items, onItemsChange, readonly = false }: ItemListProps) {
  const [newItemDesc, setNewItemDesc] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editObservacao, setEditObservacao] = useState('')

  const addItem = () => {
    if (!newItemDesc.trim()) return

    const newItem: Item = {
      descricao: newItemDesc.trim(),
      concluido: false,
      ordem: items.length,
      observacao: '',
    }

    onItemsChange([...items, newItem])
    setNewItemDesc('')
  }

  const startEdit = (index: number) => {
    if (readonly) return
    setEditingIndex(index)
    setEditDesc(items[index].descricao)
    setEditObservacao(items[index].observacao || '')
  }

  const saveEdit = () => {
    if (editingIndex === null) return

    const newItems = [...items]
    newItems[editingIndex] = {
      ...newItems[editingIndex],
      descricao: editDesc.trim(),
      observacao: editObservacao.trim() || undefined,
    }
    onItemsChange(newItems)
    setEditingIndex(null)
    setEditDesc('')
    setEditObservacao('')
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditDesc('')
    setEditObservacao('')
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    const reordered = newItems.map((item, i) => ({
      ...item,
      ordem: i,
    }))
    onItemsChange(reordered)
  }

  const toggleItem = (index: number) => {
    if (readonly) return

    const newItems = [...items]
    newItems[index].concluido = !newItems[index].concluido
    onItemsChange(newItems)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Itens do Relatório
        </label>

        {!readonly && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Digite um item..."
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem()
                }
              }}
              className="flex-1"
            />
            <Button type="button" onClick={addItem}>
              Adicionar
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum item adicionado</p>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id || `item-${index}-${item.descricao.substring(0, 10)}`}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                {editingIndex === index ? (
                  // Modo edição
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-gray-600 mt-2">
                        {index + 1}.
                      </span>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Descrição do item"
                          className="w-full"
                        />
                        <Input
                          value={editObservacao}
                          onChange={(e) => setEditObservacao(e.target.value)}
                          placeholder="Observação (opcional)"
                          className="w-full text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={cancelEdit}
                        className="text-sm"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={saveEdit}
                        className="text-sm"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Modo visualização
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.concluido}
                      onChange={() => toggleItem(index)}
                      disabled={readonly}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 disabled:opacity-50 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-gray-600">
                          {index + 1}.
                        </span>
                        <span
                          className={`flex-1 ${
                            readonly
                              ? item.concluido
                                ? 'text-slate-700 line-through'
                                : 'text-slate-800'
                              : item.concluido
                                ? 'line-through text-gray-600'
                                : 'text-gray-800'
                          }`}
                        >
                          {item.descricao}
                        </span>
                      </div>
                      {item.observacao && (
                        <p className="text-sm text-gray-600 mt-1 ml-7 italic">
                          {item.observacao}
                        </p>
                      )}
                    </div>
                    {!readonly && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(index)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Editar item"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                          title="Remover item"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

