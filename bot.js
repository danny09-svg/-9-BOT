console.log("=== STARTING QR BOT V3 - FORCE LOGS ===");
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('Bot V3 running - check logs'));
app.listen(process.env.PORT || 3000, ()=>console.log("Web up"));

async function start(){
  console.log("Getting auth...");
  const { state, saveCreds } = await useMultiFileAuthState('./auth_v3');
  console.log("Making socket...");
  const sock = makeWASocket({
    auth: state,
    logger: P({level:'silent'}),
    printQRInTerminal: false,
    browser: ["Ubuntu","Chrome","20.0.04"]
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  console.log("Listening for QR...");
  
  sock.ev.on('connection.update', async (update)=>{
    console.log("UPDATE RECEIVED:", JSON.stringify(update, null, 2).substring(0, 1000));
    
    const { qr, connection, lastDisconnect } = update;
    
    if(qr){
      console.log("\n========== QR FOUND ==========");
      console.log("RAW QR:", qr);
      console.log("\n--- LINK FOR YOU TO OPEN ---");
      const link = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`;
      console.log(link);
      console.log("========== COPY LINK ABOVE ==========\n");
    }
    
    if(connection){
      console.log("Connection status:", connection);
    }
    
    if(connection === 'open'){
      console.log(">>> SUCCESS! BOT CONNECTED! <<<");
    }
  });
}
start().catch(e=>console.log("START ERROR:", e));
