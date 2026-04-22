import { _decorator, AnimationClip, Component, Node, Animation, SpriteFrame } from 'cc'
import { FSM_PARAMS_TYPE_ENUM } from '../Enums'
import State from './State'
import { StateMachine } from './StateMachine'

const { ccclass, property } = _decorator

export abstract class SubStateMachine {
  private _currentState: State = null //当前激活的状态
  stateMachines: Map<string, State> = new Map() // 状态集合：键为状态名称，值为对应的State实例

  constructor(public fsm: StateMachine) {} // 构造函数要有状态机作为参数，在constructor的参数中添加public后，可以省略参数的定义

  // 读取访问器：读取this.currentState 为触发get
  // 获取当前激活的状态
  get currentState() {
    return this._currentState
  }

  // 写入访问器：赋值this.currentState = *** 为触发set
  // 设置新的当前状态，并自动播放该状态的动画
  set currentState(newState: State) {
    this._currentState = newState
    this._currentState.run()
  }

  // 抽象状态机运行方法
  abstract run(): void
}
