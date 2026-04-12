import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateAnimal } from "../../actions";
import { Save, ArrowLeft, Cat } from "lucide-react";
import Link from "next/link";

export default async function EditarAnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const aId = parseInt(id);

  const animal = await prisma.animal.findUnique({ where: { id: aId } });
  if (!animal) redirect('/admin/animais');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/animais" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Voltar para Plantel
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Editar Animal: <span style={{ color: 'var(--primary)' }}>{animal.nome}</span></h1>
      </div>

      <div className="premium-card" style={{ maxWidth: '600px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <Cat size={20} color="var(--primary)" /> Ficha do Animal
        </h3>
        
        <form action={updateAnimal} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <input type="hidden" name="id" value={animal.id} />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Nome do Animal</label>
            <input name="nome" type="text" required defaultValue={animal.nome} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Companhia / Tropa</label>
            <input name="companhia" type="text" required defaultValue={animal.companhia} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Tipo</label>
            <select name="tipo" required defaultValue={animal.tipo} style={{ width: '100%', padding: '0.9rem', background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem' }}>
              <option value="Touro">Touro</option>
              <option value="Cavalo">Cavalo</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <Save size={20} /> SALVAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}
