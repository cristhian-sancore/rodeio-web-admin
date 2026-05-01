
const fs = require('fs');
const https = require('https');

const API_KEY = 'ptr_qxZG4bcG7z1VLvalJX3dQKy/dDuWicAL+j4OTV0CEo8=';
const STACK_ID = 44;
const ENDPOINT_ID = 3;
const PORTAINER_URL = 'portainer.cristhiansancore.com.br';

const stackContent = fs.readFileSync('portainer-stack.yml', 'utf8');

const data = JSON.stringify({
  StackFileContent: stackContent,
  Prune: true,
  PullImage: true
});

const options = {
  hostname: PORTAINER_URL,
  port: 443,
  path: `/api/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}`,
  method: 'PUT',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
