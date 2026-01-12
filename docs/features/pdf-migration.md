# Migração de PDFKit para @react-pdf/renderer

## ✅ Migração Concluída

O projeto foi migrado de **PDFKit** para **@react-pdf/renderer** para eliminar definitivamente o erro `ENOENT Helvetica.afm` e garantir compatibilidade total com Next.js App Router e Windows.

## 📦 Mudanças Realizadas

### Dependências Removidas
- ❌ `pdfkit` (^0.14.0)
- ❌ `sharp` (^0.33.1)
- ❌ `@types/pdfkit` (dev dependency)

### Dependências Adicionadas
- ✅ `@react-pdf/renderer` (^3.4.4)

## 📁 Arquivos Criados

1. **`components/pdf/RelatorioPdf.tsx`**
   - Componente React PDF usando @react-pdf/renderer
   - Renderiza relatório completo (título, descrição, itens, fotos)
   - Suporta múltiplas páginas
   - Usa fontes TTF registradas (Roboto, Roboto-Bold)

2. **`lib/pdf/generator.ts`** (refatorado)
   - Registra fontes TTF via `Font.register()`
   - Usa `renderToStream()` do @react-pdf/renderer
   - Converte stream para Buffer
   - Compatível com Prisma Accelerate

## 🔧 Como Funciona

### 1. Registro de Fontes
As fontes TTF são registradas automaticamente na primeira execução:
- `Roboto-Regular.ttf` → família 'Roboto'
- `Roboto-Bold.ttf` → família 'Roboto-Bold' (fallback para Regular se não existir)

### 2. Geração de PDF
```typescript
// 1. Busca dados do relatório (queries separadas - Prisma Accelerate)
// 2. Registra fontes TTF
// 3. Renderiza componente React PDF
// 4. Converte stream para Buffer
// 5. Retorna PDF via API route
```

### 3. Componente PDF
O componente `RelatorioPdf` é um componente React normal que:
- Usa componentes do @react-pdf/renderer (Document, Page, Text, View, Image)
- Define estilos via StyleSheet
- Renderiza páginas dinamicamente baseado no conteúdo

## 🎯 Benefícios

1. **Sem erro Helvetica.afm**: @react-pdf/renderer não depende de fontes AFM
2. **Compatível com Next.js**: Funciona perfeitamente no App Router
3. **Compatível com Windows**: Sem problemas de caminhos ou fontes
4. **React-based**: Usa componentes React familiares
5. **TypeScript**: Totalmente tipado
6. **Prisma Accelerate**: Mantém compatibilidade com queries otimizadas

## 📝 Notas Importantes

### Fontes TTF
As fontes devem estar em `public/fonts/`:
- `Roboto-Regular.ttf` (obrigatório)
- `Roboto-Bold.ttf` (opcional, usa Regular como fallback)

### Limitações
- Máximo de 20 fotos por PDF (evita P6009 do Prisma Accelerate)
- Fotos são renderizadas em páginas separadas (3 por página)

### Performance
- @react-pdf/renderer é mais eficiente que PDFKit para componentes React
- Renderização server-side via `renderToStream()`
- Compatível com streaming para PDFs grandes

## 🚀 Uso

A API route `/api/relatorios/[id]/pdf` continua funcionando da mesma forma:
- GET request
- Retorna PDF com headers corretos
- Abre no navegador automaticamente

Nenhuma mudança é necessária no frontend!
