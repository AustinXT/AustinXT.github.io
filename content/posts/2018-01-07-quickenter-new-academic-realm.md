---
layout: post
title: 如何快速了解一个学术领域
date: 2018-01-07
categories: [方法技巧]
tags: [学术]
---

> 如今社会，信息过载，领域丛生，我们常常需要接触一些陌生的知识，一些闻所未闻的领域。那以使用工具著称的人类，是否能借助软件快速了解一个领域呢？那些每天都需要看论文的学者早已发明了快速进入一个领域的方法，在下学些皮毛，稍作实践，特来分享一下。

## 工具包

### HistCite

> 引文分析工具

在下大概一年前从[罗昭锋老师博客](http://blog.sciencenet.cn/blog-304685-383399.html)知道了 HistCite，然后从[Tsing 的 HistCite 使用教程](https://zhuanlan.zhihu.com/p/20902898)获得资源和使用方法。更多实例和教学可见：

- [快速进入陌生领域：HistCite 使用教程](http://ztever.com/histcite-manu/)
- [玩转文献调研 - 网易云课堂](http://study.163.com/course/introduction/1373003.htm#/courseDetail)
  安装好软件后，只需从 WOS 上导出的 txt 文件（一次最多可导出 500 条记录），不用做任何修改，只要把全部的 txt 放到 TXT 文件夹里面，然后双击 main.exe 即可一键完成加载。软件使用过程中主要会遇到以下几个概念：

- HistCite 使用过程中主要会遇到五个概念——GCS、LCS、LCR、CR，LCS 和 LCR 更重要，它们分别代表了与本领域相关联的被引用数和引用数，LCS 值高的文章一般是重要的新发现或者新解释，LCR 值高的一般是综述类文章。
  - GCS = global citation score，即总引用频次，它表示这篇文章被整个 WOS 数据库中所有文献引用的次数。
  - LCS = local citation score，即本地引用次数，它表示这篇文章在当前数据集中被引用的次数。如果一篇文章的 LCS 值高，意味着它是领域内的重要文献。
  - LCR = local cited references，本地参考文献数，它表示这篇文献的参考文献在当前数据集中的数量，即这篇文献引用别人的情况。如果一篇文章的 LCR 值高，意味着它引用了大量的 领域内文献，极有可能是综述文章。
  - CR = cited references，参考文献数，它表示这篇文章的参考文献在整个 WOS 数据库中的数量。
- 通过界面上方的“Cited References” ，我们可以进入被引文献的列表。在这个列表中，我们发现很多文献后面都有个绿色的“+”号，这表明这篇文献并没有被本地数据集收录，也就是说通过关键词搜索并没有检索到的文献。每篇文献最后有个 Recs 值，表示这篇文献在当前数据集中被引频次，通过 Recs 排序，我们很快就可以定位重要的被遗漏的文献。
- 网络图中：圆圈越大被引次数越多，箭头指向的对象是被引用方

### Google scholar & WOF

Web of Science 是质量最高的文献索引网站，收录有 SCIE（SCI Expanded）和 SSCI 文献，使用方法前面教程有详细介绍。

[Google Scholar](https://scholar.google.com.sg/schhp?hl=zh-CN) 和 [ScienceDirect](http://www.sciencedirect.com/) 主要用来下载文献全文，不能翻墙的朋友可用 [Sci-Hub](https://sci-hub.org.cn/schhp?hl=zh-TW&as_sdt=0,5) 代替 Google scholar。

### Zotero

> 或类似知识管理软件

Zotero 是及其强大的知识管理软件，最大的亮点是：可以用 Zotero Connecter 插件在 Chrome 上一键保存网页中所有的文献、书籍、维基百科和对应 PDF。详细教程见[阳志平老师的博客](http://www.yangzhiping.com/tech/)。

## 案例：快速了解『财务预警』领域

> 在下的本科毕设

### 获取文献

#### 下载文献信息

在 Web of Science 核心合集中检索“bankruptcy prediction”、"Business Failure Prediction"或“financial distress prediction”，时间限定为 1985 年至今，共计 1983 篇文献。下载这些文献信息及参考文献的数据集（作为本地文献集），保存至 `TXT` 。

#### 手动添加遗漏文献

将这 1903 篇论文所引用的 38000 多篇论文，按照其在本地文献集的被引用次数从低到高排序，发现仍然有重要文献没有被之前搜索的三个关键词所覆盖。接着手动将遗漏的重要文献在 WOF 上逐一标记，一并导出添加到本地文献集中（实际操作中添加了 23 篇文献，多与企业信用评级相关），此时本地文献集覆盖了财务危机预警领域所有重要的文献（包括所有 SCI、IE 和 SSCI 文献）。

#### 分析领域发展趋势

利用 HistCite 软件对本地文献集进行分析，首先查看一下该领域的发展趋势（此处截取了 1985-2016 年的数据）。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/cy论文数统计.JPG)

上图显示，财务危机预警领域在 2004 年开始蓬勃发展，而且发展热度总体呈上升趋势。由此可猜测，该领域在 2004 年左右发生重大变革，实际去考察文献发现，该项变革是人工智能方法被引入该领域。

### 分析重要文献网络图

由领域总体发展的分析可得出，该领域值得关注的年份缩小到 2004-2017 年共 14 年的时间段里。然后从本地文献集筛选出发表于 2014 年之后的文献，统计这些文献各自被本地论文集引用的次数，对前 50 最高被引的文献，按照引用关系画出网络关系图。其中被引用次数越多的文献，其节点方框越大，节点按照引用文献指向被引用文献的方式连接。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/50afterlanguage&2004-.bmp)

有图可见**222 号**、319 号、**353 号**、439 号、**442 号**、**581 号**、813 号、**868 号**、**1133 号**是重要的综述文献；而 30 号、39 号、**68 号**、72 号、**77 号**、87 号、88 号、94 号、95 号、**162 号**、207 号、**222 号**、225 号、305 号、**314 号**、**319 号**、330 号、436 号、442 号、552 号、548 号是取得重要进展的文献（其中加黑的文献又相对更重要）。

用 Google scholar 搜索重要文献的 DOI，并一键保存至 Zotero。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Predicting_financial_distress_and_corporate_failure__A_review_from_the_state-of-the-art_definitions__modeling__sampling__and_featuring_approaches_-_ScienceDirect.png)

在 Zotero 显示如下：

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Zotero.png)

### 寻找牛人

重要文献太多了怎么办？根据人的记忆生存优势，按照学者来整理文献比较有利于记忆。领域内最靠谱的学者是那些呢？这里整理了领域内前 20 本地高被引的学者以及他们在本地文献集中所拥有的文献数和被本地文献集引用的次数总和。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/cy学者排名.JPG)

