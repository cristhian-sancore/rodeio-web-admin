'use client';
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, User, Eye, EyeOff, LogIn } from "lucide-react";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Usuário ou senha inválidos.");
        setLoading(false);
      } else if (result?.ok) {
        // Usar location.href em vez de router.push para garantir
        // que o navegador envie o cookie de sessão na próxima request
        window.location.href = callbackUrl;
      } else {
        setError("Erro desconhecido ao autenticar.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Erro de conexão com o servidor.");
      setLoading(false);
    }
  };

  return (
    <div className="premium-card" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ 
          width: '64px', height: '64px', background: 'rgba(212, 175, 55, 0.1)', 
          borderRadius: '16px', display: 'inline-flex', alignItems: 'center', 
          justifyContent: 'center', marginBottom: '1.5rem', border: '2px solid var(--primary)'
        }}>
          <ShieldCheck size={32} color="var(--primary)" />
        </div>
        <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '2px', marginBottom: '0.5rem' }}>RODEIO<span style={{color:'#fff'}}>ADMIN</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Painel de Gestão Circuito Profissional</p>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--danger)', 
          color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', 
          fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Usuário</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: juiz_oficial"
              style={{ paddingLeft: '2.5rem' }}
            />
            <User size={18} style={{ position: 'absolute', left: '0.8rem', top: '0.85rem', color: '#444' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Senha de Acesso</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
            />
            <Lock size={18} style={{ position: 'absolute', left: '0.8rem', top: '0.85rem', color: '#444' }} />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '0.8rem', top: '0.85rem', background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1rem', height: '52px' }}>
          {loading ? "VALIDANDO ACESSO..." : <><LogIn size={20} /> ACESSAR PAINEL</>}
        </button>
      </form>

      <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.7rem', color: '#444' }}>
        © 2026 RODEO MANAGEMENT SYSTEM - V2.0<br/>
        CNAR OFFICIAL PLATFORM
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      padding: '2rem'
    }}>
      <Suspense fallback={<div style={{ color: '#fff' }}>Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
