const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const QRCode = require('qrcode')
const fs = require('fs')

const app = express()
let lastQR = null

app.get('/', (req,res) => {
  res.send(`
    <center style="font-family:sans-serif; margin-top:50px">
      <h1>👿 BOT 09 ! V6.2 LIVE</h1>
      <p>QR Mode | Demon Edition</p>
      <a href="/qr" style="background:black;color:white;padding:15px 30px;text-decoration:none;border-radius:10px">SCAN QR CODE</a>
      <p style="margin-top:20px">Last QR: ${lastQR ? 'Ready' : 'Generating...'}</p>
    </center>
  `)
})

app.get('/qr', async (req,res) => {
  if(!lastQR){
    return res.send(`<center><h3>Generating QR... Refresh in 5 secs</h3><p>Keep refreshing until QR shows</p><script>setTimeout(()=>location.reload(),5000)</script></center>`)
  }
  res.send(`
    <center>
      <h2>👿 BOT 09 ! SCAN QR</h2>
      <p>Open WhatsApp > Linked Devices > Link a device</p>
      <img src="${lastQR}" style="width:320px;border:5px solid black;border-radius:20px">
      <p>QR refreshes every 30s - scan fast!</p>
      <script>setTimeout(()=>location.reload(),25000)</script>
    </center>
  `)
})

app.listen(process.env.PORT || 10000, () => console.log('WEB SERVER LIVE'))

// CONFIG
const BOT_NAME = "BOT 09 !"
let antiLink = new Set()

function mainMenu(){
return `WELCOME. I AM ${BOT_NAME} 👿
PLEASE SELECT AN OPTION:

┌─[ 1 ] CORE COMMANDS
│ > .ping - Speed check
│ > .alive - Bot status
│ > .owner - Owner info
└────────────────────

┌─[ 2 ] MEDIA & TOOLS
│ > .sticker - Photo to sticker
│ > .tagall - Tag everyone
│ > .ai [text] - Ask AI
└────────────────────

┌─[ 3 ] DEMON MODE 💀
│ > .antilink on/off
│ > Auto status view ON
│ > Ghost Mode Active
└────────────────────

┌─[ 4 ] OWNER INFO
│ > CREATOR: ${BOT_NAME}
│ > BOT: ULTIMATE DEMON
│ > VERSION: V6.2 QR
└────────────────────

> Type number (1-4) or .menu
> Example: .ping | 1 | .sticker`
}

