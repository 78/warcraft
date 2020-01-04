import RealInput   from './input/index'
const realInput = new RealInput()


export default class Test {
  constructor() {
    realInput.setClientKey('xx')
    realInput.openCamera()
    realInput.capture({
      inputFPS: 15,
      model: 'pose'
    })

    this.bindLoop = this.loop.bind(this)
    
    requestAnimationFrame(this.bindLoop)
    
  }

  loop() {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    realInput.update()
    realInput.render(ctx, 0, 0)
  
    requestAnimationFrame(this.bindLoop)
  }
}
