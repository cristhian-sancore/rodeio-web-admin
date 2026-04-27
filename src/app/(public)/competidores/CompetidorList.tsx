'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, MapPin, TrendingUp, Search, X } from "lucide-react";

interface Competidor {
  id: number;
  nome: string;
  cidade: string | null;
  uf: string | null;
  stats: {
    paradas: number;
    totalMontarias: number;
    aproveitamento: number;
  }
}

export default function CompetidorList({ initialData }: { initialData: Competidor[] }) {
  const [search, setSearch] = useState('');

  // Filtro inteligente e dinâmico
  const filtered = initialData.filter(c => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;
    
    // Divide a busca por palavras para encontrar partes do nome (ex: "ever dom" acha "Everton Domingos")
    const words = searchLower.split(' ');
    const nomeLower = (c.nome || '').toLowerCase();
    const cidadeLower = (c.cidade || '').toLowerCase();
    const ufLower = (c.uf || '').toLowerCase();
    
    return words.every(word => 
      nomeLower.includes(word) || 
      cidadeLower.includes(word) || 
      ufLower.includes(word)
    );
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={20} color={search ? 'var(--primary)' : '#555'} style={{ position: 'absolute', left: '12px', top: '12px', transition: 'all 0.3s' }} />
          <input 
            type="text" 
            placeholder="Comece a digitar o nome, cidade ou UF..." 
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
            <h3 style={{ color: '#444' }}>Nenhum competidor encontrado para "{search}"</h3>
            <button onClick={() => setSearch('')} style={{ color: 'var(--primary)', background: 'none', border: 'none', marginTop: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>Limpar busca</button>
          </div>
        ) : (
          filtered.map((c) => (
            <Link key={c.id} href={`/competidores/${c.id}`} style={{ textDecoration: 'none' }}>
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
                    <User size={32} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.nome}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#666', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      <MapPin size={14} /> {c.cidade} - {c.uf}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
                  <div style={{ background: '#151515', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>APROVEITAMENTO</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{c.stats.aproveitamento}%</div>
                  </div>
                  <div style={{ background: '#151515', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>PARADAS</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{c.stats.paradas}/{c.stats.totalMontarias}</div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#888', fontWeight: 'bold' }}>VER PERFIL COMPLETO</span>
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
