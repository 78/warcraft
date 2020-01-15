let instance = null

export default class Camera {
  constructor() {
    if(instance)
      return instance
    instance = this

    this.camera = null
  }

  onShow(res) {
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
      size: 'small',
      success: () => {
        console.log('open camera succeeded')
        wx.setKeepScreenOn({
          keepScreenOn: true
        })
        wx.onShow(this.onShow)
        wx.onHide(this.onHide)
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
      this.offShow(this.onShow)
      this.offHide(this.onHide)
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

