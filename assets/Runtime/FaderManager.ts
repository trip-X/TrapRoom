import { _decorator, Component, director, game, Node, RenderRoot2D } from 'cc'
import Singleton from '../Base/Singleton'
import { DEFAULT_DURATION, DrawManager } from '../Scripts/UI/DrawManager'
import { createUINode } from '../Scripts/Utils'
const { ccclass, property } = _decorator

@ccclass('FaderManager')
export default class FaderManager extends Singleton {
  static get Instance() {
    return super.GetInstance<FaderManager>()
  }

  private _fader: DrawManager = null

  get fader() {
    if (this._fader !== null) {
      return this._fader
    }

    const root = createUINode()
    root.addComponent(RenderRoot2D) // 添加渲染根组件（引擎才会画这个节点下的所有UI（Graphics、Sprite、Label 等））

    const fadeNode = createUINode()
    fadeNode.setParent(root)

    this._fader = fadeNode.addComponent(DrawManager)
    this._fader.init()

    director.addPersistRootNode(root) // 把渐变UI根节点设为全局常驻根节点，跨场景切换时不被销毁，全局可调用

    return this._fader
  }

  async fadeIn(duration: number = DEFAULT_DURATION) {
    await this.fader.fadeIn(duration)
  }

  async fadeOut(duration: number = DEFAULT_DURATION) {
    await this.fader.fadeOut(duration)
  }

  mask() {
    return this.fader.mask()
  }
}
