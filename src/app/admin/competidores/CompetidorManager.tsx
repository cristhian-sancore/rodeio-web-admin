'use client';

import { useState } from 'react';
import { User, Trash2, Edit, Search, X, Plus, MapPin, Camera } from "lucide-react";
import Link from "next/link";
import { deleteCompetidor } from "./actions";
import ExcelActions from "./ExcelActions";

interface Competidor {
  id: number;
  nome: string;
  cidade: string | null;
  uf: string | null;
  fotoUrl: string | null;
}

interface CompetidorManagerProps {
  initialData: Competidor[];
  createAction: any;
}

export default function CompetidorManager({ initialData, createAction }: CompetidorManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = initialData.filter(c => {
    const s = search.toLowerCase();
    return c.nome.toLowerCase().includes(s) || 
           (c.cidade || '').toLowerCase().includes(s) || 
           (c.uf || '').toLowerCase().includes(s);
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
            placeholder="Pesquisar atleta por nome, cidade ou UF..." 
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary" 
            style={{ padding: '1rem 2rem', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}
          >
            <Plus size={20} /> NOVO ATLETA
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

            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--primary)', fontWeight: '900' }}>CADASTRAR ATLETA</h2>
            
            <form action={async (formData) => { await createAction(formData); setIsModalOpen(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>NOME COMPLETO</label>
                <input name="nome" type="text" required placeholder="Ex: João Silva" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>CIDADE</label>
                  <input name="cidade" type="text" placeholder="Ex: Fernandópolis" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>UF</label>
                  <input name="uf" type="text" maxLength={2} placeholder="SP" style={{ width: '100%', padding: '1rem', background: '#000', border: '1px solid #222', borderRadius: '10px', color: '#fff' }} />
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
                SALVAR CADASTRO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LISTAGEM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
        {filtered.map((c) => (
          <div key={c.id} className="premium-card fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
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
                {c.fotoUrl ? (
                  <img src={c.fotoUrl} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={28} />
                )}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>{c.nome}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '0.8rem', marginTop: '4px' }}>
                  <MapPin size={12} /> {c.cidade || 'Não inf.'} - {c.uf || ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href={`/admin/competidores/${c.id}/editar`} style={{ padding: '10px', background: '#111', borderRadius: '10px', color: '#fff', border: '1px solid #222', display: 'flex' }}>
                <Edit size={16} />
              </Link>
              <button 
                onClick={async () => { if(confirm(`Deseja excluir o atleta ${c.nome}?`)) await deleteCompetidor(c.id); }}
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
            <p style={{ color: '#444' }}>Nenhum competidor encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
