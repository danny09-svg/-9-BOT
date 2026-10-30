console.log("=== STARTING BOT ===");
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('Bot alive'));
app.listen(process.env.PORT || 3000, ()=>console.log("Web server up"));

async function start(){
  console.log("Getting auth...");
  const { state, saveCreds } = await useMultiFileAuthState('./session_'+Date.now());
  console.log("Making socket...");
  const sock = makeWASocket({ auth: state, logger: P({level:'silent'}), printQRInTerminal: false, browser: ["Ubuntu","Chrome","20.0.04"] });
  sock.ev.on('creds.update', saveCreds);
  console.log("Waiting 6 secs to request code...");
  setTimeout(async()=>{
    try{
      console.log("Requesting code for 2349035287102...");
      const code = await sock.requestPairingCode("2349035287102");
      console.log("##### CODE IS: "+code+" #####");
    }catch(e){
      console.log("ERROR REQUESTING CODE: "+e.message);
      console.log(e.stack);
    }
  },6000);
}
start();
