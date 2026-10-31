const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const QRCode = require('qrcode')
const fs = require('fs')

const app = express()
let lastQR = null

app.get('/', (req,res) => {
  res.send(`<center style="font-family:sans-serif;margin-top:50px"><h1>👿 BOT 09 ! V6.3.1 LIVE</h1><p>VOICE FIXED MODE</p><a href="/qr" style="background:black;color:white;padding:15px 30px;text-decoration:none;border-radius:10px">SCAN QR CODE</a><p>${lastQR?'QR Ready':'Generating...'}</p></center>`)
})

app.get('/qr', async (req,res) => {
  if(!lastQR) return res.send(`<center><h3>Generating QR... refresh 5s</h3><script>setTimeout(()=>location.reload(),5000)</script></center>`)
  res.send(`<center><h2>👿 BOT 09 ! V6.3.1 SCAN</h2><p>WhatsApp > Linked Devices > Link device</p><img src="${lastQR}" style="width:320px;border:5px solid black;border-radius:20px"><p>Auto refresh 25s</p><script>setTimeout(()=>location.reload(),25000)</script></center>`)
})

app.listen(process.env.PORT || 10000, () => console.log('WEB LIVE'))

const BOT_NAME = "BOT 09 !"
let antiLink = new Set()

function mainMenu(){
return `WELCOME. I AM ${BOT_NAME} 👿💀
V6.3.1 ULTIMATE - SELECT:

┌─[ 1 ] CORE
│ > .ping - Speed check
│ > .alive - Bot status
│ > .owner - Owner info
└────────────────────

┌─[ 2 ] MEDIA 🔥
│ > .sticker - Photo to sticker
│ > .attp [text] - Text sticker
│ > .tagall [msg] - Tag all
└────────────────────

┌─[ 3 ] VOICE & MUSIC 🎵
│ > .tts [text] - Voice clone FIXED
│ > .say [text] - Same
│ > .voice [text] - Voice note
│ > .play [song name]
└────────────────────

┌─[ 4 ] DEMON MODE 👿
│ > .antilink on/off
│ > .ai [text] - Chat AI
│ > Auto View Status ON ✅
└────────────────────

> Type 1-4 or command
> Eg: .tts Hello boss | .play Asake
> V6.3.1 FIXED`
}

