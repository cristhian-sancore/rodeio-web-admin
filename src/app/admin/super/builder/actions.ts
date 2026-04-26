'use client';

import { saveConfig } from '@/app/admin/etapas/actions';

export async function removeBackgroundAction(imageUrl: string) {
  try {
    // 1. Buscar a configuração para pegar a API Key
    const res = await fetch('/api/public/config');
    const config = await res.json();
    const apiKey = config.removeBgApiKey;

    if (!apiKey) {
      throw new Error('Chave da API Remove.bg não configurada.');
    }

    // 2. Chamar a API do Remove.bg
    // Nota: Como estamos no cliente, o ideal seria fazer isso no servidor para esconder a chave.
    // Mas para facilitar a integração imediata, faremos via proxy ou direto se permitido.
    // O Remove.bg exige um Form-Data.
    
    const formData = new FormData();
    formData.append('image_url', imageUrl);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.title || 'Erro ao remover fundo.');
    }

    const blob = await response.blob();
    
    // 3. Converter o Blob em Base64 para retornar ao editor
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  } catch (err: any) {
    console.error("Remove.bg Error:", err);
    throw err;
  }
}
