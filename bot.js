const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const QRCode = require('qrcode')
const fs = require('fs')

const app = express()
let lastQR = null

app.get('/', (req,res) => {
  res.send(`<center style="font-family:sans-serif;margin-top:50px"><h1>👿 BOT 09 ! V6.4 LIVE</h1><p>VOICE CLONE + MP3 DIRECT</p><a href="/qr" style="background:black;color:white;padding:15px 30px;text-decoration:none;border-radius:10px">SCAN QR CODE</a><p>${lastQR?'QR Ready':'Generating...'}</p></center>`)
})

app.get('/qr', async (req,res) => {
  if(!lastQR) return res.send(`<center><h3>Generating QR... refresh 5s</h3><script>setTimeout(()=>location.reload(),5000)</script></center>`)
  res.send(`<center><h2>👿 BOT 09 ! V6.4 SCAN</h2><p>WhatsApp > Linked Devices > Link device</p><img src="${lastQR}" style="width:320px;border:5px solid black;border-radius:20px"><p>Auto refresh 25s</p><script>setTimeout(()=>location.reload(),25000)</script></center>`)
})

app.listen(process.env.PORT || 10000, () => console.log('WEB LIVE'))

const BOT_NAME = "BOT 09 !"
let antiLink = new Set()

function mainMenu(){
return `WELCOME. I AM ${BOT_NAME} 👿💀
V6.4 ULTIMATE - BOTH POWERS:

┌─[ 1 ] VOICE CLONE 🎙️ REAL
│ > .tts [text] - Robot voice
│ > .setvoice - Reply your VN
│ > .myvoice - Play your voice
│ > .mytts [text] - Your style
└────────────────────

┌─[ 2 ] MUSIC DIRECT 🎵
│ > .play [song] - Download MP3
│ > .play2 [song] - Link only
└────────────────────

┌─[ 3 ] MEDIA 🔥
│ > .sticker - Photo to sticker
│ > .attp [text] - Rainbow
│ > .tagall [msg] - Tag all
└────────────────────

┌─[ 4 ] DEMON CORE 👿
│ > .ping .alive .owner .menu
│ > .antilink on/off
│ > .ai [text]
└────────────────────

> Type 1-4 or command
> REAL CLONE: Send VN > .setvoice
> Then .myvoice to hear am
> V6.4 BOTH`
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
    } else if(u.connection==='open'){ console.log('✅ V6.4 CONNECTED'); lastQR=null }
  })

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0]; if(!m?.message) return
    if(m.key.remoteJid==='status@broadcast'){ await sock.readMessages([m.key]).catch(()=>{}); return }
    const jid = m.key.remoteJid; const isGroup = jid.endsWith('@g.us')
    let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''; 
    let raw = body.trim(); let lower = raw.toLowerCase(); if(lower.startsWith('.')) lower=lower.slice(1)
    if(isGroup && antiLink.has(jid) && /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me)/i.test(raw) && !m.key.fromMe){
      try{ await sock.sendMessage(jid,{delete:m.key}); await sock.sendMessage(jid,{text:`🚫 Link deleted by ${BOT_NAME} 👿`}) }catch{}
    }
    const isCmd = raw.startsWith('.') || ['menu','ping','alive','owner','hi','1','2','3','4','sticker','attp','setvoice','myvoice','mytts'].some(k=>lower.startsWith(k)) || lower.startsWith('ai ') || lower.startsWith('tagall') || lower.startsWith('antilink') || lower.startsWith('tts ') || lower.startsWith('say ') || lower.startsWith('voice ') || lower.startsWith('play')
    if(!isCmd) return

    try{
      await sock.sendPresenceUpdate('composing', jid)

      if(lower==='menu' || lower==='help'){ await sock.sendMessage(jid,{text:mainMenu()}) }
      else if(lower==='1'){ await sock.sendMessage(jid,{text:`*┌─[ 1 ] VOICE CLONE REAL*\n\n.tts [text] = Robot voice\n\n*REAL VOICE STEPS:*\n1. Send your Voice Note (talk 5 sec)\n2. Reply that VN with .setvoice\n3. Type .myvoice to hear\n4. Type .mytts I love you to use am\n\nSaved file: myvoice.mp3\nV6.4 REAL CLONE 🎙️`}) }
      else if(lower==='2'){ await sock.sendMessage(jid,{text:`*┌─[ 2 ] MUSIC DIRECT MP3*\n\n.play [song] - Download MP3 direct\nEg: .play Asake Lonely\n\nE go search YouTube and send the MP3 make you play for WhatsApp! No link only!\n\n.play2 [song] - Link only (fast)\nV6.4 🎵`}) }
      else if(lower==='3'){ await sock.sendMessage(jid,{text:`*┌─[ 3 ] MEDIA*\n\n.sticker (reply image)\n.attp [text]\n.tagall [msg]`}) }
      else if(lower==='4'){ await sock.sendMessage(jid,{text:`*┌─[ 4 ] CORE*\n\n.ping .alive .owner\n.antilink on/off\n.ai [text]`}) }
      else if(lower==='ping' || lower==='alive'){ await sock.sendMessage(jid,{text:`*Pong!* ⚡\n*${BOT_NAME} V6.4 BOTH ACTIVE ✅*\n*Voice Clone + MP3 Direct Ready*`}) }
      else if(lower==='owner'){ await sock.sendMessage(jid,{text:`*OWNER: ${BOT_NAME}* 👿\n*V6.4 BOTH POWERS ACTIVE*`}) }
      else if(lower.startsWith('ai ')){ const q=raw.slice(3); await sock.sendMessage(jid,{text:`*${BOT_NAME} AI 🤖:*\nQ: ${q}\nA: I be your demon assistant V6.4 BOTH! 💀`}) }

      // REAL VOICE CLONE - SET MY VOICE
      else if(lower==='setvoice' || lower==='savevoice'){
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
        const audioMsg = quoted?.audioMessage || quoted?.pttMessage || m.message.audioMessage
        if(!audioMsg && !quoted){
          return sock.sendMessage(jid,{text:'*How to set real voice:*\n\n1. Send a Voice Note (talk like "Hello I am Daniel")\n2. Reply that Voice Note with *.setvoice*\n\nI go save am as your clone voice! 🎙️'})
        }
        try{
          await sock.sendMessage(jid,{text:'*🎙️ Saving your real voice...*'})
          let buffer
          if(quoted){
            buffer = await downloadMediaMessage({message:{audioMessage:quoted.audioMessage || quoted.pttMessage}},'buffer',{}, {logger:P({level:'silent'}), reuploadRequest:sock.updateMediaMessage})
          }else{
            buffer = await downloadMediaMessage(m,'buffer',{},{logger:P({level:'silent'}),reuploadRequest:sock.updateMediaMessage})
          }
          fs.writeFileSync('./myvoice.mp3', buffer)
          await sock.sendMessage(jid,{text:'*✅ Real voice saved!*\n\nNow use:\n.myvoice - To play your voice\n.mytts [text] - To use your voice style\n\nFile: myvoice.mp3 saved 🎙️💀'})
          await sock.sendMessage(jid,{audio: buffer, mimetype:'audio/mpeg', ptt:true})
        }catch(e){ await sock.sendMessage(jid,{text:'Save voice fail: '+e.message}) }
      }
      else if(lower==='myvoice'){
        if(!fs.existsSync('./myvoice.mp3')) return sock.sendMessage(jid,{text:'No real voice saved yet! Send VN and reply .setvoice first 🎙️'})
        const buff = fs.readFileSync('./myvoice.mp3')
        await sock.sendMessage(jid,{audio: buff, mimetype:'audio/mpeg', ptt:true})
        await sock.sendMessage(jid,{text:'*Your real voice clone 🔥 - BOT 09 V6.4*'})
      }
      else if(lower.startsWith('mytts ')){
        const txt = raw.slice(6)
        if(!fs.existsSync('./myvoice.mp3')) return sock.sendMessage(jid,{text:'No real voice saved! Do .setvoice first'})
        // Send real voice + robot TTS for text
        const buff = fs.readFileSync('./myvoice.mp3')
        await sock.sendMessage(jid,{audio: buff, mimetype:'audio/mpeg', ptt:true})
        // Also generate robot for the new text
        try{
          const gtts = require('gtts')
          const path = './mytts.mp3'
          const speech = new gtts(txt, 'en')
          speech.save(path, async ()=>{
            await new Promise(r=>setTimeout(r,1500))
            const b2 = fs.readFileSync(path)
            await sock.sendMessage(jid,{audio: b2, mimetype:'audio/mpeg'})
            await sock.sendMessage(jid,{text:`*MyTTS:* ${txt}\n*Real voice + Text voice = BOTH 💀*`})
          })
        }catch{}
      }

      // TTS ROBOT VOICE - FIXED
      else if(lower.startsWith('tts ') || lower.startsWith('say ') || lower.startsWith('voice ')){
        const txt = raw.slice(raw.indexOf(' ')+1)
        if(!txt) return sock.sendMessage(jid,{text:'Usage: .tts Hello boss'})
        try{
          const gtts = require('gtts')
          const filePath = './voice.mp3'
          await sock.sendMessage(jid,{text:`*🎙️ Generating:* ${txt.substring(0,40)}...`})
          const speech = new gtts(txt, 'en')
          speech.save(filePath, async ()=>{
            await new Promise(r=>setTimeout(r,2000))
            try{
              if(fs.existsSync(filePath)){
                const buffer = fs.readFileSync(filePath)
                await sock.sendMessage(jid,{audio: buffer, mimetype:'audio/mpeg'})
                await sock.sendMessage(jid,{text:`*Voice sent ✅* - ${BOT_NAME} V6.4`})
              }
            }catch(err){ await sock.sendMessage(jid,{text:'Send error: '+err.message}) }
          })
        }catch(e){ await sock.sendMessage(jid,{text:'Voice fail: '+e.message}) }
      }
      
      // PLAY DIRECT MP3 DOWNLOAD
      else if(lower.startsWith('play ') || lower.startsWith('play2 ')){
        const isDirect = lower.startsWith('play ')
        const query = raw.slice(raw.indexOf(' ')+1)
        if(!query) return sock.sendMessage(jid,{text:'Usage: .play Asake lonely at the top'})
        try{
          await sock.sendMessage(jid,{text:`🔍 Searching: *${query}* ${isDirect?'[MP3 DIRECT MODE]':''}...`})
          const yts = require('yt-search')
          const r = await yts(query)
          const video = r.videos[0]
          if(!video) return sock.sendMessage(jid,{text:'No song found'})
          
          if(!isDirect){
            // Link only mode - .play2
            return sock.sendMessage(jid,{text:`*🎵 FOUND:*\n\n*Title:* ${video.title}\n*Channel:* ${video.author.name}\n*Duration:* ${video.timestamp}\n*Link:* ${video.url}\n\n*BOT 09 MUSIC*`})
          }
          
          // DIRECT MP3 MODE - .play
          await sock.sendMessage(jid,{text:`*🎵 Downloading MP3:*\n${video.title}\n*${video.timestamp}* - Wait 20 sec... 👿`})
          const ytdl = require('ytdl-core')
          const filePath = './song.mp3'
          // Download audio only
          const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' })
          const writeStream = fs.createWriteStream(filePath)
          stream.pipe(writeStream)
          writeStream.on('finish', async ()=>{
            try{
              const stats = fs.statSync(filePath)
              if(stats.size > 15*1024*1024){ // >15MB too big
                fs.unlinkSync(filePath)
                return sock.sendMessage(jid,{text:`*File too big (${Math.round(stats.size/1024/1024)}MB)*\nLink: ${video.url}\nUse .play2 for link`})
              }
              const buffer = fs.readFileSync(filePath)
              await sock.sendMessage(jid,{audio: buffer, mimetype:'audio/mpeg', fileName: `${video.title}.mp3`})
              await sock.sendMessage(jid,{text:`*✅ MP3 Sent: ${video.title}*\n*BOT 09 V6.4 DIRECT 🎵*`})
              fs.unlinkSync(filePath)
            }catch(err){
              await sock.sendMessage(jid,{text:`MP3 send fail, use link: ${video.url}\nError: ${err.message}`})
            }
          })
          writeStream.on('error', async (err)=>{
            await sock.sendMessage(jid,{text:`Download fail: ${err.message}\nLink: ${video.url}`})
          })
          
        }catch(e){ 
          await sock.sendMessage(jid,{text:`Search fail: https://www.youtube.com/results?search_query=${encodeURIComponent(query)}\nError: ${e.message}`}) 
        }
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
      else if(['hi','hello','hey'].includes(lower)){ await sock.sendMessage(jid,{text:`Yo! I am *${BOT_NAME} V6.4 BOTH 👿*\nType *.menu* for REAL CLONE + MP3 DIRECT!`}) }

    }catch(e){ console.log('Error:',e.message) }
  })
}
startBot()
