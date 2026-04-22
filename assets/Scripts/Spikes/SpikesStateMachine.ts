import { _decorator, Animation, SpriteFrame } from 'cc'
import { ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, PARAMS_NAME_ENUM, SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM } from '../../Enums'
import { getInitParamsNumber, getInitParamsTrigger, StateMachine } from '../../Base/StateMachine'
import SpikesOneSubStateMachine from './SpikesOneSubStateMachine'
import SpikesTwoSubStateMachine from './SpikesTwoSubStateMachine'
import SpikesThreeSubStateMachine from './SpikesThreeSubStateMachine'
import SpikesFourSubStateMachine from './SpikesFourSubStateMachine'
import { SpikesManager } from './SpikesManager'

const { ccclass, property } = _decorator

type ParamsValueType = boolean | number // 定义状态机变量的类型：支持布尔值（触发器）或数字

@ccclass('SpikesStateMachine')
export class SpikesStateMachine extends StateMachine {
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
    this.params.set(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT, getInitParamsNumber())
    this.params.set(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT, getInitParamsNumber())
  }

  // 初始化状态集合：创建所有状态实例并加入stateMachines
  initStateMachines() {
    this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_ONE, new SpikesOneSubStateMachine(this))
    this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_TWO, new SpikesTwoSubStateMachine(this))
    this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_THREE, new SpikesThreeSubStateMachine(this))
    this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_FOUR, new SpikesFourSubStateMachine(this))
  }

  // 初始化动画事件:监听动画播放完成事件
  initAnimationEvent() {
    // 监听Animation组件的FINISHED事件（动画播放完成时触发）
    this.animationComponent.on(Animation.EventType.FINISHED, () => {
      const name = this.animationComponent.defaultClip.name
      const value = this.getParams(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT)
      if (
        (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_ONE && name.includes('spikesone/two')) ||
        (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_TWO && name.includes('spiketwo/three')) ||
        (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_THREE && name.includes('spikethree/four')) ||
        (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_FOUR && name.includes('spiketh/four/five'))
      ) {
        this.node.getComponent(SpikesManager).backZero()
      }
    })
  }

  // 状态机核心运行逻辑：根据参数值判断并切换状态
  run() {
    const value = this.getParams(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT)
    switch (
      this.currentState // 用读取访问器读取当前状态State示例，以作为后续Switch后续判断变量
    ) {
      case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE):
      case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_TWO):
      case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_THREE):
      case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_FOUR):
        if (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_ONE) {
          this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE)
        } else if (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_TWO) {
          this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_TWO)
        } else if (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_THREE) {
          this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_THREE)
        } else if (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_FOUR) {
          this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_FOUR)
        } else {
          this.currentState = this.currentState
        }
        break
      default:
        this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE)
        break
    }
  }
}
