'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Cat, Calendar, Settings, 
  Trophy, TrendingUp, Gavel, ShieldCheck, LogOut, Menu, X, User
} from "lucide-react";
import { signOut } from 'next-auth/react';
import { checkVMixStatus } from '../etapas/actions';
import { Wifi, WifiOff } from 'lucide-react';

export default function Sidebar({ user, config }: { user: any, config: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isComentarista = user?.role === 'COMENTARISTA';
  const hasFullAccess = isAdmin || isSuperAdmin || isComentarista;
  
  const siteName = config?.titulo || 'RODEIO PRO';
  const firstName = siteName.split(' ')[0];
  const restName = siteName.split(' ').slice(1).join(' ');

  const [vmixOnline, setVmixOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const res = await checkVMixStatus();
      setVmixOnline(res.online);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

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
        <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>{firstName}<span style={{color:'#fff'}}>{restName}</span></h2>
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
          <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>{firstName}<span style={{color:'#fff'}}>{restName}</span></h1>
          <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.1)', marginTop: '1.25rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>CREDENCIAIS: {user?.role}</p>
            <p style={{ fontSize: '0.9rem', color: '#fff', margin: '2px 0 0', fontWeight: '600' }}>{user?.name || 'Operador'}</p>
            
            <div style={{ 
              marginTop: '0.75rem', 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.65rem',
              color: vmixOnline ? '#4CAF50' : (vmixOnline === false ? '#ff4444' : '#666'),
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              <div style={{ 
                width: '6px', height: '6px', borderRadius: '50%', 
                background: vmixOnline ? '#4CAF50' : (vmixOnline === false ? '#ff4444' : '#666'),
                boxShadow: vmixOnline ? '0 0 8px #4CAF50' : 'none' 
              }} />
              {vmixOnline ? <><Wifi size={10} /> vMix Online</> : <><WifiOff size={10} /> vMix Offline</>}
            </div>
          </div>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          
          <div style={{ fontSize: '0.65rem', color: '#555', fontWeight: 'bold', letterSpacing: '1.5px', marginTop: '1rem', padding: '0 1.25rem' }}>OPERACIONAL</div>
          
          <NavLink href="/admin" icon={LayoutDashboard}>Dashboard</NavLink>
          
          {isAdmin && <NavLink href="/admin/execucao" icon={Trophy}>Lançar Notas</NavLink>}
          {user?.role === 'JUIZ' && <NavLink href="/admin/execucao" icon={Trophy}>Painel do Juiz</NavLink>}
          
          <NavLink href="/admin/ranking" icon={TrendingUp}>Resultados & Rankings</NavLink>

          <div style={{ fontSize: '0.65rem', color: '#555', fontWeight: 'bold', letterSpacing: '1.5px', marginTop: '1.5rem', padding: '0 1.25rem' }}>GERENCIAMENTO</div>

          {hasFullAccess && (
            <>
              <NavLink href="/admin/etapas" icon={Calendar}>Etapas</NavLink>
              <NavLink href="/admin/competidores" icon={Users}>Competidores</NavLink>
              <NavLink href="/admin/animais" icon={Cat}>Boiada/Cavalaria</NavLink>
              <NavLink href="/admin/juizes" icon={Gavel}>Juízes Oficiais</NavLink>
              
              {isAdmin && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '0.8rem 0.5rem' }} />
                  <NavLink href="/admin/usuarios" icon={ShieldCheck}>Usuários</NavLink>
                  {isSuperAdmin && <NavLink href="/admin/super" icon={ShieldCheck}>Super Admin</NavLink>}
                  <NavLink href="/admin/configuracoes" icon={Settings}>Configurações</NavLink>
                </>
              )}
            </>
          )}
          
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ margin: '0 0 1.5rem 0', padding: '0 0.5rem' }}>
              <NavLink href="/admin/perfil" icon={User}>Meu Perfil</NavLink>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                padding: '0.85rem 1.25rem', 
                borderRadius: '10px', 
                color: '#ff4444', 
                background: 'rgba(255, 68, 68, 0.05)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                fontSize: '0.95rem'
              }}
            >
              <LogOut size={20} /> Sair do Painel
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
