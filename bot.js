const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['9-BOT', 'Chrome', '1.0.0']
    })

    // PAIR CODE LOGIC - THIS WILL SHOW YOUR CODE IN RENDER LOGS
    if (!conn.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER
        if (phoneNumber) {
            setTimeout(async () => {
                const code = await conn.requestPairingCode(phoneNumber)
                console.log(`\n================================\n👿 YOUR PAIR CODE: ${code}\n================================\nGo to WhatsApp > Linked Devices > Link with phone number > Enter this code\n================================\n`)
            }, 3000)
        } else {
            console.log("PHONE_NUMBER not set in Environment!")
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

    // LOAD YOUR COMMANDS HERE - keep your old commands if you have
    conn.ev.on('messages.upsert', async (m) => {
        // your bot commands
    })
}

startBot()
