import { prisma } from "@/lib/db";
import AnimalList from "./AnimalList";

export default async function PublicAnimaisPage() {
  const animais = await prisma.animal.findMany({
    include: {
      montarias: {
        select: {
          notaAnimal: true,
          desclassificado: true
        }
      }
    },
    orderBy: { nome: 'asc' }
  });

  const animaisComStats = animais.map(a => {
    const montariasValidas = a.montarias.filter(m => !m.desclassificado && m.notaAnimal > 0);
    const media = montariasValidas.length > 0 
      ? (montariasValidas.reduce((acc, m) => acc + m.notaAnimal, 0) / montariasValidas.length).toFixed(2)
      : "0";
    
    return {
      id: a.id,
      nome: a.nome,
      companhia: a.companhia,
      stats: {
        total: a.montarias.length,
        media,
        derrubadas: a.montarias.filter(m => m.desclassificado || m.notaAnimal === 0).length
      }
    };
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', fontWeight: 900 }}>Boiada / Cavalaria</h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Pesquise por animais ou companhias e veja o desempenho oficial de cada saída.</p>
      </div>

      <AnimalList initialData={animaisComStats} />
    </div>
  );
}
