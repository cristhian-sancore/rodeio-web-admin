import { prisma } from "@/lib/db";
import { TrendingUp, Cat, Trophy } from "lucide-react";

export default async function RankingAnimaisPage() {
  const montarias = await prisma.montaria.findMany({
    where: { notaAnimal: { gt: 0 } },
    include: { animal: true, round: { include: { etapa: true } } }
  });

  const stats: Record<number, { id: number, nome: string, cia: string, somaNotas: number, qtd: number, media: number, melhorNota: number }> = {};

  montarias.forEach((m: any) => {
    if (!stats[m.animalId]) {
      stats[m.animalId] = {
        id: m.animalId,
        nome: m.animal.nome,
        cia: m.animal.companhia,
        somaNotas: 0,
        qtd: 0,
        media: 0,
        melhorNota: 0
      };
    }
    stats[m.animalId].somaNotas += m.notaAnimal;
    stats[m.animalId].qtd += 1;
    if (m.notaAnimal > stats[m.animalId].melhorNota) {
      stats[m.animalId].melhorNota = m.notaAnimal;
    }
  });

  const ranking = Object.values(stats)
    .map((s: any) => ({ ...s, media: s.somaNotas / s.qtd }))
    .sort((a: any, b: any) => b.melhorNota - a.melhorNota); // Geralmente Touro do Ano é pela média ou melhor nota. Usando melhor nota por agora.

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Ranking de Animais (Boiada)</h1>

      <div className="premium-card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cat size={20} color="#d4af37" /> Melhores Desempenhos Únicos
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: '#666' }}>Pos</th>
                <th style={{ padding: '1rem', color: '#666' }}>Animal</th>
                <th style={{ padding: '1rem', color: '#666' }}>Companhia</th>
                <th style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Saídas</th>
                <th style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Média</th>
                <th style={{ padding: '1rem', color: '#d4af37', textAlign: 'right' }}>Melhor Nota</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((a, index) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: index < 3 ? '#d4af37' : '#fff' }}>#{index + 1}</td>
                  <td style={{ padding: '1rem' }}>{a.nome}</td>
                  <td style={{ padding: '1rem', color: '#888' }}>{a.cia}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>{a.qtd}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>{a.media.toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#d4af37' }}>{a.melhorNota.toFixed(2)}</td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Aguardando o primeiro pulo...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
