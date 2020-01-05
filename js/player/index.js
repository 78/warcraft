import Sprite   from '../base/sprite'
import Bullet   from './bullet'
import DataBus  from '../databus'

const screenWidth    = window.innerWidth
const screenHeight   = window.innerHeight

// 玩家相关常量设置
const PLAYER_IMG_SRC = 'images/hero.png'
const PLAYER_WIDTH   = 80
const PLAYER_HEIGHT  = 80

let databus = new DataBus()

export default class Player extends Sprite {
  constructor() {
    super(PLAYER_IMG_SRC, PLAYER_WIDTH, PLAYER_HEIGHT)

    // 玩家默认处于屏幕底部居中位置
    this.x = screenWidth / 2 - this.width / 2
    this.y = screenHeight - this.height - 30
  }

  /**
   * 根据手指的位置设置飞机的位置
   * 保证手指处于飞机中间
   * 同时限定飞机的活动范围限制在屏幕中
   */
  setAirPosAcrossFingerPosZ(x, y) {
    let disX = x - this.width / 2
    let disY = y - this.height / 2

    if ( disX < 0 )
      disX = 0

    else if ( disX > screenWidth - this.width )
      disX = screenWidth - this.width

    if ( disY <= 0 )
      disY = 0

    else if ( disY > screenHeight - this.height )
      disY = screenHeight - this.height

    this.x = disX
    this.y = disY
  }

  /**
   * 玩家射击操作
   * 射击时机由外部决定
   */
  shoot() {
    let bullet = databus.pool.getItemByClass('bullet', Bullet)

    bullet.init(
      this.x + this.width / 2 - bullet.width / 2,
      this.y - 10,
      10
    )

    databus.bullets.push(bullet)
  }
}
