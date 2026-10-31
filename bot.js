const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req,res) => res.send('BOT ONLINE'))
app.listen(process.env.PORT || 10000)

const PHONE = '2349035287102' // your bot number without +

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, browser: ['Chrome','Windows','10'] })
    
    if (!sock.authState.creds.registered) {
        console.log('Requesting pairing code...')
        await new Promise(r => setTimeout(r, 3000))
        const code = await sock.requestPairingCode(PHONE)
        console.log('============================')
        console.log('YOUR PAIRING CODE IS: ' + code)
        console.log('Go to WhatsApp > Linked Devices > Link with phone number > Type this code')
        console.log('============================')
    }

    sock.ev.on('connection.update', async (u) => {
        console.log('CONNECTION:', u.connection)
        if (u.connection === 'open') console.log('👿 CONNECTED!')
        if (u.connection === 'close') {
            const reconnect = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (reconnect) setTimeout(startBot, 3000)
        }
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async (c) => {
        const m = c.messages[0]
        if (!m.message) return
        const jid = m.key.remoteJid
        if (jid === 'status@broadcast') return
        let t = (m.message.conversation || m.message.extendedTextMessage?.text || '').toLowerCase().trim()
        console.log('MSG:', t, 'FROM:', jid)
        if (!t) return
        if (t.startsWith('.')) t = t.slice(1)
        if (['hi','hello','ping'].includes(t)) await sock.sendMessage(jid, {text:'Pong! Bot live 👿'})
        if (t === 'menu') await sock.sendMessage(jid, {text:'*MENU*\n- ping\n- menu\n- hi'})
    })
}
startBot()
