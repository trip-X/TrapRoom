import { _decorator, Component, director, Node } from 'cc'
import { TileMapManager } from '../Tile/TileMapManager'
import { createUINode } from '../Utils'
import Levels, { Ilevel } from '../../Levels'
import DataManager, { IRecord } from '../../Runtime/DataManager'
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager'
import EventManager from '../../Runtime/EventManager'
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM, SCENE_ENUM } from '../../Enums'
import { PlayerManager } from '../Player/PlayerManager'
import { WoodenSkeletonManager } from '../WoodenSkeleton/WoodenSkeletonManager'
import { DoorManager } from '../Door/DoorManager'
import { IronSkeletonManager } from '../IronSkeletion/IronSkeletionManager'
import { BurstManager } from '../Burst/BurstManager'
import { SpikesManager } from '../Spikes/SpikesManager'
import { SmokeManager } from '../Smoke/SmokeManager'
import FaderManager from '../../Runtime/FaderManager'
import { ShakeManager } from '../UI/ShakeManager'
const { ccclass, property } = _decorator

@ccclass('BattleManager')
export class BattleManager extends Component {
  level: Ilevel // 当前关卡数据
  stage: Node // 场景节点
  private smokeLayer: Node // 烟雾层节点
  private inited = false // 是否初始化过

