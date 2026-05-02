'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, X, Calendar, MapPin, ArrowRight, LayoutGrid } from "lucide-react";

interface Etapa {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  rounds: {
    id: number;
    numero: number;
    modalidade: string;
    _count: { montarias: number };
  }[];
}

interface ExecucaoRoundSelectorProps {
  etapas: Etapa[];
  isAdmin: boolean;
}

export default function ExecucaoRoundSelector({ etapas, isAdmin }: ExecucaoRoundSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = etapas.filter(etapa => {
    const s = search.toLowerCase();
    return etapa.nome.toLowerCase().includes(s) || 
           etapa.cidade.toLowerCase().includes(s) || 
           etapa.estado.toLowerCase().includes(s);
  });

  return (
    <div className="fade-in">
      <div style={{ position: 'relative', maxWidth: '500px', marginBottom: '2.5rem' }}>
        <Search size={20} color={search ? 'var(--primary)' : '#555'} style={{ position: 'absolute', left: '15px', top: '15px', transition: 'all 0.3s' }} />
        <input 
          type="text" 
          placeholder="Pesquisar evento ou cidade..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            padding: '1rem 3rem', 
            width: '100%', 
            background: '#0a0a0a', 
            border: search ? '1px solid var(--primary)' : '1px solid #222',
            borderRadius: '15px',
            fontSize: '1rem',
            color: '#fff',
            outline: 'none',
            transition: 'all 0.3s'
          }} 
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '15px', top: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className="responsive-grid">
        {filtered.map((etapa) => (
          <div key={etapa.id} className="premium-card fade-in" style={{ border: '1px solid #1a1a1a', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '50px', height: '50px', 
                background: 'rgba(212, 175, 55, 0.05)', 
                borderRadius: '15px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)',
                border: '1px solid rgba(212, 175, 55, 0.1)'
              }}>
                <Calendar size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>{etapa.nome}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '0.8rem', marginTop: '4px' }}>
                  <MapPin size={12} /> {etapa.cidade} - {etapa.estado}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {etapa.rounds.map((round) => (
                <Link 
                  key={round.id} 
                  href={`/admin/execucao?roundId=${round.id}`} 
                  className="premium-card" 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    textDecoration: 'none', 
                    background: '#0a0a0a', 
                    padding: '1.25rem',
                    border: '1px solid #222',
                    borderRadius: '15px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '35px', height: '35px', background: '#111', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid #222' }}>
                       <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{round.numero}</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 'bold' }}>ROUND {round.numero}</h4>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: round.modalidade === 'Cutiano' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                          color: round.modalidade === 'Cutiano' ? '#60a5fa' : 'var(--accent)',
                          textTransform: 'uppercase',
                          border: round.modalidade === 'Cutiano' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
                          letterSpacing: '0.5px'
                        }}>
                          {round.modalidade || 'Touro'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#555', marginTop: '3px' }}>{round._count.montarias} montarias escaladas</p>
                    </div>
                  </div>
                  <ArrowRight size={18} color="var(--primary)" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: '#0a0a0a', borderRadius: '20px', border: '1px dashed #222' }}>
            <Search size={48} color="#222" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#444' }}>Nenhum round ou etapa ativa encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
