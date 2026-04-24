import { prisma } from "./db";

export async function logSystemAction(usuarioNome: string, acao: string, detalhes?: any) {
  try {
    await prisma.systemLog.create({
      data: {
        usuarioNome,
        acao,
        detalhes: detalhes ? JSON.stringify(detalhes) : null,
      }
    });
  } catch (err) {
    console.error("Falha ao salvar log de auditoria:", err);
  }
}
