import { SubStateMachine } from '../../Base/SubStateMachine'
import { PARAMS_NAME_ENUM, SPIKE_COUNT_ENUM, SPIKE_COUNT_MAP_NUMBER_ENUM } from '../../Enums'

export default class SpikesSubStateMachine extends SubStateMachine {
  run() {
    const value = this.fsm.getParams(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT)
    this.currentState = this.stateMachines.get(SPIKE_COUNT_MAP_NUMBER_ENUM[value as number])
  }
}