  // 生命周期函数：组件加载时执行（仅执行一次），用于初始化事件订阅
  onLoad() {
    DataManager.Instance.levelIndex = 1
    EventManager.Instance.on(EVENT_ENUM.NEXT_LEVEL, this.nextLevel, this)
    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.checkArrived, this)
    EventManager.Instance.on(EVENT_ENUM.SHOW_SMOKE, this.generateSmoke, this)
    EventManager.Instance.on(EVENT_ENUM.RECORD_STEP, this.record, this)
    EventManager.Instance.on(EVENT_ENUM.REVOKE_STEP, this.revoke, this)
    EventManager.Instance.on(EVENT_ENUM.RESTART_LEVEL, this.initLevel, this)
    EventManager.Instance.on(EVENT_ENUM.EXIT_BATTLE, this.exitBattle, this)
  }

  // 生命周期函数：组件销毁时执行（仅执行一次），用于清理事件订阅（防止内存泄漏）
  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.NEXT_LEVEL, this.nextLevel)
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.checkArrived)
    EventManager.Instance.off(EVENT_ENUM.SHOW_SMOKE, this.generateSmoke)
    EventManager.Instance.off(EVENT_ENUM.RECORD_STEP, this.record)
    EventManager.Instance.off(EVENT_ENUM.REVOKE_STEP, this.revoke)
    EventManager.Instance.off(EVENT_ENUM.RESTART_LEVEL, this.initLevel)
    EventManager.Instance.off(EVENT_ENUM.EXIT_BATTLE, this.exitBattle)
  }

  start() {
    this.generateStage() // 生成场景容器节点
    this.initLevel() // 初始化关卡数据并生成瓦片地图
  }

  // 初始化地图
  async initLevel() {
    const level = Levels[`level_${DataManager.Instance.levelIndex}`] // 获取地图信息
    if (level) {
      if (this.inited) {
        await FaderManager.Instance.fadeIn()
      } else {
        await FaderManager.Instance.mask()
      }

      this.clearLevel()
      this.level = level

      // 将地图信息同步到全局数据管理器
      DataManager.Instance.mapInfo = this.level.mapInfo
      DataManager.Instance.mapRowCount = this.level.mapInfo.length || 0
      DataManager.Instance.mapColumnCount = this.level.mapInfo[0].length || 0

      await Promise.all([
        this.generateTileMap(),
        this.generateSpikes(),
        this.generateBurst(),
        this.generateSmokeLayer(),
        this.generateDoor(),
        this.generateEnemies(),
        this.generatePlayer(),
      ])

      await FaderManager.Instance.fadeOut()
      this.inited = true
    } else {
      this.exitBattle()
    }
  }

  // 退出战斗
  async exitBattle() {
    await FaderManager.Instance.fadeIn()
    director.loadScene(SCENE_ENUM.START)
  }

  // 下一关地图
  nextLevel() {
    DataManager.Instance.levelIndex++
    this.initLevel()
  }

  // 清除地图
  clearLevel() {
    this.stage.destroyAllChildren()
    DataManager.Instance.reset()
  }

  //生成场景容器节点
  generateStage() {
    this.stage = createUINode()
    this.stage.setParent(this.node)
    this.stage.addComponent(ShakeManager)
  }

  // 生成瓦片地图
  async generateTileMap() {
    const tileMap = createUINode()
    tileMap.setParent(this.stage)

    const tileMapManager = tileMap.addComponent(TileMapManager)
    await tileMapManager.init()

    this.adaptPos()
  }

  // 生成角色
  async generatePlayer() {
    const player = createUINode()
    player.setParent(this.stage)
    const playerManager = player.addComponent(PlayerManager)
    await playerManager.init(this.level.player)
    DataManager.Instance.player = playerManager
    EventManager.Instance.emit(EVENT_ENUM.PLAYER_BORN, true)
  }

  // 生成敌人
  async generateEnemies() {
    const promise = []
    for (let index = 0; index < this.level.enemies.length; index++) {
      const enemy = this.level.enemies[index]
      const node = createUINode()
      node.setParent(this.stage)
      const Manager = enemy.type === ENTITY_TYPE_ENUM.SKELETON_WOODEN ? WoodenSkeletonManager : IronSkeletonManager
      const manager = node.addComponent(Manager)
      promise.push(manager.init(enemy))
      DataManager.Instance.enemies.push(manager)
    }

    await Promise.all(promise)
  }

  // 生成门
  async generateDoor() {
    const door = createUINode()
    door.setParent(this.stage)
    const doorManager = door.addComponent(DoorManager)
    await doorManager.init(this.level.door)
    DataManager.Instance.door = doorManager
  }

  // 生成陷阱
  async generateBurst() {
    const promise = []
    for (let index = 0; index < this.level.bursts.length; index++) {
      const burst = this.level.bursts[index]
      const node = createUINode()
      node.setParent(this.stage)
      const burstManager = node.addComponent(BurstManager)
      promise.push(burstManager.init(burst))
      DataManager.Instance.bursts.push(burstManager)
    }

    await Promise.all(promise)
  }

  // 生成地刺
  async generateSpikes() {
    const promise = []
    for (let index = 0; index < this.level.spikes.length; index++) {
      const spike = this.level.spikes[index]
      const node = createUINode()
      node.setParent(this.stage)
      const spikeManager = node.addComponent(SpikesManager)
      promise.push(spikeManager.init(spike))
      DataManager.Instance.spikes.push(spikeManager)
    }

    await Promise.all(promise)
  }

  // 生成烟雾
  async generateSmoke(x: number, y: number, direction: DIRECTION_ENUM) {
    const item = DataManager.Instance.smokes.find(smoke => smoke.state == ENTITY_STATE_ENUM.DEATH)
    if (item) {
      item.x = x
      item.y = y
      item.direction = direction
      item.state = ENTITY_STATE_ENUM.IDLE
      item.node.setPosition(x * TILE_WIDTH - TILE_WIDTH / 1.5, -y * TILE_HEIGHT - TILE_HEIGHT / 1.5)
    } else {
      const smoke = createUINode()
      smoke.setParent(this.smokeLayer)
      const smokeManager = smoke.addComponent(SmokeManager)
      await smokeManager.init({
        x,
        y,
        direction,
        state: ENTITY_STATE_ENUM.IDLE,
        type: ENTITY_TYPE_ENUM.SMOKE,
      })
      DataManager.Instance.smokes.push(smokeManager)
    }
  }

  // 生成烟雾层
  async generateSmokeLayer() {
    this.smokeLayer = createUINode()
    this.smokeLayer.setParent(this.stage)
  }

  checkArrived() {
    if (!DataManager.Instance.player || !DataManager.Instance.door) {
      return
    }
    const { x: playerX, y: playerY } = DataManager.Instance.player
    const { x: doorX, y: doorY, state: doorState } = DataManager.Instance.door
    if (playerX === doorX && playerY === doorY && doorState === ENTITY_STATE_ENUM.DEATH) {
      EventManager.Instance.emit(EVENT_ENUM.NEXT_LEVEL)
    }
  }

  // 适配瓦片地图的整体位置
  adaptPos() {
    const { mapRowCount, mapColumnCount } = DataManager.Instance
    const disX = (TILE_WIDTH * mapRowCount) / 2
    const disY = (TILE_HEIGHT * mapColumnCount) / 2 + 80

    this.stage.getComponent(ShakeManager).stop()
    this.stage.setPosition(-disX, disY)
  }

  // 记录当前状态
  record() {
    const item: IRecord = {
      player: {
        x: DataManager.Instance.player.x,
        y: DataManager.Instance.player.y,
        direction: DataManager.Instance.player.direction,
        state:
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.IDLE ||
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.DEATH ||
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.AIRDEATH
            ? DataManager.Instance.player.state
            : ENTITY_STATE_ENUM.IDLE,
        type: DataManager.Instance.player.type,
      },
      door: {
        x: DataManager.Instance.door.x,
        y: DataManager.Instance.door.y,
        direction: DataManager.Instance.door.direction,
        state: DataManager.Instance.door.state,
        type: DataManager.Instance.door.type,
      },
      enemies: DataManager.Instance.enemies.map(enemy => ({
        x: enemy.x,
        y: enemy.y,
        direction: enemy.direction,
        state: enemy.state,
        type: enemy.type,
      })),
      bursts: DataManager.Instance.bursts.map(burst => ({
        x: burst.x,
        y: burst.y,
        direction: burst.direction,
        state: burst.state,
        type: burst.type,
      })),
      spikes: DataManager.Instance.spikes.map(spike => ({
        x: spike.x,
        y: spike.y,
        count: spike.count,
        type: spike.type,
      })),
    }
    DataManager.Instance.records.push(item)
  }

  // 撤销上一步操作
  revoke() {
    const item = DataManager.Instance.records.pop()
    if (item) {
      DataManager.Instance.player.x = DataManager.Instance.player.targetX = item.player.x
      DataManager.Instance.player.y = DataManager.Instance.player.targetY = item.player.y
      DataManager.Instance.player.direction = item.player.direction
      DataManager.Instance.player.state = item.player.state

      DataManager.Instance.door.x = item.door.x
      DataManager.Instance.door.y = item.door.y
      DataManager.Instance.door.direction = item.door.direction
      DataManager.Instance.door.state = item.door.state

      for (let i = 0; i < DataManager.Instance.enemies.length; i++) {
        const enemy = item.enemies[i]
        DataManager.Instance.enemies[i].x = enemy.x
        DataManager.Instance.enemies[i].y = enemy.y
        DataManager.Instance.enemies[i].direction = enemy.direction
        DataManager.Instance.enemies[i].state = enemy.state
      }

      for (let i = 0; i < DataManager.Instance.bursts.length; i++) {
        const burst = item.bursts[i]
        DataManager.Instance.bursts[i].x = burst.x
        DataManager.Instance.bursts[i].y = burst.y
        DataManager.Instance.bursts[i].state = burst.state
      }

      for (let i = 0; i < DataManager.Instance.spikes.length; i++) {
        const spike = item.spikes[i]
        DataManager.Instance.spikes[i].x = spike.x
        DataManager.Instance.spikes[i].y = spike.y
        DataManager.Instance.spikes[i].count = spike.count
        DataManager.Instance.spikes[i].type = spike.type
      }
    }
  }
}
