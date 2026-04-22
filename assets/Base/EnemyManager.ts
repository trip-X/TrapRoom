import { _decorator } from 'cc'
import { IEntity } from '../Levels'
import { EntityManager } from './EntityManager'
import { WoodenSkeletonStateMachine } from '../Scripts/WoodenSkeleton/WoodenSkeletonStateMachine'
import EventManager from '../Runtime/EventManager'
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, EVENT_ENUM } from '../Enums'
import DataManager from '../Runtime/DataManager'

const { ccclass, property } = _decorator

@ccclass('EnemyManager')
export class EnemyManager extends EntityManager {
  async init(params: IEntity) {
    super.init(params)

    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onChangeDirection, this)
    EventManager.Instance.on(EVENT_ENUM.PLAYER_BORN, this.onChangeDirection, this)
    EventManager.Instance.on(EVENT_ENUM.ATTACK_EMEMY, this.onDead, this)

    this.onChangeDirection(true)
  }

  onDestroy() {
    super.onDestroy()
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.onChangeDirection)
    EventManager.Instance.off(EVENT_ENUM.PLAYER_BORN, this.onChangeDirection)
    EventManager.Instance.off(EVENT_ENUM.ATTACK_EMEMY, this.onDead)
  }

  // 转向判定
  onChangeDirection(isInit: boolean = false) {
    if (this.state === ENTITY_STATE_ENUM.DEATH || !DataManager.Instance.player) {
      return
    }

    const { x: playerX, y: playerY } = DataManager.Instance.player
    const disX = Math.abs(this.x - playerX)
    const disY = Math.abs(this.y - playerY)

    if (disX === disY && !isInit) {
      return
    }

    if (playerX >= this.x && playerY <= this.y) {
      this.direction = disY > disX ? DIRECTION_ENUM.TOP : DIRECTION_ENUM.RIGHT
    } else if (playerX <= this.x && playerY <= this.y) {
      this.direction = disY > disX ? DIRECTION_ENUM.TOP : DIRECTION_ENUM.LEFT
    } else if (playerX >= this.x && playerY >= this.y) {
      this.direction = disY > disX ? DIRECTION_ENUM.BOTTOM : DIRECTION_ENUM.RIGHT
    } else if (playerX <= this.x && playerY >= this.y) {
      this.direction = disY > disX ? DIRECTION_ENUM.BOTTOM : DIRECTION_ENUM.LEFT
    }
  }

  // 死亡判定
  onDead(id: string) {
    if (this.state === ENTITY_STATE_ENUM.DEATH) {
      return
    }

    if (this.id === id) {
      this.state = ENTITY_STATE_ENUM.DEATH
    }
  }
}
