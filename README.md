## Quickstart

## 源码目录介绍
```
./input               // RealInput SDK
├── 3rdparty          // 输入SDK需要用到的第三方JS文件
├── pool.js           // 存储多个玩家姿态的容器
├── pose.js           // 玩家姿态关键点对象，getFirstPlayer返回此对象
├── camera.js         // 微信小程序打开与关闭相机
├── client.js         // 客户端与服务器通信
├── protocol.js       // 通信协议底层
└── index.js          // RealInput对象，对外接口
./js                  // 微信小游戏Demo
./game.js             // 游戏入口
./game.json           //
./test.js             // 测试调用RealInput
./upgrade.js          // 检查小程序新版本

```

## 测试RealInput SDK

复制input目录到你的项目下，在game.js（游戏入口）里只需要以下两行代码即可运行测试。
```
import Test from './input/test'
new Test()
```

## 如何在游戏中使用SDK

参见./input/test.js详细注释

## FAQ

1、如何定义新的姿态识别？

可以在./input/pose.js的checkPose里定义姿态，然后在游戏loop的update事件中，通过下面代码判断姿态。
```
const player = this.realInput.getFirstPlayer()
if(player) {
  if(player.checkPose('HandsUp')) {
    // TODO
  }
}
```
