import { _decorator } from 'cc'
import EventManager from '../../Runtime/EventManager'
import {
  CONTROLLER_ENUM,
  DIRECTION_ENUM,
  ENTITY_STATE_ENUM,
  ENTITY_TYPE_ENUM,
  EVENT_ENUM,
  SHAKE_TYPE_ENUM,
} from '../../Enums'
import { PlayerStateMachine } from './PlayerStateMachine'
import { EntityManager } from '../../Base/EntityManager'
import DataManager from '../../Runtime/DataManager'
import { IEntity } from '../../Levels'
import { EnemyManager } from '../../Base/EnemyManager'
import { BurstManager } from '../Burst/BurstManager'
const { ccclass, property } = _decorator

@ccclass('PlayerManager')
export class PlayerManager extends EntityManager {
  targetX: number = 0 // 玩家目标X坐标
  targetY: number = 0 // 玩家目标Y坐标
  private readonly speed = 1 / 10 // 移动速度
  isMoving = false //玩家移动标志

  async init(params: IEntity) {
    this.fsm = this.addComponent(PlayerStateMachine)
    await this.fsm.init() // 异步初始化状态机（等待资源加载完成）
    super.init(params)

    this.targetX = this.x
    this.targetY = this.y

    // 订阅全局事件：监听玩家控制事件（EVENT_ENUM.PLAYER_CTRL），触发时执行move方法，绑定当前实例this
    EventManager.Instance.on(EVENT_ENUM.PLAYER_CTRL, this.inputHandle, this)
    EventManager.Instance.on(EVENT_ENUM.ATTACK_PLAYER, this.onDead, this)
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.PLAYER_CTRL, this.inputHandle)
    EventManager.Instance.off(EVENT_ENUM.ATTACK_PLAYER, this.onDead)
  }

  update() {
    this.updateXY() // 更新玩家当前坐标
    super.update()
  }

  // 更新玩家坐标
  updateXY() {
    if (this.targetX < this.x) {
      this.x -= this.speed
    } else if (this.targetX > this.x) {
      this.x += this.speed
    }

    if (this.targetY < this.y) {
      this.y -= this.speed
    } else if (this.targetY > this.y) {
      this.y += this.speed
    }

    // 距离阈值判断：当前坐标与目标坐标的差值小于等于0.1时，直接对齐目标坐标
    if (Math.abs(this.targetX - this.x) <= 0.1 && Math.abs(this.targetY - this.y) <= 0.1 && this.isMoving) {
      this.isMoving = false
      this.x = this.targetX
      this.y = this.targetY
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
    }
  }

  // 死亡通知
  onDead(type: ENTITY_STATE_ENUM) {
    this.state = type
  }

  // 攻击震动
  onAttackShake(type: SHAKE_TYPE_ENUM) {
    EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, type)
  }

  // 用户输入处理
  inputHandle(inputDirection: CONTROLLER_ENUM) {
    // 判断是否正在移动
    if (this.isMoving) {
      return
    }
    // 判断是否死亡或者正在攻击
    if (
      this.state == ENTITY_STATE_ENUM.DEATH ||
      this.state == ENTITY_STATE_ENUM.AIRDEATH ||
      this.state == ENTITY_STATE_ENUM.ATTACK
    ) {
      return
    }

    // 判断是否会攻击
    const id = this.willAttack(inputDirection)
    if (id) {
      EventManager.Instance.emit(EVENT_ENUM.RECORD_STEP) // 记录当前状态
      this.state = ENTITY_STATE_ENUM.ATTACK
      EventManager.Instance.emit(EVENT_ENUM.ATTACK_EMEMY, id)
      EventManager.Instance.emit(EVENT_ENUM.DOOR_OPEN)
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
      return
    }

    // 判断是否堵塞
    if (this.willBlock(inputDirection)) {
      if (inputDirection === CONTROLLER_ENUM.TOP) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.TOP)
      } else if (inputDirection === CONTROLLER_ENUM.BOTTOM) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.BOTTOM)
      } else if (inputDirection === CONTROLLER_ENUM.LEFT) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.LEFT)
      } else if (inputDirection === CONTROLLER_ENUM.RIGHT) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.RIGHT)
      } else if (inputDirection === CONTROLLER_ENUM.TURNLEFT) {
        if (this.direction === DIRECTION_ENUM.TOP) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.LEFT)
        } else if (this.direction === DIRECTION_ENUM.BOTTOM) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.RIGHT)
        } else if (this.direction === DIRECTION_ENUM.LEFT) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.BOTTOM)
        } else if (this.direction === DIRECTION_ENUM.RIGHT) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.TOP)
        }
      } else if (inputDirection === CONTROLLER_ENUM.TURNRIGHT) {
        if (this.direction === DIRECTION_ENUM.TOP) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.RIGHT)
        } else if (this.direction === DIRECTION_ENUM.BOTTOM) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.LEFT)
        } else if (this.direction === DIRECTION_ENUM.LEFT) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.TOP)
        } else if (this.direction === DIRECTION_ENUM.RIGHT) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.BOTTOM)
        }
      }

      return
    }

    this.move(inputDirection)
  }

  // 玩家移动逻辑
  move(inputDirection: CONTROLLER_ENUM) {
    EventManager.Instance.emit(EVENT_ENUM.RECORD_STEP) // 记录当前状态
    if (inputDirection === CONTROLLER_ENUM.TOP) {
      this.targetY -= 1
      this.isMoving = true
      this.showSmoke(DIRECTION_ENUM.TOP)
    } else if (inputDirection === CONTROLLER_ENUM.BOTTOM) {
      this.targetY += 1
      this.isMoving = true
      this.showSmoke(DIRECTION_ENUM.BOTTOM)
    } else if (inputDirection === CONTROLLER_ENUM.LEFT) {
      this.targetX -= 1
      this.isMoving = true
      this.showSmoke(DIRECTION_ENUM.LEFT)
    } else if (inputDirection === CONTROLLER_ENUM.RIGHT) {
      this.targetX += 1
      this.isMoving = true
      this.showSmoke(DIRECTION_ENUM.RIGHT)
    } else if (inputDirection === CONTROLLER_ENUM.TURNLEFT) {
      if (this.direction === DIRECTION_ENUM.TOP) {
        this.direction = DIRECTION_ENUM.LEFT
      } else if (this.direction === DIRECTION_ENUM.LEFT) {
        this.direction = DIRECTION_ENUM.BOTTOM
      } else if (this.direction === DIRECTION_ENUM.BOTTOM) {
        this.direction = DIRECTION_ENUM.RIGHT
      } else if (this.direction === DIRECTION_ENUM.RIGHT) {
        this.direction = DIRECTION_ENUM.TOP
      }
      this.state = ENTITY_STATE_ENUM.TURNLEFT
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
    } else if (inputDirection === CONTROLLER_ENUM.TURNRIGHT) {
      if (this.direction === DIRECTION_ENUM.TOP) {
        this.direction = DIRECTION_ENUM.RIGHT
      } else if (this.direction === DIRECTION_ENUM.BOTTOM) {
        this.direction = DIRECTION_ENUM.LEFT
      } else if (this.direction === DIRECTION_ENUM.LEFT) {
        this.direction = DIRECTION_ENUM.TOP
      } else if (this.direction === DIRECTION_ENUM.RIGHT) {
        this.direction = DIRECTION_ENUM.BOTTOM
      }
      this.state = ENTITY_STATE_ENUM.TURNRIGHT
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
    }
  }

  // 显示烟雾
  showSmoke(type: DIRECTION_ENUM) {
    EventManager.Instance.emit(EVENT_ENUM.SHOW_SMOKE, this.x, this.y, type)
  }

  //攻击判定
  willAttack(inputDirection: CONTROLLER_ENUM) {
    const enemies = DataManager.Instance.enemies.filter(enemy => enemy.state !== ENTITY_STATE_ENUM.DEATH) // 过滤已死亡的敌人
    for (let index = 0; index < enemies.length; index++) {
      const { x: enemyX, y: enemyY, id: enemyId } = enemies[index]
      if (
        inputDirection === CONTROLLER_ENUM.TOP &&
        this.direction === DIRECTION_ENUM.TOP &&
        enemyX === this.x &&
        enemyY === this.targetY - 2
      ) {
        this.state = ENTITY_STATE_ENUM.ATTACK
        return enemyId
      } else if (
        inputDirection === CONTROLLER_ENUM.LEFT &&
        this.direction === DIRECTION_ENUM.LEFT &&
        enemyX === this.targetX - 2 &&
        enemyY === this.y
      ) {
        this.state = ENTITY_STATE_ENUM.ATTACK
        return enemyId
      } else if (
        inputDirection === CONTROLLER_ENUM.BOTTOM &&
        this.direction === DIRECTION_ENUM.BOTTOM &&
        enemyX === this.x &&
        enemyY === this.targetY + 2
      ) {
        this.state = ENTITY_STATE_ENUM.ATTACK
        return enemyId
      } else if (
        inputDirection === CONTROLLER_ENUM.RIGHT &&
        this.direction === DIRECTION_ENUM.RIGHT &&
        enemyX === this.targetX + 2 &&
        enemyY === this.y
      ) {
        this.state = ENTITY_STATE_ENUM.ATTACK
        return enemyId
      }
    }

    return ''
  }

  // 碰撞判定
  willBlock(type: CONTROLLER_ENUM) {
    const { targetX: x, targetY: y, direction } = this
    const { tileInfo: tileInfo } = DataManager.Instance
    const enemies: EnemyManager[] = DataManager.Instance.enemies.filter(
      (enemy: EnemyManager) => enemy.state !== ENTITY_STATE_ENUM.DEATH,
    )
    const { x: doorX, y: doorY, state: doorState } = DataManager.Instance.door || {}
    const bursts: BurstManager[] = DataManager.Instance.bursts.filter(
      (burst: BurstManager) => burst.state !== ENTITY_STATE_ENUM.DEATH,
    )

    const { mapRowCount: row, mapColumnCount: column } = DataManager.Instance

    //按钮方向——向上
    if (type === CONTROLLER_ENUM.TOP) {
      const playerNextY = y - 1

      //玩家方向——向上
      if (direction === DIRECTION_ENUM.TOP) {
        //判断是否超出地图
        if (playerNextY < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        const weaponNextY = y - 2
        const nextPlayerTile = tileInfo[x]?.[playerNextY]
        const nextWeaponTile = tileInfo[x]?.[weaponNextY]

        //判断门
        if (
          ((doorX === x && doorY === playerNextY) || (doorX === x && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        // 判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === x && enemyY === weaponNextY) || (enemyX === x && enemyY === playerNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKFRONT
            return true
          }
        }

        // 判断地裂陷阱
        if (
          bursts.some(burst => burst.x === x && burst.y === playerNextY) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //玩家方向——向下
      } else if (direction === DIRECTION_ENUM.BOTTOM) {
        //判断是否超出地图
        if (playerNextY < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        const weaponNextY = y
        const nextPlayerTile = tileInfo[x]?.[playerNextY]
        const nextWeaponTile = tileInfo[x]?.[weaponNextY]

        //判断门
        if (
          ((doorX === x && doorY === playerNextY) || (doorX === x && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if (enemyX === x && enemyY === playerNextY) {
            this.state = ENTITY_STATE_ENUM.BLOCKBACK
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === x && burst.y === playerNextY) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //玩家方向——向左
      } else if (direction === DIRECTION_ENUM.LEFT) {
        //判断是否超出地图
        if (playerNextY < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        const weaponNextX = x - 1
        const weaponNextY = y - 1
        const nextPlayerTile = tileInfo[x]?.[playerNextY]
        const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY]

        //判断门
        if (
          ((doorX === x && doorY === playerNextY) || (doorX === weaponNextX && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === x && enemyY === playerNextY) || (enemyX === weaponNextX && enemyY === weaponNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === x && burst.y === playerNextY) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //玩家方向——向右
      } else if (direction === DIRECTION_ENUM.RIGHT) {
        //判断是否超出地图
        if (playerNextY < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        const weaponNextX = x + 1
        const weaponNextY = y - 1
        const nextPlayerTile = tileInfo[x]?.[playerNextY]
        const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY]

        //判断门
        if (
          ((doorX === x && doorY === playerNextY) || (doorX === weaponNextX && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === x && enemyY === playerNextY) || (enemyX === weaponNextX && enemyY === weaponNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKLEFT
            return true
          }
        }

        // 判断地裂陷阱
        if (
          bursts.some(burst => burst.x === x && burst.y === playerNextY) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }
      }

      //按钮方向——向下
    } else if (type === CONTROLLER_ENUM.BOTTOM) {
      const playerNextY = y + 1

      //玩家方向——向上
      if (direction === DIRECTION_ENUM.TOP) {
        if (playerNextY > column - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK

          return true
        }

        const weaponNextY = y
        const nextPlayerTile = tileInfo[x]?.[playerNextY]
        const nextWeaponTile = tileInfo[x]?.[weaponNextY]

        //判断门
        if (
          ((doorX === x && doorY === playerNextY) || (doorX === x && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if (enemyX === x && enemyY === playerNextY) {
            this.state = ENTITY_STATE_ENUM.BLOCKBACK
            return true
          }
        }

        // 判断地裂陷阱
        if (
          bursts.some(burst => burst.x === x && burst.y === playerNextY) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //玩家方向——向下
      } else if (direction === DIRECTION_ENUM.BOTTOM) {
        if (playerNextY > column - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT

          return true
        }

        const weaponNextY = y + 2
        const nextPlayerTile = tileInfo[x]?.[playerNextY]
        const nextWeaponTile = tileInfo[x]?.[weaponNextY]

        //判断门
        if (
          ((doorX === x && doorY === playerNextY) || (doorX === x && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        // 判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === x && enemyY === weaponNextY) || (enemyX === x && enemyY === playerNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKFRONT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === x && burst.y === playerNextY) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //玩家方向——向左
      } else if (direction === DIRECTION_ENUM.LEFT) {
        if (playerNextY > column - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT

          return true
        }

        const weaponNextX = x - 1
        const weaponNextY = y + 1
        const nextPlayerTile = tileInfo[x]?.[playerNextY]
        const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY]

        //判断门
        if (
          ((doorX === x && doorY === playerNextY) || (doorX === weaponNextX && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === x && enemyY === playerNextY) || (enemyX === weaponNextX && enemyY === weaponNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKLEFT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === x && burst.y === playerNextY) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //玩家方向——向右
      } else if (direction === DIRECTION_ENUM.RIGHT) {
        if (playerNextY > column - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT

          return true
        }

        const weaponNextX = x + 1
        const weaponNextY = y + 1
        const nextPlayerTile = tileInfo[x]?.[playerNextY]
        const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY]

        //判断门
        if (
          ((doorX === x && doorY === playerNextY) || (doorX === weaponNextX && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === x && enemyY === playerNextY) || (enemyX === weaponNextX && enemyY === weaponNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === x && burst.y === playerNextY) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }
      }

      //按钮方向——向左
    } else if (type === CONTROLLER_ENUM.LEFT) {
      const playerNextX = x - 1

      //玩家方向——向上
      if (direction === DIRECTION_ENUM.TOP) {
        //判断是否超出地图
        if (playerNextX < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT

          return true
        }

        const weaponNextX = x - 1
        const weaponNextY = y - 1
        const nextPlayerTile = tileInfo[playerNextX]?.[y]
        const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY]

        //判断门
        if (
          ((doorX === playerNextX && doorY === y) || (doorX === weaponNextX && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === playerNextX && enemyY === y) || (enemyX === weaponNextX && enemyY === weaponNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKLEFT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === playerNextX && burst.y === y) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //玩家方向——向下
      } else if (direction === DIRECTION_ENUM.BOTTOM) {
        //判断是否超出地图
        if (playerNextX < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT

          return true
        }

        const weaponNextX = x - 1
        const weaponNextY = y + 1
        const nextPlayerTile = tileInfo[playerNextX]?.[y]
        const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY]

        //判断门
        if (
          ((doorX === playerNextX && doorY === y) || (doorX === weaponNextX && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === playerNextX && enemyY === y) || (enemyX === weaponNextX && enemyY === weaponNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === playerNextX && burst.y === y) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //玩家方向——向左
      } else if (direction === DIRECTION_ENUM.LEFT) {
        //判断是否超出地图
        if (playerNextX < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT

          return true
        }

        const weaponNextX = x - 2
        const nextPlayerTile = tileInfo[playerNextX]?.[y]
        const nextWeaponTile = tileInfo[weaponNextX]?.[y]

        //判断门
        if (
          ((doorX === playerNextX && doorY === y) || (doorX === weaponNextX && doorY === y)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === playerNextX && enemyY === y) || (enemyX === weaponNextX && enemyY === y)) {
            this.state = ENTITY_STATE_ENUM.BLOCKFRONT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === playerNextX && burst.y === y) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //玩家方向——向右
      } else if (direction === DIRECTION_ENUM.RIGHT) {
        //判断是否超出地图
        if (playerNextX < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK

          return true
        }

        const weaponNextX = x
        const nextPlayerTile = tileInfo[playerNextX]?.[y]
        const nextWeaponTile = tileInfo[weaponNextX]?.[y]

        //判断门
        if (
          ((doorX === playerNextX && doorY === y) || (doorX === weaponNextX && doorY === y)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if (enemyX === playerNextX && enemyY === y) {
            this.state = ENTITY_STATE_ENUM.BLOCKBACK
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === playerNextX && burst.y === y) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }
      }

      //按钮方向——向右
    } else if (type === CONTROLLER_ENUM.RIGHT) {
      const playerNextX = x + 1

      //玩家方向——向上
      if (direction === DIRECTION_ENUM.TOP) {
        if (playerNextX > row - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT

          return true
        }

        const weaponNextX = x + 1
        const weaponNextY = y - 1
        const nextPlayerTile = tileInfo[playerNextX]?.[y]
        const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY]

        //判断门
        if (
          ((doorX === playerNextX && doorY === y) || (doorX === weaponNextX && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === playerNextX && enemyY === y) || (enemyX === weaponNextX && enemyY === weaponNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === playerNextX && burst.y === y) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //玩家方向——向下
      } else if (direction === DIRECTION_ENUM.BOTTOM) {
        if (playerNextX > row - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT

          return true
        }

        const weaponNextX = x + 1
        const weaponNextY = y + 1
        const nextPlayerTile = tileInfo[playerNextX]?.[y]
        const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY]

        //判断门
        if (
          ((doorX === playerNextX && doorY === y) || (doorX === weaponNextX && doorY === weaponNextY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === playerNextX && enemyY === y) || (enemyX === weaponNextX && enemyY === weaponNextY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKLEFT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === playerNextX && burst.y === y) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //玩家方向——向左
      } else if (direction === DIRECTION_ENUM.LEFT) {
        if (playerNextX > row - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK

          return true
        }

        const weaponNextX = x
        const nextPlayerTile = tileInfo[playerNextX]?.[y]
        const nextWeaponTile = tileInfo[weaponNextX]?.[y]

        //判断门
        if (
          ((doorX === playerNextX && doorY === y) || (doorX === weaponNextX && doorY === y)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if (enemyX === playerNextX && enemyY === y) {
            this.state = ENTITY_STATE_ENUM.BLOCKBACK
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === playerNextX && burst.y === y) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //玩家方向——向右
      } else if (direction === DIRECTION_ENUM.RIGHT) {
        if (playerNextX > row - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT

          return true
        }

        const weaponNextX = x + 2
        const nextPlayerTile = tileInfo[playerNextX]?.[y]
        const nextWeaponTile = tileInfo[weaponNextX]?.[y]

        //判断门
        if (
          ((doorX === playerNextX && doorY === y) || (doorX === weaponNextX && doorY === y)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i]
          const { x: enemyX, y: enemyY } = enemy

          if ((enemyX === playerNextX && enemyY === y) || (enemyX === weaponNextX && enemyY === y)) {
            this.state = ENTITY_STATE_ENUM.BLOCKFRONT
            return true
          }
        }

        //判断地裂陷阱
        if (
          bursts.some(burst => burst.x === playerNextX && burst.y === y) &&
          (!nextWeaponTile || nextWeaponTile.turnable)
        ) {
          return false
        }

        //最后判断地图元素
        if (nextPlayerTile && nextPlayerTile.moveable && (!nextWeaponTile || nextWeaponTile.turnable)) {
          // empty
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }
      }

      //按钮方向——左转
    } else if (type === CONTROLLER_ENUM.TURNLEFT) {
      let nextY, nextX
      if (direction === DIRECTION_ENUM.TOP) {
        //朝上左转的话，左上角三个tile都必须turnable为true，并且没有敌人
        nextY = y - 1
        nextX = x - 1
      } else if (direction === DIRECTION_ENUM.BOTTOM) {
        nextY = y + 1
        nextX = x + 1
      } else if (direction === DIRECTION_ENUM.LEFT) {
        nextY = y + 1
        nextX = x - 1
      } else if (direction === DIRECTION_ENUM.RIGHT) {
        nextY = y - 1
        nextX = x + 1
      }

      //判断门
      if (
        ((doorX === x && doorY === nextY) ||
          (doorX === nextX && doorY === y) ||
          (doorX === nextX && doorY === nextY)) &&
        doorState !== ENTITY_STATE_ENUM.DEATH
      ) {
        this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
        return true
      }

      //判断敌人
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i]
        const { x: enemyX, y: enemyY } = enemy

        if (enemyX === nextX && enemyY === y) {
          this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT

          return true
        } else if (enemyX === nextX && enemyY === nextY) {
          this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT

          return true
        } else if (enemyX === x && enemyY === nextY) {
          this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT

          return true
        }
      }

      //最后判断地图元素
      if (
        (!tileInfo[x]?.[nextY] || tileInfo[x]?.[nextY].turnable) &&
        (!tileInfo[nextX]?.[y] || tileInfo[nextX]?.[y].turnable) &&
        (!tileInfo[nextX]?.[nextY] || tileInfo[nextX]?.[nextY].turnable)
      ) {
        // empty
      } else {
        this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
        return true
      }

      //按钮方向——右转
    } else if (type === CONTROLLER_ENUM.TURNRIGHT) {
      let nextX, nextY
      if (direction === DIRECTION_ENUM.TOP) {
        //朝上右转的话，右上角三个tile都必须turnable为true
        nextY = y - 1
        nextX = x + 1
      } else if (direction === DIRECTION_ENUM.BOTTOM) {
        nextY = y + 1
        nextX = x - 1
      } else if (direction === DIRECTION_ENUM.LEFT) {
        nextY = y - 1
        nextX = x - 1
      } else if (direction === DIRECTION_ENUM.RIGHT) {
        nextY = y + 1
        nextX = x + 1
      }

      //判断门
      if (
        ((doorX === x && doorY === nextY) ||
          (doorX === nextX && doorY === y) ||
          (doorX === nextX && doorY === nextY)) &&
        doorState !== ENTITY_STATE_ENUM.DEATH
      ) {
        this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT
        return true
      }

      //判断敌人
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i]
        const { x: enemyX, y: enemyY } = enemy

        if (enemyX === nextX && enemyY === y) {
          this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT

          return true
        } else if (enemyX === nextX && enemyY === nextY) {
          this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT

          return true
        } else if (enemyX === x && enemyY === nextY) {
          this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT

          return true
        }
      }

      //最后判断地图元素
      if (
        (!tileInfo[x]?.[nextY] || tileInfo[x]?.[nextY].turnable) &&
        (!tileInfo[nextX]?.[y] || tileInfo[nextX]?.[y].turnable) &&
        (!tileInfo[nextX]?.[nextY] || tileInfo[nextX]?.[nextY].turnable)
      ) {
        // empty
      } else {
        this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT
        return true
      }
    }

    return false
  }
}
