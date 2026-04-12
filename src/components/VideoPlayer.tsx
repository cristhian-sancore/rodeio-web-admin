'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  thumbnail: string | null;
  className?: string;
}

export function VideoPlayer({ videoId, thumbnail, className }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Garantir que o clique seja instantâneo no mobile
  const handlePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(true);
    setIsLoading(true);
  };

  if (isPlaying) {
    return (
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 100, 
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isLoading && (
          <div style={{ 
            position: 'absolute', 
            zIndex: 102, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1rem' 
          }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Carregando Replay...
            </div>
          </div>
        )}
        
        <iframe
          key={videoId}
          src={`https://drive.google.com/file/d/${videoId}/preview`}
          style={{ width: '100%', height: '100%', border: 'none', opacity: isLoading ? 0.3 : 1, transition: 'opacity 0.3s' }}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  }

  return (
    <div 
      className={className} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        cursor: 'pointer',
        backgroundImage: thumbnail ? `url(${thumbnail.replace('=s220', '=s800')})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        touchAction: 'manipulation'
      }}
      onClick={handlePlay}
      onTouchEnd={handlePlay}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 }} />
      {!thumbnail && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, #111, #222)', zIndex: 0 }} />}
      
      <div style={{ 
        zIndex: 10, 
        width: '80px', 
        height: '80px', 
        background: 'var(--primary)', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: '0 0 40px var(--primary-glow)',
        color: '#000',
        transition: 'transform 0.1s active'
      }}>
        <Play size={40} fill="currentColor" style={{ marginLeft: '4px' }} />
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '0.8rem',
        color: '#fff',
        background: 'rgba(0,0,0,0.7)',
        padding: '8px 16px',
        borderRadius: '30px',
        zIndex: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        Tocar Replay
      </div>
    </div>
  );
}
