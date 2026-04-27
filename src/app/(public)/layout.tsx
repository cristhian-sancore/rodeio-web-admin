export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { NavbarPublic } from '@/components/NavbarPublic';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <NavbarPublic />

      <main style={{ paddingTop: '100px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          {children}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #222', padding: '3rem 0', marginTop: '4rem', background: '#050505' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>
            © 2026 Rodeio Pro - Tecnologia de Ponta para o Campo.
          </div>
          <div style={{ display: 'flex', gap: '2rem', opacity: 0.6, fontSize: '0.9rem' }}>
            <Link href="/contato" style={{ color: '#fff', textDecoration: 'none' }}>Contato</Link>
            <Link href="/privacidade" style={{ color: '#fff', textDecoration: 'none' }}>Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const navLinkStyle = {
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'color 0.2s ease',
  opacity: 0.8
};
