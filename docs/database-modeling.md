# Modelagem do Banco de Dados - Prisma Schema

## Diagrama de Entidades

```
User (Usuário)
├── id (UUID)
├── email (String, único)
├── password (String, hasheada)
├── name (String)
├── createdAt (DateTime)
└── updatedAt (DateTime)
    └── relatorios (Relatorio[]) - 1:N

Relatorio (Relatório)
├── id (UUID)
├── titulo (String)
├── descricao (String, opcional)
├── data (DateTime)
├── status (Enum: RASCUNHO, FINALIZADO)
├── userId (UUID, FK)
├── createdAt (DateTime)
├── updatedAt (DateTime)
├── user (User) - N:1
├── itens (ItemRelatorio[]) - 1:N
└── fotos (Foto[]) - 1:N

ItemRelatorio (Item do Relatório)
├── id (UUID)
├── descricao (String)
├── concluido (Boolean, default: false)
├── ordem (Int)
├── relatorioId (UUID, FK)
├── createdAt (DateTime)
└── relatorio (Relatorio) - N:1

Foto (Foto do Relatório)
├── id (UUID)
├── url (String) - URL do Supabase Storage
├── nome (String) - Nome original
├── ordem (Int) - Ordem de exibição
├── relatorioId (UUID, FK)
├── createdAt (DateTime)
└── relatorio (Relatorio) - N:1
```

## Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum StatusRelatorio {
  RASCUNHO
  FINALIZADO
}

model User {
  id         String      @id @default(uuid())
  email      String      @unique
  password   String
  name       String?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  relatorios Relatorio[]

  @@map("users")
}

model Relatorio {
  id          String          @id @default(uuid())
  titulo      String
  descricao   String?
  data        DateTime        @default(now())
  status      StatusRelatorio @default(RASCUNHO)
  userId      String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  itens       ItemRelatorio[]
  fotos       Foto[]

  @@index([userId])
  @@index([data])
  @@map("relatorios")
}

model ItemRelatorio {
  id          String    @id @default(uuid())
  descricao   String
  concluido   Boolean   @default(false)
  ordem       Int
  relatorioId String
  createdAt   DateTime  @default(now())
  
  relatorio   Relatorio @relation(fields: [relatorioId], references: [id], onDelete: Cascade)

  @@index([relatorioId])
  @@map("itens_relatorio")
}

model Foto {
  id          String    @id @default(uuid())
  url         String
  nome        String
  ordem       Int       @default(0)
  relatorioId String
  createdAt   DateTime  @default(now())
  
  relatorio   Relatorio @relation(fields: [relatorioId], references: [id], onDelete: Cascade)

  @@index([relatorioId])
  @@map("fotos")
}
```

## Relacionamentos

- **User → Relatorio**: 1 para N (um usuário tem muitos relatórios)
- **Relatorio → ItemRelatorio**: 1 para N (um relatório tem muitos itens)
- **Relatorio → Foto**: 1 para N (um relatório tem muitas fotos)

## Índices

- `userId` em `Relatorio` - Para consultas rápidas por usuário
- `data` em `Relatorio` - Para ordenação por data
- `relatorioId` em `ItemRelatorio` e `Foto` - Para joins eficientes

## Constraints

- `email` único em `User`
- Cascade delete: ao deletar usuário, deleta relatórios; ao deletar relatório, deleta itens e fotos
- `status` com valores fixos (enum)

## Considerações

- UUIDs para IDs (segurança e escalabilidade)
- Timestamps automáticos (createdAt, updatedAt)
- URLs de fotos armazenadas (Supabase Storage)
- Ordem de itens e fotos para organização no PDF
