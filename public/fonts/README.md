# Fontes para PDF

Esta pasta contém as fontes TTF usadas na geração de PDFs.

## Fonte Necessária

- **Roboto-Regular.ttf**: Fonte padrão para textos do PDF

## Como Obter

### Opção 1: Google Fonts (Recomendado)

1. Acesse: https://fonts.google.com/specimen/Roboto
2. Baixe a família Roboto
3. Extraia `Roboto-Regular.ttf` para esta pasta

### Opção 2: Usar Fonte do Sistema

Se você tem uma fonte TTF no sistema (ex: Arial, Times New Roman), copie para esta pasta e atualize o nome no código `lib/pdf/generator.ts`.

### Opção 3: Fonte Alternativa

Você pode usar qualquer fonte TTF. Apenas certifique-se de:
- O arquivo está em `public/fonts/`
- O nome do arquivo corresponde ao usado em `lib/pdf/generator.ts`
- A fonte suporta caracteres latinos (para português)

## Estrutura Esperada

```
public/fonts/
  └── Roboto-Regular.ttf
```

## Nota

O PDFKit não funciona com fontes padrão (Helvetica) no Next.js App Router. Por isso, usamos fontes TTF registradas manualmente.













