import { prisma } from "@/lib/db";
import Link from "next/link";
import { User, Trophy, MapPin, TrendingUp, Search } from "lucide-react";

export default async function PublicCompetidoresPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  const competidores = await prisma.competidor.findMany({
    where: q ? {
      OR: [
        { nome: { contains: q } },
        { cidade: { contains: q } }
      ]
    } : undefined,
    include: {
      montarias: {
        select: {
          notaTotal: true,
          desclassificado: true
        }
      }
    },
    orderBy: { nome: 'asc' }
  });

  // Calcular estatísticas básicas para cada competidor
  const competidoresComStats = competidores.map(c => {
    const paradas = c.montarias.filter(m => !m.desclassificado && m.notaTotal > 0).length;
    const totalMontarias = c.montarias.length;
    const aproveitamento = totalMontarias > 0 ? Math.round((paradas / totalMontarias) * 100) : 0;
    
    return {
      ...c,
      stats: {
        paradas,
        totalMontarias,
        aproveitamento
      }
    };
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Competidores</h1>
          <p style={{ color: '#888' }}>Conheça os atletas do campeonato e suas estatísticas de desempenho.</p>
        </div>

        <form method="GET" style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} color="#555" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              name="q" 
              type="text" 
              placeholder="Nome ou cidade..." 
              defaultValue={q || ''}
              style={{ padding: '0.8rem 1rem 0.8rem 2.8rem', minWidth: '300px' }} 
            />
          </div>
          <button type="submit" className="btn-primary">BUSCAR</button>
        </form>
      </div>

      <div className="responsive-grid">
        {competidoresComStats.map((c) => (
          <Link key={c.id} href={`/competidores/${c.id}`} style={{ textDecoration: 'none' }}>
            <div className="premium-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <User size={32} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', textTransform: 'uppercase' }}>{c.nome}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#666', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    <MapPin size={14} /> {c.cidade} - {c.uf}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
                <div style={{ background: '#151515', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>APROVEITAMENTO</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{c.stats.aproveitamento}%</div>
                </div>
                <div style={{ background: '#151515', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>PARADAS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{c.stats.paradas}/{c.stats.totalMontarias}</div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#888' }}>VER PERFIL COMPLETO</span>
                <TrendingUp size={16} color="var(--primary)" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
