/**
 * SCRIPT DE REDEPLOY AUTOMATIZADO - PORTAINER API
 * Este script força o pull da imagem mais recente e recria o container.
 */
const axios = require('axios');

const PORTAINER_URL = 'https://portainer.cristhiansancore.com.br';
const API_TOKEN = 'ptr_qxZG4bcG7z1VLvalJX3dQKy/dDuWicAL+j4OTV0CEo8=';
const STACK_ID = 26; // ID da stack do Rodeio Web no Portainer

async function redeploy() {
    console.log('🚀 Iniciando atualização remota via Portainer...');
    
    try {
        const api = axios.create({
            baseURL: PORTAINER_URL,
            headers: { 'X-API-Key': API_TOKEN }
        });

        // 1. Obter detalhes da stack para pegar o env e Git config
        const { data: stack } = await api.get(`/api/stacks/${STACK_ID}`);
        console.log(`📦 Stack localizada: ${stack.Name}`);

        // 2. Forçar atualização (Pull Image + Redeploy)
        // No Portainer API v2, usamos o endpoint de 'git update' se for stack Git
        await api.put(`/api/stacks/${STACK_ID}/git/redeploy`, {
            env: stack.Env,
            pullImage: true
        });

        console.log('✅ Comando enviado com sucesso! O container será reiniciado em instantes.');
    } catch (err) {
        console.error('❌ Erro no redeploy:', err.response?.data || err.message);
        process.exit(1);
    }
}

redeploy();
