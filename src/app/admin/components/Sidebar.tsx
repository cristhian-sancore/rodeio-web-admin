'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Cat, Calendar, Settings, 
  Trophy, TrendingUp, Gavel, ShieldCheck, LogOut, Menu, X 
} from "lucide-react";
import { signOut } from 'next-auth/react';

export default function Sidebar({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN';
  const isComentarista = user?.role === 'COMENTARISTA';
  const hasFullAccess = isAdmin || isComentarista;

  const NavLink = ({ href, icon: Icon, children }: any) => {
    const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
    return (
      <Link 
        href={href} 
        onClick={() => setIsOpen(false)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '10px', 
          color: isActive ? '#000' : '#888', 
          background: isActive ? 'var(--primary)' : 'transparent',
          textDecoration: 'none',
          fontWeight: isActive ? '700' : '500',
          transition: 'all 0.2s ease',
          fontSize: '0.95rem'
        }}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} /> {children}
      </Link>
    );
  };

  return (
    <>
      {/* 📱 Mobile Top Navigation Header */}
      <header className="mobile-header" style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
        background: 'rgba(18, 18, 18, 0.95)', borderBottom: '1px solid #222', zIndex: 600,
        padding: '0 1.5rem', alignItems: 'center', justifyContent: 'space-between',
        display: 'none', // Overridden by global CSS on small screens
        backdropFilter: 'blur(8px)'
      }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>Rodeio<span style={{color:'#fff'}}>Admin</span></h2>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* 🌑 Overlay for Mobile Menu */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="mobile-hide" // Special hide behavior is handled by Sidebar CSS in globals.css
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', 
            zIndex: 400, backdropFilter: 'blur(5px)' 
          }}
        />
      )}

      {/* 🧭 Sidebar Navigation */}
      <aside 
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} 
        style={{ 
          width: '280px', 
          background: '#0a0a0a', 
          borderRight: '1px solid #1a1a1a', 
          padding: '2.5rem 1.25rem', 
          height: '100vh', 
          position: 'sticky', 
          top: 0,
          display: 'flex', 
          flexDirection: 'column', 
          zIndex: 300 // Higher on mobile via globals.css
        }}
      >
        
        <div style={{ marginBottom: '3rem', padding: '0 1rem' }}>
          <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '1px' }}>RODEIO<span style={{color:'#fff'}}>ADMIN</span></h1>
          <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.1)', marginTop: '1.25rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>CREDENCIAIS: {user?.role}</p>
            <p style={{ fontSize: '0.9rem', color: '#fff', margin: '2px 0 0', fontWeight: '600' }}>{user?.name || 'Operador'}</p>
          </div>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <NavLink href="/admin" icon={LayoutDashboard}>Dashboard</NavLink>
          {isAdmin && <NavLink href="/admin/super" icon={ShieldCheck}>Super Admin</NavLink>}
          {isAdmin && <NavLink href="/admin/configuracoes" icon={Settings}>Configurações</NavLink>}
          
          {hasFullAccess && (
            <>
              <NavLink href="/admin/etapas" icon={Calendar}>Etapas</NavLink>
              <NavLink href="/admin/competidores" icon={Users}>Competidores</NavLink>
              <NavLink href="/admin/animais" icon={Cat}>Boiada/Cavalaria</NavLink>
              <NavLink href="/admin/juizes" icon={Gavel}>Juízes Oficiais</NavLink>
              <NavLink href="/admin/usuarios" icon={ShieldCheck}>Usuários</NavLink>
              <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '1rem 0.5rem' }} />
            </>
          )}

          <NavLink href="/admin/ranking" icon={TrendingUp}>Resultados & Rankings</NavLink>
          {isAdmin && <NavLink href="/admin/execucao" icon={Trophy}>Lançar Notas</NavLink>}
          {user?.role === 'JUIZ' && <NavLink href="/admin/execucao" icon={Trophy}>Painel do Juiz</NavLink>}
          
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', 
                borderRadius: '10px', color: '#ff4444', background: 'transparent',
                border: '1px solid rgba(255, 68, 68, 0.1)', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
              }}
            >
              <LogOut size={20} /> Encerrar Painel
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
