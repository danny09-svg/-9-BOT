const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const QRCode = require('qrcode')
const fs = require('fs')

const app = express()
let lastQR = null

app.get('/', (req,res) => {
  res.send(`<center style="font-family:sans-serif;margin-top:50px"><h1>👿 BOT 09 ! V6.4.1 HOTFIX</h1><p>NO HANG MP3</p><a href="/qr" style="background:black;color:white;padding:15px 30px;text-decoration:none;border-radius:10px">SCAN QR</a></center>`)
})
app.get('/qr', async (req,res) => {
  if(!lastQR) return res.send(`<center><h3>Generating QR... refresh</h3><script>setTimeout(()=>location.reload(),5000)</script></center>`)
  res.send(`<center><h2>👿 V6.4.1 SCAN</h2><img src="${lastQR}" style="width:320px;border:5px solid black;border-radius:20px"><p>Auto refresh 25s</p><script>setTimeout(()=>location.reload(),25000)</script></center>`)
})
app.listen(process.env.PORT || 10000, () => console.log('WEB LIVE'))

const BOT_NAME = "BOT 09 !"
let antiLink = new Set()

function mainMenu(){
return `WELCOME. I AM ${BOT_NAME} 👿💀
V6.4.1 HOTFIX - NO HANG

┌─[ 1 ] VOICE CLONE 🎙️
│ > .tts [text] - Robot
│ > .setvoice - Reply your VN
│ > .myvoice - Play your voice
└────────────────────

┌─[ 2 ] MUSIC FAST 🎵
│ > .play [song] - Try MP3
│   If block = instant link!
│ > .play2 [song] - Link only
└────────────────────

┌─[ 3 ] MEDIA / CORE
│ > .sticker .attp .tagall
│ > .ping .alive .menu
└────────────────────

V6.4.1 HOTFIX`
}

