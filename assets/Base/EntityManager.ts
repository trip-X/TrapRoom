import { _decorator, Component, Sprite, UITransform } from 'cc'
import { IEntity } from '../Levels'
import { DIRECTION_ENUM, DIRECTION_ORDER_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, PARAMS_NAME_ENUM } from '../Enums'
import { TILE_HEIGHT, TILE_WIDTH } from '../Scripts/Tile/TileManager'
import { StateMachine } from './StateMachine'
import { randomByLen } from '../Scripts/Utils'
const { ccclass, property } = _decorator

@ccclass('EntityManager')
export class EntityManager extends Component {
  id: string = randomByLen(12) //12位随机id
  x: number = 0 // 当前X坐标
  y: number = 0 // 当前Y坐标
  fsm: StateMachine // 状态机实例

  type: ENTITY_TYPE_ENUM // 实体类型
  private _direction: DIRECTION_ENUM // 实体当前方向
  private _state: ENTITY_STATE_ENUM // 实体当前状态

  get direction() {
    return this._direction
  }

  set direction(newDirection: DIRECTION_ENUM) {
    this._direction = newDirection
    this.fsm.setParams(PARAMS_NAME_ENUM.DIRECTION, DIRECTION_ORDER_ENUM[this._direction])
  }

  get state() {
    return this._state
  }

  set state(newState: ENTITY_STATE_ENUM) {
    this._state = newState
    this.fsm.setParams(this._state, true)
  }

  async init(params: IEntity) {
    const sprite = this.addComponent(Sprite)
    sprite.sizeMode = Sprite.SizeMode.CUSTOM // 尺寸模式为自定义

    const transform = this.getComponent(UITransform)
    transform.setContentSize(TILE_WIDTH * 4, TILE_HEIGHT * 4) // 适配瓦片地图尺寸

    this.x = params.x
    this.y = params.y
    this.type = params.type
    this.direction = params.direction
    this.state = params.state
  }

  update() {
    this.node.setPosition(this.x * TILE_WIDTH - TILE_WIDTH * 1.5, -this.y * TILE_HEIGHT + TILE_HEIGHT * 1.5) // 设置节点位置
  }

  onDestroy() {}
}
