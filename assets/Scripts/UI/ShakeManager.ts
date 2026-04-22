import { _decorator, Component, game, Node } from 'cc'
import EventManager from '../../Runtime/EventManager'
import { EVENT_ENUM, SHAKE_TYPE_ENUM } from '../../Enums'
const { ccclass } = _decorator

@ccclass('ShakeManager')
export class ShakeManager extends Component {
  private isShake = false // 震动状态标志
  private type: SHAKE_TYPE_ENUM // 震动类型
  private oldTime: number = 0 // 震动开始时间
  private oldPos: { x: number; y: number } = { x: 0, y: 0 } // 震动开始位置

  onLoad() {
    EventManager.Instance.on(EVENT_ENUM.SCREEN_SHAKE, this.onShake, this)
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.SCREEN_SHAKE, this.onShake)
  }

  // 停止震动
  stop() {
    this.isShake = false
  }

  // 开始震动
  onShake(type: SHAKE_TYPE_ENUM) {
    if (this.isShake) {
      return
    }
    this.type = type
    this.oldTime = game.totalTime
    this.isShake = true
    this.oldPos.x = this.node.position.x
    this.oldPos.y = this.node.position.y
  }

  update() {
    if (this.isShake) {
      const duration = 300 // 震动总时长
      const amount = 3 // 震动幅度
      const frequency = 4 // 震动频率
      const curSecond = (game.totalTime - this.oldTime) / 1000
      const totalSecond = duration / 1000
      const offset = amount * Math.sin(frequency * Math.PI * curSecond)

      if (this.type === SHAKE_TYPE_ENUM.TOP) {
        this.node.setPosition(this.oldPos.x, this.oldPos.y - offset)
      } else if (this.type === SHAKE_TYPE_ENUM.BOTTOM) {
        this.node.setPosition(this.oldPos.x, this.oldPos.y + offset)
      } else if (this.type === SHAKE_TYPE_ENUM.LEFT) {
        this.node.setPosition(this.oldPos.x - offset, this.oldPos.y)
      } else if (this.type === SHAKE_TYPE_ENUM.RIGHT) {
        this.node.setPosition(this.oldPos.x + offset, this.oldPos.y)
      }

      if (curSecond > totalSecond) {
        this.isShake = false
        this.node.setPosition(this.oldPos.x, this.oldPos.y)
      }
    }
  }
}
