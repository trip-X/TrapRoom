import { _decorator, Component, director, Node } from 'cc'
import EventManager from '../../Runtime/EventManager'
import { CONTROLLER_ENUM, EVENT_ENUM, SCENE_ENUM } from '../../Enums'
import FaderManager from '../../Runtime/FaderManager'
const { ccclass, property } = _decorator

@ccclass('StartManager')
export class StartManager extends Component {
  onLoad() {
    FaderManager.Instance.fadeOut(1000)
    this.node.once(Node.EventType.TOUCH_END, this.handleStart, this)
  }

  async handleStart() {
    await FaderManager.Instance.fadeIn(300)
    director.loadScene(SCENE_ENUM.BATTLE)
  }
}
