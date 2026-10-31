const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const QRCode = require('qrcode')

const app = express()
let lastQR = null

app.get('/', (req,res) => res.send('<h2>BOT LIVE</h2><a href="/qr">VIEW QR</a>'))
app.get('/qr', async (req,res) => {
  if(!lastQR) return res.send('<h3>Generating QR... wait 5 sec then refresh</h3><script>setTimeout(()=>location.reload(),5000)</script>')
  res.send(`<center><h2>Scan with WhatsApp Business</h2><img src="${lastQR}" width="350"><br><br>Refresh if expired</center>`)
})
app.listen(process.env.PORT || 10000, () => console.log('Server up'))

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ['Chrome','Ubuntu','20.0'],
        syncFullHistory: false
    })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (u) => {
        if(u.qr){
            lastQR = await QRCode.toDataURL(u.qr)
            console.log('QR READY - check /qr')
        }
        if(u.connection === 'open') console.log('CONNECTED!')
        if(u.connection === 'close' && u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut){
            setTimeout(startBot, 3000)
        }
    })

    sock.ev.on('messages.upsert', async (c) => {
        const m = c.messages[0]
        if(!m?.message) return
        const jid = m.key.remoteJid
        if(jid === 'status@broadcast') return
        let t = (m.message.conversation || m.message.extendedTextMessage?.text || '').toLowerCase().trim()
        if(t.startsWith('.')) t = t.slice(1)
        if(['hi','hello','ping'].includes(t)) await sock.sendMessage(jid, {text:'Bot dey live 👿'})
    })
}
startBot()
