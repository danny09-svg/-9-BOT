const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const express = require('express');

const FREE_LIMIT = 3;
let users = {};

// Load users if exists
if (fs.existsSync('./users.json')) {
  users = JSON.parse(fs.readFileSync('./users.json'));
}

function saveUsers() {
  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

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

    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || chatId;
    const rawText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const text = rawText.toLowerCase();

    if (!users[sender]) users[sender] = { count: 0, paid: false };

    // .unlock command
    if (text.startsWith('.unlock') && chatId === sender) {
      const num = rawText.split(' ')[1];
      if (num) {
        const jid = num.includes('@') ? num : `${num}@s.whatsapp.net`;
        if (!users[jid]) users[jid] = { count: 0, paid: false };
        users[jid].paid = true;
        saveUsers();
        await sock.sendMessage(chatId, { text: `Unlocked ${num} ✅` });
        await sock.sendMessage(jid, { text: '*PAID* Unlocked! You can now download unlimited.' });
      }
      return;
    }

    const linkMatch = rawText.match(/(https?:\/\/\S+)/);
    if (!linkMatch) return;

    if (users[sender].count >= FREE_LIMIT && !users[sender].paid) {
      await sock.sendMessage(chatId, { text: 'Free limit reached! Contact owner to unlock.' });
      return;
    }

    const url = linkMatch[0];
    await sock.sendMessage(chatId, { text: '⏳ 9 BOT downloading...' });

    try {
      let downloadUrl = '';

      if (url.includes('tiktok')) {
        const { data } = await axios.get(`https://www.tikwm.com/api/?url=${url}`);
        downloadUrl = data.data.play;
      } else {
        const res = await axios.post('https://api.cobalt.tools/api/json', { url });
        downloadUrl = res.data.url;
      }

      users[sender].count += 1;
      saveUsers();
      await sock.sendMessage(chatId, { video: { url: downloadUrl }, caption: 'Here is your video - 9 BOT' });

    } catch (e) {
      console.log(e);
      await sock.sendMessage(chatId, { text: '❌ Download failed, try another link' });
    }
  });
}

// Keep Render alive - DO NOT DELETE BELOW
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('9-BOT is running! Bot is Live!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('9-BOT is running!');
});

startBot();
