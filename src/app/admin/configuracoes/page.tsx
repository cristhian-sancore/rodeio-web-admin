export const dynamic = 'force-dynamic';

import { Settings, Shield, Palette, Layout, Gavel, Save, Plus, Database, Edit, Trash2, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { saveConfig, saveTemporada, deleteTemporada } from "../etapas/actions";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import { headers } from "next/headers";
import CopyLink from "@/components/CopyLink";

export default async function ConfigPage({ searchParams }: { searchParams: Promise<{ error?: string, success?: string }> }) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'SUPER') redirect('/admin');
  const { error, success } = await searchParams;

  const configData = await prisma.configuracao.findFirst();
  const config = (configData || { 
    id: 1,
    numJuizes: 2, 
    titulo: "Circuito Master Professional",
    vmixUrl: "",
    vmixInputId: "",
    vmixOverlayChannel: 1,
    vmixReplayInputId: "Instant Replay",
    replayExportPath: "",
    googleDriveFolderId: "",
    googleDriveApiKey: ""
  }) as any;

  const temporadas = await prisma.temporada.findMany({
    orderBy: { ano: 'desc' },
    include: { etapas: true }
  });

  const juizes = await prisma.juiz.findMany({ orderBy: { nome: 'asc' } });

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '2.5rem', fontSize: '2.2rem', fontWeight: '900' }}>Configurações do <span style={{color:'var(--primary)'}}>Painel</span></h1>
      
      {success && (
        <div style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', padding: '1.2rem', borderRadius: '12px', border: '1px solid currentColor', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
          <Settings size={24} />
          <span>Configurações salvas com sucesso no banco de dados!</span>
        </div>
      )}

      {/* CENTRAL DE OVERLAYS - VMIX/OBS */}
      <div className="premium-card" style={{ marginBottom: '3rem', borderLeft: '5px solid #2196F3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: '45px', height: '45px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layout size={24} color="#2196F3" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Links de Transmissão (Overlays)</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Copie esses links e insira como 'Web Browser' no vMix ou OBS.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '15px' }}>
            <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>📺 PLACAR DE NOTAS</div>
            <CopyLink url={`${baseUrl}/overlay/nota`} />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#555' }}>Exibe a nota total e os nomes na arena.</p>
          </div>

          <div style={{ padding: '1.5rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '15px' }}>
            <div style={{ color: '#2196F3', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>👤 PRÓXIMO COMPETIDOR (NEXT)</div>
            <CopyLink url={`${baseUrl}/overlay/chamada`} />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#555' }}>Tela cheia com foto e estatísticas do peão.</p>
          </div>

          <div style={{ padding: '1.5rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '15px' }}>
            <div style={{ color: '#9c27b0', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>🏆 RANKING DO RODEIO</div>
            <CopyLink url={`${baseUrl}/overlay/ranking`} />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#555' }}>Tabela dinâmica com os 10 melhores da etapa.</p>
          </div>
        </div>
      </div>
      <form action={saveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
        <div className="premium-card" style={{ borderLeft: '5px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: '45px', height: '45px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gavel size={24} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Regras de Arbitragem Globais</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Defina o comportamento do lançamento de notas do sistema.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>Título do Painel / Circuito Atual</label>
              <input name="titulo" type="text" defaultValue={config.titulo} required style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>Quantidade de Juízes Oficiais</label>
              <select name="numJuizes" defaultValue={config.numJuizes} style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }}>
                <option value="1">1 Juiz - Nota Direta (0 a 100)</option>
                <option value="2">2 Juízes - Somatória (50 peão / 50 animal cada)</option>
                <option value="4">4 Juízes - Média / Divisão (Sistema Barretos)</option>
              </select>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid #222', margin: '2rem 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '35px', height: '35px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Palette size={20} color="#2196F3" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Integração vMix (Live Scoring)</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>Use HTTPS e DNS via Cloudflare para conexões externas estáveis.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>URL da API do vMix</label>
              <input 
                name="vmixUrl" 
                type="text" 
                defaultValue={config.vmixUrl || 'http://127.0.0.1:8088/api'} 
                placeholder="https://vmix.seu-dominio.com/api"
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>vMix: Input NOTAS (GT Title)</label>
              <input 
                name="vmixInputNotaId" 
                type="text" 
                defaultValue={config.vmixInputNotaId || config.vmixInputId || ''} 
                placeholder="Ex: Notas.gtzip"
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>vMix: Input CHAMADA (Full)</label>
              <input 
                name="vmixInputChamadaId" 
                type="text" 
                defaultValue={config.vmixInputChamadaId || ''} 
                placeholder="Ex: Chamada.gtzip"
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>vMix: Input RANKING</label>
              <input 
                name="vmixInputRankingId" 
                type="text" 
                defaultValue={config.vmixInputRankingId || ''} 
                placeholder="Ex: TabelaRanking.gtzip"
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>Canal de Overlay (Nota)</label>
              <select 
                name="vmixOverlayChannel" 
                defaultValue={config.vmixOverlayChannel || 1}
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }}
              >
                <option value="1">Overlay 1</option>
                <option value="2">Overlay 2</option>
                <option value="3">Overlay 3</option>
                <option value="4">Overlay 4</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '35px', height: '35px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layout size={20} color="#FFC107" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Automação de Instant Replay (vMix)</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>O sistema irá taguear e exportar o replay automaticamente ao salvar a nota.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>ID da Entrada de Replay</label>
              <input 
                name="vmixReplayInputId" 
                type="text" 
                defaultValue={config.vmixReplayInputId || 'Instant Replay'} 
                placeholder="Ex: Instant Replay"
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>Pasta de Exportação (Caminho Absoluto)</label>
              <input 
                name="replayExportPath" 
                type="text" 
                defaultValue={config.replayExportPath || ''} 
                placeholder="Ex: C:\Rodeio\Replays"
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '35px', height: '35px', background: 'rgba(66, 133, 244, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} color="#4285F4" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Google Drive (Vídeos de Replay)</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>Cole o ID da pasta compartilhada do Google Drive onde os replays são salvos.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>ID da Pasta do Google Drive</label>
              <input 
                name="googleDriveFolderId" 
                type="text" 
                defaultValue={(config as any).googleDriveFolderId || ''} 
                placeholder="Ex: 1wLscg7oTamIWYm6hPMCmF-26Qm8zHHSG"
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
              />
              <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.5rem' }}>
                O ID é a parte final da URL da pasta: drive.google.com/drive/folders/<strong style={{ color: '#4285F4' }}>ID_AQUI</strong>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', color: '#888', fontSize: '0.9rem', fontWeight: '600' }}>API Key do Google Cloud</label>
              <input 
                name="googleDriveApiKey" 
                type="text" 
                defaultValue={(config as any).googleDriveApiKey || ''} 
                placeholder="Ex: AIzaSyB..."
                style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '1rem' }} 
              />
              <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.5rem' }}>
                Crie em <strong style={{ color: '#4285F4' }}>console.cloud.google.com</strong> → APIs → Drive API v3 → Credenciais → API Key
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Save size={18} /> SALVAR CONFIGURAÇÕES
            </button>
          </div>
        </div>
      </form>

      {/* GERENCIAMENTO DE TEMPORADAS / CIRCUITOS */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Database color="var(--primary)" size={24} /> Histórico de Circuitos (Temporadas)
      </h2>

      {error === 'TEMPORADA_HAS_LINKS' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '1rem', borderRadius: '8px', border: '1px solid currentColor', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span><b>Erro:</b> Não é possível excluir o circuito porque ele possui etapas vinculadas. Exclua as etapas ou edite o circuito em vez de excluir.</span>
        </div>
      )}
      
      <div className="grid-1-2">
        
        {/* Formulário Novo Circuito */}
        <div className="premium-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#fff' }}>Registrar Novo Circuito</h3>
          <form action={saveTemporada} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Ano</label>
                <input name="ano" type="number" required defaultValue={new Date().getFullYear()} style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ flex: 3 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.85rem' }}>Nome da Temporada</label>
                <input name="titulo" type="text" required placeholder="Ex: Circuito CRP 2026" style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: 'rgba(212, 175, 55, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#d4af37' }}>Bônus: Maior Nota Etapa</label>
                <input name="bonusMelhorNotaEtapa" type="number" step="1" defaultValue="0" style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#d4af37' }}>Bônus: Maior Nota Noite</label>
                <input name="bonusMelhorNotaNoite" type="number" step="1" defaultValue="0" style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#d4af37' }}>Bônus: Notas 90+</label>
                <input name="bonusNotasAcima90" type="number" step="1" defaultValue="10" style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#d4af37' }}>Maior Nota do Circuito</label>
                <input name="ptsMelhorNotaCampeonato" type="number" step="1" defaultValue="70" style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#fff' }}>Pontos por Posição no Round (1º ao 5º)</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[10, 8, 6, 4, 2].map((val, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', color: '#666', display: 'block', textAlign: 'center' }}>{i + 1}º</label>
                    <input name={`ptsRound${i + 1}`} type="number" defaultValue={val} style={{ width: '100%', padding: '0.5rem', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', textAlign: 'center' }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#fff' }}>Pontos por Posição na Etapa (1º ao 10º)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {[70, 60, 50, 40, 30, 25, 20, 15, 10, 5].map((val, i) => (
                  <div key={i}>
                    <label style={{ fontSize: '0.65rem', color: '#666', display: 'block', textAlign: 'center' }}>{i + 1}º</label>
                    <input name={`ptsEtapa${i + 1}`} type="number" defaultValue={val} style={{ width: '100%', padding: '0.5rem', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', textAlign: 'center' }} />
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
                  <select name="defaultJuiz1Id" style={{ width: '100%', padding: '0.6rem', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
                    <option value="">Nenhum...</option>
                    {juizes.map((j: any) => (
                      <option key={`j1-${j.id}`} value={j.id}>{j.nome}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: '#888', fontSize: '0.75rem' }}>Juiz 2 Padrão</label>
                  <select name="defaultJuiz2Id" style={{ width: '100%', padding: '0.6rem', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
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
              <input name="premiaAte" type="number" defaultValue="5" style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> ADICIONAR CIRCUITO
            </button>
          </form>
        </div>

        {/* Lista de Circuitos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {temporadas.map((temp: any) => (
            <div key={temp.id} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: temp.ativa ? '4px solid #4CAF50' : '4px solid #444' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{temp.titulo} <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '0.5rem' }}>({temp.ano})</span></h4>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>
                  <span>📋 {temp.etapas.length} Etapas</span>
                  <span>🏆 Bônus Etapa: <strong style={{color:'#d4af37'}}>+{temp.bonusMelhorNotaEtapa} pts</strong></span>
                  <span>🚀 Bônus Noite: <strong style={{color:'#d4af37'}}>+{temp.bonusMelhorNotaNoite} pts</strong></span>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', background: temp.ativa ? 'rgba(76, 175, 80, 0.1)' : '#1a1a1a', color: temp.ativa ? '#4CAF50' : '#666', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {temp.ativa ? 'TEMPORADA ATUAL' : 'ENCERRADA'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Link href={`/admin/configuracoes/temporada/${temp.id}/editar`} style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: '#fff', cursor: 'pointer', border: '1px solid #333' }}>
                    <Edit size={16} />
                  </Link>
                  <form action={deleteTemporada.bind(null, temp.id)}>
                    <button type="submit" style={{ padding: '6px', background: 'rgba(255,68,68,0.1)', borderRadius: '4px', color: '#ff4444', cursor: 'pointer', border: '1px solid currentColor' }}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {temporadas.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666', border: '2px dashed #222', borderRadius: '12px' }}>
              Nenhum circuito cadastrado.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
