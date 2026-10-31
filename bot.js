const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req,res) => res.send('9-BOT ONLINE 👿 Last active: ' + new Date()))
app.listen(process.env.PORT || 10000, () => console.log('Web running'))

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ['Ubuntu','Chrome','110.0.0'],
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        console.log('CONNECTION:', connection)
        if (connection === 'open') console.log('👿 9-BOT CONNECTED - READY FOR MESSAGES!')
        if (connection === 'close') {
            console.log('Closed:', lastDisconnect?.error)
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) {
                console.log('Reconnecting in 3 sec...')
                setTimeout(startBot, 3000)
            }
        }
    })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0]
            if (!m.message) return
            
            const jid = m.key.remoteJid
            const isGroup = jid.endsWith('@g.us')
            
            // Don't reply to status or groups for now
            if (jid === 'status@broadcast' || isGroup) return

            const msgType = Object.keys(m.message)[0]
            let text = ''
            if (msgType === 'conversation') text = m.message.conversation
            else if (msgType === 'extendedTextMessage') text = m.message.extendedTextMessage.text
            else if (msgType === 'imageMessage') text = m.message.imageMessage.caption || ''
            else text = ''

            console.log('--- NEW MESSAGE ---')
            console.log('From:', jid)
            console.log('Text:', text)
            console.log('Type:', msgType)

            // REPLY TO EVERY MESSAGE FOR TESTING
            await sock.sendMessage(jid, { text: `👿 9-BOT got your message: "${text}"\n\nType *menu* for commands!` })
            console.log('Replied!')

        } catch (e) {
            console.log('Error in message handler:', e)
        }
    })
}
startBot()
