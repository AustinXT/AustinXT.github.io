---
title: 借助Anki增加词汇广度和深度
date: 2017-12-06
sidebar: 'auto'
categories:
  - 效率工具
author: 夜航星
tags:
  - 英语
  - 效率工具
publish: true
description: 
---

近日在下学着使用记忆神器Anki，并做了些整理工作。这篇文章介绍了『借助Anki增加词汇广度和深度』的方法，主要讲如何使用一些软件，来构建一个高效制作带有原文的单词卡片，让英语单词过目不忘。在此感谢相关软件的开发者。

## 词汇广度和深度

非英语母语的人大致是**以5000为峰值的长尾分布**，英语是母语的人词汇量平均有**两三万**，两者在广度上差异显著。在深度上，差异更加突出，前者只有**40%**的主动词汇，而后者有**90%**的词汇是主动词汇。那么词汇量只有5000的人仅有2000的主动词汇量，相当于3岁儿童的词汇量。

英语中一个单词通常有好几个意思。例如，**spring**，一般想到的是春天，然后是泉水、发条，其实还有动词的意思，跳跃。词汇的这种不同词频的含义就是词汇的深度。

**纯粹的背单词只能增加词汇广度，并不能增加词汇深度，而且在理解不深刻的情况下，遗忘速度总会让我们吃惊，词汇广度也因此存在一个较低的上限。**那有没有什么办法既能深刻理解词义，又能让记单词自然地融入日常学习，省心省力呢？

答案是，有的，借助下面介绍的软件可以求得一个满意解，至少在下还算满意。

首先回忆一下日常遇到英语生词的场景，大概有一下几个：

