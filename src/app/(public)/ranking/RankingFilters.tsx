'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, User, Cat, Clock, Award, Filter, Calendar } from "lucide-react";

interface RankingFiltersProps {
  etapas: any[];
  rounds: any[];
}

export default function RankingFilters({ etapas, rounds }: RankingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentEtapaId = searchParams.get('etapaId') || etapas[0]?.id?.toString();
  const currentEntity = searchParams.get('entity') || 'peao';
  const currentScope = searchParams.get('scope') || 'campeonato';
  const currentRoundId = searchParams.get('roundId') || '';
  const currentModalidade = searchParams.get('modalidade') || 'Touro';

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/ranking?${params.toString()}`);
  };

  const filteredRounds = rounds.filter(r => r.etapaId.toString() === currentEtapaId && r.modalidade === currentModalidade);

  return (
    <div className="premium-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Entidade: Peão ou Touro */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#888', marginBottom: '0.5rem' }}>
            CLASSIFICAÇÃO DE:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => updateFilters({ entity: 'peao' })}
              style={{ 
                flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer',
                background: currentEntity === 'peao' ? 'var(--primary)' : 'transparent',
                color: currentEntity === 'peao' ? '#000' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold'
              }}
            >
              <User size={18} /> ATLETAS
            </button>
            <button 
              onClick={() => updateFilters({ entity: 'touro' })}
              style={{ 
                flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer',
                background: currentEntity === 'touro' ? 'var(--primary)' : 'transparent',
                color: currentEntity === 'touro' ? '#000' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold'
              }}
            >
              <Cat size={18} /> TOUROS
            </button>
          </div>
        </div>

        {/* Modalidade: Touro ou Cavalo */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#888', marginBottom: '0.5rem' }}>
            MODALIDADE:
          </label>
          <select 
            value={currentModalidade}
            onChange={(e) => updateFilters({ modalidade: e.target.value, roundId: '' })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#111', color: '#fff', border: '1px solid #333' }}
          >
            <option value="Touro">TOURO</option>
            <option value="Cutiano">CUTIANO (CAVALO)</option>
          </select>
        </div>

        {/* Âmbito: Noite, Etapa ou Campeonato */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#888', marginBottom: '0.5rem' }}>
            PERÍODO:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => updateFilters({ scope: 'noite' })}
              style={{ 
                flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #333',
                background: currentScope === 'noite' ? '#fff' : 'transparent',
                color: currentScope === 'noite' ? '#000' : '#fff'
              }}
            >
              NOITE
            </button>
            <button 
              onClick={() => updateFilters({ scope: 'etapa' })}
              style={{ 
                flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #333',
                background: currentScope === 'etapa' ? '#fff' : 'transparent',
                color: currentScope === 'etapa' ? '#000' : '#fff'
              }}
            >
              ETAPA
            </button>
            <button 
              onClick={() => updateFilters({ scope: 'campeonato' })}
              style={{ 
                flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #333',
                background: currentScope === 'campeonato' ? '#fff' : 'transparent',
                color: currentScope === 'campeonato' ? '#000' : '#fff'
              }}
            >
              TOTAL
            </button>
          </div>
        </div>

        {/* Seleção de Etapa (apenas se não for campeonato) */}
        {currentScope !== 'campeonato' && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#888', marginBottom: '0.5rem' }}>
              ETAPA:
            </label>
            <select 
              value={currentEtapaId}
              onChange={(e) => updateFilters({ etapaId: e.target.value, roundId: '' })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#111', color: '#fff', border: '1px solid #333' }}
            >
              {etapas.map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Seleção de Round (apenas se for Noite) */}
        {currentScope === 'noite' && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#888', marginBottom: '0.5rem' }}>
              ESCOLHER NOITE:
            </label>
            <select 
              value={currentRoundId}
              onChange={(e) => updateFilters({ roundId: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#111', color: '#fff', border: '1px solid #333' }}
            >
              <option value="">Selecione...</option>
              {filteredRounds.map(r => (
                <option key={r.id} value={r.id}>{r.numero}ª Noite</option>
              ))}
            </select>
          </div>
        )}

      </div>
    </div>
  );
}
