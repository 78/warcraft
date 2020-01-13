/*
 * 这是一个用来测试 RealInput，在手机屏幕显示输入姿态的示例
 * xiaoxia@lizhiweike.com
 */

import RealInput from './index'

// 这里Test对应你的游戏类名
export default class Test {
  constructor() {
    // 在构造函数创建RealInput实例
    this.realInput = new RealInput()
    // 每个小游戏产品有独立的ClientKey
    // 不同的ClientKey在服务器端可以随时调整输入参数，例如输入像素、FPS和灵敏度等
    this.realInput.setClientKey('test')
    // 打开相机，默认是前置摄像头
    this.realInput.openCamera()
    // 开始捕捉用户姿态
    this.realInput.capture({
      model: 'pose'
    })

    // 游戏主循环
    this.bindLoop = this.loop.bind(this)
    requestAnimationFrame(this.bindLoop)
  }

  loop() {
    // 画一个白色背景
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // 
    this.realInput.update()
    this.realInput.render(ctx, 0, 0)
  
    requestAnimationFrame(this.bindLoop)
  }
}
