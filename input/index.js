import Client from './client'
import Camera from './camera'
import Pose from './pose'
import Pool from './pool'

const b64 = require('base64-arraybuffer')


export default class RealInput {
  constructor() {
    this.camera = new Camera()
    this.__init()
  }

  __init() {
    this.busy = false
    this.lastMoveTime = new Date()
    this.inputFPS = 15
    this.model = 'pose'
    this.clientKey = null
    this.hiddenCanvas = wx.createCanvas()
    this.hiddenContext = this.hiddenCanvas.getContext('2d')
    this.posePool = new Pool(Pose)
    this.inputCanvas = wx.createCanvas()
    this.inputCanvas.width = 180
    this.inputCanvas.height = 320
  }

  setClientKey(clientKey) {
    this.clientKey = clientKey
  }

  setInputFPS(fps) {
    if(fps > 30) {
      throw "Input FPS too high."
    }
    if(fps < 1) {
      throw "Input FPS too low."
    }
    this.inputFPS = fps
  }

  setModel(model) {
    if(model != 'pose') {
      throw "model invalid"
    }
    this.model = model
  }

  render(ctx, startX=0, startY=0) {
    //ctx.drawImage(this.inputCanvas, 0, 0)
    this.posePool.render(ctx, startX, startY)
  }

  getOnePlayer() {
    return this.posePool.getOne()
  }

  update() {
    this.posePool.update()
  }

  __onInputResponse(msg) {
    if(msg.poses) {
      // translate coordinates
      for(const p of msg.poses) {
        for(const k in p.keypoints) {
          const kp = p.keypoints[k]
          kp.x = kp.x * window.innerWidth / this.inputCanvas.width
          kp.y = kp.y * window.innerHeight / this.inputCanvas.height
        }
      }
      this.posePool.addTargets(msg.poses)
    }
  }

  __onFrame(frame) {
    if(this.busy || !this.client) {
      return
    }
    const st = new Date()
    this.busy = true
    if(this.hiddenCanvas.width != frame.width || this.hiddenCanvas.height != frame.height) {
      this.hiddenCanvas.width = frame.width
      this.hiddenCanvas.height = frame.height
    }

    const bytes = new Uint8ClampedArray(frame.data)
    const img = this.hiddenContext.createImageData(frame.width, frame.height)
    img.data.set(bytes)
    this.hiddenContext.putImageData(img, 0, 0)
    this.inputCanvas.getContext('2d').drawImage(this.hiddenCanvas, 0, 0, 
      this.hiddenCanvas.width, this.hiddenCanvas.height, 0, 0,
      this.inputCanvas.width, this.inputCanvas.height)
    const b64Image = this.inputCanvas.toDataURL('image/jpeg', 0.1)
    const jpegData = b64.decode(b64Image.slice(23))
    this.client.inputImage(this.model, jpegData)

    // console.log(frame.width, frame.height, new Date() - st, 'ms')
    const delta = new Date() - this.lastMoveTime
    if(delta > 0) {
      setTimeout(() => {
        this.busy = false
        this.lastMoveTime = new Date()
      }, Math.max(0, (1000/this.inputFPS) - delta))
    }else{
      this.busy = false
      this.lastMoveTime = new Date()
    }
  }

  openCamera() {
    this.camera.open((err) => {
      if(err)
        return
      wx.setKeepScreenOn({
        keepScreenOn: true,
      })
      this.camera.setFrameCallback(this.__onFrame.bind(this))
    })
  }

  closeCamera() {
    this.camera.close()
  }

  capture(config, cb) {
    if(config.inputFPS) {
      this.setInputFPS(config.inputFPS)
    }
    if(config.model) {
      this.setModel(config.model)
    }

    if(!this.clientKey) {
      throw "Missing clientKey"
    }
    
    const versionInfo = wx.getSystemInfoSync()
    const data = {
      version: versionInfo,
      playerId: Math.random().toString(),
      clientKey: this.clientKey,
      inputFPS: this.inputFPS,
      model: this.model
    }
    wx.request({
      url: 'https://realinput.keep.fm/v1/requestToken',
      method: 'POST',
      data: data,
      success: (res) => {
        if(res.statusCode == 200) {
          if(res.data.code == 0) {
            this.client = new Client()
            this.client.setToken(res.data.token)
            if(res.data.suggestFPS) {
              this.setInputFPS(res.data.suggestFPS)
            }
            if(res.data.packetSize) {
              this.client.setPacketSize(res.data.packetSize)
            }
            this.client.setMessageCallback(this.__onInputResponse.bind(this))
            this.client.setServer(res.data.server)
            cb && cb()
          }else{
            cb && cb(res.data.msg)
          }
        }else{
          cb && cb(res.data.toString())
        }
      },
      fail: (err) => {
        console.error(err)
        cb && cb(err)
      }
    })
  }
}

