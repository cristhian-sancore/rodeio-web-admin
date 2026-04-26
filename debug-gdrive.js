const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const config = await prisma.configuracao.findFirst();
  
  console.log('=== CONFIGURAÇÃO VMIX ===');
  console.log('vmixUrl:', config?.vmixUrl);
  console.log('vmixInputNotaId:', config?.vmixInputNotaId);
  console.log('vmixReplayInputId:', config?.vmixReplayInputId);
  console.log('replayExportPath:', config?.replayExportPath);
  console.log('vmixOverlayChannel:', config?.vmixOverlayChannel);
  console.log('googleDriveFolderId:', config?.googleDriveFolderId);
  console.log('googleDriveApiKey:', config?.googleDriveApiKey ? '***SET***' : 'NOT SET');
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
