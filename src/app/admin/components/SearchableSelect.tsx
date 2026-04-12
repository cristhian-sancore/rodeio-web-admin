'use client';

import { useState } from 'react';

export default function SearchableSelect({ 
  name, 
  options, 
  placeholder,
  defaultValue
}: { 
  name: string, 
  options: { id: number, label: string }[], 
  placeholder: string,
  defaultValue?: number
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: number, label: string } | null>(
    defaultValue ? options.find(o => o.id === defaultValue) || null : null
  );

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Oculto, é o que será enviado no formData do lado do servidor */}
      <input type="hidden" name={name} value={selected ? selected.id : ''} required />
      
      {/* Campo visual de digitação / busca */}
      <input 
        type="text" 
        value={open ? search : (selected ? selected.label : '')}
        onChange={e => setSearch(e.target.value)}
        onFocus={() => { setOpen(true); setSearch(''); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        style={{ 
          width: '100%', 
          padding: '0.75rem', 
          background: '#222', 
          border: '1px solid #333', 
          borderRadius: '8px', 
          color: '#fff',
          fontSize: '0.9rem'
        }}
        autoComplete="off"
      />
      
      {/* Lista Suspensa (Dropdown Personalizado) */}
      {open && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 4px)', 
          left: 0, 
          right: 0, 
          background: '#151515', 
          border: '1px solid #444', 
          borderRadius: '8px', 
          zIndex: 50, 
          maxHeight: '250px', 
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <div 
                key={opt.id} 
                onClick={() => { setSelected(opt); setOpen(false); }}
                style={{ 
                  padding: '0.75rem 1rem', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #222',
                  fontSize: '0.9rem',
                  color: '#ddd'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div style={{ padding: '1rem', color: '#666', textAlign: 'center', fontSize: '0.85rem' }}>
              Nenhum resultado encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
