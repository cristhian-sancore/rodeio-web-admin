'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, X, Calendar, MapPin, ExternalLink, Trophy } from "lucide-react";
import { deleteEtapa } from "./actions";

interface Etapa {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  dataInicio: Date;
  dataFinal: Date;
  ativa: boolean;
  temporada: {
    titulo: string;
    ano: number;
  }
}

interface EtapasManagerProps {
  initialEtapas: any[];
  temporadas: any[];
  createAction: any;
}

export default function EtapasManager({ initialEtapas, temporadas, createAction }: EtapasManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredEtapas = initialEtapas.filter(e => {
    const s = search.toLowerCase();
    return e.nome.toLowerCase().includes(s) || 
           e.cidade.toLowerCase().includes(s) || 
           e.estado.toLowerCase().includes(s) ||
           e.temporada.titulo.toLowerCase().includes(s);
  });

  return (
    <div className="fade-in">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search size={20} color={search ? 'var(--primary)' : '#555'} style={{ position: 'absolute', left: '15px', top: '15px', transition: 'all 0.3s' }} />
          <input 
            type="text" 
            placeholder="Pesquisar por evento, cidade ou circuito..." 
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

        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary" 
          style={{ padding: '1rem 2rem', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(212,175,55,0.2)' }}
        >
          <Plus size={20} /> AGENDAR NOVA ETAPA
        </button>
      </div>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.9)', zIndex: 10000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="premium-card fade-in" style={{ width: '100%', maxWidth: '600px', position: 'relative', border: '1px solid #333' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#222', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--primary)', fontWeight: '900' }}>AGENDAR EVENTO</h2>
            
            <form action={async (formData) => { await createAction(formData); setIsModalOpen(false); }} className="grid-2">
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>CIRCUITO / TEMPORADA</label>
                <select name="temporadaId" required style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }}>
                  {temporadas.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.titulo} ({t.ano})</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>NOME DO EVENTO</label>
                <input name="nome" type="text" required placeholder="Ex: Festa do Peão de Barretos" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>CIDADE</label>
                <input name="cidade" type="text" required placeholder="Barretos" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>UF</label>
                <input name="estado" type="text" maxLength={2} required placeholder="SP" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>DATA INÍCIO</label>
                <input name="dataInicio" type="date" required style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>DATA FINAL</label>
                <input name="dataFinal" type="date" required style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1.5rem', padding: '1.2rem', fontSize: '1rem', fontWeight: 'bold' }}>
                CONCLUIR AGENDAMENTO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LISTAGEM DE ETAPAS */}
      <div className="responsive-grid">
        {filteredEtapas.map((e: any) => (
          <div key={e.id} className="premium-card fade-in" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '1.5rem',
            background: e.ativa ? 'rgba(212,175,55,0.02)' : '#0a0a0a',
            border: e.ativa ? '1px solid var(--primary)' : '1px solid #1a1a1a',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {e.ativa && (
              <div style={{ 
                position: 'absolute', top: '15px', right: '-35px', 
                background: 'var(--primary)', color: '#000', 
                padding: '5px 40px', transform: 'rotate(45deg)', 
                fontSize: '0.65rem', fontWeight: '900' 
              }}>ATIVA</div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '5px', textTransform: 'uppercase' }}>
                <Trophy size={12} /> {e.temporada.titulo}
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#fff', margin: 0, textTransform: 'uppercase', lineHeight: 1.1 }}>{e.nome}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '0.85rem', marginTop: '8px' }}>
                <MapPin size={14} /> {e.cidade} - {e.estado}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: 'rgba(255,255,255,0.03)', 
              padding: '10px 15px', 
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <Calendar size={16} color="#444" />
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#aaa' }}>
                {new Date(e.dataInicio).toLocaleDateString()} <span style={{color:'#444'}}>a</span> {new Date(e.dataFinal).toLocaleDateString()}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Link href={`/admin/etapas/${e.id}`} className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '0.8rem', textDecoration: 'none', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '900' }}>
                ACESSAR PAINEL
              </Link>
              
              <Link href={`/admin/etapas/${e.id}/editar`} style={{ background: '#111', color: '#fff', border: '1px solid #222', padding: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                <Edit size={16} />
              </Link>

              <button 
                onClick={async () => { if(confirm(`Deseja realmente excluir a etapa ${e.nome}?`)) await deleteEtapa(e.id); }}
                style={{ background: 'rgba(255, 68, 68, 0.05)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredEtapas.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: '#0a0a0a', borderRadius: '20px', border: '1px dashed #222' }}>
            <Search size={48} color="#222" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#444' }}>Nenhuma etapa encontrada para sua busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
