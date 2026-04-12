import { prisma } from "@/lib/db";
import Link from "next/link";
import { Cat, Star, TrendingUp, Search } from "lucide-react";

export default async function PublicAnimaisPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  const animais = await prisma.animal.findMany({
    where: q ? {
      OR: [
        { nome: { contains: q } },
        { companhia: { contains: q } }
      ]
    } : undefined,
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
      ...a,
      stats: {
        total: a.montarias.length,
        media,
        derrubadas: a.montarias.filter(m => m.desclassificado || m.notaAnimal === 0).length
      }
    };
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Boiada / Cavalaria</h1>
          <p style={{ color: '#888' }}>Ranking de desempenho dos melhores animais do campeonato.</p>
        </div>

        <form method="GET" style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            name="q" 
            type="text" 
            placeholder="Nome ou companhia..." 
            defaultValue={q || ''}
            style={{ padding: '0.8rem 1rem', minWidth: '300px' }} 
          />
          <button type="submit" className="btn-primary">BUSCAR</button>
        </form>
      </div>

      <div className="responsive-grid">
        {animaisComStats.map((a) => (
          <Link key={a.id} href={`/animais/${a.id}`} style={{ textDecoration: 'none' }}>
            <div className="premium-card" style={{ height: '100%' }}>
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Cat size={32} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', textTransform: 'uppercase' }}>{a.nome}</h3>
                  <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 'bold' }}>{a.companhia}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#151515', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>MÉDIA DE NOTA</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{a.stats.media}</div>
                </div>
                <div style={{ background: '#151515', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>APRESENTAÇÕES</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{a.stats.total}</div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#888' }}>DATA DA ÚLTIMA SAÍDA</span>
                <span style={{ fontWeight: '600' }}>VER DETALHES</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
