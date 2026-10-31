const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const QRCode = require('qrcode')
const fs = require('fs')

const app = express()
let lastQR = null
app.get('/', (req,res) => res.send('<h2>BOT 09! LIVE 👿</h2><a href="/qr">VIEW QR</a>'))
app.get('/qr', async (req,res) => {
  if(!lastQR) return res.send('<h3>Generating QR... refresh in 5s</h3><script>setTimeout(()=>location.reload(),5000)</script>')
  res.send(`<center><h2>BOT 09! SCAN</h2><img src="${lastQR}" width="350"></center>`)
})
app.listen(process.env.PORT || 10000)

let antiLinkGroups = new Set()
let antiDeleteGroups = new Set()
let ghostDB = new Map() // store deleted msgs

const BOT_NAME = "BOT 09 !"
const OWNER_NAME = "BOT 09 !"

function blackKingMenu(){
return `WELCOME. I AM ${BOT_NAME} 👿
PLEASE SELECT AN OPTION:

┌─[ 1 ] CORE COMMANDS
│ > .ping - Speed check
│ > .alive - Bot status
│ > .owner - Owner info
└────────────────────

┌─[ 2 ] MEDIA & TOOLS
│ > .sticker - Photo to sticker
│ > .tagall - Tag all members
│ > .ai [text] - Chat with AI
└────────────────────

┌─[ 3 ] DEMON MODE 💀
│ > .antilink on/off - Anti link
│ > .antidelete on/off - Ghost mode
│ > .autostatus - View status
└────────────────────

┌─[ 4 ] OWNER INFO
│ > CREATOR: ${OWNER_NAME}
│ > BOT: BOT 09! ULTIMATE
│ > VERSION: V6 DEMON
└────────────────────

> Type number (1-4) or command
> Example: 1 , .sticker , .ping`
}

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({ version, logger: P({level:'silent'}), auth: state, browser:['Chrome','Ubuntu','20.0'] })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (u) => {
        if(u.qr){ lastQR = await QRCode.toDataURL(u.qr) }
        if(u.connection === 'close' && u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) setTimeout(startBot, 3000)
    })

    // GHOST MODE - Save all messages
    sock.ev.on('messages.upsert', async (chat) => {
        const m = chat.messages[0]
        if(!m?.message) return
        const jid = m.key.remoteJid
        if(jid === 'status@broadcast'){
           // AUTO STATUS VIEW
           await sock.readMessages([m.key])
           // auto react
           await sock.sendMessage(jid, {react:{text:'🔥',key:m.key}}).catch(()=>{})
           return
        }

        // Save for anti-delete
        if(m.message.conversation || m.message.extendedTextMessage || m.message.imageMessage){
            ghostDB.set(m.key.id, m)
        }

        const isGroup = jid.endsWith('@g.us')
        let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
        let rawText = body.trim()
        let text = rawText.toLowerCase()
        if(text.startsWith('.')) text = text.slice(1)

        // ANTI-LINK
        if(isGroup && antiLinkGroups.has(jid) && /https?:\/\/|www\.|t\.me|chat\.whatsapp/.test(rawText)){
            if(!m.key.fromMe){
                await sock.sendMessage(jid, {delete: m.key}).catch(()=>{})
                await sock.sendMessage(jid, {text:`@ ${m.pushName} link deleted 👿 BOT 09!`, mentions:[m.key.participant]})
            }
        }

        // COMMANDS
        if(!rawText.startsWith('.') && !['menu','ping','hi','1','2','3','4'].includes(text)) {
           if(isGroup && antiLinkGroups.has(jid)) {} else return
        }

        // FAKE TYPING
        await sock.sendPresenceUpdate('composing', jid)

        // MENU
        if(text === 'menu' || text === 'help' || text === 'bot'){
            await sock.sendMessage(jid, {text: blackKingMenu()})
        }
        if(text === '1'){
            await sock.sendMessage(jid, {text:`*┌─[ 1 ] CORE COMMANDS - ${BOT_NAME}*\n\n> .ping - Bot speed\n> .alive - Is bot alive\n> .owner - Contact owner\n> .menu - Show menu\n\n*BOT 09! ACTIVE ✅*`})
        }
        if(text === '2'){
            await sock.sendMessage(jid, {text:`*┌─[ 2 ] MEDIA & TOOLS - ${BOT_NAME}*\n\n> .sticker - Reply image with .sticker\n> .tagall [msg] - Tag everyone\n> .ai [question] - Ask AI\n> .play - Coming soon\n\n*BOT 09! ACTIVE ✅*`})
        }
        if(text === '3'){
            await sock.sendMessage(jid, {text:`*┌─[ 3 ] DEMON MODE - ${BOT_NAME}*\n\n> .antilink on/off\n> .antidelete on/off - See deleted msgs\n> Status auto view ON ✅\n> Anti-delete: ${isGroup && antiDeleteGroups.has(jid) ? 'ON' : 'OFF'}\n\n*DEMON MODE READY 💀*`})
        }
        if(text === '4'){
            await sock.sendMessage(jid, {text:`*┌─[ 4 ] OWNER INFO - ${BOT_NAME}*\n\n> CREATOR: BOT 09 !\n> BOT: WHATSAPP DEMON BOT\n> VERSION: V6 ULTIMATE\n> POWER: 100%\n\nContact owner for custom bot 👿`})
        }

        if(text === 'ping' || text === 'alive'){
            await sock.sendMessage(jid, {text:`*Pong!* ⚡\n*BOT 09! Speed: ${Date.now()%100}ms*\n*Bot is Active ✅*`})
        }
        if(text === 'owner'){
            await sock.sendMessage(jid, {text:`*OWNER: ${OWNER_NAME}*\n*BOT: BOT 09! 👿*\n*Number: wa.me/${sock.user.id.split(':')[0]}*`})
        }
        if(text.startsWith('ai ')){
            const q = rawText.slice(3)
            await sock.sendMessage(jid, {text:`*BOT 09! AI 🤖:*\n\nYou asked: ${q}\n\nI be your WhatsApp assistant - Ask me anything! Demon mode active 💀\n\n_Powered by BOT 09!_`})
        }
        if(text === 'sticker'){
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
            const media = quoted?.imageMessage || m.message.imageMessage
            if(media){
                try{
                    const buffer = await downloadMediaMessage({message:{imageMessage:media}}, 'buffer', {})
                    await sock.sendMessage(jid, {sticker: buffer})
                }catch(e){ await sock.sendMessage(jid, {text:'Failed to make sticker 😢'}) }
            }else{
                await sock.sendMessage(jid, {text:'Reply an image with .sticker 👿'})
            }
        }
        if(text.startsWith('tagall')){
            if(isGroup){
                const groupMeta = await sock.groupMetadata(jid)
                const members = groupMeta.participants.map(p=>p.id)
                const msg = rawText.slice(6) || 'BOT 09! TAGALL 👿'
                await sock.sendMessage(jid, {text:`*${msg}*\n\n${members.map(m=>'@'+m.split('@')[0]).join(' ')}`, mentions: members})
            }
        }
        if(text === 'antilink on'){
            if(isGroup){ antiLinkGroups.add(jid); await sock.sendMessage(jid, {text:'*AntiLink ON* 💀 BOT 09! will delete links'})}
        }
        if(text === 'antilink off'){
            antiLinkGroups.delete(jid); await sock.sendMessage(jid, {text:'*AntiLink OFF* ✅'})
        }
        if(text === 'antidelete on'){
            if(isGroup){ antiDeleteGroups.add(jid); await sock.sendMessage(jid, {text:'*Ghost Mode ON* 👻 BOT 09! will catch deleted msgs'})}
        }
        if(text === 'antidelete off'){
            antiDeleteGroups.delete(jid); await sock.sendMessage(jid, {text:'*Ghost Mode OFF* ✅'})
        }
        if(['hi','hello','hey'].includes(text)){
            await sock.sendMessage(jid, {text:`Yo! I am *${BOT_NAME} 👿*\nType .menu`})
        }
    })

    // CATCH DELETED MESSAGES - GHOST MODE
    sock.ev.on('messages.delete', async (item) => {
        for(const key of item.keys){
            if(ghostDB.has(key.id) && antiDeleteGroups.has(key.remoteJid)){
                const oldMsg = ghostDB.get(key.id)
                const content = oldMsg.message.conversation || oldMsg.message.extendedTextMessage?.text || '[Media]'
                await sock.sendMessage(key.remoteJid, {text:`*👻 GHOST MODE - DELETED CAUGHT* \n\n*Sender:* @${key.participant?.split('@')[0] || 'unknown'}\n*Deleted:* ${content}\n\n*BOT 09! SAW IT 💀*`, mentions: key.participant ? [key.participant] : []})
            }
        }
    })
}
startBot()
