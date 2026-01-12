import PDFDocument from 'pdfkit'
import { RelatorioWithRelations } from '@/types'
import { formatDate } from '@/lib/utils'
import path from 'path'
import fs from 'fs'

/**
 * Obtém caminhos absolutos das fontes TTF
 * Valida existência dos arquivos e lança erro se não existirem
 * @returns Objeto com caminhos absolutos das fontes
 */
function getFontPaths(): { regular: string; bold: string } {
  // Usa path.resolve para garantir caminho absoluto
  const regularPath = path.resolve(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf')
  const boldPath = path.resolve(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf')

  // Valida Roboto-Regular.ttf (OBRIGATÓRIO)
  if (!fs.existsSync(regularPath)) {
    throw new Error(
      `[PDF] ERRO CRÍTICO: Roboto-Regular.ttf não encontrada em ${regularPath}. ` +
      `A geração de PDF requer esta fonte. Verifique se o arquivo existe.`
    )
  }

  // Valida Roboto-Bold.ttf (OBRIGATÓRIO)
  if (!fs.existsSync(boldPath)) {
    throw new Error(
      `[PDF] ERRO CRÍTICO: Roboto-Bold.ttf não encontrada em ${boldPath}. ` +
      `A geração de PDF requer esta fonte. Verifique se o arquivo existe.`
    )
  }

  return { regular: regularPath, bold: boldPath }
}

/**
 * Registra fontes TTF no PDFDocument
 * IMPORTANTE: Deve ser chamado para CADA nova instância de PDFDocument
 * IMPORTANTE: Deve ser chamado ANTES de qualquer uso de doc.font()
 * @param doc - Instância do PDFDocument onde as fontes serão registradas
 */
function registerFonts(doc: InstanceType<typeof PDFDocument>): void {
  // Obtém caminhos absolutos das fontes
  const fontPaths = getFontPaths()

  // Registra fontes usando nomes (NÃO usar caminhos diretamente em doc.font())
  // Cada instância de PDFDocument precisa ter suas próprias fontes registradas
  doc.registerFont('Roboto', fontPaths.regular)
  doc.registerFont('Roboto-Bold', fontPaths.bold)

  console.log('[PDF] Fontes Roboto registradas com sucesso para esta instância do PDFDocument')
}

/**
 * Desenha uma linha horizontal divisória
 */
function drawDivider(doc: InstanceType<typeof PDFDocument>, y: number, width: number = 495): void {
  const pageWidth = doc.page.width
  const startX = (pageWidth - width) / 2

  doc.moveTo(startX, y)
  doc.lineTo(startX + width, y)
  doc.strokeColor('#cccccc')
  doc.lineWidth(1)
  doc.stroke()
  doc.strokeColor('#000000') // Restaura cor padrão
}

/**
 * Desenha um retângulo com fundo colorido
 */
function drawRect(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string
): void {
  doc.rect(x, y, width, height)
  doc.fillColor(fillColor)
  doc.fill()
  doc.fillColor('#000000') // Restaura cor padrão
}

/**
 * Desenha um retângulo com borda
 */
function drawBorderedRect(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeColor: string = '#e0e0e0',
  fillColor?: string,
  lineWidth: number = 1
): void {
  // Preenche fundo se fornecido
  if (fillColor) {
    drawRect(doc, x, y, width, height, fillColor)
  }

  // Desenha borda
  doc.rect(x, y, width, height)
  doc.strokeColor(strokeColor)
  doc.lineWidth(lineWidth)
  doc.stroke()
  doc.strokeColor('#000000') // Restaura cor padrão
}

/**
 * Desenha cabeçalho do relatório
 * @param doc - Instância do PDFDocument
 * @param relatorio - Dados do relatório
 * @param y - Posição vertical inicial
 * @returns Nova posição Y após o cabeçalho
 */
function drawHeader(
  doc: InstanceType<typeof PDFDocument>,
  relatorio: RelatorioWithRelations,
  y: number
): number {
  const pageWidth = doc.page.width
  const marginLeft = doc.page.margins.left
  const marginRight = doc.page.margins.right
  const availableWidth = pageWidth - marginLeft - marginRight

  const headerStartY = y
  let titleY = y

  // Número do relatório (se existir)
  if (relatorio.numeroRelatorio) {
    doc.font('Roboto')
    doc.fontSize(10)
    doc.fillColor('#666666')
    doc.text(`Nº: ${relatorio.numeroRelatorio}`, marginLeft, titleY, {
      width: availableWidth - 200,
      align: 'left',
    })
    titleY += 15
  }

  // Título do relatório em destaque (lado esquerdo)
  doc.font('Roboto-Bold')
  doc.fontSize(24)
  doc.fillColor('#1a1a1a')
  doc.text(relatorio.titulo, marginLeft, titleY, {
    width: availableWidth - 200, // Deixa espaço para data/status à direita
    align: 'left',
  })

  // Calcula altura do título para posicionar data/status corretamente
  const titleHeight = doc.heightOfString(relatorio.titulo, {
    width: availableWidth - 200,
    align: 'left',
  })

  // Data e Status alinhados à direita (mesma linha do título)
  const rightX = marginLeft + availableWidth - 150
  const rightY = titleY

  // Data
  doc.font('Roboto')
  doc.fontSize(10)
  doc.fillColor('#666666')
  doc.text('Data:', rightX, rightY, {
    width: 70,
    align: 'right',
  })
  doc.font('Roboto-Bold')
  doc.fontSize(10)
  doc.fillColor('#000000')
  doc.text(formatDate(relatorio.data), rightX + 75, rightY, {
    width: 75,
    align: 'left',
  })

  // Status (abaixo da data)
  const statusY = rightY + 15
  doc.font('Roboto')
  doc.fontSize(10)
  doc.fillColor('#666666')
  doc.text('Status:', rightX, statusY, {
    width: 70,
    align: 'right',
  })
  doc.font('Roboto-Bold')
  doc.fontSize(10)
  const statusText = relatorio.status === 'FINALIZADO' ? 'Finalizado' : 'Pendente'
  const statusColor = relatorio.status === 'FINALIZADO' ? '#2d5016' : '#666666'
  doc.fillColor(statusColor)
  doc.text(statusText, rightX + 75, statusY, {
    width: 75,
    align: 'left',
  })
  doc.fillColor('#000000') // Restaura cor padrão

  // Linha divisória abaixo do cabeçalho
  // Calcula altura total do cabeçalho (título ou status, o que for maior)
  const headerHeight = Math.max(titleHeight, statusY + 15 - titleY)
  const dividerY = headerStartY + headerHeight + 15
  drawDivider(doc, dividerY, availableWidth)

  return dividerY + 20 // Retorna nova posição Y
}

/**
 * Desenha um card de item do relatório
 * @param doc - Instância do PDFDocument
 * @param item - Item do relatório
 * @param index - Índice do item (para numeração)
 * @param y - Posição vertical inicial
 * @returns Nova posição Y após o card
 */
function drawItemCard(
  doc: InstanceType<typeof PDFDocument>,
  item: { descricao: string; concluido: boolean; observacao?: string | null },
  index: number,
  y: number
): number {
  const pageWidth = doc.page.width
  const marginLeft = doc.page.margins.left
  const marginRight = doc.page.margins.right
  const availableWidth = pageWidth - marginLeft - marginRight

  const cardPadding = 15
  const cardStartY = y
  const cardWidth = availableWidth
  let cardHeight = cardPadding * 2

  // Calcula altura necessária para o texto
  doc.font('Roboto')
  doc.fontSize(11)
  const textHeight = doc.heightOfString(item.descricao, {
    width: cardWidth - cardPadding * 2 - 60, // Deixa espaço para numeração e checkbox
  })

  // Adiciona altura para observação se existir
  let observacaoHeight = 0
  if (item.observacao && item.observacao.trim()) {
    doc.fontSize(9)
    observacaoHeight = doc.heightOfString(item.observacao, {
      width: cardWidth - cardPadding * 2 - 60,
    }) + 10 // Espaçamento adicional
  }

  cardHeight += Math.max(textHeight, 20) + observacaoHeight // Mínimo 20px de altura

  // Desenha borda do card
  drawBorderedRect(doc, marginLeft, cardStartY, cardWidth, cardHeight, '#e0e0e0', '#fafafa', 1)

  // Numeração do item
  doc.font('Roboto-Bold')
  doc.fontSize(12)
  doc.fillColor('#666666')
  doc.text(`${index + 1}.`, marginLeft + cardPadding, cardStartY + cardPadding, {
    width: 30,
    align: 'left',
  })

  // Checkbox visual
  const checkboxX = marginLeft + cardPadding + 35
  const checkbox = item.concluido ? '☑' : '☐'
  const checkboxColor = item.concluido ? '#2d5016' : '#999999'
  doc.font('Roboto-Bold')
  doc.fontSize(14)
  doc.fillColor(checkboxColor)
  doc.text(checkbox, checkboxX, cardStartY + cardPadding - 2, {
    width: 20,
    align: 'left',
  })

  // Título/Descrição do item
  const textX = checkboxX + 25
  doc.font('Roboto-Bold')
  doc.fontSize(11)
  doc.fillColor('#333333')
  const descY = cardStartY + cardPadding
  doc.text(item.descricao, textX, descY, {
    width: cardWidth - textX - cardPadding,
    align: 'left',
  })
  doc.fillColor('#000000') // Restaura cor padrão

  // Observação do item (se existir)
  if (item.observacao && item.observacao.trim()) {
    doc.font('Roboto')
    doc.fontSize(9)
    doc.fillColor('#666666')
    const observacaoY = descY + textHeight + 5
      doc.font('Roboto') // Fonte normal para itálico visual
      doc.text(`Obs: ${item.observacao}`, textX, observacaoY, {
        width: cardWidth - textX - cardPadding,
        align: 'left',
      })
    doc.fillColor('#000000') // Restaura cor padrão
  }

  return cardStartY + cardHeight + 15 // Retorna nova posição Y com espaçamento
}

/**
 * Desenha rodapé na página atual
 * @param doc - Instância do PDFDocument
 * @param pageNumber - Número da página atual
 */
function drawFooter(doc: InstanceType<typeof PDFDocument>, pageNumber: number): void {
  const pageHeight = doc.page.height
  const pageWidth = doc.page.width
  const marginLeft = doc.page.margins.left
  const marginRight = doc.page.margins.right
  const availableWidth = pageWidth - marginLeft - marginRight

  // Linha divisória acima do rodapé
  const footerY = pageHeight - 40
  drawDivider(doc, footerY, availableWidth)

  // Data/hora de geração e número da página
  doc.font('Roboto')
  doc.fontSize(8)
  doc.fillColor('#666666')
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR')
  const footerText = `Gerado em ${dateStr} às ${timeStr} - Página ${pageNumber}`
  doc.text(footerText, marginLeft, footerY + 8, {
    width: availableWidth,
    align: 'center',
  })
  doc.fillColor('#000000') // Restaura cor padrão
}

/**
 * Verifica se há espaço suficiente na página atual e cria nova página se necessário
 * Esta é a função centralizada de controle de espaço e quebras de página
 * @param doc - Instância do PDFDocument
 * @param relatorio - Dados do relatório (para repetir cabeçalho)
 * @param currentY - Posição Y atual
 * @param currentPage - Número da página atual
 * @param heightNeeded - Altura necessária em pontos para o próximo bloco
 * @returns Objeto com nova posição Y e número da página
 */
function ensureSpace(
  doc: InstanceType<typeof PDFDocument>,
  relatorio: RelatorioWithRelations,
  currentY: number,
  currentPage: number,
  heightNeeded: number
): { y: number; page: number } {
  const pageHeight = doc.page.height
  const footerHeight = 50 // Altura reservada para rodapé
  const marginTop = doc.page.margins.top
  const marginBottom = doc.page.margins.bottom

  // Calcula espaço disponível na página atual (altura total - Y atual - rodapé - margem inferior)
  const availableSpace = pageHeight - currentY - footerHeight - marginBottom

  // Só cria nova página se realmente não houver espaço suficiente
  if (availableSpace < heightNeeded) {
    // Cria nova página (NÃO desenha rodapé aqui - será desenhado no final)
    doc.addPage()
    doc.font('Roboto') // OBRIGATÓRIO após addPage()

    // Repete cabeçalho na nova página
    const newY = drawHeader(doc, relatorio, marginTop)

    return { y: newY, page: currentPage + 1 }
  }

  return { y: currentY, page: currentPage }
}

/**
 * Baixa imagem de URL e retorna como buffer
 */
async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Erro ao buscar imagem: ${res.statusText}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Processa todas as fotos e retorna buffers
 */
async function processPhotos(
  fotos: Array<{ url?: string; nome: string }>
): Promise<Array<{ buffer: Buffer | null; nome: string }>> {
  const result: Array<{ buffer: Buffer | null; nome: string }> = []

  for (const foto of fotos) {
    if (!foto.url) {
      result.push({ buffer: null, nome: foto.nome })
      continue
    }

    try {
      const buffer = await fetchImageAsBuffer(foto.url)
      result.push({ buffer, nome: foto.nome })
    } catch {
      result.push({ buffer: null, nome: foto.nome })
    }
  }

  return result
}

/**
 * Gera um PDF profissional do relatório usando PDFKit puro
 * 
 * @param relatorio - Relatório completo com itens e fotos
 * @returns Buffer do PDF gerado
 */
export async function generatePDF(relatorio: RelatorioWithRelations): Promise<Buffer> {
  // Cria documento PDF
  // OBRIGATÓRIO: font: null desativa completamente as fontes padrão do PDFKit
  // Isso previne que o PDFKit tente carregar Helvetica.afm internamente no construtor
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    autoFirstPage: false,
    font: null as any, // Desativa fontes padrão (Helvetica, etc.) - cast necessário para TypeScript
  })

  // OBRIGATÓRIO: Registra fontes TTF manualmente ANTES de qualquer uso
  registerFonts(doc)

  // OBRIGATÓRIO: Define fonte padrão imediatamente após registro
  // Isso garante que nenhum texto use fontes padrão
  doc.font('Roboto')

  // Processa fotos ANTES de começar a escrever no PDF
  const photos = await processPhotos(relatorio.fotos)

  // Buffer para armazenar o PDF
  const chunks: Buffer[] = []
  doc.on('data', (c) => chunks.push(c))

  // Contador de páginas
  let currentPage = 1

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // === PÁGINA PRINCIPAL ===
    doc.addPage()
    doc.font('Roboto') // OBRIGATÓRIO após addPage()

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height
    const marginLeft = doc.page.margins.left
    const marginRight = doc.page.margins.right
    const marginTop = doc.page.margins.top
    const availableWidth = pageWidth - marginLeft - marginRight

    // Controle manual de posição Y
    let currentY = marginTop
    let currentPage = 1

    // === CABEÇALHO ===
    currentY = drawHeader(doc, relatorio, currentY)

    // === SEÇÃO: DESCRIÇÃO ===
    if (relatorio.descricao && relatorio.descricao.trim()) {
      // Calcula altura necessária: título (20px) + conteúdo + espaçamento (20px)
      doc.font('Roboto')
      doc.fontSize(11)
      const descHeight = doc.heightOfString(relatorio.descricao, {
        width: availableWidth,
        align: 'justify',
        lineGap: 3,
      })
      const totalHeight = 20 + descHeight + 20

      // Verifica espaço antes de iniciar seção
      const pageCheck = ensureSpace(doc, relatorio, currentY, currentPage, totalHeight)
      currentY = pageCheck.y
      currentPage = pageCheck.page

      // Título da seção
      doc.font('Roboto-Bold')
      doc.fontSize(14)
      doc.fillColor('#333333')
      doc.text('Descrição do Relatório', marginLeft, currentY, {
        width: availableWidth,
        align: 'left',
      })
      currentY += 20

      // Conteúdo da descrição
      doc.font('Roboto')
      doc.fontSize(11)
      doc.fillColor('#333333')
      doc.text(relatorio.descricao, marginLeft, currentY, {
        width: availableWidth,
        align: 'justify',
        lineGap: 3,
      })
      doc.fillColor('#000000') // Restaura cor padrão
      currentY += descHeight + 20
    }

    // === SEÇÃO: ITENS DO RELATÓRIO ===
    if (relatorio.itens.length) {
      // Título da seção (altura: 25px)
      const titleHeight = 25
      const pageCheck = ensureSpace(doc, relatorio, currentY, currentPage, titleHeight)
      currentY = pageCheck.y
      currentPage = pageCheck.page

      doc.font('Roboto-Bold')
      doc.fontSize(14)
      doc.fillColor('#333333')
      doc.text('Itens do Relatório', marginLeft, currentY, {
        width: availableWidth,
        align: 'left',
      })
      currentY += titleHeight

      // Desenha cards dos itens
      relatorio.itens.forEach((item, index) => {
        // Estima altura do card antes de desenhar
        doc.font('Roboto')
        doc.fontSize(11)
        const textHeight = doc.heightOfString(item.descricao, {
          width: availableWidth - 30 - 60, // cardPadding * 2 - numeração - checkbox
        })
        let itemHeight = 30 + Math.max(textHeight, 20) + 15 // padding + texto + espaçamento
        if (item.observacao && item.observacao.trim()) {
          doc.fontSize(9)
          const obsHeight = doc.heightOfString(item.observacao, {
            width: availableWidth - 30 - 60,
          })
          itemHeight += obsHeight + 10
        }

        // Verifica espaço antes de cada item
        const pageCheck = ensureSpace(doc, relatorio, currentY, currentPage, itemHeight)
        currentY = pageCheck.y
        currentPage = pageCheck.page

        // Desenha card do item
        currentY = drawItemCard(doc, item, index, currentY)
      })
    }

    // === SEÇÃO: FOTOS DO RELATÓRIO ===
    if (photos.length) {
      // Adiciona espaçamento visual antes da seção de fotos
      currentY += 15

      // Recalcula dimensões da página
      const pageWidthFotos = doc.page.width
      const marginLeftFotos = doc.page.margins.left
      const marginRightFotos = doc.page.margins.right
      const marginTopFotos = doc.page.margins.top
      const availableWidthFotos = pageWidthFotos - marginLeftFotos - marginRightFotos

      // Configurações do grid profissional
      const gap = 25 // Espaço entre imagens (aumentado para melhor visual)
      const cardPadding = 8 // Padding interno do card
      const cardBorderWidth = 1.5 // Largura da borda
      const legendHeight = 20 // Altura da legenda abaixo da imagem
      const rowSpacing = 30 // Espaçamento vertical entre linhas

      // Altura necessária para título da seção
      const titleHeight = 25
      const pageCheckTitle = ensureSpace(doc, relatorio, currentY, currentPage, titleHeight)
      currentY = pageCheckTitle.y
      currentPage = pageCheckTitle.page

      // Título da seção
      doc.font('Roboto-Bold')
      doc.fontSize(14)
      doc.fillColor('#333333')
      doc.text('Fotos do Relatório', marginLeftFotos, currentY, {
        width: availableWidthFotos,
        align: 'left',
      })
      currentY += titleHeight + 15 // Espaço após título (aumentado levemente)

      let currentCol = 0
      let rowStartY = currentY // Y inicial da linha atual

      for (let i = 0; i < photos.length; i++) {
        const foto = photos[i]

        // Detecta se é a última foto e se está sozinha na linha
        const isLastPhoto = i === photos.length - 1
        const isAloneInRow = isLastPhoto && currentCol === 0 && photos.length % 2 !== 0
        
        // Calcula largura da imagem: maior se estiver sozinha, menor se for grid de 2
        let imageWidth: number
        if (isAloneInRow) {
          // Foto solitária ocupa 60% da largura disponível (mais destaque)
          imageWidth = availableWidthFotos * 0.6
        } else {
          // Grid de 2 fotos: divide espaço disponível
          imageWidth = (availableWidthFotos - gap) / 2
        }
        
        const imageHeight = imageWidth * 0.75 // Proporção 4:3 (mais profissional)

        // Calcula altura necessária para uma linha completa (imagem + legenda + espaçamento)
        // Se for foto sozinha, usa altura maior; se for grid, usa altura padrão
        const rowHeight = imageHeight + legendHeight + rowSpacing

        // Verifica se precisa de nova página ANTES de desenhar a linha
        // Se for a primeira foto da linha, verifica espaço para a linha completa
        if (currentCol === 0) {
          // Para verificação de espaço, usa a altura calculada (já considera se está sozinha)
          const pageCheck = ensureSpace(doc, relatorio, currentY, currentPage, rowHeight)
          
          // Se nova página foi criada, reseta coluna e adiciona título de continuação
          if (pageCheck.page > currentPage) {
            currentPage = pageCheck.page
            currentCol = 0
            
            // Título da seção (continuação)
            doc.font('Roboto-Bold')
            doc.fontSize(14)
            doc.fillColor('#333333')
            doc.text('Fotos do Relatório (continuação)', marginLeftFotos, pageCheck.y, {
              width: availableWidthFotos,
              align: 'left',
            })
            currentY = pageCheck.y + titleHeight + 15
          } else {
            currentY = pageCheck.y
          }
          rowStartY = currentY
        }

        // Calcula posição X da foto (alinhada à esquerda, seguindo o fluxo do documento)
        // Se estiver sozinha, centraliza levemente (mas mantém alinhamento à esquerda)
        let x: number
        if (isAloneInRow) {
          // Foto solitária: mantém alinhamento à esquerda, mas com um pequeno offset visual
          x = marginLeftFotos
        } else {
          // Grid de 2: calcula posição baseada na coluna
          x = marginLeftFotos + currentCol * (imageWidth + gap)
        }
        const imageY = rowStartY

        // Desenha card com borda (container profissional)
        const cardX = x
        const cardY = imageY
        const cardWidth = imageWidth
        const cardHeight = imageHeight + legendHeight

        // Fundo do card (opcional, leve)
        drawRect(doc, cardX, cardY, cardWidth, cardHeight, '#fafafa')

        // Borda do card
        drawBorderedRect(
          doc,
          cardX,
          cardY,
          cardWidth,
          cardHeight,
          '#d0d0d0',
          undefined,
          cardBorderWidth
        )

        // Área da imagem (dentro do card)
        const imageAreaX = cardX + cardPadding
        const imageAreaY = cardY + cardPadding
        const imageAreaWidth = cardWidth - cardPadding * 2
        const imageAreaHeight = imageHeight - cardPadding * 2

        // Adiciona imagem ou placeholder
        if (foto.buffer) {
          try {
            // Adiciona imagem mantendo proporção e preenchendo o espaço disponível
            doc.image(foto.buffer, imageAreaX, imageAreaY, {
              fit: [imageAreaWidth, imageAreaHeight],
              align: 'center',
              valign: 'center',
            })
          } catch (error) {
            console.error(`[PDF] Erro ao adicionar foto ${foto.nome}:`, error)
            doc.font('Roboto')
            doc.fontSize(9)
            doc.fillColor('#999999')
            doc.text('[Erro ao carregar imagem]', imageAreaX, imageAreaY + imageAreaHeight / 2, {
              width: imageAreaWidth,
              align: 'center',
            })
            doc.fillColor('#000000')
          }
        } else {
          doc.font('Roboto')
          doc.fontSize(9)
          doc.fillColor('#999999')
          doc.text('[Imagem indisponível]', imageAreaX, imageAreaY + imageAreaHeight / 2, {
            width: imageAreaWidth,
            align: 'center',
          })
          doc.fillColor('#000000')
        }

        // Legenda padronizada abaixo da imagem (dentro do card)
        const legendY = cardY + imageHeight + 5
        doc.font('Roboto')
        doc.fontSize(9)
        doc.fillColor('#666666')
        // Formato: "Foto 1 — Nome da Foto"
        const legendText = `Foto ${i + 1} — ${foto.nome}`
        doc.text(legendText, cardX + cardPadding, legendY, {
          width: cardWidth - cardPadding * 2,
          align: 'left',
        })
        doc.fillColor('#000000')

        // Move para próxima coluna
        currentCol++
        if (currentCol >= 2) {
          // Nova linha: move Y para baixo da linha atual
          currentCol = 0
          currentY = rowStartY + rowHeight
          rowStartY = currentY // Atualiza Y inicial da próxima linha
        }
      }

      // Ajusta posição Y final corretamente
      if (currentCol > 0) {
        // Última linha tinha apenas 1 foto (não completou o grid de 2)
        // Y final deve ser após a foto solitária
        // Recalcula imageHeight para a última foto (pode ser maior se estava sozinha)
        const lastImageWidth = photos.length % 2 !== 0 
          ? availableWidthFotos * 0.6 
          : (availableWidthFotos - gap) / 2
        const lastImageHeight = lastImageWidth * 0.75
        currentY = rowStartY + lastImageHeight + legendHeight + rowSpacing
      } else if (photos.length > 0 && photos.length % 2 === 0) {
        // Completou uma linha completa (2 fotos)
        // Y já está correto (rowStartY + rowHeight), mas vamos garantir
        currentY = rowStartY
      }
      // Se photos.length % 2 !== 0 e currentCol === 0, significa que completou uma linha
      // e o Y já está correto (rowStartY + rowHeight do último loop)
      
      // Adiciona espaçamento visual após a seção de fotos
      currentY += 10
    }

    // === SEÇÃO: OBSERVAÇÕES GERAIS ===
    if (relatorio.observacoesGerais && relatorio.observacoesGerais.trim()) {
      // Adiciona espaçamento visual antes de "Observações Gerais" (melhor separação)
      currentY += 20
      
      // Calcula altura necessária: título (20px) + conteúdo + espaçamento (20px)
      doc.font('Roboto')
      doc.fontSize(11)
      const obsHeight = doc.heightOfString(relatorio.observacoesGerais, {
        width: availableWidth,
        align: 'justify',
        lineGap: 3,
      })
      const totalHeight = 20 + obsHeight + 20

      // Verifica espaço antes de iniciar seção
      const pageCheck = ensureSpace(doc, relatorio, currentY, currentPage, totalHeight)
      currentY = pageCheck.y
      currentPage = pageCheck.page

      // Título da seção
      doc.font('Roboto-Bold')
      doc.fontSize(14)
      doc.fillColor('#333333')
      doc.text('Observações Gerais', marginLeft, currentY, {
        width: availableWidth,
        align: 'left',
      })
      currentY += 20

      // Conteúdo
      doc.font('Roboto')
      doc.fontSize(11)
      doc.fillColor('#333333')
      doc.text(relatorio.observacoesGerais, marginLeft, currentY, {
        width: availableWidth,
        align: 'justify',
        lineGap: 3,
      })
      doc.fillColor('#000000')
      currentY += obsHeight + 20
    }

    // === SEÇÃO: CONCLUSÃO / PARECER TÉCNICO ===
    if (relatorio.conclusao && relatorio.conclusao.trim()) {
      // Calcula altura necessária: título (20px) + conteúdo + espaçamento (20px)
      doc.font('Roboto')
      doc.fontSize(11)
      const conclHeight = doc.heightOfString(relatorio.conclusao, {
        width: availableWidth,
        align: 'justify',
        lineGap: 3,
      })
      const totalHeight = 20 + conclHeight + 20

      // Verifica espaço antes de iniciar seção
      const pageCheck = ensureSpace(doc, relatorio, currentY, currentPage, totalHeight)
      currentY = pageCheck.y
      currentPage = pageCheck.page

      // Título da seção
      doc.font('Roboto-Bold')
      doc.fontSize(14)
      doc.fillColor('#333333')
      doc.text('Conclusão / Parecer Técnico', marginLeft, currentY, {
        width: availableWidth,
        align: 'left',
      })
      currentY += 20

      // Conteúdo
      doc.font('Roboto')
      doc.fontSize(11)
      doc.fillColor('#333333')
      doc.text(relatorio.conclusao, marginLeft, currentY, {
        width: availableWidth,
        align: 'justify',
        lineGap: 3,
      })
      doc.fillColor('#000000')
      currentY += conclHeight + 20
    }

    // === SEÇÃO: RECOMENDAÇÕES FINAIS ===
    if (relatorio.recomendacoes && relatorio.recomendacoes.trim()) {
      // Calcula altura necessária: título (20px) + conteúdo + espaçamento (20px)
      doc.font('Roboto')
      doc.fontSize(11)
      const recHeight = doc.heightOfString(relatorio.recomendacoes, {
        width: availableWidth,
        align: 'justify',
        lineGap: 3,
      })
      const totalHeight = 20 + recHeight + 20

      // Verifica espaço antes de iniciar seção
      const pageCheck = ensureSpace(doc, relatorio, currentY, currentPage, totalHeight)
      currentY = pageCheck.y
      currentPage = pageCheck.page

      // Título da seção
      doc.font('Roboto-Bold')
      doc.fontSize(14)
      doc.fillColor('#333333')
      doc.text('Recomendações Finais', marginLeft, currentY, {
        width: availableWidth,
        align: 'left',
      })
      currentY += 20

      // Conteúdo
      doc.font('Roboto')
      doc.fontSize(11)
      doc.fillColor('#333333')
      doc.text(relatorio.recomendacoes, marginLeft, currentY, {
        width: availableWidth,
        align: 'justify',
        lineGap: 3,
      })
      doc.fillColor('#000000')
      currentY += recHeight + 20
    }

    // === RODAPÉ FINAL ===
    // Desenha rodapé apenas uma vez, no final, se houver conteúdo na página
    if (currentY > marginTop + 50) {
      drawFooter(doc, currentPage)
    }

    // Finaliza o documento
    doc.end()
  })
}
