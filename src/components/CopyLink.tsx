'use client';

import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      background: '#050505', 
      padding: '5px 10px', 
      borderRadius: '8px',
      border: '1px solid #222',
      marginTop: '10px'
    }}>
      <code style={{ 
        flex: 1, 
        fontSize: '0.8rem', 
        color: '#aaa', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap' 
      }}>
        {url}
      </code>
      <button 
        type="button"
        onClick={handleCopy}
        style={{ 
          background: copied ? '#4CAF50' : '#1a1a1a', 
          border: 'none', 
          borderRadius: '5px', 
          padding: '8px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s',
          color: copied ? '#000' : '#fff'
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}
