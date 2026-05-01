-- SCRIPT DE REPARO MANUAL DE SCHEMA
-- Use este script no Query Editor do Postgres caso o botão do painel falhe.

-- 1. Tabela de Configuração
ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "exibirCronometroNoOverlay" BOOLEAN DEFAULT true;
ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "rankingCongelado" BOOLEAN DEFAULT false;

-- 2. Tabela de Montaria (Garantir colunas de juízes extras)
ALTER TABLE "Montaria" ADD COLUMN IF NOT EXISTS "j3Peao" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Montaria" ADD COLUMN IF NOT EXISTS "j3Animal" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Montaria" ADD COLUMN IF NOT EXISTS "j4Peao" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Montaria" ADD COLUMN IF NOT EXISTS "j4Animal" DOUBLE PRECISION DEFAULT 0;

-- 3. Tabela de Round (Garantir juízes 3 e 4)
ALTER TABLE "Round" ADD COLUMN IF NOT EXISTS "juiz3Id" INTEGER;
ALTER TABLE "Round" ADD COLUMN IF NOT EXISTS "juiz4Id" INTEGER;

-- 4. Constraints (Opcional, apenas se não existirem)
-- ALTER TABLE "Round" ADD CONSTRAINT "Round_juiz3Id_fkey" FOREIGN KEY ("juiz3Id") REFERENCES "Juiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "Round" ADD CONSTRAINT "Round_juiz4Id_fkey" FOREIGN KEY ("juiz4Id") REFERENCES "Juiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
