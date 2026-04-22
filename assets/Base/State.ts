import { animation, AnimationClip, Sprite, SpriteFrame } from 'cc'
import ResourceManager from '../Runtime/ResourceManager'
import { StateMachine } from './StateMachine'
import { sortSpriteFrame } from '../Scripts/Utils'

export const ANIMATION_SPEED = 1 / 8

/****
 * 1.需要知道AnimationClip
 * 2.需要播放动画的能力Animation
 */
export default class State {
  private animationClip: AnimationClip // 当前状态对应的动画剪辑
  // 构造函数：初始化状态实例
  constructor(
    private fsm: StateMachine, // 所属的状态机实例
    private path: string, // 动画精灵帧资源的加载路径
    private wrapMode: AnimationClip.WrapMode = AnimationClip.WrapMode.Normal, // 动画循环模式
    private speed: number = ANIMATION_SPEED, // 动画播放速度
    private events: any[] = [], // 动画事件数组
  ) {
    this.init() // 初始化动画剪辑和资源加载
  }

  // 这部分主要是加载资源以及制作动画切片，需要执行一次，因此放在初始化里
  async init() {
    const promise = ResourceManager.Instance.loadDir(this.path) // 调用资源管理器加载指定路径下的所有精灵帧资源
    this.fsm.waitingList.push(promise) // 将资源加载Promise加入状态机的等待列表，确保状态机初始化时等待所有资源加载完成
    const spriteFrames = await promise // 等待资源加载完成以获取精灵帧数组
    this.animationClip = new AnimationClip() // 实例化动画剪辑对象

    const track = new animation.ObjectTrack() // 创建一个对象轨道
    track.path = new animation.TrackPath().toComponent(Sprite).toProperty('spriteFrame') // 指定轨道路径：目标为当前节点的Sprite组件的spriteFrame属性（即控制精灵帧的切换）
    const frames: Array<[number, SpriteFrame]> = sortSpriteFrame(spriteFrames).map((item, index) => [
      this.speed * index,
      item,
    ]) // 排序精灵帧数组，以确保资源按顺序播放，遍历精灵帧数组，为每帧计算对应播放时间，生成动画所需的 [时间点，精灵帧] 关键帧数组
    track.channel.curve.assignSorted(frames) // 将关键帧分配到轨道的曲线中
    this.animationClip.addTrack(track) // 将轨道添加到动画剪辑以应用
    this.animationClip.name = this.path // 设置路径为动画切片名
    this.animationClip.duration = frames.length * ANIMATION_SPEED // 重新计算动画剪辑总时长
    this.animationClip.wrapMode = this.wrapMode // 设置动画循环模式

    for (const event of this.events) {
      this.animationClip.events.push(event)
    }
  }

  // 切换状态机的动画
  run() {
    // 防止同状态重复播放
    if (this.fsm.animationComponent?.defaultClip?.name === this.animationClip.name) {
      return
    }
    this.fsm.animationComponent.defaultClip = this.animationClip // 将当前动画剪辑设为Animation组件的默认剪辑
    this.fsm.animationComponent.play() // 播放动画
  }
}
