import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { deleteEtapa, createEtapaAction } from "./actions";

export default async function EtapasPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const hasError = searchParams?.error === 'ETAPA_HAS_LINKS';
  const temporadas = await prisma.temporada.findMany({
    orderBy: { ano: 'desc' }
  });

  const etapas = await prisma.etapa.findMany({
    include: { temporada: true },
    orderBy: { dataInicio: 'asc' }
  });



  if (temporadas.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2>Nenhum Circuito/Temporada Ativo</h2>
        <p style={{ color: '#888' }}>Você precisa registrar um Circuito Master no painel de Configurações antes de agendar etapas.</p>
        <Link href="/admin/configuracoes" className="btn-primary" style={{ display: 'inline-flex', padding: '1rem', textDecoration: 'none', marginTop: '1rem' }}>
          IR PARA CONFIGURAÇÕES DE CIRCUITO
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Gerenciamento de Etapas (Eventos)</h1>

      {hasError && (
        <div style={{ padding: '1rem', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: '8px', color: '#ff4444', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={24} />
          <div>
            <strong>Não foi possível excluir a Etapa!</strong>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Existem Rounds ou Montarias vinculadas a ela. Exclua as dependências primeiro antes de apagar a Etapa completa.</p>
          </div>
        </div>
      )}

      {/* Formulario de Cadastro */}
      <div className="premium-card" style={{ marginBottom: '3rem', maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#fff' }}>Agendar Nova Etapa</h2>
        <form action={createEtapaAction} className="grid-2">
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Vincular a qual Circuito / Temporada?</label>
            <select name="temporadaId" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
              {temporadas.map((t: any) => (
                <option key={t.id} value={t.id}>{t.titulo} ({t.ano})</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome do Evento</label>
            <input name="nome" type="text" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="Ex: Festa do Peão de Barretos" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Cidade</label>
            <input name="cidade" type="text" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="Barretos" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>UF</label>
            <input name="estado" type="text" maxLength={2} required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} placeholder="SP" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Data de Início</label>
            <input name="dataInicio" type="date" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Data Final</label>
            <input name="dataFinal" type="date" required style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
          </div>

          <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> SALVAR ETAPA
          </button>
        </form>
      </div>

      {/* Calendario de Etapas */}
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#fff' }}>Etapas Registradas</h2>
        <div className="responsive-grid">
          {etapas.map((e: any) => (
            <div key={e.id} className="premium-card" style={{ borderLeft: e.ativa ? '4px solid #d4af37' : '4px solid #444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>{e.nome}</h3>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>{e.cidade} - {e.estado}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', color: '#d4af37', fontSize: '1.2rem', fontWeight: 'bold' }}>{e.temporada.titulo}</span>
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>({e.temporada.ano})</span>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  {e.dataInicio.toLocaleDateString()} a {e.dataFinal.toLocaleDateString()}
                </span>
                <span style={{ color: e.ativa ? '#d4af37' : '#666', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid', padding: '2px 6px', borderRadius: '4px' }}>
                  {e.ativa ? 'ATIVA' : 'FINALIZADA'}
                </span>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
                <Link href={`/admin/etapas/${e.id}`} className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '0.6rem', textDecoration: 'none', fontSize: '0.85rem' }}>
                  PAINEL →
                </Link>
                <Link href={`/admin/etapas/${e.id}/editar`} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.6rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <Edit size={16} />
                </Link>
                <form action={deleteEtapa.bind(null, e.id)}>
                  <button type="submit" style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '0.6rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} title="Excluir Etapa permanentemente">
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {etapas.length === 0 && (
            <p style={{ color: '#666' }}>Nenhuma etapa agendada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
