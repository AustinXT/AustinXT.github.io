# 讲座记录：零基础网络数据分析入门


## 讲师介绍

刘勇，Gephi 官方认证讲师，数据可视化实践者，《网络数据可视化与分析利器：Gephi 中文教程》作者。

## 什么是网络数据

我们先来了解一下研究网络的学科——网络科学是什么。美国国家科研委员会（National Research Council）将网络科学定义为“研究物理，生物，和社会现象的网络化表达，建立针对这些象限具有预测效果的模型”的学科。网络数据则是对网络进行一种数字化的记录。网络科学的研究是以图论(数学的分支)为基础，在数据的记录上，也是以图论中图的数字化记录方式记录的。顶点和边是图论中最重要的两种元素，顶点的集合称作点集，边的集合称作边集，我们可以用点集和边集对图进行数字化记录。讲座介绍的 Gephi 也是基于这种方式，用节点表和边表来记录网络数据。

## Gephi 的基本介绍及基本操作

Gephi 是一款由法国工程师开发的用于探索与分析网络的开源工具软件，它是免费的而且支持多平台。

打开 Gephi，界面上会出现三个图窗来供我们选择。最常用的两个图窗是概览和数据资料，概览是 Gephi 数据可视化处理的主要环境，中间的图窗是是数据可视化的图形显示区域，左侧是用来改变图形的工具；数据资料图窗是用来查看、编辑和修改网络数据，该窗口与 Excel 类似。网络图可视化完成后，可以切换到预览图窗来导出图形文件。

## 案例：“16 国 32 媒”数据操作

该案例以 16 国的 32 家日报（每个国家选两家最重要的日报）为节点，以一家日报在五年时间内对两家日报的引用次数为有向边的权值，来生成一个网络。数据导入后，Gephi 的界面中间会出现一个难以辨析的初始网络图。接下来可以调整网络图的布局和外观，得到一个清晰以观察的网络图，也可以对数据进行统计计算。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Gephi1.JPG)

调整后便可得到一个清晰的网络图，可以看到最重要的节点是纽约时报、华盛顿邮报、卫报和泰晤士报，它们恰好也是全球最重要的四家日报。此外，我们还可以深入思考，引用关系究竟表明了什么含义，是贬义的还是褒义的？是正向的还是负向的影响？以及，这些媒体是不是有足够的代表性？

## 互动问答

> Q1：网络数据分析在我们日常生活中有哪些应用？

我们可以用 Gephi 来分析 Twitter 中好友和粉丝间的关系，看看哪些人是自己和一些朋友的共同好友，哪些人是自己的粉丝。

> Q2：Gephi 处理的最大数据量是多少，数据较多时有没有可视化的技巧？

Gephi 最大的数据处理量跟边的数量有很大的关系，官方公布的数据是 100,000 个节点和 1,000,000 条边。当数据较多时，可以用 Gephi 中的聚类算法将功能相近的节点聚合，这样网络图就会变得清晰一些。

## ChangeLog

- 2017-04-03 初稿
