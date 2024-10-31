---
layout: post
title: 「效率工具」借助 Anki 增加词汇广度和深度
date: 2017-12-06
categories: [tech]
tags: [工具，英语]
expirydate: 2021-01-01
---

近日在下学着使用记忆神器 Anki，并做了些整理工作。这篇文章介绍了『借助 Anki 增加词汇广度和深度』的方法，主要讲如何使用一些软件，来构建一个高效制作带有原文的单词卡片，让英语单词过目不忘。在此感谢相关软件的开发者。

## 词汇广度和深度

非英语母语的人大致是**以 5000 为峰值的长尾分布**，英语是母语的人词汇量平均有**两三万**，两者在广度上差异显著。在深度上，差异更加突出，前者只有**40%**的主动词汇，而后者有**90%**的词汇是主动词汇。那么词汇量只有 5000 的人仅有 2000 的主动词汇量，相当于 3 岁儿童的词汇量。

英语中一个单词通常有好几个意思。例如，**spring**，一般想到的是春天，然后是泉水、发条，其实还有动词的意思，跳跃。词汇的这种不同词频的含义就是词汇的深度。

**纯粹的背单词只能增加词汇广度，并不能增加词汇深度，而且在理解不深刻的情况下，遗忘速度总会让我们吃惊，词汇广度也因此存在一个较低的上限。**那有没有什么办法既能深刻理解词义，又能让记单词自然地融入日常学习，省心省力呢？

答案是，有的，借助下面介绍的软件可以求得一个满意解，至少在下还算满意。

首先回忆一下日常遇到英语生词的场景，大概有一下几个：

