const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req,res) => res.send('9-BOT ONLINE 👿🔥'))
app.listen(process.env.PORT || 10000)

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ['Chrome','Windows','10'],
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        console.log('Status:', connection)
        if (connection === 'open') console.log('👿 9-BOT CONNECTED!')
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) setTimeout(startBot, 3000)
        }
    })
    sock.ev.on('creds.update', saveCreds)

    // COMMANDS
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || '').toLowerCase().trim()
        const jid = m.key.remoteJid
        console.log('CMD:', text)

        if (text === 'ping') {
            await sock.sendMessage(jid, { text: 'Pong! 👿 9-BOT is Active & Fast!' })
        }
        if (text === 'menu' || text === 'help') {
            await sock.sendMessage(jid, { text: `*👿 9-BOT MENU*\n\n• ping - check if bot active\n• menu - show this menu\n• owner - owner info\n\nMore commands coming!` })
        }
        if (text === 'owner') {
            await sock.sendMessage(jid, { text: 'Owner: You 👿 Number: 09035287102' })
        }
    })
}
startBot()
