const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('9-BOT is running! Bot is Live!'));
app.listen(PORT, () => console.log(`Server on ${PORT}`));

let users = {};
try { if (fs.existsSync('./users.json')) users = JSON.parse(fs.readFileSync('./users.json')); } catch {}

function saveUsers() { fs.writeFileSync('./users.json', JSON.stringify(users, null, 2)); }

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["9-BOT", "Chrome", "1.0.0"]
  });

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode("2349035287102");
        console.log(`PAIRING CODE: ${code}`);
      } catch(e) { console.log("Error getting code:", e); }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('9-BOT is running!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    
    // Your bot commands here - keep your old commands
    if (text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello') {
      await sock.sendMessage(from, { text: "Hello! 9-BOT is Live! 🎉 Send a TikTok or Instagram link to download." });
    }
  });
}

startBot();
