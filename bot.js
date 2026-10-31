const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req,res) => res.send('9-BOT LIVE'))
app.listen(process.env.PORT || 10000)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu','Chrome','20.0']
    })

    if(!conn.authState.creds.registered) {
        const num = process.env.PHONE_NUMBER.replace(/[^0-9]/g,'')
        console.log('Number: '+num)
        setTimeout(async () => {
            try {
                let code = await conn.requestPairingCode(num)
                code = code.match(/.{1,4}/g).join('-')
                console.log('\nYOUR PAIR CODE: '+code+'\n')
            } catch(e) {
                console.log('Error: '+e.message)
            }
        }, 10000) // Wait 10 seconds before asking
    }

    conn.ev.on('creds.update', saveCreds)
    conn.ev.on('connection.update', (u) => {
        if(u.connection === 'open') console.log('BOT CONNECTED!')
        if(u.connection === 'close' && u.lastDisconnect.error.output.statusCode != DisconnectReason.loggedOut) startBot()
    })
}
startBot()
