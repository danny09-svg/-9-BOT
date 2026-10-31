const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const QRCode = require('qrcode')
const express = require('express')

const app = express()
let latestQR = null

app.get('/', async (req,res) => {
    if (!latestQR) return res.send('<h2>9-BOT 👿 Waiting for QR... Refresh in 10s. Check Render Logs.</h2>')
    try {
        const qrImage = await QRCode.toDataURL(latestQR)
        res.send(`<html><body style="text-align:center;background:#000;color:#fff"><h1>9-BOT QR 👿</h1><p>Scan this with WhatsApp: Linked Devices > Link a device</p><img src="${qrImage}" style="width:300px"/><br><br><p>QR expires in 20 sec! Refresh page if expired</p></body></html>`)
    } catch(e) { res.send('Error generating QR') }
})

app.listen(process.env.PORT || 10000, () => console.log('Web Live'))

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Chrome','Windows','10'],
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            latestQR = qr
            console.log('NEW QR GENERATED - Go to your bot URL: https://your-bot.onrender.com to scan it!')
            console.log('QR String:', qr)
        }
        
        if (connection === 'open') {
            console.log('👿 CONNECTED SUCCESSFULLY!')
            latestQR = null
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) setTimeout(startBot, 3000)
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

startBot()
