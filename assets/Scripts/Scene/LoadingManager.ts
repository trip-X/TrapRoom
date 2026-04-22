import { _decorator, Component, director, Node, ProgressBar, resources } from 'cc'
import { CONTROLLER_ENUM, EVENT_ENUM, SCENE_ENUM } from '../../Enums'
const { ccclass, property } = _decorator

@ccclass('LoadingManager')
export class LoadingManager extends Component {
  // property装饰器：标记该属性为可在编辑器中绑定的组件属性，类型为ProgressBar（进度条组件）
  // 作用是关联场景中的进度条节点，用于展示资源加载进度
  @property(ProgressBar)
  bar: ProgressBar = null

  onLoad() {
    resources.preloadDir(
      'texture/crtl',
      (cur, total) => {
        this.bar.progress = cur / total
      },
      () => {
        director.loadScene(SCENE_ENUM.START)
      },
    )
  }
}