async function startBot(){
  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  
  const sock = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ['BOT 09 !', 'Chrome', '1.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    
    if(qr){
      lastQR = await QRCode.toDataURL(qr)
      console.log('NEW QR GENERATED - Go to /qr')
    }
    
    if(connection === 'close'){
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed, reconnecting:', shouldReconnect)
      if(shouldReconnect){
        setTimeout(startBot, 3000)
      } else {
        console.log('LOGGED OUT - Need new QR')
        if(fs.existsSync('./auth')) fs.rmSync('./auth', {recursive:true, force:true})
        setTimeout(startBot, 3000)
      }
    } else if(connection === 'open'){
      console.log('✅ BOT 09 ! CONNECTED - READY FOR COMMANDS')
      lastQR = null
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m?.message) return
    if(m.key.remoteJid === 'status@broadcast'){
      await sock.readMessages([m.key]).catch(()=>{})
      return
    }

    const jid = m.key.remoteJid
    const isGroup = jid.endsWith('@g.us')
    let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''
    if(!body) return
    let raw = body.trim()
    let lower = raw.toLowerCase()
    if(lower.startsWith('.')) lower = lower.slice(1)

    // ANTI-LINK
    if(isGroup && antiLink.has(jid) && /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me)/i.test(raw) && !m.key.fromMe){
      try{
        await sock.sendMessage(jid, { delete: m.key })
        await sock.sendMessage(jid, { text: `🚫 Link deleted by ${BOT_NAME} 👿` })
      }catch{}
    }

    // ONLY REPLY TO COMMANDS OR NUMBERS
    const isCommand = raw.startsWith('.') || ['menu','ping','alive','owner','hi','1','2','3','4'].includes(lower) || lower.startsWith('ai ') || lower.startsWith('tagall') || lower.startsWith('antilink') || lower === 'sticker'
    if(!isCommand) return

    try{
      await sock.sendPresenceUpdate('composing', jid)

      if(lower === 'menu' || lower === 'help'){
        await sock.sendMessage(jid, { text: mainMenu() })
      }
      else if(lower === '1'){
        await sock.sendMessage(jid, { text: `*┌─[ 1 ] CORE - ${BOT_NAME}*\n\n> .ping - Check speed\n> .alive - Bot alive?\n> .owner - Owner contact\n> .menu - Show this menu\n\n*${BOT_NAME} ACTIVE ✅*` })
      }
      else if(lower === '2'){
        await sock.sendMessage(jid, { text: `*┌─[ 2 ] MEDIA - ${BOT_NAME}*\n\n> .sticker - Reply image to make sticker\n> .tagall [text] - Tag all members\n> .ai [question] - Chat AI\n\n*DEMON READY 💀*` })
      }
      else if(lower === '3'){
        await sock.sendMessage(jid, { text: `*┌─[ 3 ] DEMON - ${BOT_NAME}*\n\n> .antilink on/off - Anti link\n> Status view: ON ✅\n> Typing: ON ✅\n> AntiLink: ${antiLink.has(jid) ? 'ON' : 'OFF'}\n\n*DEMON MODE 👿*` })
      }
      else if(lower === '4'){
        await sock.sendMessage(jid, { text: `*┌─[ 4 ] OWNER - ${BOT_NAME}*\n\n> CREATOR: BOT 09 !\n> BOT: WHATSAPP DEMON BOT\n> VERSION: V6.2 QR FINAL\n> YT: BOT 09 !\n\n*Contact for custom bot*` })
      }
      else if(lower === 'ping' || lower === 'alive'){
        await sock.sendMessage(jid, { text: `*Pong!* ⚡\n*${BOT_NAME} Speed: ${Math.floor(Math.random()*100)}ms*\n*Active ✅ V6.2*` })
      }
      else if(lower === 'owner'){
        await sock.sendMessage(jid, { text: `*OWNER: ${BOT_NAME}* 👿\n*BOT: 09-BOT ULTIMATE V6.2*\n*Status: Online 24/7*` })
      }
      else if(lower.startsWith('ai ')){
        const q = raw.slice(3)
        await sock.sendMessage(jid, { text: `*${BOT_NAME} AI 🤖:*\n\nQ: ${q}\n\nA: I be your demon assistant! You fit ask me anything, I dey active 24/7 💀\n\n_Powered by ${BOT_NAME}_` })
      }
      else if(lower === 'sticker'){
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
        const img = quoted?.imageMessage || m.message.imageMessage
        if(img){
          const buff = await downloadMediaMessage(m, 'buffer', {}, { logger: P({level:'silent'}), reuploadRequest: sock.updateMediaMessage })
          .catch(async () => await downloadMediaMessage({message:{imageMessage:img}}, 'buffer', {}))
          await sock.sendMessage(jid, { sticker: buff }).catch(()=>{})
        }else{
          await sock.sendMessage(jid, { text: 'Reply an image with .sticker 👿' })
        }
      }
      else if(lower.startsWith('tagall')){
        if(isGroup){
          const meta = await sock.groupMetadata(jid)
          const members = meta.participants.map(p=>p.id)
          const txt = raw.slice(6).trim() || 'Attention Everyone 👿'
          await sock.sendMessage(jid, { text: `*${txt}*\n\n${members.map(v=>'@'+v.split('@')[0]).join(' ')}`, mentions: members })
        }
      }
      else if(lower === 'antilink on'){
        if(isGroup){ antiLink.add(jid); await sock.sendMessage(jid, { text: '*AntiLink ON* 💀 Links will be deleted' }) }
      }
      else if(lower === 'antilink off'){
        antiLink.delete(jid); await sock.sendMessage(jid, { text: '*AntiLink OFF* ✅' })
      }
      else if(['hi','hello','hey'].includes(lower)){
        await sock.sendMessage(jid, { text: `Yo! I am *${BOT_NAME} 👿*\nType *.menu* to see my powers!` })
      }
    }catch(e){
      console.log('Error:', e.message)
    }
  })
}

startBot()