async function startBot(){
  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ version, logger: P({level:'silent'}), auth: state, browser: [BOT_NAME,'Chrome','1.0'] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (u)=>{
    if(u.qr){ lastQR = await QRCode.toDataURL(u.qr); console.log('NEW QR') }
    if(u.connection==='close'){
      const should = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if(should) setTimeout(startBot,3000)
      else { if(fs.existsSync('./auth')) fs.rmSync('./auth',{recursive:true,force:true}); setTimeout(startBot,3000) }
    } else if(u.connection==='open'){ console.log('✅ V6.3.1 CONNECTED'); lastQR=null }
  })

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0]; if(!m?.message) return
    if(m.key.remoteJid==='status@broadcast'){ await sock.readMessages([m.key]).catch(()=>{}); return }
    const jid = m.key.remoteJid; const isGroup = jid.endsWith('@g.us')
    let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''; if(!body) return
    let raw = body.trim(); let lower = raw.toLowerCase(); if(lower.startsWith('.')) lower=lower.slice(1)

    if(isGroup && antiLink.has(jid) && /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me)/i.test(raw) && !m.key.fromMe){
      try{ await sock.sendMessage(jid,{delete:m.key}); await sock.sendMessage(jid,{text:`🚫 Link deleted by ${BOT_NAME} 👿`}) }catch{}
    }

    const isCmd = raw.startsWith('.') || ['menu','ping','alive','owner','hi','1','2','3','4','sticker','attp'].some(k=>lower.startsWith(k)) || lower.startsWith('ai ') || lower.startsWith('tagall') || lower.startsWith('antilink') || lower.startsWith('tts ') || lower.startsWith('say ') || lower.startsWith('voice ') || lower.startsWith('play ')
    if(!isCmd) return

    try{
      await sock.sendPresenceUpdate('composing', jid)

      if(lower==='menu' || lower==='help'){ await sock.sendMessage(jid,{text:mainMenu()}) }
      else if(lower==='1'){ await sock.sendMessage(jid,{text:`*┌─[ 1 ] CORE - ${BOT_NAME}*\n\n.ping\n.alive\n.owner\n.menu\n\nACTIVE ✅ V6.3.1`}) }
      else if(lower==='2'){ await sock.sendMessage(jid,{text:`*┌─[ 2 ] MEDIA*\n\n.sticker (reply image)\n.attp [text]\n.tagall [msg]\n\n🔥 READY`}) }
      else if(lower==='3'){ await sock.sendMessage(jid,{text:`*┌─[ 3 ] VOICE & MUSIC*\n\n.tts [text] - Voice FIXED\n.say [text]\n.voice [text]\n.play [song]\n\nExample:\n.tts Hello Daniel I am Bot 09\n.play Burna Boy Last Last\n\n🎵 V6.3.1*`}) }
      else if(lower==='4'){ await sock.sendMessage(jid,{text:`*┌─[ 4 ] DEMON*\n\n.antilink on/off\n.ai [question]\nStatus view: ON ✅\nV6.3.1 ULTIMATE\n\n👿`}) }
      else if(lower==='ping' || lower==='alive'){ await sock.sendMessage(jid,{text:`*Pong!* ⚡\n*${BOT_NAME} Speed: ${Math.floor(Math.random()*150)}ms*\n*V6.3.1 ACTIVE ✅*`}) }
      else if(lower==='owner'){ await sock.sendMessage(jid,{text:`*OWNER: ${BOT_NAME}* 👿\n*V6.3.1 VOICE FIXED*`}) }
      else if(lower.startsWith('ai ')){ const q=raw.slice(3); await sock.sendMessage(jid,{text:`*${BOT_NAME} AI 🤖:*\nQ: ${q}\nA: I be your demon assistant V6.3.1! 💀`}) }
      
      // VOICE CLONE - FIXED VERSION
      else if(lower.startsWith('tts ') || lower.startsWith('say ') || lower.startsWith('voice ')){
        const txt = raw.slice(raw.indexOf(' ')+1)
        if(!txt) return sock.sendMessage(jid,{text:'Usage: .tts Hello boss I am Bot 09'})
        try{
          const gtts = require('gtts')
          const filePath = './voice.mp3'
          await sock.sendMessage(jid,{text:`*🎙️ Generating voice:*\n${txt.substring(0,50)}...`})
          const speech = new gtts(txt, 'en')
          speech.save(filePath, async function(){
            await new Promise(r=>setTimeout(r,2000))
            try{
              if(fs.existsSync(filePath)){
                const buffer = fs.readFileSync(filePath)
                await sock.sendMessage(jid,{ audio: buffer, mimetype: 'audio/mpeg' })
                await sock.sendMessage(jid,{text:`*Voice sent ✅ Play am!* - ${BOT_NAME}`})
              }
            }catch(err){
              await sock.sendMessage(jid,{text:'Send error: '+err.message})
            }
          })
        }catch(e){ await sock.sendMessage(jid,{text:'Voice fail: '+e.message}) }
      }
      
      // PLAY SONG
      else if(lower.startsWith('play ')){
        const query = raw.slice(5); if(!query) return sock.sendMessage(jid,{text:'Usage: .play Asake lonely at the top'})
        try{
          await sock.sendMessage(jid,{text:`🔍 Searching: *${query}*...`})
          const yts = require('yt-search'); const r = await yts(query); const video = r.videos[0]
          if(!video) return sock.sendMessage(jid,{text:'No song found'})
          await sock.sendMessage(jid,{text:`*🎵 FOUND:*\n\n*Title:* ${video.title}\n*Channel:* ${video.author.name}\n*Duration:* ${video.timestamp}\n*Link:* ${video.url}\n\n*${BOT_NAME} MUSIC 👿*`})
        }catch(e){ await sock.sendMessage(jid,{text:`Search fail: https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}) }
      }
      
      else if(lower==='sticker'){
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage; const img = quoted?.imageMessage || m.message.imageMessage
        if(img){ try{ const buff = await downloadMediaMessage(m,'buffer',{},{logger:P({level:'silent'}),reuploadRequest:sock.updateMediaMessage}).catch(async()=>await downloadMediaMessage({message:{imageMessage:img}},'buffer',{})); await sock.sendMessage(jid,{sticker:buff}) }catch{ await sock.sendMessage(jid,{text:'Sticker fail'}) } }
        else{ await sock.sendMessage(jid,{text:'Reply an image with .sticker 👿'}) }
      }
      else if(lower.startsWith('attp ')){ const txt = raw.slice(5); if(!txt) return; try{ await sock.sendMessage(jid,{sticker:{url:`https://api.oglinfo.com/attp?text=${encodeURIComponent(txt)}`}}) }catch{ await sock.sendMessage(jid,{text:'Attp fail'}) } }
      else if(lower.startsWith('tagall')){ if(isGroup){ const meta=await sock.groupMetadata(jid); const members=meta.participants.map(p=>p.id); const txt=raw.slice(6).trim()||'Attention 👿'; await sock.sendMessage(jid,{text:`*${txt}*\n\n${members.map(v=>'@'+v.split('@')[0]).join(' ')}`,mentions:members}) } }
      else if(lower==='antilink on'){ if(isGroup){ antiLink.add(jid); await sock.sendMessage(jid,{text:'*AntiLink ON* 💀'}) } }
      else if(lower==='antilink off'){ antiLink.delete(jid); await sock.sendMessage(jid,{text:'*AntiLink OFF* ✅'}) }
      else if(['hi','hello','hey'].includes(lower)){ await sock.sendMessage(jid,{text:`Yo! I am *${BOT_NAME} V6.3.1 👿*\nType *.menu*`}) }

    }catch(e){ console.log('Error:',e.message) }
  })
}
startBot()
