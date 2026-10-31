const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req,res) => res.send('BOT ONLINE - CHECK LOGS FOR CODE'))
app.listen(process.env.PORT || 10000)

const PHONE = '2349035287102'

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('./auth')

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ['Chrome','Ubuntu','20.0.04'],
        syncFullHistory: false
    })

    sock.ev.on('creds.update', saveCreds)

    if (!state.creds.registered) {
        setTimeout(async () => {
            try {
                console.log('REQUESTING PAIRING CODE FOR ' + PHONE)
                let code = await sock.requestPairingCode(PHONE)
                code = code?.match(/.{1,4}/g)?.join('-') || code
                console.log('======================')
                console.log('PAIRING CODE: ' + code)
                console.log('======================')
            } catch (e) {
                console.log('Failed to get code:', e.message)
            }
        }, 8000)
    }

    sock.ev.on('connection.update', async (u) => {
        console.log('Conn:', u.connection)
        if (u.connection === 'open') console.log('BOT CONNECTED 👿')
        if (u.connection === 'close') {
            const reason = u.lastDisconnect?.error?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...')
                setTimeout(startBot, 5000)
            }
        }
    })

    sock.ev.on('messages.upsert', async (c) => {
        const m = c.messages[0]
        if (!m?.message) return
        const jid = m.key.remoteJid
        if (jid === 'status@broadcast') return
        let t = (m.message.conversation || m.message.extendedTextMessage?.text || '').toLowerCase().trim()
        if (t.startsWith('.')) t = t.slice(1)
        if (['hi','hello','ping'].includes(t)) await sock.sendMessage(jid, {text:'Pong! Bot live 👿'})
        if (t === 'menu') await sock.sendMessage(jid, {text:'MENU - ping, menu'})
    })
}
startBot()
