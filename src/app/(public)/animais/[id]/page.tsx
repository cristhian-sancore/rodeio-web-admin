import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Cat, Award, TrendingUp, History, User, Star, Shield } from "lucide-react";
import Link from "next/link";
import { getReplayFileMap } from "@/lib/gdrive";
import { VideoPlayer } from "@/components/VideoPlayer";

export default async function AnimalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const animal = await prisma.animal.findUnique({
    where: { id: parseInt(id) },
    include: {
      montarias: {
        include: {
          round: true,
          etapa: true,
          competidor: true
        },
        orderBy: { dataHora: 'desc' }
      }
    }
  });

  if (!animal) return notFound();

  // Buscar config do Google Drive
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const folderId = (config as any)?.googleDriveFolderId || null;
  
  let replayMap: Record<string, { id: string, thumb: string | null }> = {};
  if (folderId) {
    replayMap = await getReplayFileMap(folderId);
  }

  // Estatísticas
  const montariasValidas = animal.montarias.filter(m => !m.desclassificado && m.notaAnimal > 0);
  const mediaValida = montariasValidas.length > 0
    ? (montariasValidas.reduce((acc, m) => acc + m.notaAnimal, 0) / montariasValidas.length).toFixed(2)
    : "0";
  const mNota = Math.max(...animal.montarias.map(m => m.notaAnimal), 0);
  const derrubadas = animal.montarias.filter(m => m.desclassificado || m.notaAnimal === 0).length;

  return (
    <div className="fade-in">
      <div className="premium-card profile-header-responsive" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '120px', height: '120px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
          <Cat size={64} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '3rem', margin: 0, textTransform: 'uppercase' }}>{animal.nome}</h1>
          <h3 style={{ color: 'var(--primary)', margin: '0.25rem 0 1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>{animal.companhia}</h3>
          
          <div style={{ display: 'flex', gap: '1.5rem', color: '#888' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={18} /> {animal.tipo} Oficial
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Média de Nota: {mediaValida}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <StatCard icon={History} label="TOTAL SAÍDAS" value={animal.montarias.length} />
        <StatCard icon={Shield} label="DERRUBADAS" value={derrubadas} />
        <StatCard icon={TrendingUp} label="MAIOR NOTA" value={mNota > 0 ? mNota.toFixed(2) : '---'} />
        <StatCard icon={Award} label="MÉDIA ATUAL" value={mediaValida} />
      </div>

      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <History size={24} color="var(--primary)" /> Histórico de Saídas
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {animal.montarias.map((m) => {
          // Busca inteligente: procura qualquer arquivo que contenha o nome do competidor e do animal
          const searchKeyComp = m.competidor.nome.toUpperCase();
          const searchKeyAnimal = animal.nome.toUpperCase();
          
          const replayFileEntry = Object.entries(replayMap).find(([name]) => {
            const upName = name.toUpperCase();
            // Removemos acentos e símbolos para uma busca mais robusta
            const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalize(upName).includes(normalize(searchKeyComp)) && 
                   normalize(upName).includes(normalize(searchKeyAnimal));
          });
          
          const replayFile = replayFileEntry ? replayFileEntry[1] : null;
          
          return (
            <div key={m.id} className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: replayFile ? '1px solid #222' : 'none' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{m.etapa.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{new Date(m.dataHora).toLocaleDateString('pt-BR')} • Round {m.round.numero}</div>
                  </div>
                  <div>
                    <Link href={`/competidores/${m.competidorId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', textDecoration: 'none', fontWeight: '600' }}>
                      <User size={14} /> {m.competidor.nome}
                    </Link>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#666' }}>NOTA ANIMAL</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{m.notaAnimal.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#666' }}>NOTA PEÃO</div>
                    <div style={{ opacity: 0.6 }}>{m.notaPeao.toFixed(2)}</div>
                  </div>
                  <div style={{ minWidth: '80px', textAlign: 'right' }}>
                    {m.desclassificado ? (
                      <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '0.9rem' }}>DERRUBOU</span>
                    ) : (
                      <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '0.9rem' }}>PAROU</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Replay Video Embed */}
              {replayFile && (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                  <VideoPlayer 
                    videoId={replayFile.id} 
                    thumbnail={replayFile.thumb}
                  />
                </div>
              )}
            </div>
          );
        })}
        {animal.montarias.length === 0 && (
          <div className="premium-card" style={{ padding: '4rem', textAlign: 'center', color: '#555' }}>Nenhuma saída registrada.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="premium-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
      <div style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
        <Icon size={21} />
      </div>
      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{value}</div>
    </div>
  );
}
