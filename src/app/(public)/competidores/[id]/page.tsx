import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { User, MapPin, Award, TrendingUp, Calendar, Cat, Star, Play } from "lucide-react";
import Link from "next/link";
import { getReplayFileMap } from "@/lib/gdrive";
import { VideoPlayer } from "@/components/VideoPlayer";

export default async function CompetidorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competidor = await prisma.competidor.findUnique({
    where: { id: parseInt(id) },
    include: {
      montarias: {
        include: {
          round: true,
          etapa: true,
          animal: true
        },
        orderBy: { dataHora: 'desc' }
      }
    }
  });

  if (!competidor) return notFound();

  // Buscar config do Google Drive
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const folderId = (config as any)?.googleDriveFolderId || null;
  
  // Buscar mapa de arquivos de replay se tiver pasta configurada
  let replayMap: Record<string, { id: string, thumb: string | null }> = {};
  if (folderId) {
    replayMap = await getReplayFileMap(folderId);
  }

  // Cálculos de Estatísticas
  const total = competidor.montarias.length;
  const paradas = competidor.montarias.filter(m => !m.desclassificado && m.notaTotal > 0).length;
  const aproveitamento = total > 0 ? ((paradas / total) * 100).toFixed(1) : "0";
  const mNota = Math.max(...competidor.montarias.map(m => m.notaTotal), 0);
  const mediaNotas = paradas > 0 ? (competidor.montarias.reduce((acc, m) => acc + m.notaTotal, 0) / paradas).toFixed(2) : "0";

  return (
    <div className="fade-in">
      {/* Header do Perfil */}
      <div className="premium-card profile-header-responsive" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '100px', height: '100px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
          <User size={48} />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', margin: 0, textTransform: 'uppercase' }}>{competidor.nome}</h1>
            <div style={{ background: 'var(--primary)', color: '#000', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.7rem' }}>RANK #{competidor.ranking}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', flexWrap: 'wrap', fontSize: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} /> {competidor.cidade} - {competidor.uf}
            </div>
            <span className="hide-mobile">•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={16} /> {aproveitamento}% Aproveitamento
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <StatCard icon={Award} label="TOTAL MONTARIAS" value={total} />
        <StatCard icon={Star} label="PARADAS COM NOTA" value={paradas} />
        <StatCard icon={TrendingUp} label="MAIOR NOTA" value={mNota > 0 ? mNota.toFixed(2) : '---'} />
        <StatCard icon={Calendar} label="MÉDIA DE NOTAS" value={mediaNotas} />
      </div>

      {/* Histórico de Montarias */}
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Calendar size={24} color="var(--primary)" /> Histórico de Montarias
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {competidor.montarias.map((m) => {
          // Busca inteligente: procura qualquer arquivo que contenha o nome do competidor e do animal
          const searchKeyComp = competidor.nome.toUpperCase();
          const searchKeyAnimal = m.animal.nome.toUpperCase();
          
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
                    <Link href={`/animais/${m.animalId}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: '600' }}>
                      {m.animal.nome}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{m.animal.companhia}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#666' }}>PEÃO</div>
                    <div style={{ opacity: 0.8 }}>{m.notaPeao.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#666' }}>ANIMAL</div>
                    <div style={{ opacity: 0.8 }}>{m.notaAnimal.toFixed(2)}</div>
                  </div>
                  <div style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: '900', 
                    color: m.desclassificado ? '#ff4444' : (m.notaTotal > 0 ? 'var(--primary)' : '#555'),
                    minWidth: '80px',
                    textAlign: 'right'
                  }}>
                    {m.desclassificado ? 'DESC' : (m.notaTotal > 0 ? m.notaTotal.toFixed(2) : '---')}
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
        {competidor.montarias.length === 0 && (
          <div className="premium-card" style={{ padding: '4rem', textAlign: 'center', color: '#555' }}>Nenhuma montaria registrada.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="premium-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
      <div style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', fontWeight: 'bold' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{value}</div>
    </div>
  );
}
