import { prisma } from "@/lib/db";
import { AlertTriangle } from "lucide-react";
import { createEtapaAction } from "./actions";
import EtapasManager from "./EtapasManager";

export default async function EtapasPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const hasError = searchParams?.error === 'ETAPA_HAS_LINKS';
  
  try {
    const temporadas = await prisma.temporada.findMany({
      orderBy: { ano: 'desc' }
    });

    const etapas = await prisma.etapa.findMany({
      include: { temporada: true },
      orderBy: { dataInicio: 'desc' }
    });

    if (temporadas.length === 0) {
      return (
        <div style={{ textAlign: 'center', marginTop: '5rem', padding: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Nenhum Circuito Ativo</h2>
          <p style={{ color: '#888', maxWidth: '500px', margin: '1rem auto' }}>Você precisa registrar um Circuito Master no painel de Configurações antes de agendar etapas.</p>
          <a href="/admin/configuracoes" className="btn-primary" style={{ display: 'inline-flex', padding: '1rem 2rem', textDecoration: 'none', marginTop: '1rem', borderRadius: '12px' }}>
            IR PARA CONFIGURAÇÕES DE CIRCUITO
          </a>
        </div>
      );
    }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px' }}>Gerenciamento de <span style={{color:'var(--primary)'}}>Etapas</span></h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Organize e monitore todos os eventos do seu circuito.</p>
      </div>

      {hasError && (
        <div style={{ padding: '1.5rem', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: '15px', color: '#ff4444', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={24} />
          <div>
            <strong style={{ fontSize: '1.1rem' }}>Não foi possível excluir a Etapa!</strong>
            <p style={{ margin: '5px 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Existem Rounds ou Montarias vinculadas a ela. Exclua as dependências primeiro antes de apagar a Etapa completa.</p>
          </div>
        </div>
      )}

      <EtapasManager 
        initialEtapas={etapas} 
        temporadas={temporadas} 
        createAction={createEtapaAction} 
      />
    </div>
  );
  } catch (error) {
    console.error("[EtapasPage] Erro:", error);
    return <div>Erro ao carregar lista de etapas.</div>;
  }
}
