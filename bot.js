const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('pairing...'));
app.listen(process.env.PORT || 3000);
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), printQRInTerminal: false, browser: ["Ubuntu","Chrome","22.04"] });
  sock.ev.on('creds.update', saveCreds);
  if(!state.creds.registered){
    setTimeout(async()=>{
      try{
        const code = await sock.requestPairingCode("2349035287102");
        console.log("##### PAIRING CODE IS: "+code+" #####");
      }catch(e){ console.log("Failed: "+e.message) }
    },3000);
  }
}
start();
