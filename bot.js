const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const QRCode = require('qrcode')
const fs = require('fs')
const fetch = require('node-fetch')

const app = express()
let lastQR = null

app.get('/', (req,res) => {
  res.send(`<center style="font-family:sans-serif;margin-top:50px"><h1>👿 BOT 09 ! V6.6 ULTRA</h1><p>4 WAY MP3 BYPASS ACTIVE</p><a href="/qr" style="background:black;color:white;padding:15px 30px;text-decoration:none;border-radius:10px">SCAN QR</a></center>`)
})
app.get('/qr', async (req,res) => {
  if(!lastQR) return res.send(`<center><h3>Generating QR... refresh in 3s</h3><script>setTimeout(()=>location.reload(),3000)</script></center>`)
  res.send(`<center><h2>👿 V6.6 SCAN</h2><img src="${lastQR}" style="width:320px;border:5px solid black;border-radius:20px"><p>Refresh 25s</p><script>setTimeout(()=>location.reload(),25000)</script></center>`)
})
app.listen(process.env.PORT || 10000, () => console.log('WEB LIVE V6.6'))

const BOT_NAME = "BOT 09 !"
let antiLink = new Set()

function mainMenu(){
return `WELCOME. I AM ${BOT_NAME} 👿💀
V6.6 ULTRA - REAL MP3 BYPASS

┌─[ 1 ] MUSIC REAL MP3 🎵
│ > .play [song] - REAL MP3!
│   4-way bypass!
│ > .play2 [song] - Fast Link
└────────────────────

┌─[ 2 ] VOICE CLONE 🎙️
│ > .tts [text]
│ > .setvoice (reply VN)
│ > .myvoice .mytts [text]
└────────────────────

┌─[ 3 ] CORE
│ > .sticker .attp .tagall
│ > .ping .menu
└────────────────────

V6.6 ULTRA 👿`
}

async function downloadFile(url, path){
  const res = await fetch(url)
  if(!res.ok) throw new Error('download fail')
  const buf = await res.buffer()
  fs.writeFileSync(path, buf)
  return buf
}