- 浏览英文**网页**和**移动端 APP**页面，例如程序猿需要频繁浏览问答网站（[Stack Overflow ](https://stackoverflow.com/)）、各种官方文档（[Scipy Lecture Notes](http://www.scipy-lectures.org/)）和代码托管平台（[GitHub](https://github.com/)）
- 阅读以**PDF**格式为主的英文教科书和论文
- 在**kindle**上阅读英文原版书，毕竟长时间盯着电脑、手机眼睛会受不了
- 纸质英文材料

如果以上场景都能方便地**查询生词制做 Anki 卡片**和**摘抄佳句送进 Anki**，那我们再也不用担心阅读中被大量生词困扰，词汇增长缓慢甚至负增长，写不出好句子。

## 浏览网页及移动端应用

浏览英文网页有多个具体场景，[老黄](https://ninja33.github.io/)给出了一整套的解决方案——**Anki 划词制卡助手**（附：[代码仓库](https://github.com/ninja33/anki-dict-helper)）。

### Chrome

#### 安装

在电脑（Chrome）上，可用[Chrome 插件《Anki 划词制卡助手》](https://ninja33.github.io/20160817/anki-dict-helper-chrome-extension/)，安装需要四件工具及相应步骤：

- Chrome 浏览器
- [Anki App](https://apps.ankiweb.net/)
- [Chrome 网上应用店](https://chrome.google.com/webstore/detail/anki-%E5%88%92%E8%AF%8D%E5%88%B6%E5%8D%A1%E5%8A%A9%E6%89%8B/ajencmdaamfnkgilhpgkepfhfgjfplnn?hl=zh-CN)直接添加插件；或者在 Chrome》**更多工具**》**扩展程序**下勾选「开发者模式」，然后**加载已解压的扩展程序**——测试版[Anki 划词制卡助手](https://zhuanlan.zhihu.com/p/22472893?refer=-anki)
- [AnkiConnect.py](https://ninja33.github.io/20160817/anki-connect/)，将`AnkiConnect.py`文件复制到`.../Anki/addon`目录下，然后**重启**Anki；或者在 Anki 里直接添加插件**2055492159**，即[AnkiConnect](https://ankiweb.net/shared/info/2055492159)

具体步骤见[《Anki 划词制卡助手》使用说明 (含视频教程) ](https://ninja33.github.io/20160817/anki-dict-helper-chrome-extension/)。

此外，Mac 用户还会遇到一个问题，每次添加生词都需要激活 Anki.app，一个简便的解决方法是让 Anki.app 一直处于打开状态，步骤（参考[Always keep an application open - Mac OS X Hints](http://hints.macworld.com/article.php?story=20110617204111325)）如下：

- 新建一个**plis**t 文件，在终端输入`touch ~/Library/LaunchAgents/user.launchkeep.anki.plist`

- 用编辑器打开文件，例如

  - 用 TextMate：`open -a /Applications/TextMate.app/ user.launchkeep.anki.plist`
  - 或者用 Vim：`vim user.launchkeep.anki.plist`

- 输入

  ```
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
  <dict>
    <key>Label</key>
    <string>user.launchkeep.anki</string>
    <key>KeepAlive</key>
    <true/>
    <key>Program</key>
    <string>/Applications/Anki.app/Contents/MacOS/Anki</string>
  </dict>
  </plist>
  ```

- load launch job，`launchctl load ~/Library/LaunchAgents/user.launchkeep.anki.plist`，只要 Mac 处于开机状态，Anki.app 会一直处于打开状态（关闭后会立即打开）

- 想要关闭 Anki.app 可以在终端输入：`launchctl remove user.launchkeep.anki`

#### 配置

接下来就是配置 Chrome 上的 Anki 划词制卡助手插件，此时需要一个[高颜值的 Anki 卡片模板](https://zhuanlan.zhihu.com/p/26255602)，更多见[Anki 终极汇总](https://zhuanlan.zhihu.com/p/21328602?refer=-anki)。

勾选「启用 AnkiConnect」

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/扩展程序1.png)

选择牌组和模板，区域映射对应的标签

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/扩展程序2.png)

现在就可以使用了，让**光标**停留在一个英语单词上，按「shift」，点击**绿色加号**，效果如下：

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Anki1.png)

除了看释义，还能听发音增强记忆。到目前为止，『Anki 划词制卡助手』已经是一款很贴心的划词词典插件了，然后切换到 Anki 窗口看看卡片效果如何。这下彻底怒了，竟然连**原句**都一并摘录下来，也就是说，我在复习单词的同时也能一并复习知识点，单词顺着大脑语义网络唤醒了与知识点相关的脑区，记忆更深刻，而且记住了应用情境。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Anki2.png)

[作者](https://ninja33.github.io/about/)是谁，赶紧膜拜一下。

### 移动设备

**Android**的使用方法详见：[【工具篇】安卓版 Anki 划词助手！](https://zhuanlan.zhihu.com/p/25857322)，凡是能够选择文本的场合都能用。

**iOS**的使用方法详见：[iOS workflow 划词制卡助手 ](https://ninja33.github.io/20170311/iOS-workflow-dict-helper/)

### PDF

阅读 PDF 文件时，可借助**前文安装好的 APP 和插件**+[PDF.js](https://mozilla.github.io/pdf.js/)来制作生词卡，其代码托管在[GitHub](https://github.com/mozilla/pdf.js)。下载后打开`pdfjs-1.9.426-dist/web/viewer.html`文件，并添加到 Chrome 的书签里。在该网页下打开本地的 PDF，便能用『shift』来添加单词。详细教程见：[在 PDF 中取词（PDF.JS+ 划词助手）](https://zhuanlan.zhihu.com/p/23870485)

摘录佳句可借助 MarginNote：先选中句子文本并标记，再选中句子中妙用的地方，标记为重点，然后将句子文本生成一张卡片，于是得到一张佳句妙用填空卡。

### kindle

kindle 的使用方法是：kindle 自带生词本功能+[KindleMate](http://kmate.me/cn/)导出生词本。生词本自带了原文和来源，可用自己手动添加发音。

给单词添加发音如图：

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Item-0_和_Item-0_和_Item-0.png)

此外，也可用 kindle**标注佳句**，用导出笔记的方式导出 KindleMate，编辑成**填空题**的格式导入 Anki。

更多关于 KindleMate 的使用可参考[Kindle Mate 功能展示 | Kindle Mate 官网](http://kmate.me/democn/)。
至于 Kindle 上刷自定义安卓客户端了的方法，还有待实践。

## 注意事项：

1. 因为 anki 的服务器在国外，同步的速度比较慢，如果同步失败，请过段时间再试；如果还是不行，请在首选项里取消「同时同步媒体文件」；如果这样还是不行，可以一次导出所有的 Desks，发送到其他设备上打开。
2. 使用 Power Format Pack 时，如果在 Power Format Pack add-on(options) 中勾选了「Enable Markdown」，则「General」中的选项均不能勾选，否则会导致同步失败。

## Ref：

- [Anki - powerful, intelligent flashcards](https://apps.ankiweb.net/)
- [→→→→→→Anki 终极汇总——请先看我！←←←←←←](https://zhuanlan.zhihu.com/p/21328602?refer=-anki)
- [英语插件？有这一个就够了——工具篇【Anki 划词制卡助手】](https://zhuanlan.zhihu.com/p/22472893?refer=-anki)
- [我不是针对谁，我是说在座各位... 老黄老巢](https://ninja33.github.io/20170319/the-new-way-of-vocabulary-world/)
- [工具篇——在 PDF 中取词（PDF.JS+ 划词助手）](https://zhuanlan.zhihu.com/p/23870485)
- [Anki 搭配 Kindle Mate--经济学人五篇生词量从 177 个降到 26 个](https://zhuanlan.zhihu.com/p/22338951)
- [Anki 官方小组](https://www.douban.com/group/577207/)

## ChangeLog

- 2017-12-13 添加两点注意事项
- 2017-12-06 初稿
