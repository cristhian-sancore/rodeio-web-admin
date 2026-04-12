import { prisma } from "./src/lib/db";
import { getOverlayRankingData } from "./src/lib/ranking";

async function test() {
  try {
    console.log("--- TEST START ---");
    const config = await prisma.configuracao.findUnique({
      where: { id: 1 },
      select: { 
        montariaAtivaId: true, 
        numJuizes: true,
        timerRunning: true,
        timerStartedAt: true,
        rankingMode: true,
        rankingPage: true
      }
    });
    console.log("Config loaded:", config);

    if (config?.rankingMode && config.rankingMode !== 'OFF') {
      console.log("Fetching ranking data for mode:", config.rankingMode);
      const rankingData = await getOverlayRankingData(config.rankingMode);
      console.log("Ranking data fetched successfully. Count:", rankingData?.list?.length);
    } else {
      console.log("Ranking mode is OFF or config is null");
    }
    console.log("--- TEST END ---");
  } catch (err: any) {
    console.error("--- TEST FAILED ---");
    console.error(err);
    if (err.message) console.error("Message:", err.message);
  }
}

test();
