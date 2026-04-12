const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFileDetails() {
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const apiKey = config.googleDriveApiKey;
  const fileId = '17YoHSnI8ibvdM4xwhYruBDLGwfnI8BFX'; // O ID que o site está tentando abrir
  
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType&key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('--- DETALHES DO ARQUIVO NO DRIVE ---');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.size && parseInt(data.size) === 0) {
      console.log('⚠️ ALERTA: O arquivo está com tamanho ZERO!');
    } else if (data.size) {
      console.log(`✅ O arquivo tem ${Math.round(data.size / 1024)} KB.`);
    }
  } catch (err) {
    console.error(err);
  }
}

checkFileDetails().finally(() => prisma.$disconnect());
