const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const QRCode = require('qrcode')

const app = express()
let lastQR = null
app.get('/', (req,res) => res.send('<h2>BOT 09! LIVE 👿</h2><a href="/qr">VIEW QR</a>'))
app.get('/qr', async (req,res) => {
  if(!lastQR) return res.send('<h3>Generating QR... refresh in 5s</h3><script>setTimeout(()=>location.reload(),5000)</script>')
  res.send(`<center><h2>BOT 09! SCAN</h2><img src="${lastQR}" width="350"></center>`)
})
app.listen(process.env.PORT || 10000)

let antiLinkGroups = new Set()

function menuText(){
return `WELCOME. I AM BOT 09 ! 👿
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
│ > .antilink on/off
│ > .autostatus - View status
│ > Ghost Mode Active
└────────────────────

┌─[ 4 ] OWNER INFO
│ > CREATOR: BOT 09 !
│ > BOT: BOT 09! ULTIMATE
│ > VERSION: V6.1 DEMON
└────────────────────

> Type number (1-4) or command`
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

    sock.ev.on('messages.upsert', async (chat) => {
        const m = chat.messages[0]
        if(!m?.message) return
        const jid = m.key.remoteJid
        if(jid === 'status@broadcast'){ await sock.readMessages([m.key]); return }

        let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
        let raw = body.trim()
        let text = raw.toLowerCase()
        if(text.startsWith('.')) text = text.slice(1)

        const isGroup = jid.endsWith('@g.us')

        if(isGroup && antiLinkGroups.has(jid) && /https?:\/\/|www\.|t\.me|chat\.whatsapp/.test(raw)){
            if(!m.key.fromMe){
                await sock.sendMessage(jid, {delete: m.key}).catch(()=>{})
                await sock.sendMessage(jid, {text:`Link deleted 👿 BOT 09!`})
            }
        }

        if(!raw.startsWith('.') && !['menu','ping','hi','alive','owner','1','2','3','4','sticker','tagall','antilink on','antilink off'].some(k=>text.startsWith(k))) {
            if(!['1','2','3','4'].includes(text)) return
        }

        await sock.sendPresenceUpdate('composing', jid)

        if(text === 'menu' || text === 'help'){
            await sock.sendMessage(jid, {text: menuText()})
        }
        if(text === '1') await sock.sendMessage(jid, {text:`*┌─[ 1 ] CORE - BOT 09!*\n\n.ping\n.alive\n.owner\n.menu\n\nBOT 09! ACTIVE ✅`})
        if(text === '2') await sock.sendMessage(jid, {text:`*┌─[ 2 ] MEDIA - BOT 09!*\n\n.sticker (reply image)\n.tagall [msg]\n.ai [question]\n\nDEMON READY 💀`})
        if(text === '3') await sock.sendMessage(jid, {text:`*┌─[ 3 ] DEMON MODE - BOT 09!*\n\n.antilink on/off\nAuto status view ON ✅\nGhost mode soon\n\nBOT 09! 👿`})
        if(text === '4') await sock.sendMessage(jid, {text:`*┌─[ 4 ] OWNER - BOT 09!*\n\nCREATOR: BOT 09 !\nBOT: ULTIMATE DEMON\nVERSION: V6.1\n\nContact for bot 👿`})
        if(text === 'ping' || text === 'alive') await sock.sendMessage(jid, {text:`*Pong!* ⚡\n*BOT 09! Speed: Fast*\n*Active ✅*`})
        if(text === 'owner') await sock.sendMessage(jid, {text:`*OWNER: BOT 09 !* 👿\n*BOT: 09-BOT ULTIMATE*`})
        if(text.startsWith('ai ')){
            const q = raw.slice(3)
            await sock.sendMessage(jid, {text:`*BOT 09! AI 🤖:*\nYou asked: ${q}\n\nI be your demon assistant 💀`})
        }
        if(text === 'sticker'){
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
            const media = quoted?.imageMessage || m.message.imageMessage
            if(media){
                try{
                    const buffer = await downloadMediaMessage({message:{imageMessage:media}}, 'buffer', {})
                    await sock.sendMessage(jid, {sticker: buffer})
                }catch(e){ await sock.sendMessage(jid, {text:'Fail to make sticker'}) }
            }else{
                await sock.sendMessage(jid, {text:'Reply an image with .sticker 👿'})
            }
        }
        if(text.startsWith('tagall')){
            if(isGroup){
                const meta = await sock.groupMetadata(jid)
                const members = meta.participants.map(p=>p.id)
                const msg = raw.slice(6) || 'BOT 09! TAGALL 👿'
                await sock.sendMessage(jid, {text:`*${msg}*\n${members.map(m=>'@'+m.split('@')[0]).join(' ')}`, mentions: members})
            }
        }
        if(text === 'antilink on' && isGroup){ antiLinkGroups.add(jid); await sock.sendMessage(jid, {text:'*AntiLink ON* 💀'}) }
        if(text === 'antilink off'){ antiLinkGroups.delete(jid); await sock.sendMessage(jid, {text:'*AntiLink OFF* ✅'}) }
        if(['hi','hello','hey'].includes(text)) await sock.sendMessage(jid, {text:`Yo! I am *BOT 09 ! 👿*\nType .menu`})
    })
}
startBot()
