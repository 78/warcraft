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
    this.inputContext = this.inputCanvas.getContext('2d')
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
    // 显示摄像头影像，用于调试
    // ctx.drawImage(this.inputCanvas, 0, 0)
    this.posePool.render(ctx, startX, startY)
  }

  getFirstPlayer() {
    return this.posePool.getFirst()
  }

  update() {
    this.posePool.update()
  }

  // 从服务器返回动作信息
  __onInputResponse(msg) {
    if(msg.poses) {
      // translate coordinates to this device
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

  // 从摄像头获得输入图像
  __onFrame(frame) {
    if(this.busy || !this.client) {
      return
    }
    this.busy = true
    const st = new Date()

    // hiddenCanvas的大小等于摄像头图像大小，inputCanvas的大小等于要识别的图像大小
    if(this.hiddenCanvas.width != frame.width || this.hiddenCanvas.height != frame.height) {
      this.hiddenCanvas.width = frame.width
      this.hiddenCanvas.height = frame.height
    }

    const bytes = new Uint8ClampedArray(frame.data)
    const img = this.hiddenContext.createImageData(frame.width, frame.height)
    img.data.set(bytes)
    this.hiddenContext.putImageData(img, 0, 0)
    
    // 压缩分辨率，摄像头分辨率到识别分辨率的转换
    this.inputContext.drawImage(this.hiddenCanvas, 0, 0, 
      this.hiddenCanvas.width, this.hiddenCanvas.height, 0, 0,
      this.inputCanvas.width, this.inputCanvas.height)
      
    // 制作灰度图片，试图减少图片体积
    /* 
    const inputData = this.inputContext.getImageData(0, 0, this.inputCanvas.width, this.inputCanvas.height)
    const data = inputData.data
    for(let i = 0; i < data.byteLength; i += 4) {
      const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
      //const brightness = Math.floor((data[i] + data[i+1] + data[i+2])/3)
      // red
      data[i] = brightness;
      // green
      data[i + 1] = brightness;
      // blue
      data[i + 2] = brightness;
    }
    // overwrite original image
    this.inputContext.putImageData(inputData, 0, 0)
    */
  
    const b64Image = this.inputCanvas.toDataURL('image/jpeg', 0.1)
    const jpegData = b64.decode(b64Image.slice(23))
    this.client.inputImage(this.model, jpegData)

    // 上述操作大概6ms完成
    //console.log(frame.width, frame.height, new Date() - st, 'ms', 'size', jpegData.byteLength)
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

  // 开始识别输入动作
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

