console.log("=== STARTING QR BOT ===");
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.get('/', (req,res)=>res.send('Scan QR in logs'));
app.listen(process.env.PORT || 3000, ()=>console.log("Web up"));

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./session_qr_'+Date.now());
  const sock = makeWASocket({
    auth: state,
    logger: P({level:'silent'}),
    printQRInTerminal: false,
    browser: ["Ubuntu","Chrome","20.0.04"]
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', (update)=>{
    const { connection, lastDisconnect, qr } = update;
    if(qr){
      console.log("\n\n");
      console.log("########## SCAN THIS QR ##########");
      qrcode.generate(qr, {small: true});
      console.log("########## SCAN WITH BUSINESS WHATSAPP -> Linked Devices -> Link a Device ##########");
      console.log("\n\n");
    }
    if(connection === 'open'){
      console.log(">>> BOT CONNECTED SUCCESSFULLY <<<");
    }
  });
}
start();
