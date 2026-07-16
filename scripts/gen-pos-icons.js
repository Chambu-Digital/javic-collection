const fs = require('fs')
const zlib = require('zlib')
const path = require('path')

// Generates a valid PNG filled with a solid color
function makePng(size, r, g, b) {
  const rowLen = 1 + size * 4
  const raw = Buffer.alloc(size * rowLen)
  for (let y = 0; y < size; y++) {
    const base = y * rowLen
    raw[base] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const p = base + 1 + x * 4
      raw[p] = r; raw[p+1] = g; raw[p+2] = b; raw[p+3] = 0xFF
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })

  function crc32(buf) {
    let crc = 0xFFFFFFFF
    for (const byte of buf) {
      crc ^= byte
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function chunk(type, data) {
    const t = Buffer.from(type, 'ascii')
    const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length)
    const body = Buffer.concat([t, data])
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(body))
    return Buffer.concat([lenBuf, t, data, crcBuf])
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // RGBA
  // compression, filter, interlace = 0

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

const publicDir = path.join(__dirname, '..', 'public')

// Javic brand color: #990044
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), makePng(192, 0x99, 0x00, 0x44))
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), makePng(512, 0x99, 0x00, 0x44))

console.log('✓ icon-192.png created (' + fs.statSync(path.join(publicDir, 'icon-192.png')).size + ' bytes)')
console.log('✓ icon-512.png created (' + fs.statSync(path.join(publicDir, 'icon-512.png')).size + ' bytes)')
