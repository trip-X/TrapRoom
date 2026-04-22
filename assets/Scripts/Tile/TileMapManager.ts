import { _decorator, Component, resources, SpriteFrame } from 'cc'
const { ccclass } = _decorator
import { TileManager } from './TileManager'
import { createUINode, randomByRange } from '../Utils'
import DataManager from '../../Runtime/DataManager'
import ResourceManager from '../../Runtime/ResourceManager'

@ccclass('TileMapManager')
export class TileMapManager extends Component {
  async init() {
    const spriteFrames = await ResourceManager.Instance.loadDir('texture/tile/tile') // await等待异步加载完成，返回帧数组（即获取到资源才继续往下执行）
    const { mapInfo } = DataManager.Instance // 全局数据管理器获取地图信息
    DataManager.Instance.tileInfo = []
    for (let i = 0; i < mapInfo.length; i++) {
      const column = mapInfo[i]
      DataManager.Instance.tileInfo[i] = []
      for (let j = 0; j < column.length; j++) {
        const item = column[j]
        if (item.src === null || item.type === null) {
          continue
        }

        let number = item.src
        if ((number === 1 || number === 5 || number === 9) && i % 2 === 0 && j % 2 === 0) {
          number += randomByRange(0, 4)
        }

        const imgSrc = `tile (${number})` // 拼接精灵帧名称
        const node = createUINode()
        const spriteFrame = spriteFrames.find(v => v.name === imgSrc) || spriteFrames[0] // 从加载的精灵帧数组中匹配名称
        const tileManager = node.addComponent(TileManager)
        const type = item.type
        tileManager.init(type, spriteFrame, i, j) // 初始化瓦片
        DataManager.Instance.tileInfo[i][j] = tileManager
        node.setParent(this.node)
      }
    }
  }
}
