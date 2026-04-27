'use client';

import { useState } from 'react';
import { Plus, Target, User, Cat, X, Save, Camera } from "lucide-react";
import SearchableSelect from "../../../../../components/SearchableSelect";

interface SorteioManagerProps {
  roundId: number;
  etapaId: number;
  modalidade: string;
  competidores: any[];
  animais: any[];
  montarias: any[];
  addMontariaAction: any;
  createCompetidorAction: any;
  createAnimalAction: any;
}

export default function SorteioManager({ 
  roundId, 
  etapaId, 
  modalidade, 
  competidores, 
  animais, 
  montarias, 
  addMontariaAction,
  createCompetidorAction,
  createAnimalAction
}: SorteioManagerProps) {
  const [isCompetidorModalOpen, setIsCompetidorModalOpen] = useState(false);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);

  return (
    <div className="premium-card">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
        <Target size={20} color="var(--primary)" /> Adicionar à Súmula
      </h3>
      
      <form action={addMontariaAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <input type="hidden" name="roundId" value={roundId} />
        <input type="hidden" name="etapaId" value={etapaId} />
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#888' }}>Atleta (Peão)</label>
            <button 
              type="button" 
              onClick={() => setIsCompetidorModalOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={12} /> NOVO PEÃO
            </button>
          </div>
          <SearchableSelect 
            name="competidorId" 
            placeholder="Pesquise pelo nome do Peão..." 
            options={competidores.map(c => ({
              id: c.id, 
              label: `${c.nome} ${montarias.some(m => m.competidorId === c.id) ? '🕒 (Escalado)' : ''}`
            }))} 
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#888' }}>Animal ({modalidade})</label>
            <button 
              type="button" 
              onClick={() => setIsAnimalModalOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={12} /> NOVO {modalidade.toUpperCase()}
            </button>
          </div>
          <SearchableSelect 
            name="animalId" 
            placeholder={`Procurar ${modalidade}...`} 
            options={animais.map(c => ({
              id: c.id, 
              label: `${c.nome} (${c.companhia})`
            }))} 
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 'bold' }}>
          <Plus size={20} /> ADICIONAR CONFRONTO
        </button>
      </form>

      {/* MODAL NOVO PEÃO */}
      {isCompetidorModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div className="premium-card fade-in" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setIsCompetidorModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} /> NOVO COMPETIDOR
            </h2>
            <form action={async (formData) => { await createCompetidorAction(formData); setIsCompetidorModalOpen(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input name="nome" type="text" required placeholder="Nome do Peão" style={{ width: '100%', padding: '0.8rem', background: '#000', border: '1px solid #222', borderRadius: '8px', color: '#fff' }} />
              <input name="cidade" type="text" placeholder="Cidade" style={{ width: '100%', padding: '0.8rem', background: '#000', border: '1px solid #222', borderRadius: '8px', color: '#fff' }} />
              <input name="uf" type="text" maxLength={2} placeholder="UF (Ex: SP)" style={{ width: '100%', padding: '0.8rem', background: '#000', border: '1px solid #222', borderRadius: '8px', color: '#fff' }} />
              <button type="submit" className="btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem' }}>SALVAR E VOLTAR</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO ANIMAL */}
      {isAnimalModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div className="premium-card fade-in" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setIsAnimalModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cat size={20} /> NOVO ANIMAL
            </h2>
            <form action={async (formData) => { await createAnimalAction(formData); setIsAnimalModalOpen(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input name="nome" type="text" required placeholder="Nome do Animal" style={{ width: '100%', padding: '0.8rem', background: '#000', border: '1px solid #222', borderRadius: '8px', color: '#fff' }} />
              <input name="companhia" type="text" required placeholder="Companhia / Tropa" style={{ width: '100%', padding: '0.8rem', background: '#000', border: '1px solid #222', borderRadius: '8px', color: '#fff' }} />
              <select name="tipo" style={{ width: '100%', padding: '0.8rem', background: '#000', border: '1px solid #222', borderRadius: '8px', color: '#fff' }}>
                <option value={modalidade === 'Cavalo' ? 'Cavalo' : 'Touro'}>{modalidade}</option>
                <option value={modalidade === 'Cavalo' ? 'Touro' : 'Cavalo'}>{modalidade === 'Cavalo' ? 'Touro' : 'Cavalo'}</option>
              </select>
              <button type="submit" className="btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem' }}>SALVAR E VOLTAR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
