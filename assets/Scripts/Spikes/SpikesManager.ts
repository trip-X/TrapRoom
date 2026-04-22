import { _decorator, Component, Sprite, UITransform } from 'cc'
import {
  ENTITY_STATE_ENUM,
  ENTITY_TYPE_ENUM,
  EVENT_ENUM,
  PARAMS_NAME_ENUM,
  SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM,
} from '../../Enums'
import { randomByLen } from '../Utils'
import { StateMachine } from '../../Base/StateMachine'
import { ISpikes } from '../../Levels'
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager'
import { SpikesStateMachine } from './SpikesStateMachine'
import EventManager from '../../Runtime/EventManager'
import DataManager from '../../Runtime/DataManager'
const { ccclass, property } = _decorator

@ccclass('SpikesManager')
export class SpikesManager extends Component {
  id: string = randomByLen(12) //12位随机id
  x: number = 0 // 当前X坐标
  y: number = 0 // 当前Y坐标
  fsm: StateMachine // 状态机实例

  private _count: number
  private _totalCount: number
  type: ENTITY_TYPE_ENUM // 实体当前类型

  get count() {
    return this._count
  }

  set count(newCount: number) {
    this._count = newCount
    if (this.fsm) {
      this.fsm.setParams(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT, newCount)
    }
  }

  get totalCount() {
    return this._totalCount
  }

  set totalCount(newCount: number) {
    this._totalCount = newCount
    if (this.fsm) {
      this.fsm.setParams(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT, newCount)
    }
  }

  async init(params: ISpikes) {
    const sprite = this.addComponent(Sprite)
    sprite.sizeMode = Sprite.SizeMode.CUSTOM // 尺寸模式为自定义

    const transform = this.getComponent(UITransform)
    transform.setContentSize(TILE_WIDTH * 4, TILE_HEIGHT * 4) // 适配瓦片地图尺寸

    this.fsm = this.addComponent(SpikesStateMachine)
    await this.fsm.init() // 异步初始化状态机（等待资源加载完成）

    this.x = params.x
    this.y = params.y
    this.type = params.type
    this.totalCount = SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM[this.type]
    this.count = params.count

    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onLoop, this)
  }

  update() {
    this.node.setPosition(this.x * TILE_WIDTH - TILE_WIDTH * 1.5, -this.y * TILE_HEIGHT + TILE_HEIGHT * 1.5) // 设置节点位置
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.onLoop)
  }

  // 地刺循环逻辑：每次玩家移动结束时调用，让地刺按照节奏伸出和收回
  onLoop() {
    if (this.count === this.totalCount) {
      this.count = 1
    } else {
      this.count++
    }

    this.onattack()
  }

  // 将地刺的伸出数量重置为0
  backZero() {
    this.count = 0
  }

  // 检测玩家是否在地刺上，如果是且地刺完全伸出，则攻击玩家导致玩家死亡
  onattack() {
    if (!DataManager.Instance.player) {
      return
    }
    const { x: playerX, y: playerY } = DataManager.Instance.player
    if (this.x === playerX && this.y === playerY && this.count === this.totalCount) {
      EventManager.Instance.emit(EVENT_ENUM.ATTACK_PLAYER, ENTITY_STATE_ENUM.DEATH)
    }
  }
}
