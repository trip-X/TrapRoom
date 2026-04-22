import { _decorator } from 'cc'
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from '../../Enums'
import { EntityManager } from '../../Base/EntityManager'
import EventManager from '../../Runtime/EventManager'
import { DoorStateMachine } from './DoorStateMachine'
import DataManager from '../../Runtime/DataManager'
import { IEntity } from '../../Levels'

const { ccclass, property } = _decorator

@ccclass('DoorManager')
export class DoorManager extends EntityManager {
  async init(params: IEntity) {
    this.fsm = this.addComponent(DoorStateMachine)
    await this.fsm.init() // 异步初始化状态机（等待资源加载完成）
    super.init(params)

    EventManager.Instance.on(EVENT_ENUM.DOOR_OPEN, this.onOpen, this)
  }

  onDestroy() {
    super.onDestroy()
    EventManager.Instance.off(EVENT_ENUM.DOOR_OPEN, this.onOpen)
  }

  onOpen() {
    if (
      DataManager.Instance.enemies.every(enemy => enemy.state === ENTITY_STATE_ENUM.DEATH) &&
      this.state !== ENTITY_STATE_ENUM.DEATH
    ) {
      this.state = ENTITY_STATE_ENUM.DEATH
    }
  }
}
