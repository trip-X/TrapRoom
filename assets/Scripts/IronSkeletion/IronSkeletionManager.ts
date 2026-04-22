import { _decorator } from 'cc'
import { EnemyManager } from '../../Base/EnemyManager'
import { IEntity } from '../../Levels'
import { IronSkeletonStateMachine } from './IronSkeletionStateMachine'
const { ccclass, property } = _decorator

@ccclass('IronSkeletonManager')
export class IronSkeletonManager extends EnemyManager {
  async init(params: IEntity) {
    this.fsm = this.addComponent(IronSkeletonStateMachine)
    await this.fsm.init() // 异步初始化状态机（等待资源加载完成）
    super.init(params)
  }
}
