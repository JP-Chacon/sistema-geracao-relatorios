/**
 * Utilitários para rotas API do Next.js App Router
 * Garante compatibilidade com Next.js 13+ e 15+
 */

/**
 * Resolve params de forma segura, garantindo compatibilidade com Next.js 15+
 * @param params - Parâmetros da rota (pode ser Promise ou objeto)
 * @returns Parâmetros resolvidos como objeto
 */
export async function resolveParams<T extends Record<string, string>>(
  params: Promise<T> | T
): Promise<T> {
  return params instanceof Promise ? await params : params
}

/**
 * Valida e extrai ID de params de forma segura
 * @param params - Parâmetros da rota
 * @param paramName - Nome do parâmetro (padrão: 'id')
 * @returns ID validado como string
 * @throws Erro se ID não for válido
 */
export async function extractIdFromParams(
  params: Promise<{ id: string }> | { id: string },
  paramName: string = 'id'
): Promise<string> {
  const resolvedParams = await resolveParams(params)
  
  if (!resolvedParams || typeof resolvedParams !== 'object') {
    throw new Error(`Parâmetros inválidos: ${paramName} não encontrado`)
  }
  
  const id = (resolvedParams as any)[paramName]
  
  if (!id || typeof id !== 'string') {
    throw new Error(`${paramName} não fornecido ou inválido`)
  }
  
  const trimmedId = String(id).trim()
  
  if (!trimmedId || trimmedId === '') {
    throw new Error(`${paramName} está vazio após trim`)
  }
  
  return trimmedId
}
