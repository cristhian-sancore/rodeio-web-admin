'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cat, TrendingUp, Search, X } from "lucide-react";

interface Animal {
  id: number;
  nome: string;
  companhia: string;
  stats: {
    total: number;
    media: string;
    derrubadas: number;
  }
}

export default function AnimalList({ initialData }: { initialData: Animal[] }) {
  const [search, setSearch] = useState('');

  // Filtro dinâmico para animais e companhias
  const filtered = initialData.filter(a => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;
    
    const words = searchLower.split(' ');
    const nomeLower = (a.nome || '').toLowerCase();
    const ciaLower = (a.companhia || '').toLowerCase();
    
    return words.every(word => 
      nomeLower.includes(word) || 
      ciaLower.includes(word)
    );
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={20} color={search ? 'var(--primary)' : '#555'} style={{ position: 'absolute', left: '12px', top: '12px', transition: 'all 0.3s' }} />
          <input 
            type="text" 
            placeholder="Digite o nome do animal ou companhia..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              padding: '0.8rem 2.8rem', 
              width: '100%', 
              background: '#0a0a0a', 
              border: search ? '1px solid var(--primary)' : '1px solid #222',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              transition: 'all 0.3s'
            }} 
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '12px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: '#666'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="responsive-grid">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', background: '#0a0a0a', borderRadius: '20px', border: '1px dashed #222' }}>
            <Search size={48} color="#222" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#444' }}>Nenhum animal encontrado para "{search}"</h3>
            <button onClick={() => setSearch('')} style={{ color: 'var(--primary)', background: 'none', border: 'none', marginTop: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>Limpar busca</button>
          </div>
        ) : (
          filtered.map((a) => (
            <Link key={a.id} href={`/animais/${a.id}`} style={{ textDecoration: 'none' }}>
              <div className="premium-card fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    width: '60px', height: '60px', 
                    background: 'rgba(212, 175, 55, 0.1)', 
                    borderRadius: '15px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: 'var(--primary)',
                    border: '1px solid rgba(212, 175, 55, 0.1)'
                  }}>
                    <Cat size={32} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{a.nome}</h3>
                    <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 'bold' }}>{a.companhia}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
                  <div style={{ background: '#151515', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>MÉDIA DE NOTA</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{a.stats.media}</div>
                  </div>
                  <div style={{ background: '#151515', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>SAÍDAS</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{a.stats.total}</div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#888', fontWeight: 'bold' }}>VER HISTÓRICO COMPLETO</span>
                  <TrendingUp size={16} color="var(--primary)" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
