import { DIRECTION_ORDER_ENUM, PARAMS_NAME_ENUM } from '../Enums'
import { SubStateMachine } from './SubStateMachine'

export default class DirectionSubStateMachine extends SubStateMachine {
  run() {
    const value = this.fsm.getParams(PARAMS_NAME_ENUM.DIRECTION) // 获取当前角色方向参数值
    this.currentState = this.stateMachines.get(DIRECTION_ORDER_ENUM[value as number]) // 根据方向序号获取方向的字符串名称，切换对应turnleft状态
  }
}
