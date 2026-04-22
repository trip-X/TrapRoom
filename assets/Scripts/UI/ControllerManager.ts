import { _decorator, Component, Node } from 'cc'
import EventManager from '../../Runtime/EventManager'
import { CONTROLLER_ENUM, EVENT_ENUM } from '../../Enums'
const { ccclass, property } = _decorator

@ccclass('ControllerManager')
export class ControllerManager extends Component {
  handleCtrl(evt: Event, type: string) {
    EventManager.Instance.emit(EVENT_ENUM.PLAYER_CTRL, type as CONTROLLER_ENUM)
  }
}