- 浏览英文**网页**和**移动端APP**页面，例如程序猿需要频繁浏览问答网站（[Stack Overflow ](https://stackoverflow.com/)）、各种官方文档（[Scipy Lecture Notes](http://www.scipy-lectures.org/)）和代码托管平台（[GitHub](https://github.com/)）
- 阅读以**PDF**格式为主的英文教科书和论文
- 在**kindle**上阅读英文原版书，毕竟长时间盯着电脑、手机眼睛会受不了
- 纸质英文材料

如果以上场景都能方便地**查询生词制做Anki卡片**和**摘抄佳句送进Anki**，那我们再也不用担心阅读中被大量生词困扰，词汇增长缓慢甚至负增长，写不出好句子。

## 浏览网页及移动端应用

浏览英文网页有多个具体场景，[老黄](https://ninja33.github.io/)给出了一整套的解决方案——**Anki划词制卡助手**（附：[代码仓库](https://github.com/ninja33/anki-dict-helper)）。

### Chrome

#### 安装

在电脑（Chrome）上，可用[Chrome插件《Anki 划词制卡助手》](https://ninja33.github.io/20160817/anki-dict-helper-chrome-extension/)，安装需要四件工具及相应步骤：

- Chrome浏览器
- [Anki App](https://apps.ankiweb.net/)
- [Chrome 网上应用店](https://chrome.google.com/webstore/detail/anki-%E5%88%92%E8%AF%8D%E5%88%B6%E5%8D%A1%E5%8A%A9%E6%89%8B/ajencmdaamfnkgilhpgkepfhfgjfplnn?hl=zh-CN)直接添加插件；或者在Chrome》**更多工具**》**扩展程序**下勾选「开发者模式」，然后**加载已解压的扩展程序**——测试版[Anki划词制卡助手](https://zhuanlan.zhihu.com/p/22472893?refer=-anki)
- [AnkiConnect.py](https://ninja33.github.io/20160817/anki-connect/)，将`AnkiConnect.py`文件复制到`.../Anki/addon`目录下，然后**重启**Anki；或者在Anki里直接添加插件**2055492159**，即[AnkiConnect](https://ankiweb.net/shared/info/2055492159)

具体步骤见[《Anki 划词制卡助手》使用说明(含视频教程) ](https://ninja33.github.io/20160817/anki-dict-helper-chrome-extension/)。

此外，Mac用户还会遇到一个问题，每次添加生词都需要激活Anki.app，一个简便的解决方法是让Anki.app一直处于打开状态，步骤（参考[Always keep an application open - Mac OS X Hints](http://hints.macworld.com/article.php?story=20110617204111325)）如下：

- 新建一个**plis**t文件，在终端输入`touch ~/Library/LaunchAgents/user.launchkeep.anki.plist`

- 用编辑器打开文件，例如

  - 用TextMate：`open -a /Applications/TextMate.app/ user.launchkeep.anki.plist`
  - 或者用Vim：`vim user.launchkeep.anki.plist`

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

- load launch job，`launchctl load ~/Library/LaunchAgents/user.launchkeep.anki.plist`，只要Mac处于开机状态，Anki.app会一直处于打开状态（关闭后会立即打开）

- 想要关闭Anki.app可以在终端输入：`launchctl remove user.launchkeep.anki`

#### 配置

接下来就是配置Chrome上的Anki划词制卡助手插件，此时需要一个[高颜值的Anki卡片模板](https://zhuanlan.zhihu.com/p/26255602)，更多见[Anki终极汇总](https://zhuanlan.zhihu.com/p/21328602?refer=-anki)。

勾选「启用AnkiConnect」

![](http://images.austinxt.com/扩展程序1.png)

选择牌组和模板，区域映射对应的标签

![](http://images.austinxt.com/扩展程序2.png)

现在就可以使用了，让**光标**停留在一个英语单词上，按「shift」，点击**绿色加号**，效果如下：

![](http://images.austinxt.com/Anki1.png)

除了看释义，还能听发音增强记忆。到目前为止，『Anki划词制卡助手』已经是一款很贴心的划词词典插件了，然后切换到Anki窗口看看卡片效果如何。这下彻底怒了，竟然连**原句**都一并摘录下来，也就是说，我在复习单词的同时也能一并复习知识点，单词顺着大脑语义网络唤醒了与知识点相关的脑区，记忆更深刻，而且记住了应用情境。

![](http://images.austinxt.com/Anki2.png)

[作者](https://ninja33.github.io/about/)是谁，赶紧膜拜一下。

### 移动设备

**Android**的使用方法详见：[【工具篇】安卓版 Anki划词助手！](https://zhuanlan.zhihu.com/p/25857322)，凡是能够选择文本的场合都能用。

**iOS**的使用方法详见：[iOS workflow 划词制卡助手 ](https://ninja33.github.io/20170311/iOS-workflow-dict-helper/)

### PDF

阅读PDF文件时，可借助**前文安装好的APP和插件**+[PDF.js](https://mozilla.github.io/pdf.js/)来制作生词卡，其代码托管在[GitHub](https://github.com/mozilla/pdf.js)。下载后打开`pdfjs-1.9.426-dist/web/viewer.html`文件，并添加到Chrome的书签里。在该网页下打开本地的PDF，便能用『shift』来添加单词。详细教程见：[在PDF中取词（PDF.JS+划词助手）](https://zhuanlan.zhihu.com/p/23870485)

摘录佳句可借助MarginNote：先选中句子文本并标记，再选中句子中妙用的地方，标记为重点，然后将句子文本生成一张卡片，于是得到一张佳句妙用填空卡。

### kindle

kindle的使用方法是：kindle自带生词本功能+[KindleMate](http://kmate.me/cn/)导出生词本。生词本自带了原文和来源，可用自己手动添加发音。

给单词添加发音如图：

![](http://images.austinxt.com/Item-0_和_Item-0_和_Item-0.png)

此外，也可用kindle**标注佳句**，用导出笔记的方式导出KindleMate，编辑成**填空题**的格式导入Anki。

更多关于KindleMate的使用可参考[Kindle Mate 功能展示 | Kindle Mate 官网](http://kmate.me/democn/)。
至于Kindle上刷自定义安卓客户端了的方法，还有待实践。

## 注意事项：

1. 因为anki的服务器在国外，同步的速度比较慢，如果同步失败，请过段时间再试；如果还是不行，请在首选项里取消「同时同步媒体文件」；如果这样还是不行，可以一次导出所有的Desks，发送到其他设备上打开。
2. 使用Power Format Pack时，如果在Power Format Pack add-on(options)中勾选了「Enable Markdown」，则「General」中的选项均不能勾选，否则会导致同步失败。

## Ref：

* [Anki - powerful, intelligent flashcards](https://apps.ankiweb.net/)
* [→→→→→→Anki终极汇总——请先看我！←←←←←←](https://zhuanlan.zhihu.com/p/21328602?refer=-anki)
* [英语插件？ 有这一个就够了——工具篇【Anki划词制卡助手】](https://zhuanlan.zhihu.com/p/22472893?refer=-anki)
* [我不是针对谁，我是说在座各位... 老黄老巢](https://ninja33.github.io/20170319/the-new-way-of-vocabulary-world/)
* [工具篇——在PDF中取词（PDF.JS+划词助手）](https://zhuanlan.zhihu.com/p/23870485)
* [Anki搭配Kindle Mate--经济学人五篇生词量从177个降到26个](https://zhuanlan.zhihu.com/p/22338951)
* [Anki官方小组](https://www.douban.com/group/577207/)

## ChangeLog

- 2017-12-13 添加两点注意事项
- 2017-12-06 初稿