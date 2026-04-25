'use client';

import { Trash2 } from "lucide-react";
import { deleteUser } from "./actions";

export default function DeleteUserButton({ id }: { id: number }) {
  return (
    <form action={deleteUser}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm('Deseja realmente remover este usuário?')) {
            e.preventDefault();
          }
        }}
        style={{
          padding: '6px',
          background: 'rgba(255,68,68,0.1)',
          borderRadius: '4px',
          color: '#ff4444',
          cursor: 'pointer',
          border: '1px solid currentColor',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}
