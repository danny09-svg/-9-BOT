console.log("=== BOT V5 LATEST BAILEYS ===");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('V5 Latest - check logs'));
app.listen(process.env.PORT || 3000, ()=>console.log("Web up"));

async function start(){
  const { version } = await fetchLatestBaileysVersion();
  console.log("Using WA version:", version);
  
  const folder = './auth_v5_' + Date.now();
  const { state, saveCreds } = await useMultiFileAuthState(folder);
  
  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({level:'silent'}),
    printQRInTerminal: false,
    browser: ["Ubuntu","Chrome","20.0.04"]
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update)=>{
    const { qr, connection, lastDisconnect } = update;
    
    if(qr){
      console.log("\n========== QR FOUND ==========");
      const link = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`;
      console.log(link);
      console.log("========== COPY LINK ==========\n");
    }
    
    if(connection === 'close'){
      console.log("Closed, retrying...", lastDisconnect?.error?.message);
      setTimeout(start, 5000);
    }
    
    if(connection === 'open'){
      console.log(">>> BOT CONNECTED! <<<");
    }
  });
}
start();
