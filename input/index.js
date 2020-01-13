import Client from './client'
import Camera from './camera'
import Pose from './pose'
import Pool from './pool'

const b64 = require('./3rdparty/base64')

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
    this.inputCanvas.width = 181
    this.inputCanvas.height = 321
    this.inputContext = this.inputCanvas.getContext('2d')
    this.movementCanvas = wx.createCanvas()
    this.movementCanvas.width = 18
    this.movementCanvas.height = 32
    this.movementContext = this.movementCanvas.getContext('2d')
    this.imageType = 'image/jpeg'
    this.imageQuality = 0.2
    this.enableMovementDetection = true
    this.movementThreshold = 10
    this.movementSensitiveness = 50
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

  updateConfig(config) {
    if(config.inFPS && this.inputFPS != config.inFPS) {
      this.setInputFPS(config.inFPS)
    }
    if(config.pS && this.client.packetSize != config.pS) {
      this.client.setPacketSize(config.pS)
    }
    if(config.inT && this.imageType != config.inT) {
      this.imageType = config.inT
    }
    if(config.inQ && this.imageQuality != config.inQ) {
      this.imageQuality = config.inQ
    } 
    if(config.inW && this.inputCanvas.width != config.inW) {
      this.inputCanvas.width = config.inW
    }
    if(config.inH && this.inputCanvas.height != config.inH) {
      this.inputCanvas.height = config.inH
    }
    if(config.mvOn && this.enableMovementDetection != config.mvOn) {
      this.enableMovementDetection = config.mvOn
    }
    if(config.mvOn) {
      if(config.mvW && this.movementCanvas.width != config.mvW) {
        this.movementCanvas.width = config.mvW
      }
      if(config.mvH && this.movementCanvas.height != config.mvH) {
        this.movementCanvas.height = config.mvH
      }
      if(config.mvS && this.movementSensitiveness != config.mvS) {
        this.movementSensitiveness = config.mvS
      }
      if(config.mvC && this.movementThreshold != config.mvC) {
        this.movementThreshold = config.mvC
      }
    }
  }

  render(ctx, startX=0, startY=0) {
    // 显示摄像头影像，用于调试
    // ctx.drawImage(this.inputCanvas, 0, 0)
    // ctx.drawImage(this.movementCanvas, 0, 0, this.movementCanvas.width, this.movementCanvas.height,
    //  0,0, window.innerWidth, window.innerHeight)
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
    if(msg.config) {
      this.updateConfig(msg.config)
    }
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

    // 运动检测
    if(this.enableMovementDetection) {
      this.movementContext.drawImage(this.hiddenCanvas, 0, 0, 
        this.hiddenCanvas.width, this.hiddenCanvas.height, 0, 0,
        this.movementCanvas.width, this.movementCanvas.height)
      if(this.lastInputData) {
        const inputImage = this.movementContext.getImageData(0, 0, 
          this.movementCanvas.width, this.movementCanvas.height)
        const inputData = inputImage.data
        let diffs = 0
        for(let i=0; i<inputData.byteLength; i+=4) {
          const v = Math.floor((inputData[i] + inputData[i+1] + inputData[i+2])/3)
          inputData[i] = inputData[i+1] = inputData[i+2] = v
          const diff = Math.abs(this.lastInputData[i]-v)
          if(diff > 50) {
            diffs += diff
          }
        }
        this.movementContext.putImageData(inputImage, 0, 0)
        this.lastInputData = inputData
        if(diffs < 10) {
          // no movement
          this.busy = false
          return
        }
      }else{
        this.lastInputData = this.movementContext.getImageData(0, 0, 
          this.movementCanvas.width, this.movementCanvas.height).data
      }
    }

    // 压缩分辨率，摄像头分辨率到识别分辨率的转换
    this.inputContext.drawImage(this.hiddenCanvas, 0, 0, 
      this.hiddenCanvas.width, this.hiddenCanvas.height, 0, 0,
      this.inputCanvas.width, this.inputCanvas.height)
  
    const b64Image = this.inputCanvas.toDataURL(this.imageType, this.imageQuality)
    const jpegData = b64.decode(b64Image.slice(13+this.imageType.length))
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
            if(res.data.config) {
              this.updateConfig(res.data.config)
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

