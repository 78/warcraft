let instance = null

export default class Camera {
  constructor() {
    if(instance)
      return instance
    instance = this

    this.camera = null
  }

  onShow() {
    if(this.camera && this.camera.frameCallback) {
      wx.listenFrameChange()
    }
  }

  onHide() {
    if(this.camera && this.camera.frameCallback) {
      wx.closeFrameChange()
    }
  }

  open(cb) {
    this.camera = wx.createCamera({
      x: window.innerWidth,
      y: window.innerHeight,
      devicePosition: 'front',
      flash: 'off',
      size: 'medium',
      success: () => {
        console.log('open camera succeeded')
        cb && cb()
      },
      fail: (err) => {
        console.error(err)
        cb && cb(err)
      }
    })
  }

  close() {
    if(this.camera) {
      if(this.frameCallback) {
        this.closeFrameChange()
        this.frameCallback = null
      }
      this.camera.destroy()
      this.camera = null
    }
  }

  setFrameCallback(cb) {
    if(this.camera) {
      this.frameCallback = cb
      this.camera.onCameraFrame(this.frameCallback)
      this.camera.listenFrameChange()
    }
  }
}