async function startBot(){
  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ version, logger: P({level:'silent'}), auth: state, browser: [BOT_NAME,'Chrome','1.0'] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (u)=>{
    if(u.qr){ lastQR = await QRCode.toDataURL(u.qr) }
    if(u.connection==='close'){
      const should = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if(should) setTimeout(startBot,3000)
      else { if(fs.existsSync('./auth')) fs.rmSync('./auth',{recursive:true,force:true}); setTimeout(startBot,3000) }
    } else if(u.connection==='open'){ lastQR=null; console.log('✅ V6.4.1 CONNECTED') }
  })

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0]; if(!m?.message) return
    if(m.key.remoteJid==='status@broadcast'){ await sock.readMessages([m.key]).catch(()=>{}); return }
    const jid = m.key.remoteJid; const isGroup = jid.endsWith('@g.us')
    let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''; 
    let raw = body.trim(); let lower = raw.toLowerCase(); if(lower.startsWith('.')) lower=lower.slice(1)
    if(isGroup && antiLink.has(jid) && /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me)/i.test(raw) && !m.key.fromMe){
      try{ await sock.sendMessage(jid,{delete:m.key}); await sock.sendMessage(jid,{text:`🚫 Link deleted by ${BOT_NAME}`}) }catch{}
    }
    const isCmd = raw.startsWith('.') || ['menu','ping','alive','owner','hi','1','2','3','sticker','attp','setvoice','myvoice','mytts'].some(k=>lower.startsWith(k)) || lower.startsWith('ai ') || lower.startsWith('tagall') || lower.startsWith('antilink') || lower.startsWith('tts ') || lower.startsWith('say ') || lower.startsWith('voice ') || lower.startsWith('play')
    if(!isCmd) return

    try{
      await sock.sendPresenceUpdate('composing', jid)

      if(lower==='menu' || lower==='help'){ await sock.sendMessage(jid,{text:mainMenu()}) }
      else if(lower==='ping' || lower==='alive'){ await sock.sendMessage(jid,{text:`*Pong!* ⚡\n*${BOT_NAME} V6.4.1 HOTFIX ACTIVE ✅*\nNo more hanging!`}) }
      else if(lower==='owner'){ await sock.sendMessage(jid,{text:`*OWNER: ${BOT_NAME}* 👿\n*V6.4.1 HOTFIX - NO HANG*`}) }
      else if(lower.startsWith('ai ')){ const q=raw.slice(3); await sock.sendMessage(jid,{text:`*${BOT_NAME} AI:* ${q}\nI be demon V6.4.1! 💀`}) }

      // VOICE CLONE
      else if(lower==='setvoice'){
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
        if(!quoted?.audioMessage && !quoted?.pttMessage){ return sock.sendMessage(jid,{text:'Send VN then reply that VN with .setvoice 🎙️'}) }
        try{
          await sock.sendMessage(jid,{text:'*🎙️ Saving real voice...*'})
          const buffer = await downloadMediaMessage({message:{audioMessage:quoted.audioMessage || quoted.pttMessage}},'buffer',{}, {logger:P({level:'silent'}), reuploadRequest:sock.updateMediaMessage})
          fs.writeFileSync('./myvoice.mp3', buffer)
          await sock.sendMessage(jid,{audio: buffer, mimetype:'audio/mpeg', ptt:true})
          await sock.sendMessage(jid,{text:'*✅ Real voice saved! .myvoice to play*'})
        }catch(e){ await sock.sendMessage(jid,{text:'Save fail: '+e.message}) }
      }
      else if(lower==='myvoice'){
        if(!fs.existsSync('./myvoice.mp3')) return sock.sendMessage(jid,{text:'No voice saved! Send VN > reply .setvoice'})
        const buff = fs.readFileSync('./myvoice.mp3')
        await sock.sendMessage(jid,{audio: buff, mimetype:'audio/mpeg', ptt:true})
      }
      else if(lower.startsWith('mytts ')){
        const txt = raw.slice(6); if(!fs.existsSync('./myvoice.mp3')) return sock.sendMessage(jid,{text:'Do .setvoice first'})
        const buff = fs.readFileSync('./myvoice.mp3')
        await sock.sendMessage(jid,{audio: buff, mimetype:'audio/mpeg', ptt:true})
        try{
          const gtts = require('gtts'); const path = './mytts.mp3'
          const speech = new gtts(txt, 'en')
          speech.save(path, async ()=>{ await new Promise(r=>setTimeout(r,1500)); const b2 = fs.readFileSync(path); await sock.sendMessage(jid,{audio: b2, mimetype:'audio/mpeg'}); })
        }catch{}
      }
      else if(lower.startsWith('tts ') || lower.startsWith('say ') || lower.startsWith('voice ')){
        const txt = raw.slice(raw.indexOf(' ')+1); if(!txt) return
        try{
          const gtts = require('gtts'); const filePath = './voice.mp3'
          await sock.sendMessage(jid,{text:`*🎙️ Generating:* ${txt.substring(0,40)}...`})
          const speech = new gtts(txt, 'en')
          speech.save(filePath, async ()=>{
            await new Promise(r=>setTimeout(r,2000))
            if(fs.existsSync(filePath)){
              const buffer = fs.readFileSync(filePath)
              await sock.sendMessage(jid,{audio: buffer, mimetype:'audio/mpeg'})
              await sock.sendMessage(jid,{text:`*Voice sent ✅*`})
            }
          })
        }catch(e){ await sock.sendMessage(jid,{text:'Voice fail: '+e.message}) }
      }
      
      // PLAY V6.4.1 - NO HANG VERSION
      else if(lower.startsWith('play ') || lower.startsWith('play2 ')){
        const isDirect = lower.startsWith('play ') && !lower.startsWith('play2 ')
        const query = raw.slice(raw.indexOf(' ')+1)
        if(!query) return sock.sendMessage(jid,{text:'Usage: .play Asake Lonely'})
        try{
          await sock.sendMessage(jid,{text:`🔍 Searching: *${query}* ${isDirect?'[TRY MP3]':''}...`})
          const yts = require('yt-search')
          const r = await yts(query)
          const video = r.videos[0]
          if(!video) return sock.sendMessage(jid,{text:'No song found'})

          if(!isDirect){
            return sock.sendMessage(jid,{text:`*🎵 FOUND:*\n*Title:* ${video.title}\n*Duration:* ${video.timestamp}\n*Link:* ${video.url}\n\n*BOT 09 MUSIC* 😈`})
          }

          // Try MP3 with 15 sec timeout
          await sock.sendMessage(jid,{text:`*🎵 Found:*\n${video.title}\n*${video.timestamp}*\nTrying MP3 (10s timeout)... 👿`})
          
          const ytdl = require('ytdl-core')
          const filePath = './song.mp3'
          let finished = false
          
          const timeout = setTimeout(async ()=>{
            if(!finished){
              finished = true
              await sock.sendMessage(jid,{text:`*⚠️ YouTube blocked direct download (Render IP)*\n\n*Title:* ${video.title}\n*Link:* ${video.url}\n\n*FAST DOWNLOAD:*\n1. Go: https://y2mate.is/${video.videoId}\n2. Or https://ytmp3.nu/${video.videoId}\n\n*Use .play2 for instant link mode*\n*BOT 09 V6.4.1* 😈`})
              try{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath) }catch{}
            }
          }, 12000)

          try{
            const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' })
            const writeStream = fs.createWriteStream(filePath)
            stream.pipe(writeStream)
            writeStream.on('finish', async ()=>{
              if(finished) return
              finished = true
              clearTimeout(timeout)
              try{
                const stats = fs.statSync(filePath)
                if(stats.size > 15*1024*1024){
                  fs.unlinkSync(filePath)
                  return sock.sendMessage(jid,{text:`*File too big ${Math.round(stats.size/1024/1024)}MB*\n*Link:* ${video.url}\nDownload here: https://y2mate.is/${video.videoId}`})
                }
                const buffer = fs.readFileSync(filePath)
                await sock.sendMessage(jid,{audio: buffer, mimetype:'audio/mpeg', fileName: `${video.title}.mp3`})
                await sock.sendMessage(jid,{text:`*✅ MP3 Sent: ${video.title}* 🎵`})
                fs.unlinkSync(filePath)
              }catch(err){ await sock.sendMessage(jid,{text:`Send fail: ${err.message}\nLink: ${video.url}`}) }
            })
            writeStream.on('error', async (err)=>{
              if(finished) return
              finished = true
              clearTimeout(timeout)
              await sock.sendMessage(jid,{text:`*MP3 blocked, use link:*\n${video.url}\nDownload: https://y2mate.is/${video.videoId}\nError: ${err.message}`})
            })
            stream.on('error', async (err)=>{
              if(finished) return
              finished = true
              clearTimeout(timeout)
              await sock.sendMessage(jid,{text:`*YouTube blocked MP3*\n*Link:* ${video.url}\n*Fast DL:* https://y2mate.is/${video.videoId}\n\nUse .play2 next time for instant link!`})
            })
          }catch(err){
            if(finished) return
            finished = true
            clearTimeout(timeout)
            await sock.sendMessage(jid,{text:`*Link: ${video.url}*\n*Download MP3:* https://y2mate.is/${video.videoId}\n*Error:* ${err.message}`})
          }
          
        }catch(e){ await sock.sendMessage(jid,{text:`Search fail: https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}) }
      }
      
      else if(lower==='sticker'){
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage; const img = quoted?.imageMessage || m.message.imageMessage
        if(img){ try{ const buff = await downloadMediaMessage({message:{imageMessage:img}},'buffer',{}); await sock.sendMessage(jid,{sticker:buff}) }catch{ await sock.sendMessage(jid,{text:'Sticker fail'}) } }
        else{ await sock.sendMessage(jid,{text:'Reply image with .sticker 👿'}) }
      }
      else if(lower.startsWith('attp ')){ const txt = raw.slice(5); try{ await sock.sendMessage(jid,{sticker:{url:`https://api.oglinfo.com/attp?text=${encodeURIComponent(txt)}`}}) }catch{} }
      else if(lower.startsWith('tagall')){ if(isGroup){ const meta=await sock.groupMetadata(jid); const members=meta.participants.map(p=>p.id); const txt=raw.slice(6).trim()||'Attention 👿'; await sock.sendMessage(jid,{text:`*${txt}*\n\n${members.map(v=>'@'+v.split('@')[0]).join(' ')}`,mentions:members}) } }
      else if(['hi','hello','hey'].includes(lower)){ await sock.sendMessage(jid,{text:`Yo! *${BOT_NAME} V6.4.1 NO HANG 👿* Type *.menu*`}) }

    }catch(e){ console.log('Error:',e.message) }
  })
}
startBot()
