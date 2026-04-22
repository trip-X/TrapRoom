import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, TILE_TYPE_ENUM } from '../Enums'
import level_1 from './Level_1'
import level_2 from './Level_2'
import level_3 from './Level_3'
import level_4 from './Level_4'
import level_5 from './Level_5'
import level_6 from './Level_6'
import level_7 from './Level_7'
import level_8 from './Level_8'
import level_9 from './Level_9'
import level_10 from './Level_10'
import level_11 from './Level_11'
import level_12 from './Level_12'
import level_13 from './Level_13'
import level_14 from './Level_14'
import level_15 from './Level_15'
import level_16 from './Level_16'
import level_17 from './Level_17'
import level_18 from './Level_18'
import level_19 from './Level_19'
import level_20 from './Level_20'
import level_21 from './Level_21'

// 定义实体接口
export interface IEntity {
  x: number // 实体当前X坐标
  y: number // 实体当前Y坐标
  type: ENTITY_TYPE_ENUM //实体类型
  direction: DIRECTION_ENUM //实体方向
  state: ENTITY_STATE_ENUM // 实体状态
}

// 定义地刺参数接口
export interface ISpikes {
  x: number // 实体当前X坐标
  y: number // 实体当前Y坐标
  type: ENTITY_TYPE_ENUM //实体类型
  count: number // 地刺触发次数/状态数量
}

// 定义单个瓦片的接口类型，约束瓦片的属性结构
export interface ITile {
  src: number | null // 瓦片资源索引（对应图集里的资源ID，null表示无资源）
  type: TILE_TYPE_ENUM | null // 瓦片类型（关联枚举类型，null表示无类型）
}

// 定义单个关卡的接口类型，约束关卡的结构
export interface Ilevel {
  mapInfo: Array<Array<ITile>> // 地图信息：二维数组，每一项是一行瓦片，每行包含多个ITile类型的瓦片
  player: IEntity
  enemies: Array<IEntity>
  spikes: Array<ISpikes>
  bursts: Array<IEntity>
  door: IEntity
}

// 整合所有关卡数据，便于统一管理和调用（后续可扩展）
const Levels: Record<string, Ilevel> = {
  level_1,
  level_2,
  level_3,
  level_4,
  level_5,
  level_6,
  level_7,
  level_8,
  level_9,
  level_10,
  level_11,
  level_12,
  level_13,
  level_14,
  level_15,
  level_16,
  level_17,
  level_18,
  level_19,
  level_20,
  level_21,
}

// 导出关卡集合，供外部模块（如地图渲染、游戏逻辑）使用
export default Levels
