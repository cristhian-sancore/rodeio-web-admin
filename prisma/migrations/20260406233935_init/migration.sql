-- CreateTable
CREATE TABLE "Temporada" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ano" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Etapa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFinal" DATETIME NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "temporadaId" INTEGER NOT NULL,
    CONSTRAINT "Etapa_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Competidor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "ranking" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Montaria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "competidorId" INTEGER NOT NULL,
    "animalId" INTEGER NOT NULL,
    "etapaId" INTEGER NOT NULL,
    "nota1" REAL NOT NULL DEFAULT 0,
    "nota2" REAL NOT NULL DEFAULT 0,
    "pontoTotal" REAL NOT NULL DEFAULT 0,
    "tempo" REAL NOT NULL DEFAULT 0,
    "dataHora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Montaria_competidorId_fkey" FOREIGN KEY ("competidorId") REFERENCES "Competidor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Montaria_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Montaria_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "Etapa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Publicidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "texto" TEXT NOT NULL,
    "url" TEXT
);
