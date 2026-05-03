const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const icons = [
  'home', 'home-active',
  'discover', 'discover-active',
  'publish', 'publish-active',
  'message', 'message-active',
  'mine', 'mine-active',
  'search', 'system', 'interaction',
  'address', 'deposit', 'pickup', 'vip', 'settings',
  'scan'
];

const iconDir = path.join(__dirname, '../miniprogram/assets/images');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const chunk = Buffer.alloc(4 + 4 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crcData = Buffer.concat([Buffer.from(type), data]);
  chunk.writeUInt32BE(crc32(crcData), 8 + data.length);
  return chunk;
}

function createIcon(name, isActive) {
  const color = isActive ? '#FF6B6B' : '#999999';
  const size = 48;
  
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0);
    for (let x = 0; x < size; x++) {
      const cx = size / 2, cy = size / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const alpha = dist < size / 3 ? 255 : 0;
      rawData.push(r, g, b, alpha);
    }
  }
  
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(path.join(iconDir, `${name}.png`), png);
  console.log(`Created ${name}.png`);
}

icons.forEach(name => {
  createIcon(name, name.includes('-active'));
});

console.log('All icons created successfully!');