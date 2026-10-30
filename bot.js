const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('9+ BOT Running'));
app.listen(process.env.PORT||3000);

const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const axios = require('axios')
const P = require('pino')

const OWNER_NUMBER = '2349035287102@s.whatsapp.net'
const BOT_NAME = '9 ⸸ BOT'
const FREE_LIMIT = 3
const PAYMENT_INFO = '8128472431 (Opay) - Amount: ₦500'
const PAYMENT_LINK = `💳 *PAY TO UNLOCK:*\nAccount: 8128472431 (Opay)\nAmount: ₦500\n\n📲 After payment send screenshot to wa.me/2349035287102`

let users = {}

const MENU = `
*🤖 9 ⸸ BOT - ULTIMATE DOWNLOADER*

*Commands:*
.menu - Show menu
.ping - Check bot
.owner - Pay for unlimited

*FREE:* 3 videos
*PREMIUM:* ₦500 unlimited

*Supported:*
📱 TikTok - no watermark
📸 Instagram
▶️ YouTube
📘 Facebook
🐦 Twitter/X

Send any link to start! 🔥
`

const PRICE_REPLY = `
*💰 9 ⸸ BOT PRICING*

*FREE PLAN:*
✅ 3 downloads free

*PREMIUM - ₦500 ONLY:*
✅ Unlimited downloads
✅ Fast server
✅ All platforms

*PAY HERE:*
${PAYMENT_INFO}

After payment, send proof to wa.me/2349035287102

Type .menu to start!
`

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ c }) => { if (c === 'open') console.log('9 BOT ONLINE') })
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim()
    const rawText = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    const chatId = msg.key.remoteJid
    const sender = chatId
    if (!users[sender]) users[sender] = { count: 0, paid: false }
    if (['price','how much','cost','pricing','plan','premium','pay','payment'].some(w => text.includes(w))) {
      await sock.sendMessage(chatId, { text: PRICE_REPLY })
      return
    }
    if (text === '.menu' || text === 'menu' || text === '9' || text === 'hi' || text === 'hello') {
      await sock.sendMessage(chatId, { text: MENU })
      return
    }
    if (text === '.ping') {
      await sock.sendMessage(chatId, { text: `Pong! 9 ⸸ BOT active` })
      return
    }
    if (text === '.owner') {
      await sock.sendMessage(chatId, { text: `*UNLOCK UNLIMITED - ₦500*\n\n${PAYMENT_LINK}` })
      return
    }
    if (text.startsWith('.unlock') && chatId === OWNER_NUMBER) {
      const num = text.split(' ')[1]
      if (num) {
        const jid = num.includes('@') ? num : `${num.replace(/^0/, '234')}@s.whatsapp.net`
        if (!users[jid]) users[jid] = { count: 0, paid: false }
        users[jid].paid = true
        await sock.sendMessage(chatId, { text: `Unlocked ${num}` })
        await sock.sendMessage(jid, { text: `*PAYMENT CONFIRMED - 9 BOT*\nYou don unlock unlimited! Send link now.` })
      }
      return
    }
    const linkMatch = rawText.match(/(https?:\/\/)?(www\.|vm\.|vt\.)?(tiktok|instagram|youtube|youtu\.be|facebook|fb\.watch|twitter|x\.com)\S+/gi)
    if (!linkMatch) return
    if (users[sender].count >= FREE_LIMIT && !users[sender].paid && sender !== OWNER_NUMBER) {
      await sock.sendMessage(chatId, { text: `Free limit finished!\n\n${PRICE_REPLY}` })
      return
    }
    const url = linkMatch[0]
    await sock.sendMessage(chatId, { text: `⏳ 9 BOT downloading...` })
    try {
      let downloadUrl = ''
      if (url.includes('tiktok')) {
        const { data } = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
        downloadUrl = data.data.play
      } else {
        const res = await axios.post('https://api.cobalt.tools/api/json', { url }, { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } })
        downloadUrl = res.data.url
      }
      users[sender].count += 1
      await sock.sendMessage(chatId, { video: { url: downloadUrl }, caption: `✅ *9 BOT*\n${users[sender].paid ? 'Unlimited' : `${FREE_LIMIT - users[sender].count} free left`}` })
    } catch (e) {
      await sock.sendMessage(chatId, { text: '❌ Download failed. Try another link.' })
    }
  })
}
// Keep Render alive - DO NOT DELETE
const express = require('express');
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
