import { _decorator, AnimationClip, Component, Node, Animation, SpriteFrame } from 'cc'
import { ENTITY_STATE_ENUM, PARAMS_NAME_ENUM } from '../../Enums'
import { getInitParamsNumber, getInitParamsTrigger, StateMachine } from '../../Base/StateMachine'
import IdleSubStateMachine from './IdleSubStateMachine'
import TurnLeftSubStateMachine from './TurnLeftSubStateMachine'
import { EntityManager } from '../../Base/EntityManager'
import BlockFrontSubStateMachine from './BlockFrontSubStateMachine'
import BlockTurnLeftSubStateMachine from './BlockTurnLeftSubStateMachine'
import TurnRightSubStateMachine from './TurnRightSubStateMachine'
import BlockBackSubStateMachine from './BlockBackSubStateMachine'
import BlockLeftSubStateMachine from './BlockLeftSubStateMachine'
import BlockRightSubStateMachine from './BlockRightSubStateMachine'
import BlockTurnRightSubStateMachine from './BlockTurnRightSubStateMachine'
import DeathSubStateMachine from './DeathSubStateMachine'
import AttackSubStateMachine from './AttackSubStateMachine'
const { ccclass, property } = _decorator

type ParamsValueType = boolean | number // 定义状态机变量的类型：支持布尔值（触发器）或数字

@ccclass('PlayerStateMachine')
export class PlayerStateMachine extends StateMachine {
  // 异步初始化方法：初始化动画组件、参数、状态，并等待所有资源加载完成
  async init() {
    this.animationComponent = this.addComponent(Animation)
    this.initParams() // 初始化所有状态实例
    this.initStateMachines() // 初始化所有状态实例
    this.initAnimationEvent()
    await Promise.all(this.waitingList) // 等待waitingList中所有资源加载完成（并行加载，效率最高）
  }

  // 初始化状态机参数：注册所有需要的参数并设置初始值
  initParams() {
    this.params.set(PARAMS_NAME_ENUM.IDLE, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.ATTACK, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.TURNLEFT, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.TURNRIGHT, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.BLOCKFRONT, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.BLOCKBACK, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.BLOCKLEFT, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.BLOCKRIGHT, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.BLOCKTURNLEFT, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.BLOCKTURNRIGHT, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.DEATH, getInitParamsTrigger())
    // this.params.set(PARAMS_NAME_ENUM.AIRDEATH, getInitParamsTrigger())
    this.params.set(PARAMS_NAME_ENUM.DIRECTION, getInitParamsNumber()) // 标记当前角色方向
  }

  // 初始化状态集合：创建所有状态实例并加入stateMachines
  initStateMachines() {
    this.stateMachines.set(PARAMS_NAME_ENUM.IDLE, new IdleSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.TURNLEFT, new TurnLeftSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.TURNRIGHT, new TurnRightSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKFRONT, new BlockFrontSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKBACK, new BlockBackSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKLEFT, new BlockLeftSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKRIGHT, new BlockRightSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKTURNLEFT, new BlockTurnLeftSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKTURNRIGHT, new BlockTurnRightSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.ATTACK, new AttackSubStateMachine(this))
    this.stateMachines.set(PARAMS_NAME_ENUM.DEATH, new DeathSubStateMachine(this))
    // this.stateMachines.set(PARAMS_NAME_ENUM.AIRDEATH, new AirDeathSubStateMachine(this))
  }

  // 初始化动画事件:监听动画播放完成事件
  initAnimationEvent() {
    // 监听Animation组件的FINISHED事件（动画播放完成时触发）
    this.animationComponent.on(Animation.EventType.FINISHED, () => {
      const name = this.animationComponent.defaultClip.name // 获取当前播放的动画剪辑名称
      const whiteList = ['turn', 'block', 'attack'] // 白名单：包含'turn'的动画（如turnleft）播放完成后切回IDLE
      // 判断当前动画是否在白名单中,some用法：遍历数组，只要有任意一个元素满足条件，就返回 true；全部不满足，返回 false
      if (whiteList.some(v => name.includes(v))) {
        this.node.getComponent(EntityManager).state = ENTITY_STATE_ENUM.IDLE // 触发IDLE状态（切回待机动画）
      }
    })
  }

  // 状态机核心运行逻辑：根据参数值判断并切换状态
  run() {
    switch (
      this.currentState // 用读取访问器读取当前状态State示例，以作为后续Switch后续判断变量
    ) {
      case this.stateMachines.get(PARAMS_NAME_ENUM.IDLE):
      case this.stateMachines.get(PARAMS_NAME_ENUM.ATTACK):
      case this.stateMachines.get(PARAMS_NAME_ENUM.TURNLEFT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.TURNRIGHT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKFRONT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKBACK):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKLEFT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKRIGHT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.DEATH):
        // case this.stateMachines.get(PARAMS_NAME_ENUM.AIRDEATH):

        if (this.params.get(PARAMS_NAME_ENUM.TURNLEFT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.TURNLEFT)
        } else if (this.params.get(PARAMS_NAME_ENUM.TURNRIGHT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.TURNRIGHT)
        } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKFRONT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKFRONT)
        } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKBACK).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKBACK)
        } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKLEFT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKLEFT)
        } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKRIGHT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKRIGHT)
        } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT)
        } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT)
        } else if (this.params.get(PARAMS_NAME_ENUM.IDLE).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE)
        } else if (this.params.get(PARAMS_NAME_ENUM.DEATH).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.DEATH)
        } else if (this.params.get(PARAMS_NAME_ENUM.ATTACK).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.ATTACK)
        }
        // else if (this.params.get(PARAMS_NAME_ENUM.AIRDEATH).value) {
        //   this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.AIRDEATH)
        // }
        else {
          this.currentState = this.currentState
        }
        break
      default:
        this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE)
        break
    }
  }
}
