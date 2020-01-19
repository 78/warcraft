const msgpack = require('./3rdparty/msgpack')
const Buffer = require('./3rdparty/buffer').Buffer

const PACKET_BUFFER_TIMEOUT = 10 * 1000
const CHECK_TIMEOUT_INTERVAL = 1000

module.exports = class Protocol {
  constructor() {
    this.sequence = 0
    this.packetSize = 2000
    this.buffers = {}
    this.checker = setInterval(this.checkTimeoutBuffer.bind(this), CHECK_TIMEOUT_INTERVAL)
  }

  checkTimeoutBuffer() {
      for(const key in this.buffers) {
          const pb = this.buffers[key]
          if(new Date() - pb.mtime > PACKET_BUFFER_TIMEOUT) {
              delete this.buffers[key]
              console.log('deleted expired buffer', key, new Date())
          }
      }
  }


  setPacketSize(size) {
    if(size >= 9200 || size < 100) {
      throw "Invalid packet size"
    }
    this.packetSize = size
  }

  onPacketData(data, rinfo) {
    try{
        const packet = msgpack.decode(data)
        //console.log(`[PACKET] ${packet.sequence} [${packet.index}/${packet.count}] ${data.length} from ${rinfo.address}:${rinfo.port}`);

        if(packet.count == 1) {
            this.onMessage(msgpack.decode(packet.payload), rinfo)
            return
        }
        const pcKey = `${rinfo.address}:${rinfo.port}:${packet.sequence%1000}`
        if(!this.buffers[pcKey]) {
            this.buffers[pcKey] = {mtime: new Date(), packets: [packet], remain: packet.count-1}
            return
        }
        const pb = this.buffers[pcKey]
        pb.packets.push(packet)
        pb.mtime = new Date()
        pb.remain --

        if(pb.remain == 0) {
            pb.packets.sort((a,b)=>a.index-b.index)
            const ds = []
            for(const p of pb.packets) {
                ds.push(p.payload)
            }
            this.onMessage(msgpack.decode(Buffer.concat(ds)), rinfo)
            delete this.buffers[pcKey]
        }
    }catch(e) {
      console.error(e)
    }
  }

  createPackets(msg) {
    const buffer = msgpack.encode(msg)
    let slices = Math.floor(buffer.byteLength / this.packetSize) + 1
    if(buffer.byteLength % this.packetSize == 0) {
      slices -= 1
    }

    const packets = []
    for(let i=0; i<slices; i++) {
      const a = i * this.packetSize
      const b = Math.min(a+this.packetSize, buffer.byteLength)
      const packet = {
        sequence: this.sequence,
        index: i,
        count: slices,
        payload: buffer.slice(a, b)
      }
      packets.push(msgpack.encode(packet))
    }
    this.sequence = (this.sequence + 1) % 100000
    return packets
  }
}
