console.log("=== STARTING QR BOT V2 ===");
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('QR Bot - check logs'));
app.listen(process.env.PORT || 3000, ()=>console.log("Web up"));

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./session_final_'+Date.now());
  const sock = makeWASocket({
    auth: state,
    logger: P({level:'silent'}),
    printQRInTerminal: false,
    browser: ["Ubuntu","Chrome","20.0.04"]
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update)=>{
    const { qr, connection } = update;
    if(qr){
      console.log("\n\n");
      console.log("########## YOUR QR STRING ##########");
      console.log(qr);
      console.log("\nCOPY THIS LINK AND OPEN FOR BROWSER TO SEE QR IMAGE:");
      console.log(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`);
      console.log("\nOR GO TO: https://wa.link and paste");
      console.log("########## SCAN WITH BUSINESS WHATSAPP ##########\n\n");
    }
    if(connection === 'open'){
      console.log(">>> BOT CONNECTED! <<<");
    }
  });
}
start();
