const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const express = require('express')

const app = express()
app.get('/', (req,res) => res.send('9-BOT ONLINE 👿 - Pair code in Render Logs'))
app.listen(process.env.PORT || 10000, () => console.log('Web Live'))

async function startBot() {
    try {
        const { version } = await fetchLatestBaileysVersion()
        console.log(`Using WA v${version.join('.')}`)
        
        const { state, saveCreds } = await useMultiFileAuthState('session')
        
        const conn = makeWASocket({
            version,
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: ['Chrome','Windows','10'],
            syncFullHistory: false
        })

        let codeRequested = false
        
        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            console.log('Connection Status:', connection)
            
            if (connection === 'open') {
                console.log('👿 9-BOT CONNECTED SUCCESSFULLY!')
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
                console.log('Connection closed, reconnecting:', shouldReconnect)
                if (shouldReconnect) {
                    setTimeout(startBot, 3000)
                }
            }
        })

        conn.ev.on('creds.update', saveCreds)

        // PAIRING CODE LOGIC - FINAL FIX
        if (!conn.authState.creds.registered) {
            const phoneNumber = process.env.PHONE_NUMBER?.replace(/[^0-9]/g,'')
            if (!phoneNumber) {
                console.log('ERROR: Set PHONE_NUMBER env in Render!')
                return
            }
            if (!codeRequested) {
                codeRequested = true
                console.log(`Phone number for pairing: ${phoneNumber}`)
                console.log('Waiting 20s for stable connection before requesting code...')
                
                setTimeout(async () => {
                    try {
                        console.log('Requesting pairing code now...')
                        const code = await conn.requestPairingCode(phoneNumber)
                        console.log('\n================================')
                        console.log('   FINAL PAIR CODE: ' + code)
                        console.log('   Enter FAST within 20 sec!')
                        console.log('================================\n')
                    } catch (e) {
                        console.log('Failed to get code: ' + e.message)
                        console.log('Wait 2 mins and redeploy')
                    }
                }, 20000)
            }
        }

        // MESSAGE HANDLER
        conn.ev.on('messages.upsert', async ({ messages }) => {
            const m = messages[0]
            if (!m.message) return
            const msgType = Object.keys(m.message)[0]
            if (msgType === 'protocolMessage') return
            
            const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
            console.log('Message:', text)
            
            if (text.toLowerCase() === 'ping') {
                await conn.sendMessage(m.key.remoteJid, { text: 'Pong 👿 9-BOT Active!' })
            }
        })

    } catch (err) {
        console.log('Fatal error: ' + err.message)
        setTimeout(startBot, 5000)
    }
}

startBot()
