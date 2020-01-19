import Protocol from './protocol'

let instance = null

export default class Client extends Protocol {
  constructor() {
    if(instance)
      return instance

    super()
    instance = this
  }

  setToken(token) {
    this.token = token
  }

  setServer(server) {
    this.server = server
    if(this.server.packetSize) {
      this.packetSize = this.server.packetSize
    }
    this.__connect()
  }

  setMessageCallback(cb) {
    this.messageCallback = cb
  }

  __connect() {
    this.udp = wx.createUDPSocket()
    this.udp.bind()
    this.udp.onError(this.__onError.bind(this))
    this.udp.onMessage(this.__onWechatReceive.bind(this))
  }

  __onError(err) {
    console.error(err)
  }

  __onWechatReceive(res) {
    this.onPacketData(new Uint8Array(res.message), res.remoteInfo)
  }

  inputImage(model, imageData, timeMetrics) {
    const msg = {
      token: this.token,
      type: 'InputImage',
      model: model,
      timestamp: Date.now(),
      image: new Uint8Array(imageData),
      timeMetrics: timeMetrics
    }
    this.sendMessage(msg)
  }

  onMessage(msg, rinfo) {
    if(msg.code == 0) {
      this.messageCallback && this.messageCallback(msg)
    }
  }

  sendMessage(msg) {
    if(!this.udp) {
      return
    }
    const packets = this.createPackets(msg)
    for(const p of packets) {
      this.udp.send({
        address: this.server.ip,
        port: this.server.port,
        message: p.buffer,
        offset: 0,
        length: p.byteLength
      })
    }
  }

  destroy() {
    if(this.udp) {
      this.udp.close()
      this.udp = null
    }
  }
}
