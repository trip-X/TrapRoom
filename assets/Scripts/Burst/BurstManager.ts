import { _decorator, UITransform } from 'cc'
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM, SHAKE_TYPE_ENUM } from '../../Enums'
import { EntityManager } from '../../Base/EntityManager'
import EventManager from '../../Runtime/EventManager'
import DataManager from '../../Runtime/DataManager'
import { BurstStateMachine } from './BurstStateMachine'
import { IEntity } from '../../Levels'
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager'

const { ccclass, property } = _decorator

@ccclass('BurstManager')
export class BurstManager extends EntityManager {
  async init(params: IEntity) {
    this.fsm = this.addComponent(BurstStateMachine)
    await this.fsm.init() // 异步初始化状态机（等待资源加载完成）
    super.init(params)

    const transform = this.getComponent(UITransform)
    transform.setContentSize(TILE_WIDTH, TILE_HEIGHT) // 适配瓦片地图尺寸

    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onBurst, this)
  }

  onDestroy() {
    super.onDestroy()
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.onBurst)
  }

  update() {
    this.node.setPosition(this.x * TILE_WIDTH, -this.y * TILE_HEIGHT) // 设置节点位置
  }

  //陷阱触发
  onBurst() {
    if (this.state === ENTITY_STATE_ENUM.DEATH || !DataManager.Instance.player) {
      return
    }
    const { x: playerX, y: playerY } = DataManager.Instance.player

    if (this.x === playerX && this.y === playerY && this.state === ENTITY_STATE_ENUM.IDLE) {
      this.state = ENTITY_STATE_ENUM.ATTACK
    } else if (this.state === ENTITY_STATE_ENUM.ATTACK) {
      this.state = ENTITY_STATE_ENUM.DEATH
      EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.BOTTOM)
      if (this.x === playerX && this.y === playerY) {
        EventManager.Instance.emit(EVENT_ENUM.ATTACK_PLAYER, ENTITY_STATE_ENUM.AIRDEATH)
      }
    }
  }
}
