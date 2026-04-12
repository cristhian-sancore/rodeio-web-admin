import { prisma } from "./db";

/**
 * Busca a configuração de forma segura, ignorando o cache do Prisma Client
 * para evitar erros de campo não encontrado durante migrações em tempo real.
 */
export async function getSafeConfig() {
  try {
    const configs = await prisma.$queryRaw`SELECT * FROM "Configuracao" LIMIT 1` as any[];
    if (configs && configs.length > 0) {
      return configs[0];
    }
    return null;
  } catch (err) {
    console.error("Erro ao buscar config via SQL:", err);
    // Fallback para o método tradicional caso o SQL falhe (ex: tabela não existe)
    try {
      return await (prisma as any).configuracao.findFirst();
    } catch (e) {
      return null;
    }
  }
}
