import Player     from './player/index'
import Enemy      from './npc/enemy'
import BackGround from './runtime/background'
import GameInfo   from './runtime/gameinfo'
import Music      from './runtime/music'
import DataBus    from './databus'
import RealInput   from '../input/index'

const ctx   = canvas.getContext('2d')
const databus = new DataBus()

/**
 * 游戏主函数
 */
export default class Game {
  constructor() {
    this.restart()

    this.realInput = new RealInput()
    this.realInput.setClientKey('xxcRTlCPhDsd9TBL')
    this.realInput.openCamera()
    this.realInput.capture({
      model: 'pose'
    })

    this.bindLoop     = this.loop.bind(this)
    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  restart() {
    databus.reset()

    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )

    this.bg       = new BackGround(ctx)
    this.player   = new Player(ctx)
    this.player2   = new Player(ctx)
    this.gameinfo = new GameInfo()
    this.music    = new Music()

    this.hasEventBind = false
  }

  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate() {
    if ( databus.frame % 30 === 0 ) {
      let enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6)
      databus.enemys.push(enemy)
    }
  }

  // 全局碰撞检测
  collisionDetection() {
    let that = this

    databus.bullets.forEach((bullet) => {
      for ( let i = 0, il = databus.enemys.length; i < il;i++ ) {
        let enemy = databus.enemys[i]

        if ( !enemy.isPlaying && enemy.isCollideWith(bullet) ) {
          enemy.playAnimation()
          that.music.playExplosion()

          bullet.visible = false
          databus.score  += 1

          break
        }
      }
    })

    for ( let i = 0, il = databus.enemys.length; i < il;i++ ) {
      let enemy = databus.enemys[i]

      if ( this.player.isCollideWith(enemy) ) {
        databus.gameOver = true

        break
      }
      if ( this.player2.isCollideWith(enemy) ) {
        databus.gameOver = true

        break
      }
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  touchEventHandler(e) {
     e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    let area = this.gameinfo.btnArea

    if (   x >= area.startX
        && x <= area.endX
        && y >= area.startY
        && y <= area.endY  )
      this.restart()
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)
    this.realInput.render(ctx, 0, 0)

    databus.bullets
          .concat(databus.enemys)
          .forEach((item) => {
              item.drawToCanvas(ctx)
            })

    this.player.drawToCanvas(ctx)
    this.player2.drawToCanvas(ctx)

    databus.animations.forEach((ani) => {
      if ( ani.isPlaying ) {
        ani.aniRender(ctx)
      }
    })

    this.gameinfo.renderGameScore(ctx, databus.score)

    // 游戏结束停止帧循环
    if ( databus.gameOver ) {
      this.gameinfo.renderGameOver(ctx, databus.score)

      if ( !this.hasEventBind ) {
        this.hasEventBind = true
        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
      }
    }
  }

  // 游戏逻辑更新主函数
  update() {
    const one = this.realInput.getFirstPlayer()
    this.realInput.update()

    if ( databus.gameOver ) {
      if(one && one.checkPose('HandsUp')) {
        this.restart()
        return
      }
      return;
    }

    this.bg.update()

    databus.bullets
           .concat(databus.enemys)
           .forEach((item) => {
              item.update()
            })

    this.enemyGenerate()

    this.collisionDetection()

    if ( databus.frame % 30 === 0 ) {
      this.player.shoot()
      this.music.playShoot()
    }
    if( databus.frame % 30 === 15 ) {
      this.player2.shoot()
      this.music.playShoot()
    }

    if(one) {
      const leftWrist = one.keypoints.leftWrist
      const rightWrist = one.keypoints.rightWrist
      if(leftWrist) {
        this.player.setAirPosAcrossFingerPosZ(leftWrist.x, leftWrist.y)
      }
      if(rightWrist) {
        this.player2.setAirPosAcrossFingerPosZ(rightWrist.x, rightWrist.y)
      }
    }
  }

  // 实现游戏帧循环
  loop() {
    const st = new Date()
    databus.frame++

    this.update()
    this.render()

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }
}
