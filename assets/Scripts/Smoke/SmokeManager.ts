import { _decorator } from 'cc'
import { EntityManager } from '../../Base/EntityManager'
import { IEntity } from '../../Levels'
import { SmokeStateMachine } from './SmokeStateMachine'

const { ccclass, property } = _decorator

@ccclass('SmokeManager')
export class SmokeManager extends EntityManager {
  async init(params: IEntity) {
    this.fsm = this.addComponent(SmokeStateMachine)
    await this.fsm.init() // 异步初始化状态机（等待资源加载完成）
    super.init(params)
  }
}
