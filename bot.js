const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

// FIX FOR RENDER PORT ERROR
const app = express()
const PORT = process.env.PORT || 10000
app.get('/', (req, res) => res.send('👿 9-BOT IS LIVE!'))
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['9-BOT', 'Chrome', '1.0.0']
    })

    // PAIR CODE LOGIC - THIS WILL SHOW YOUR CODE
    if (!conn.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER
        console.log(`Phone number from ENV: ${phoneNumber}`)
        if (phoneNumber) {
            setTimeout(async () => {
                try {
                    const code = await conn.requestPairingCode(phoneNumber)
                    console.log(`\n============================\n👿 YOUR PAIR CODE: ${code}\n============================\n`)
                } catch (e) {
                    console.log("Pair code error: ", e)
                }
            }, 5000)
        }
    }

    conn.ev.on('creds.update', saveCreds)
    
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('👿 9-BOT Connected Successfully!')
        }
    })
}

startBot()
