import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateTemporada } from "../../../../etapas/actions";
import { Save, ArrowLeft, Settings, Gavel } from "lucide-react";
import Link from "next/link";

export default async function EditarTemporadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tId = parseInt(id);

  const temporada = await prisma.temporada.findUnique({ where: { id: tId } });
  if (!temporada) redirect('/admin/configuracoes');

  const juizes = await prisma.juiz.findMany({ orderBy: { nome: 'asc' } });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/configuracoes" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar para Configurações
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Temporada: <span style={{ color: 'var(--primary)' }}>{temporada.titulo}</span></h1>
      </div>

      <div className="premium-card" style={{ maxWidth: '600px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <Settings size={20} color="var(--primary)" /> Ajustes do Circuito
        </h3>
        
        <form action={updateTemporada} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <input type="hidden" name="id" value={temporada.id} />

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Ano</label>
              <input name="ano" type="number" required defaultValue={temporada.ano} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div style={{ flex: 3 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Nome da Temporada</label>
              <input name="titulo" type="text" required defaultValue={temporada.titulo} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: 'rgba(212, 175, 55, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#d4af37' }}>Bônus: Maior Nota Etapa</label>
              <input name="bonusMelhorNotaEtapa" type="number" step="1" defaultValue={temporada.bonusMelhorNotaEtapa} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#d4af37' }}>Bônus: Maior Nota Noite</label>
              <input name="bonusMelhorNotaNoite" type="number" step="1" defaultValue={temporada.bonusMelhorNotaNoite} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#d4af37' }}>Bônus: Notas 90+</label>
              <input name="bonusNotasAcima90" type="number" step="1" defaultValue={temporada.bonusNotasAcima90 || 0} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#d4af37' }}>Maior Nota do Circuito</label>
              <input name="ptsMelhorNotaCampeonato" type="number" step="1" defaultValue={temporada.ptsMelhorNotaCampeonato || 0} style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>
          </div>

          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#fff' }}>Pontos por Posição no Round (1º ao 5º)</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((pos) => (
                <div key={pos} style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', color: '#666', display: 'block', textAlign: 'center' }}>{pos}º</label>
                  <input name={`ptsRound${pos}`} type="number" defaultValue={(temporada as any)[`ptsRound${pos}`]} style={{ width: '100%', padding: '0.5rem', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', textAlign: 'center' }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#fff' }}>Pontos por Posição na Etapa (1º ao 10º)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pos) => (
                <div key={pos}>
                  <label style={{ fontSize: '0.65rem', color: '#666', display: 'block', textAlign: 'center' }}>{pos}º</label>
                  <input name={`ptsEtapa${pos}`} type="number" defaultValue={(temporada as any)[`ptsEtapa${pos}`]} style={{ width: '100%', padding: '0.5rem', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', textAlign: 'center' }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(33, 150, 243, 0.05)', borderRadius: '8px', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#2196F3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gavel size={16} /> Juízes Padrão do Circuito (Opcional)
            </h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#888', fontSize: '0.75rem' }}>Juiz 1 Padrão</label>
                <select name="defaultJuiz1Id" defaultValue={temporada.defaultJuiz1Id ?? ""} style={{ width: '100%', padding: '0.6rem', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
                  <option value="">Nenhum...</option>
                  {juizes.map((j: any) => (
                    <option key={`j1-${j.id}`} value={j.id}>{j.nome}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#888', fontSize: '0.75rem' }}>Juiz 2 Padrão</label>
                <select name="defaultJuiz2Id" defaultValue={temporada.defaultJuiz2Id ?? ""} style={{ width: '100%', padding: '0.6rem', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
                  <option value="">Nenhum...</option>
                  {juizes.map((j: any) => (
                    <option key={`j2-${j.id}`} value={j.id}>{j.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Premia até (Posição Leaderboard)</label>
            <input name="premiaAte" type="number" defaultValue={temporada.premiaAte} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '1rem', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '8px' }}>
            <input type="checkbox" name="ativa" id="ativa" defaultChecked={temporada.ativa} style={{ width: '20px', height: '20px', accentColor: '#4CAF50' }} />
            <label htmlFor="ativa" style={{ color: '#4CAF50', fontWeight: 'bold' }}>Marcar como Temporada Ativa no Sistema</label>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <Save size={20} /> SALVAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}
