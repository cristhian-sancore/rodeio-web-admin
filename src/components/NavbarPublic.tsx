'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Users, Cat, Home, TrendingUp, Menu, X } from 'lucide-react';

export function NavbarPublic() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navLinkStyle = {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'color 0.2s ease',
    opacity: 1
  };

  return (
    <>
      <nav className="public-nav">
        <div className="nav-container">
          <Link href="/" onClick={closeMenu} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '1px' }}>RODEIO</span>
            <span style={{ color: '#fff', fontWeight: 400, fontSize: '1.5rem' }}>PRO</span>
          </Link>

          {/* Desktop Menu */}
          <div className="nav-links-desktop">
            <Link href="/live" style={navLinkStyle}><TrendingUp size={18} /> AO VIVO</Link>
            <Link href="/ranking" style={navLinkStyle}><Trophy size={18} /> RANKINGS</Link>
            <Link href="/competidores" style={navLinkStyle}><Users size={18} /> COMPETIDORES</Link>
            <Link href="/animais" style={navLinkStyle}><Cat size={18} /> BOIADA</Link>
          </div>

          <div className="nav-actions-desktop">
            <Link href="/admin" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>ACESSO ADMIN</Link>
          </div>

          {/* Mobile Toggle */}
          <button className="mobile-toggle" onClick={toggleMenu}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`nav-links-mobile ${isOpen ? 'active' : ''}`}>
          <Link href="/live" onClick={closeMenu} className="mobile-link"><TrendingUp size={24} /> AO VIVO</Link>
          <Link href="/ranking" onClick={closeMenu} className="mobile-link"><Trophy size={24} /> RANKINGS</Link>
          <Link href="/competidores" onClick={closeMenu} className="mobile-link"><Users size={24} /> COMPETIDORES</Link>
          <Link href="/animais" onClick={closeMenu} className="mobile-link"><Cat size={24} /> BOIADA</Link>
          <Link href="/admin" onClick={closeMenu} className="mobile-link admin-link">ACESSO ADMIN</Link>
        </div>
      </nav>

      <style jsx>{`
        .public-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          z-index: 1000;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
        }

        .nav-container {
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-links-desktop {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-actions-desktop {
          display: flex;
        }

        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          z-index: 1001;
        }

        .nav-links-mobile {
          position: fixed;
          top: 70px;
          left: 100%;
          width: 100%;
          height: calc(100vh - 70px);
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          gap: 2rem;
          transition: left 0.3s ease;
          overflow-y: auto;
          z-index: 999;
        }

        .nav-links-mobile.active {
          left: 0;
        }

        .mobile-link {
          color: #fff;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .admin-link {
          margin-top: auto;
          color: var(--primary);
          border: 1px solid var(--primary);
          padding: 1.5rem;
          border-radius: 16px;
          justify-content: center;
        }

        @media (max-width: 900px) {
          .nav-links-desktop, .nav-actions-desktop {
            display: none;
          }
          .mobile-toggle {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