其中 Sun J 和 Li H 两位学者主要活跃于 2006 年至今，研究内容涉及领域的方方面面，Sun J 更是近 10 年只专注于该领域，而且两位学者的 H 指数也高达 20，因此两位学者是相当靠谱的；排在第三和第五的 Ravi V 和 Kumar PR 则主要活跃在 2006-2012 年，主要研究银行的财务危机预警；排在第四的 Tsai CF 活跃在 2008 年至今，主要研究财务指标等数据特征的选择。

在 [Google scholar citation](https://scholar.google.com/citations?mauthors=&hl=en&view_op=search_authors) 中搜索 Sun J，按右上角 Zotero Connector 文件图标，一键下载 Sun J 最高引的文献信息和 PDF。

### 近期分析

#### 分析近十年重要文献

以上分析会倾向于夸大 2008 年之前研究的重要性，因此需要在此按年份进行筛选。接下来筛选出 2008 年及以后的论文来分析，做前 40 最多被本地文献集引用的文献网络关系图。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/2008-.bmp)

此图涌现出了一个难以回避的信息，912 号（原来的 1133 号，其作者是 Sun J 等人）是及其重要的综述文献，通过它可以快速理清整个领域截止至 2014 年的发展情况。

#### 发现前沿

前辈们做了这么多研究，那还剩什么可以做呢？

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/2013-.bmp)

结合 2013 年至今的文献网络关系图，可总结为如下几个方向：

- 构建简单而准确的财务危机预警模型
- 构建动态财务预警模型
- 构建基于不平衡数据集的财务预警模型

## 延伸学习

[科学网—如何使用 CiteSpace 的一组示范及常见问题解答 - 陈超美的博文](http://blog.sciencenet.cn/blog-496649-838067.html)

## ChangeLog

- 2018-01-07 初稿
