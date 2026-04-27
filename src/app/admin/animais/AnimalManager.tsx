'use client';

import { useState } from 'react';
import { Cat, Trash2, Edit, Search, X, Plus, Shield, Camera } from "lucide-react";
import Link from "next/link";
import { deleteAnimal } from "./actions";
import ExcelActions from "./ExcelActions";

interface Animal {
  id: number;
  nome: string;
  companhia: string;
  tipo: string;
  fotoUrl: string | null;
}

interface AnimalManagerProps {
  initialData: Animal[];
  createAction: any;
}

export default function AnimalManager({ initialData, createAction }: AnimalManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = initialData.filter(a => {
    const s = search.toLowerCase();
    return a.nome.toLowerCase().includes(s) || 
           a.companhia.toLowerCase().includes(s);
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
            placeholder="Pesquisar por nome do animal ou companhia..." 
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

        <div style={{ display: 'flex', gap: '10px' }}>
          <ExcelActions data={initialData} />
          <Link href="/admin/animais/ranking" className="btn-primary" style={{ padding: '1rem 1.5rem', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '8px', background: '#111', border: '1px solid #222', textDecoration: 'none', fontSize: '0.9rem' }}>
            RANKING DA BOIADA
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary" 
            style={{ padding: '1rem 2rem', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}
          >
            <Plus size={20} /> NOVO ANIMAL
          </button>
        </div>
      </div>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.9)', zIndex: 10000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="premium-card fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', border: '1px solid #333' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#222', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--primary)', fontWeight: '900' }}>CADASTRAR ANIMAL</h2>
            
            <form action={async (formData) => { await createAction(formData); setIsModalOpen(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>NOME DO ANIMAL</label>
                <input name="nome" type="text" required placeholder="Ex: Bandido" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>COMPANHIA / TROPA</label>
                <input name="companhia" type="text" required placeholder="Ex: Cia Paulo Emílio" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>TIPO</label>
                  <select name="tipo" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }}>
                    <option value="Touro">Touro</option>
                    <option value="Cavalo">Cavalo</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                   <Camera size={14} /> FOTO / CÂMERA
                </label>
                <input 
                  name="foto" 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  style={{ width: '100%', padding: '1rem', background: '#000', border: '1px dashed #333', borderRadius: '10px', color: '#888', fontSize: '0.8rem' }} 
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1.2rem', fontSize: '1rem', fontWeight: 'bold' }}>
                SALVAR ANIMAL
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LISTAGEM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
        {filtered.map((a) => (
          <div key={a.id} className="premium-card fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ 
                width: '60px', height: '60px', 
                background: 'rgba(212, 175, 55, 0.05)', 
                borderRadius: '15px', 
                overflow: 'hidden', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: 'var(--primary)', 
                border: '1px solid #1a1a1a' 
              }}>
                {a.fotoUrl ? (
                  <img src={a.fotoUrl} alt={a.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Cat size={28} />
                )}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>{a.nome}</h4>
                <div style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {a.companhia}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href={`/admin/animais/${a.id}/editar`} style={{ padding: '10px', background: '#111', borderRadius: '10px', color: '#fff', border: '1px solid #222', display: 'flex' }}>
                <Edit size={16} />
              </Link>
              <button 
                onClick={async () => { if(confirm(`Deseja excluir o animal ${a.nome}?`)) await deleteAnimal(a.id); }}
                style={{ padding: '10px', background: 'rgba(255,68,68,0.05)', borderRadius: '10px', color: '#ff4444', border: '1px solid rgba(255,68,68,0.1)', cursor: 'pointer', display: 'flex' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: '#0a0a0a', borderRadius: '20px', border: '1px dashed #222' }}>
            <Search size={48} color="#222" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#444' }}>Nenhum animal encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
