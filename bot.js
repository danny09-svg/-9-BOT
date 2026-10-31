const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req, res) => res.send('9-BOT IS LIVE 👿'))
app.listen(process.env.PORT || 10000, () => console.log('Web server running'))

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    const conn = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Chrome', 'Windows', '10']
    })

    if (!conn.authState.creds.registered) {
        const phoneNumber = (process.env.PHONE_NUMBER || '').replace(/[^0-9]/g, '')
        console.log('Waiting to request pair code for: ' + phoneNumber)
        
        setTimeout(async () => {
            try {
                if (!conn.authState.creds.registered) {
                    let code = await conn.requestPairingCode(phoneNumber)
                    code = code?.match(/.{1,4}/g)?.join('-') || code
                    console.log('\n========================')
                    console.log('YOUR PAIR CODE: ' + code)
                    console.log('========================\n')
                }
            } catch (err) {
                console.log('Pair failed: ' + err.message)
            }
        }, 15000)
    }

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') {
            console.log('👿 9-BOT CONNECTED!')
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('Connection closed, reason: ' + reason)
            if (reason !== DisconnectReason.loggedOut) {
                startBot()
            }
        }
    })
}

startBot()
