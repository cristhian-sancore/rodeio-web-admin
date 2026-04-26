const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Populando dados do Construtor Total...');
  
  const defaultLayouts = {
    HOME: [
      { id: 'hero', type: 'HERO', title: 'Banner Principal', visible: true },
      { id: 'highlights', type: 'HIGHLIGHTS', title: 'Destaques em Vídeo', visible: true },
      { id: 'rankings', type: 'RANKINGS', title: 'Ranking Home', visible: true },
      { id: 'features', type: 'FEATURES', title: 'Recursos do Sistema', visible: true }
    ],
    RANKING: [
      { id: 'r1', type: 'RANKINGS', title: 'Ranking Geral do Campeonato', visible: true }
    ],
    COMPETIDORES: [
      { id: 'c1', type: 'GALLERY', title: 'Galeria de Atletas', visible: true }
    ],
    ANIMAIS: [
      { id: 'a1', type: 'GALLERY', title: 'Galeria de Animais', visible: true }
    ],
    OVERLAYS: [
      { id: 'lt1', type: 'LOWER_THIRD', title: 'GC de Atleta', visible: true },
      { id: 'sb1', type: 'SCORE_BOARD', title: 'Placar de Notas', visible: true },
      { id: 'fr1', type: 'FULL_RANKING', title: 'Ranking Tela Cheia', visible: true }
    ],
    PAINEIS: [
      { id: 'jv1', type: 'JUDGE_VOTE', title: 'Interface de Votação', visible: true },
      { id: 'cf1', type: 'COMMENTATOR_FEED', title: 'Feed do Comentarista', visible: true }
    ]
  };

  try {
    const config = await prisma.configuracao.upsert({
      where: { id: 1 },
      update: {
        siteLayouts: defaultLayouts,
        primaryColor: '#d4af37',
        secondaryColor: '#111111'
      },
      create: {
        id: 1,
        titulo: 'RODEIO PRO',
        siteLayouts: defaultLayouts,
        primaryColor: '#d4af37',
        secondaryColor: '#111111',
        homeLayout: defaultLayouts.HOME
      }
    });
    console.log('✅ Dados inseridos com sucesso:', config.id);
  } catch (err) {
    console.error('❌ Erro ao popular banco:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
