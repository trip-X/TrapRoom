import { _decorator, Component, Layers, Node, SpriteFrame, UITransform } from 'cc'

// 创建节点的工具函数
export const createUINode = (name: string = '') => {
  const node = new Node(name)
  const transform = node.addComponent(UITransform) // 给节点添加UITransform组件
  transform.setAnchorPoint(0, 1) // 设置锚点为左上角
  node.layer = 1 << Layers.nameToLayer('UI_2D') // 设置节点层级为UI_2D层
  return node
}

// 随机函数
export const randomByRange = (start: number, end: number) => Math.floor(start + (end - start) * Math.random())

// 定义正则表达式，用于匹配字符串中括号内的数字
const reg = /\((\d+)\)/

// 步骤1：str.match(reg) 用正则匹配字符串，返回匹配数组（第一个元素是整体匹配，第二个是捕获组）
// 步骤2：[1] 取捕获组（括号内的数字字符串），若匹配不到则取'0'
// 步骤3：parseInt 转为整数类型，确保返回数字
const getNumberWithinString = (str: string) => parseInt(str.match(reg)[1] || '0')

// 导出精灵帧数组排序函数：按精灵帧名称中的数字升序排列
export const sortSpriteFrame = (spriteFrames: SpriteFrame[]) =>
  // 排序逻辑：a的数字 - b的数字 → 升序排列（结果为负a在前，正b在前，0不变）
  // 先提取a精灵帧名称中的数字，再提取b的，做差值比较
  spriteFrames.sort((a, b) => getNumberWithinString(a.name) - getNumberWithinString(b.name))

// 生成指定长度的随机数字字符串
export const randomByLen = (len: number) => {
  // 1. Array.from({ length: len })：创建长度为len的空数组（元素为undefined）
  // 2. reduce：数组累加器，初始值为空字符串（<string>指定累加结果为字符串类型）
  // 3. 每次迭代：生成0-9的随机整数（Math.floor(Math.random()*10)），拼接到total上
  // 4. 最终返回长度为len的随机数字字符串
  return Array.from({ length: len }).reduce<string>((total, item) => total + Math.floor(Math.random() * 10), '')
}
