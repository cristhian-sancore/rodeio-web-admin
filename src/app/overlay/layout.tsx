'use client';
import { useEffect } from "react";

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    document.documentElement.classList.add('transparent');
    document.body.classList.add('transparent');
    
    return () => {
      document.documentElement.classList.remove('transparent');
      document.body.classList.remove('transparent');
    };
  }, []);

  return (
    <div style={{ 
      backgroundColor: 'transparent', 
      background: 'transparent',
      width: '100vw', 
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {children}
    </div>
  )
}
