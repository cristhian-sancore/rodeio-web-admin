import { prisma } from "./src/lib/db";

async function diagnose() {
  console.log("--- DIAGNÓSTICO DE CONFIGURAÇÃO ---");
  const allConfigs = await prisma.configuracao.findMany();
  console.log("Total de registros na tabela Configuracao:", allConfigs.length);
  
  allConfigs.forEach((c, i) => {
    console.log(`\n[Registro ${i+1}] ID: ${c.id}`);
    console.log(`- Ranking Mode: ${c.rankingMode}`);
    console.log(`- Montaria Ativa ID: ${c.montariaAtivaId}`);
    console.log(`- Ranking Page: ${c.rankingPage}`);
  });

  if (allConfigs.length > 1) {
    console.warn("\nAVISO: Mais de um registro de configuração encontrado! Isso pode causar inconsistências no overlay.");
  }

  const montariaAtiva = allConfigs[0]?.montariaAtivaId;
  if (montariaAtiva) {
    const m = await prisma.montaria.findUnique({
      where: { id: montariaAtiva },
      include: { competidor: true, animal: true }
    });
    console.log("\nMontaria Ativa no BD:", m ? `${m.competidor.nome} no ${m.animal.nome}` : "NÃO ENCONTRADA");
  }

  console.log("\n--- FIM DO DIAGNÓSTICO ---");
}

diagnose().catch(console.error);
