export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { Users, Cat, Calendar, Trophy, TrendingUp, Gavel } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'SUPER';

  const [competidoresCount, animaisCount, etapasCount, juizesCount, montariasCount, roundsDoJuiz] = await Promise.all([
    prisma.competidor.count(),
    prisma.animal.count(),
    prisma.etapa.count(),
    prisma.juiz.count(),
    prisma.montaria.count(),
    // Buscar rounds vinculados ao juiz
    (!isAdmin && user?.juizId) ? prisma.round.findMany({
      where: {
        OR: [
          { juiz1Id: user.juizId },
          { juiz2Id: user.juizId },
          { juiz3Id: user.juizId },
          { juiz4Id: user.juizId },
        ],
        etapa: { ativa: true }
      },
      include: { etapa: true },
      orderBy: { dataAgenda: 'asc' }
    }) : Promise.resolve([]) as Promise<any[]>
  ]);

  const ultimasMontarias = await prisma.montaria.findMany({
    take: 5,
    orderBy: { dataHora: 'desc' },
    include: { competidor: true, animal: true, round: { include: { etapa: true } } }
  });

  return (
    <div>
      <h1 style={{ marginBottom: isAdmin ? '2rem' : '1rem' }}>
        {isAdmin ? 'Painel Administrativo' : `Painel do Juiz: ${user?.name}`}
      </h1>
      
      {!isAdmin && (
         <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--primary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Bem-vindo à Arena Pro, {user?.name}!</h2>
            <p style={{ color: '#888', margin: 0 }}>Você está logado com credenciais de Juiz Oficial. Sua atuação é limitada ao lançamento das notas técnicas nos rounds em que você está escalado.</p>
         </div>
      )}

      {/* Cards de Resumo - Apenas para Admin */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <SummaryCard icon={<Users />} label="Competidores" value={competidoresCount} color="#d4af37" href="/admin/competidores" />
          <SummaryCard icon={<Cat />} label="Boiada" value={animaisCount} color="#ff4444" href="/admin/animais" />
          <SummaryCard icon={<Calendar />} label="Etapas" value={etapasCount} color="#4CAF50" href="/admin/etapas" />
          <SummaryCard icon={<Gavel />} label="Juízes" value={juizesCount} color="#2196F3" href="/admin/juizes" />
          <SummaryCard icon={<Trophy />} label="Montarias" value={montariasCount} color="#fff" href="/admin/notas" />
        </div>
      )}

      <div className={isAdmin ? "grid-2-1" : "responsive-grid"} style={{ gap: '2rem' }}>
        {/* Agenda do Juiz - Seção Nova */}
        {!isAdmin && user?.juizId && (
          <div className="premium-card" style={{ borderColor: 'var(--primary)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={20} color="var(--primary)" /> Minha Escala de Hoje
            </h2>
            {roundsDoJuiz.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {roundsDoJuiz.map((r: any) => (
                  <div key={r.id} style={{ padding: '1.2rem', background: '#111', borderRadius: '10px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--primary)' }}>{r.etapa.nome}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>ROUND {r.numero}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#666' }}>{r.dataAgenda ? new Date(r.dataAgenda).toLocaleDateString() : '---'}</p>
                    </div>
                    <Link href={`/admin/execucao?roundId=${r.id}`} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.6rem 1rem', textDecoration: 'none' }}>
                      ABRIR SÚMULA
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <Gavel size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>Você não possui escalas ativas em etapas no momento.</p>
              </div>
            )}
          </div>
        )}

        {/* Ultimos Resultados */}
        <div className="premium-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#d4af37" /> {isAdmin ? 'Lançamentos Recentes' : 'Últimas Notas Processadas'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {ultimasMontarias.map((m: any) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#1a1a1a', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{m.competidor?.nome || '---'}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{m.animal?.nome || '---'} • {m.round?.etapa?.nome || '---'} • Round {m.round?.numero || '---'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: (m.notaTotal || 0) > 0 ? '#d4af37' : '#ff4444' }}>{(m.notaTotal || 0).toFixed(2)} pts</span>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>P: {(m.notaPeao || 0).toFixed(2)} | A: {(m.notaAnimal || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atalhos de Juiz */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="premium-card" style={{ borderColor: '#d4af37', background: 'rgba(212, 175, 55, 0.03)' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#d4af37', marginBottom: '1.25rem' }}>Ações Rápidas de Campo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link href="/admin/execucao" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.2rem' }}>
                <Trophy size={20} /> IR PARA SÚMULA (LANÇAR)
              </Link>
              <Link href="/admin/ranking" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.2rem', background: '#222', border: '1px solid #333' }}>
                <TrendingUp size={20} /> CONFERIR RANKINGS
              </Link>
            </div>
          </div>
          
          {!isAdmin && (
            <div className="premium-card" style={{ borderStyle: 'dashed' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>Suporte Técnico</h3>
              <p style={{ fontSize: '0.75rem', color: '#444', margin: 0 }}>Se você não encontrar um round escalado, entre em contato com o Administrador via Rádio ou Central de TI.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, href }: any) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.3s ease', cursor: 'pointer' }}>
        <div style={{ width: '54px', height: '54px', background: `${color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>{label}</p>
          <h3 style={{ margin: '2px 0 0 0', fontSize: '1.5rem', color: '#fff' }}>{value}</h3>
        </div>
      </div>
    </Link>
  );
}
