import { _decorator } from 'cc'
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from '../../Enums'
import { EntityManager } from '../../Base/EntityManager'
import { WoodenSkeletonStateMachine } from './WoodenSkeletonStateMachine'
import EventManager from '../../Runtime/EventManager'
import DataManager from '../../Runtime/DataManager'
import { IEntity } from '../../Levels'
import { EnemyManager } from '../../Base/EnemyManager'

const { ccclass, property } = _decorator

@ccclass('WoodenSkeletonManager')
export class WoodenSkeletonManager extends EnemyManager {
  async init(params: IEntity) {
    this.fsm = this.addComponent(WoodenSkeletonStateMachine)
    await this.fsm.init() // 异步初始化状态机（等待资源加载完成）
    super.init(params)

    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onAttack, this)
  }

  onDestroy() {
    super.onDestroy()
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.onAttack)
  }

  // 攻击判定
  onAttack() {
    if (this.state === ENTITY_STATE_ENUM.DEATH || !DataManager.Instance.player) {
      return
    }
    const { x: playerX, y: playerY, state: playerState } = DataManager.Instance.player
    if (
      ((this.x === playerX && Math.abs(this.y - playerY) <= 1) ||
        (this.y === playerY && Math.abs(this.x - playerX) <= 1)) &&
      playerState !== ENTITY_STATE_ENUM.DEATH &&
      playerState !== ENTITY_STATE_ENUM.AIRDEATH
    ) {
      this.state = ENTITY_STATE_ENUM.ATTACK
      EventManager.Instance.emit(EVENT_ENUM.ATTACK_PLAYER, ENTITY_STATE_ENUM.DEATH)
    } else {
      this.state = ENTITY_STATE_ENUM.IDLE
    }
  }
}
