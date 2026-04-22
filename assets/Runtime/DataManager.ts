import { EnemyManager } from '../Base/EnemyManager'
import Singleton from '../Base/Singleton'
import { Ilevel, ITile } from '../Levels'
import { BurstManager } from '../Scripts/Burst/BurstManager'
import { DoorManager } from '../Scripts/Door/DoorManager'
import { PlayerManager } from '../Scripts/Player/PlayerManager'
import { SmokeManager } from '../Scripts/Smoke/SmokeManager'
import { SpikesManager } from '../Scripts/Spikes/SpikesManager'
import { TileManager } from '../Scripts/Tile/TileManager'

export type IRecord = Omit<Ilevel, 'mapInfo'>

export default class DataManager extends Singleton {
  // 静态getter语法糖：简化单例实例的获取
  static get Instance() {
    return super.GetInstance<DataManager>()
  }

  mapInfo: Array<Array<ITile>>
  tileInfo: Array<Array<TileManager>>
  player: PlayerManager
  enemies: EnemyManager[]
  bursts: BurstManager[]
  spikes: SpikesManager[]
  smokes: SmokeManager[]
  door: DoorManager
  mapRowCount: number = 0
  mapColumnCount: number = 0
  levelIndex: number = 1
  records: IRecord[]

  // 重置方法
  reset() {
    this.mapInfo = []
    this.tileInfo = []
    this.player = null
    this.enemies = []
    this.bursts = []
    this.spikes = []
    this.smokes = []
    this.door = null
    this.mapRowCount = 0
    this.mapColumnCount = 0
    this.records = []
  }
}
