console.log("=== BOT V4 FRESH AUTH ===");
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('Bot V4 - check logs for QR link'));
app.listen(process.env.PORT || 3000, ()=>console.log("Web up"));

// DELETE OLD BAD SESSIONS
try {
  if(fs.existsSync('./auth_v3')) fs.rmSync('./auth_v3', {recursive:true, force:true});
  if(fs.existsSync('./session_qr')) fs.rmSync('./session_qr', {recursive:true, force:true});
  console.log("Cleaned old auth");
} catch(e){}

async function start(){
  const folder = './auth_fresh_' + Date.now();
  console.log("Using folder:", folder);
  const { state, saveCreds } = await useMultiFileAuthState(folder);
  
  const sock = makeWASocket({
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
      console.log("COPY THIS LINK OPEN FOR BROWSER:");
      console.log(link);
      console.log("========== END ==========\n");
    }
    
    if(connection === 'close'){
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("Closed, reason code:", reason, "Full:", JSON.stringify(lastDisconnect).slice(0,500));
      console.log("Retrying in 5 secs...");
      setTimeout(start, 5000);
    }
    
    if(connection === 'open'){
      console.log(">>> BOT CONNECTED SUCCESSFULLY! <<<");
    }
  });
}
start();
