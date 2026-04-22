import { BlockInputEvents, Color, Component, game, Graphics, UITransform, view, _decorator } from 'cc'
const { ccclass } = _decorator
const SCREEN_WIDTH = view.getVisibleSize().width
const SCREEN_HEIGHT = view.getVisibleSize().height

// 定义渐变状态枚举：控制淡入/淡出/idle状态
enum FADE_STATE_ENUM {
  IDLE = 'IDLE',
  FADE_IN = 'FADE_IN',
  FADE_OUT = 'FADE_OUT',
}

export const DEFAULT_DURATION = 500

@ccclass('DrawManager')
export class DrawManager extends Component {
  private ctx: Graphics // 2D绘图上下文
  private state: FADE_STATE_ENUM = FADE_STATE_ENUM.IDLE // 当前渐变状态
  private oldTime: number = 0 // 渐变开始时间戳
  private duration: number = 0 // 渐变持续时间
  private fadeResolve: (value: PromiseLike<null>) => void // 存储渐变完成的Promise回调，用于通知外部渐变结束，该变量是个函数，参数为promise的null，返回值为void
  private block: BlockInputEvents // 输入事件阻塞组件

  init() {
    this.block = this.addComponent(BlockInputEvents)
    this.ctx = this.addComponent(Graphics)
    const transform = this.getComponent(UITransform)
    transform.setAnchorPoint(0.5, 0.5) // 设置锚点为中心
    transform.setContentSize(SCREEN_WIDTH, SCREEN_HEIGHT) // 设置内容大小为全屏
    this.setAlpha(1) // 初始化透明度为1（完全不透明）
  }

  // 设置透明度
  private setAlpha(percent: number) {
    this.ctx.clear() // 清除绘制内容
    this.ctx.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT) // 绘制全屏矩形
    this.ctx.fillColor = new Color(0, 0, 0, 255 * percent) // 设置填充颜色为透明黑色
    this.ctx.fill() // 填充矩形
    this.block.enabled = percent === 1 // 当透明度为1（完全不透明）时，禁用输入事件
  }

  update() {
    const percent = (game.totalTime - this.oldTime) / this.duration
    switch (this.state) {
      case FADE_STATE_ENUM.FADE_IN:
        if (percent < 1) {
          this.setAlpha(percent)
        } else {
          this.setAlpha(1)
          this.state = FADE_STATE_ENUM.IDLE
          this.fadeResolve(null) // 调用渐变完成回调函数
        }
        break
      case FADE_STATE_ENUM.FADE_OUT:
        if (percent < 1) {
          this.setAlpha(1 - percent)
        } else {
          this.setAlpha(0)
          this.state = FADE_STATE_ENUM.IDLE
          this.fadeResolve(null) // 调用渐变完成回调函数
        }
        break
      default:
        break
    }
  }

  // 淡入
  fadeIn(duration: number = DEFAULT_DURATION) {
    this.setAlpha(0)
    this.duration = duration
    this.oldTime = game.totalTime
    this.state = FADE_STATE_ENUM.FADE_IN
    return new Promise(resolve => {
      this.fadeResolve = resolve // 赋值渐变完成回调函数，用于通知外部渐变结束
    })
  }

  // 淡出
  fadeOut(duration: number = DEFAULT_DURATION) {
    this.setAlpha(1)
    this.duration = duration
    this.oldTime = game.totalTime
    this.state = FADE_STATE_ENUM.FADE_OUT
    return new Promise(resolve => {
      this.fadeResolve = resolve // 赋值渐变完成回调函数，用于通知外部渐变结束
    })
  }

  mask() {
    this.setAlpha(1)
    return new Promise(resolve => {
      setTimeout(resolve, DEFAULT_DURATION) //延迟DEFAULT_DURATION毫秒，调用resolve函数，通知外部渐变结束
    })
  }
}
