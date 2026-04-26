import { prisma } from "@/lib/db";
import { Shield, Users, Database, Activity, Terminal, AlertCircle, Trash2, RefreshCcw, Layout, Monitor, LogOut } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DbManager from "./DbManager";
import CmsManager from "./CmsManager";

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPER')) {
    redirect('/login');
  }

  let config = null;
  try {
    config = await prisma.configuracao.findFirst();
  } catch (e) {
    console.error("Erro ao carregar config:", e);
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', borderBottom: '1px solid #222', paddingBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: '#D4AF37', margin: 0 }}>PAINEL SUPER ADMIN</h1>
          <p style={{ color: '#555', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '5px' }}>Controle Total do Sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/admin" style={secondaryBtn}>PAINEL ADMIN</Link>
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>
            MODO ROOT ATIVO
          </div>
          <Link href="/api/auth/signout" style={logoutBtn}>SAIR</Link>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* COLUNA ESQUERDA: PERSONALIZAÇÃO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
           <section style={cardSection}>
              <h2 style={sectionTitle}><Layout size={22} color="#D4AF37" /> PERSONALIZAR PÁGINA INICIAL</h2>
              <CmsManager config={config} />
           </section>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <Link href="/admin/super/usuarios" style={toolCard}>
                 <Users size={32} color="#D4AF37" />
                 <div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>USUÁRIOS</div>
                    <div style={{ fontSize: '0.7rem', color: '#555', fontWeight: 700 }}>GERENCIAR ACESSOS</div>
                 </div>
              </Link>
              <Link href="/admin/super/vmix" style={toolCard}>
                 <Monitor size={32} color="#D4AF37" />
                 <div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>VMIX</div>
                    <div style={{ fontSize: '0.7rem', color: '#555', fontWeight: 700 }}>GRÁFICOS E OVERLAYS</div>
                 </div>
              </Link>
           </div>
        </div>

        {/* COLUNA DIREITA: BANCO DE DADOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
           <section style={cardSection}>
              <h2 style={sectionTitle}><Database size={22} color="#D4AF37" /> BANCO DE DADOS E FERRAMENTAS</h2>
              <DbManager />
           </section>
        </div>

      </div>
    </div>
  );
}

// --- ESTILOS INLINE (Garante que funcione sem Tailwind) ---
const cardSection = { background: '#0a0a0a', padding: '40px', borderRadius: '30px', border: '1px solid #1a1a1a' };
const sectionTitle = { fontSize: '1.2rem', fontWeight: 950, marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' };
const secondaryBtn = { background: '#1a1a1a', color: '#fff', padding: '12px 25px', borderRadius: '12px', fontWeight: 900, textDecoration: 'none', fontSize: '0.8rem', border: '1px solid #333' };
const logoutBtn = { background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '12px 25px', borderRadius: '12px', fontWeight: 900, textDecoration: 'none', fontSize: '0.8rem' };
const toolCard = { background: '#0a0a0a', padding: '30px', borderRadius: '25px', border: '1px solid #111', textDecoration: 'none', color: '#fff', display: 'flex', flexDirection: 'column' as const, gap: '20px', transition: 'all 0.2s' };
