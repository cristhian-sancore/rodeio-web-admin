import { prisma } from "@/lib/db";
import { Shield, Users, Database, Activity, Terminal, AlertCircle, Trash2, RefreshCcw, Layout } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DbManager from "./DbManager";
import CmsManager from "./CmsManager";
import PageBuilder from "./PageBuilder";
import { exec } from "child_process";
import { promisify } from "util";

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'SUPER_ADMIN') {
    redirect('/admin');
  }

  const [usersCount, totalLogs, databaseSize, config] = await Promise.all([
    prisma.user.count(),
    prisma.montaria.count(),
    // Mock database size for SQLite
    Promise.resolve("64 KB"),
    prisma.configuracao.findFirst()
  ]);

  const recentActivity = await prisma.montaria.findMany({
    take: 10,
    orderBy: { dataHora: 'desc' },
    include: { competidor: true, animal: true, round: { include: { etapa: true } } }
  });

  const systemLogs = await (prisma as any).systemLog.findMany({
    take: 10,
    orderBy: { dataHora: 'desc' },
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Shield size={32} color="var(--primary)" /> Painel de Controle Super Admin
          </h1>
          <p style={{ color: '#888' }}>Gestão avançada do sistema, usuários e auditoria global.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/admin/super/builder" className="btn-primary" style={{ background: 'var(--primary)', color: '#000', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '0.85rem' }}>
             <Layout size={18} /> CONSTRUTOR DE SITE
          </Link>
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>
            MODO ROOT ATIVO
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Users color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>USUÁRIOS CADASTRADOS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{usersCount}</div>
            </div>
          </div>
          <Link href="/admin/usuarios" style={{ display: 'block', marginTop: '1rem', color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold' }}>
             GERENCIAR USUÁRIOS →
          </Link>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity color="#4CAF50" />
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>LOGS DE LANÇAMENTO</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalLogs}</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', color: '#4CAF50', fontSize: '0.8rem', fontWeight: 'bold' }}>SISTEMA ESTÁVEL</div>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Database color="#2196F3" />
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>TAMANHO DO BANCO</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{databaseSize}</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', color: '#2196F3', fontSize: '0.8rem', fontWeight: 'bold' }}>AUTO-VACUUM: ON</div>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
         <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="var(--primary)" /> Gerenciador de Banco de Dados (PostgreSQL)
         </h2>
         <DbManager />
      </div>

      <div style={{ marginBottom: '3rem' }}>
          <CmsManager config={config} />
      </div>

      <div style={{ marginBottom: '3rem' }}>
          <PageBuilder config={config} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
        
        {/* Auditoria de Notas */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={20} color="var(--primary)" /> Auditoria Global de Atividades
          </h2>
          <div className="premium-card" style={{ padding: 0 }}>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ textAlign: 'left', borderBottom: '1px solid #333', fontSize: '0.8rem', color: '#666' }}>
                   <th style={{ padding: '1rem' }}>DATA/HORA</th>
                   <th>COMPETIDOR</th>
                   <th>AÇÃO</th>
                   <th style={{ textAlign: 'right', paddingRight: '1rem' }}>NOTA</th>
                 </tr>
               </thead>
               <tbody>
                 {recentActivity.map((log) => (
                   <tr key={log.id} style={{ borderBottom: '1px solid #1a1a1a', fontSize: '0.9rem' }}>
                     <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{new Date(log.dataHora).toLocaleTimeString()}</td>
                     <td style={{ fontWeight: 'bold' }}>{log.competidor.nome}</td>
                     <td>Lançamento: {log.round.etapa.nome} • R{log.round.numero}</td>
                     <td style={{ textAlign: 'right', paddingRight: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{log.notaTotal.toFixed(2)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Console de Manutenção */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color="#ff4444" /> Ferramentas de Sistema
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <button className="premium-card" style={{ textAlign: 'left', width: '100%', cursor: 'pointer', border: '1px solid rgba(255,68,68,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ff4444' }}>
                  <Trash2 size={20} />
                  <div>
                    <h4 style={{ margin: 0 }}>Limpar Cache de Rankings</h4>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>Força o recálculo imediato de todos os pontos.</p>
                  </div>
                </div>
             </button>

             <button className="premium-card" style={{ textAlign: 'left', width: '100%', cursor: 'pointer', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                  <RefreshCcw size={20} />
                  <div>
                    <h4 style={{ margin: 0 }}>Sincronizar Temporada</h4>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>Atualiza as pontuações globais do campeonato.</p>
                  </div>
                </div>
             </button>

             <div className="premium-card" style={{ background: '#000', border: '1px solid #333' }}>
                <h4 style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem' }}>INFORMAÇÕES DE AMBIENTE</h4>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#4CAF50' }}>
                   <div>OS: {process.platform}</div>
                   <div>NODE: {process.version}</div>
                   <div>DATABASE: SQLITE</div>
                   <div style={{ marginTop: '0.5rem', color: '#fff' }}>STATUS: ONLINE</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
         <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#4CAF50" /> Log de Auditoria Root (Ações de Sistema)
         </h2>
         <div className="premium-card" style={{ padding: 0 }}>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ textAlign: 'left', borderBottom: '1px solid #333', fontSize: '0.8rem', color: '#666' }}>
                   <th style={{ padding: '1rem' }}>DATA/HORA</th>
                   <th>USUÁRIO</th>
                   <th>AÇÃO</th>
                   <th>DETALHES</th>
                 </tr>
               </thead>
               <tbody>
                 {systemLogs.map((log: any) => (
                   <tr key={log.id} style={{ borderBottom: '1px solid #1a1a1a', fontSize: '0.85rem' }}>
                     <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{new Date(log.dataHora).toLocaleString()}</td>
                     <td style={{ fontWeight: 'bold' }}>{log.usuarioNome}</td>
                     <td style={{ color: 'var(--primary)' }}>{log.acao}</td>
                     <td style={{ color: '#888', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detalhes}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
      </div>
    </div>
  );
}