async function tryGetMp3(youtubeUrl, filePath){
  // API 1 - Ryzendesu (BEST FOR RENDER)
  try{
    console.log('Trying Ryzendesu...')
    const api1 = `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`
    const j1 = await fetch(api1, {timeout: 15000}).then(r=>r.json()).catch(()=>null)
    let dl = j1?.url || j1?.result?.url || j1?.downloadUrl || j1?.data?.url || j1?.result?.downloadUrl
    if(dl){ 
      console.log('Ryzendesu found:', dl)
      await downloadFile(dl, filePath); 
      return true 
    }
  }catch(e){ console.log('API1 fail', e.message)}

  // API 2 - Akuari
  try{
    console.log('Trying Akuari...')
    const api2 = `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(youtubeUrl)}`
    const j2 = await fetch(api2, {timeout: 15000}).then(r=>r.json()).catch(()=>null)
    let dl = j2?.mp3 || j2?.result?.mp3 || j2?.result?.url || j2?.url
    if(dl){ await downloadFile(dl, filePath); return true }
  }catch(e){ console.log('API2 fail')}

  // API 3 - David Cyril Tech
  try{
    console.log('Trying David...')
    const api3 = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(youtubeUrl)}`
    const j3 = await fetch(api3, {timeout: 15000}).then(r=>r.json()).catch(()=>null)
    let dl = j3?.result?.downloadUrl || j3?.url || j3?.download_url
    if(dl){ await downloadFile(dl, filePath); return true }
  }catch(e){ console.log('API3 fail')}

  // API 4 - Cobalt Backup
  try{
    console.log('Trying Cobalt...')
    const res = await fetch('https://co.wuk.sh/api/json', {
      method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'},
      body: JSON.stringify({url: youtubeUrl, aFormat:'mp3', isAudioOnly:true})
    }).then(r=>r.json()).catch(()=>null)
    if(res?.url){ await downloadFile(res.url, filePath); return true }
  }catch(e){}

  return false
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
    } else if(u.connection==='open'){ lastQR=null; console.log('✅ V6.6 CONNECTED') }
  })

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0]; if(!m?.message) return
    if(m.key.remoteJid==='status@broadcast'){ await sock.readMessages([m.key]).catch(()=>{}); return }
    const jid = m.key.remoteJid; const isGroup = jid.endsWith('@g.us')
    let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''
    let raw = body.trim(); let lower = raw.toLowerCase(); if(lower.startsWith('.')) lower=lower.slice(1)

    if(isGroup && antiLink.has(jid) && /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me)/i.test(raw) && !m.key.fromMe){
      try{ await sock.sendMessage(jid,{delete:m.key}); await sock.sendMessage(jid,{text:`🚫 Link deleted by ${BOT_NAME}`}) }catch{}
    }
    const isCmd = raw.startsWith('.') || ['menu','ping','alive','owner','hi','1','2','3','sticker','attp','setvoice','myvoice','mytts'].some(k=>lower.startsWith(k)) || lower.startsWith('ai ') || lower.startsWith('tagall') || lower.startsWith('antilink') || lower.startsWith('tts ') || lower.startsWith('say ') || lower.startsWith('voice ') || lower.startsWith('play')
    if(!isCmd) return

    try{
      await sock.sendPresenceUpdate('composing', jid)

      if(lower==='menu' || lower==='help'){ await sock.sendMessage(jid,{text:mainMenu()}) }
      else if(lower==='ping' || lower==='alive'){ await sock.sendMessage(jid,{text:`*Pong!* ⚡\n*${BOT_NAME} V6.6 ULTRA BYPASS ACTIVE ✅*\n4-way MP3 bypass ready!`}) }
      else if(lower==='owner'){ await sock.sendMessage(jid,{text:`*OWNER: ${BOT_NAME}* 👿\n*V6.6 ULTRA*`}) }
      else if(lower.startsWith('ai ')){ const q=raw.slice(3); await sock.sendMessage(jid,{text:`*${BOT_NAME} AI:* ${q}\nI be demon V6.6! 💀`}) }

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
            }
          })
        }catch(e){ await sock.sendMessage(jid,{text:'Voice fail: '+e.message}) }
      }
      
      else if(lower.startsWith('play ') || lower.startsWith('play2 ')){
        const isDirect = lower.startsWith('play ') && !lower.startsWith('play2 ')
        const query = raw.slice(raw.indexOf(' ')+1)
        if(!query) return sock.sendMessage(jid,{text:'Usage: .play Asake Lonely'})
        try{
          await sock.sendMessage(jid,{text:`🔍 Searching: *${query}* ...`})
          const yts = require('yt-search')
          const r = await yts(query)
          const video = r.videos[0]
          if(!video) return sock.sendMessage(jid,{text:'No song found'})

          if(!isDirect){
            return sock.sendMessage(jid,{text:`*🎵 FOUND:*\n*Title:* ${video.title}\n*Duration:* ${video.timestamp}\n*Link:* ${video.url}\n\n*FAST MP3:* https://y2mate.is/${video.videoId}\n\n*BOT 09 MUSIC* 😈`})
          }

          await sock.sendMessage(jid,{text:`*🎵 Found:* ${video.title}\n*${video.timestamp}*\n*Downloading via ULTRA Bypass (Ryzendesu + 3 more)... 👿🔥*`})
          
          const filePath = './song.mp3'
          if(fs.existsSync(filePath)) try{fs.unlinkSync(filePath)}catch{}

          const ok = await tryGetMp3(video.url, filePath)
          
          if(ok && fs.existsSync(filePath)){
            const stats = fs.statSync(filePath)
            if(stats.size > 100000){
              const buffer = fs.readFileSync(filePath)
              await sock.sendMessage(jid,{audio: buffer, mimetype:'audio/mpeg', fileName: `${video.title}.mp3`})
              await sock.sendMessage(jid,{text:`*✅ REAL MP3 SENT! ${video.title}* 🎵\n*Size:* ${(stats.size/1024/1024).toFixed(2)}MB - V6.6 ULTRA BYPASS!`})
              try{fs.unlinkSync(filePath)}catch{}
              return
            }
          }

          // Direct ytdl fallback
          try{
            const ytdl = require('ytdl-core')
            await new Promise((resolve, reject)=>{
              const timeout = setTimeout(()=>reject(new Error('timeout')), 12000)
              const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' })
              const writeStream = fs.createWriteStream(filePath)
              stream.pipe(writeStream)
              writeStream.on('finish', ()=>{ clearTimeout(timeout); resolve() })
              writeStream.on('error', (e)=>{ clearTimeout(timeout); reject(e) })
              stream.on('error', (e)=>{ clearTimeout(timeout); reject(e) })
            })
            if(fs.existsSync(filePath)){
              const buffer = fs.readFileSync(filePath)
              await sock.sendMessage(jid,{audio: buffer, mimetype:'audio/mpeg', fileName: `${video.title}.mp3`})
              await sock.sendMessage(jid,{text:`*✅ MP3 Direct: ${video.title}* 🎵`})
              try{fs.unlinkSync(filePath)}catch{}
              return
            }
          }catch{}

          await sock.sendMessage(jid,{text:`*⚠️ Server still blocked, use instant:*\n*Title:* ${video.title}\n*Link:* ${video.url}\n*INSTANT MP3:* https://y2mate.is/${video.videoId}\n\nTry .play2 for link mode`})
          
        }catch(e){ await sock.sendMessage(jid,{text:`Error: ${e.message}`}) }
      }
      
      else if(lower==='sticker'){
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage; const img = quoted?.imageMessage || m.message.imageMessage
        if(img){ try{ const buff = await downloadMediaMessage({message:{imageMessage:img}},'buffer',{}); await sock.sendMessage(jid,{sticker:buff}) }catch{ await sock.sendMessage(jid,{text:'Sticker fail'}) } }
        else{ await sock.sendMessage(jid,{text:'Reply image with .sticker 👿'}) }
      }
      else if(lower.startsWith('attp ')){ const txt = raw.slice(5); try{ await sock.sendMessage(jid,{sticker:{url:`https://api.oglinfo.com/attp?text=${encodeURIComponent(txt)}`}}) }catch{} }
      else if(lower.startsWith('tagall')){ if(isGroup){ const meta=await sock.groupMetadata(jid); const members=meta.participants.map(p=>p.id); const txt=raw.slice(6).trim()||'Attention 👿'; await sock.sendMessage(jid,{text:`*${txt}*\n\n${members.map(v=>'@'+v.split('@')[0]).join(' ')}`,mentions:members}) } }
      else if(['hi','hello','hey'].includes(lower)){ await sock.sendMessage(jid,{text:`Yo! *${BOT_NAME} V6.6 ULTRA MP3 👿* Type *.menu*`}) }

    }catch(e){ console.log('Error:',e.message) }
  })
}
startBot()
