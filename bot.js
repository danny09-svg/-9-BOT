const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')

const app = express()
app.get('/', (req,res) => res.send('BOT ONLINE'))
app.listen(process.env.PORT || 10000)

const PHONE = '2349035287102'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({ 
        logger: P({ level: 'silent' }), 
        auth: state, 
        browser: ['Ubuntu','Chrome','20.0.04'],
        printQRInTerminal: false
    })

    if(!state.creds.registered){
        console.log('Waiting to request code...')
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE)
                console.log('======================')
                console.log('PAIRING CODE: ' + code)
                console.log('WhatsApp > Linked Devices > Link with phone number')
                console.log('======================')
            } catch(e){ console.log('Code error', e.message) }
        }, 5000)
    }
    
    sock.ev.on('connection.update', async (u) => {
        console.log('Conn:', u.connection)
        if(u.connection === 'open') console.log('👿 CONNECTED!')
        if(u.connection === 'close'){
            const code = u.lastDisconnect?.error?.output?.statusCode
            if(code !== DisconnectReason.loggedOut) setTimeout(startBot, 3000)
        }
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async (c) => {
        const m = c.messages[0]
        if(!m?.message) return
        const jid = m.key.remoteJid
        if(jid === 'status@broadcast') return
        let t = (m.message.conversation || m.message.extendedTextMessage?.text || '').toLowerCase().trim()
        if(t.startsWith('.')) t = t.slice(1)
        console.log('MSG:', t)
        if(['hi','hello','ping'].includes(t)) await sock.sendMessage(jid, {text:'Pong! Bot live 👿'})
        if(t === 'menu') await sock.sendMessage(jid, {text:'*MENU*\n- ping\n- menu'})
    })
}
startBot()
