/**
 * Obtém o IP local do PC para o app no celular acessar o backend.
 * Uso: node get-ip.js
 */
const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push(iface.address);
      }
    }
  }
  // Prefer 192.168.x.x or 10.x.x.x (WiFi/LAN) - phone can reach these
  const lan = candidates.find(ip => ip.startsWith('192.168.') || ip.startsWith('10.'));
  if (lan) return lan;
  // Avoid 172.17.x, 172.19.x (Docker/WSL) - phone usually can't reach
  const notDocker = candidates.find(ip => !ip.startsWith('172.17.') && !ip.startsWith('172.19.'));
  if (notDocker) return notDocker;
  return candidates[0] || '192.168.1.100';
}

const ip = getLocalIP();
const envPath = path.join(__dirname, '.env');
let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

// Atualizar ou adicionar EXPO_PUBLIC_API_URL
const urlLine = `EXPO_PUBLIC_API_URL=http://${ip}:8001`;
if (content.includes('EXPO_PUBLIC_API_URL=')) {
  content = content.replace(/EXPO_PUBLIC_API_URL=.*/g, urlLine);
} else {
  content = urlLine + '\n' + content;
}
fs.writeFileSync(envPath, content);
console.log('IP do PC:', ip);
console.log('API URL configurada:', urlLine);
console.log('Arquivo .env atualizado.');
