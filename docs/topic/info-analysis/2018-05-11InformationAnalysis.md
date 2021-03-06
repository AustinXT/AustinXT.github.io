# 信息分析概论

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 什么是信息？

### 世界的构成：信息与物质

如果说世界由物质与构成，相比原始社会，现代社会信息比重越来越高。由学科的发展也可看出信息的地位在逐步攀升，例如，物理学在过去的几个世纪，都是科学中的中流砥柱，极大影响人的世界观，无数科学家耗尽一生去研究它，物理学也因此蓬勃发展，不断出现新的方程和定理。而对信息的系统研究，起始于上世纪香农的信息论，第一次对信息量进行度量。之后兴起的复杂科学、网络科学，如当初物理学对描述物质、能源的方程的诉求一样，正在诉求更多描述信息的方程，以适应信息爆炸式增长的新时代。

### 信息的定义

凡是在一种情况下能减少不确定性的任何事物都叫信息。 —— Shannon 《通信的数学理论》

例如，天气预报是一种信息。它不能 100% 预测未来，但能减少预测的不确定性。在天气多变的地区，依靠天气预报，人们可以更好地计划今天穿什么衣物。

又如，20世纪70时年代，著名的纽约地铁海报：if u cn rd ths, u cn gt a jb w hi pa! 你大概知道这句话的意思，但还是会对其他可能存疑，而完整的句子：If you can read this, you can get a job with hight pay! 能减少不确定性。

## 信息三个维度

### 最大信息熵原理 (MIP)

「熵」的概念最早来源于 19 世纪热力学研究。香农的信息概念建立在物理学家 Ludwig Boltzmann 提出熵的等式基础上，后者是热力学第二定律的组成部分。

在香农信息论中，「信息量」用「熵」来表达，表示的是某系统信息丧失或不确定性的一个度量。不确定性越大，信息量就越大，熵值越大；反之则越小。使得「熵」最大的事情，最有可能接近其真实状态。

此外，香农还定义了信息测量单位「比特」 —— 比特没有颜色、尺寸或重量，能以光速传播。它好比人体内的 DNA ，是信息的最小单位。

### 最省力原则 (LEP)

最早由语言学家乔治·K·齐夫（George Kingsley Zipf）在《最省力原则——人类行为生态学导论》提出。齐夫使用大量数学研究、语言学案例，在大时间周期，使用最省力原则才是取胜策略。

### 哥德尔不完备定律

哥德尔不完备定律包括两条。

- 第一条定理：任何相容的形式系统，只要蕴涵皮亚诺算术公理，就可以在其中构造在体系中不能被证明的真命题，因此通过推演不能得到所有真命题（即体系是不完备的）。

  例如，语言形式系统。国王公布一告示：不是好人不让进城门。

- 第二条定理：任何相容的形式系统，只要蕴涵皮亚诺算术公理，它就不能用于证明它本身的相容性。

哥德尔不完备定律直接开启了递归论、模型论等重要的逻辑学分支，直接启发图灵证明了停机定理。

如果要完全理解哥德尔不完备定律，推荐你阅读《哥德尔、艾舍尔、巴赫》。

## 信息分析流程

信息的目的是减少判断不确定性，增强决策准确性。具体来说包括确认事实，做出准确、可靠、有效的推理（包含假设、评估、结论、预测），辅助最终决策。

我们将信息分析流程拆解为关键四步：收集 - 整理 - 加工 - 输出报告。因运用场景不同，会有不同偏重。如寻找到目标客户联系方式，通常只需完成第一步；向上级汇报某产品市场需求分析，则需要全部四步。

![iaprogress.png](http://openmindclub.zoomquiet.top/InfoAnalysis/iaprogress.png)

## 信息素养

了解信息、信息系统重要原理，另一个关键概念「信息素养」也需你了解。

美国图书馆协会将信息素养 (Information Literacy) 定义为：认识到什么时候需要信息，有能力获取、评估、有效利用所需信息。

「有能力」三个字背后，暗示了你需要具备一系列能力：

- 具有怀疑精神，不轻信任何未被证实的信息
- 知晓获取信息的渠道和方法
- 知晓检验信息真实性的渠道和方法
- 寻找更多证据（实锤）支撑判断

当你看到朋友圈疯传的信息，要保持警惕 —— 它们有可能是假消息，很可能是以讹传讹。

比如：

- 杨绛先生去世当天，假语录刷屏
- 朋友圈刷屏「马克·扎克伯格的 26 张 PPT」并非扎克伯格制作

下一次，当你看到任何信息，不妨先自己搜一搜，验证信息是否可靠。

### 信息与理性

「信息分析」为什么是理性思维入门课？

在当今时代，智力的价值越来越高。多数人智力水平相差无几，信息水平却容易形成巨大差异。掌握信息数量、质量不同，最终决策也有差异。

工具理性强调把事情做对，广义理性强调把事情做好 —— 不仅关注能否完成，还关注事情本身是否正确。掌握更多必要、优质信息，更容易做出符合工具理性、广义理性的选择。

### 内隐知识工具化

内隐知识 (tacit knowledge) 是指实践性知识、常识、生活技巧、程序性和行为导向的知识，是以经验为基础，但难以完全表达的个人知识。

内隐知识难以通过搜索引擎直接检索出来。但好的专业软件通常内隐了大量知识。反向利用它们，你将习得大量内隐知识。

### 大时间周期习惯培养

习惯反映在个人行为上，就是细节与坚持。每一个细节比别人做得好一点，每一个好行动持续得更久一些。

好习惯会帮助你不经意间做出更好的选择，如此慢慢积累，形成巨大的优势。

比如：

- A 君习惯输入优质论文，B 君阅读微信公众号等媒体文章。十年之后，A 君占领了 10 个领域最优秀的信息源，B 君的大脑则充斥各种不成体系、低质量、甚至有害的信息。
- A 君习惯每天输出一张卡片，B 君只阅读不输出。十年之后，A 君拥有了 3000 多张卡片，消化了 3000 多个有价值的知识点；B 君阅读了很多书，但对知识的理解多是浮于表面。
- A 君习惯做更难的事情，B 君习惯遇到难的事情就放弃。十年之后，A 君能力大幅提升，能挑重任，B 君依然在当年水平徘徊。

具体目标常常跟随形势变动，好习惯更稳固。建立好习惯就是「以不变应万变」。

## 信息计量的六大数学原理

### 布拉德福定律(Bradford's law)

若将期刊按其刊载的某个领域的论文数递减排序，按照论文数把期刊三等分，则得到该领域的核心区、相关区和非相关区，三区的期刊数大约遵从 1:n:n^2 的比例关系。

启示：一个领域值得关注的期刊知识少数，了解一个领域应该关注核心区的期刊。

### 洛特卡定律 Lotka's law

发表1篇论文的作者占作者总数的60.79%，发表2篇论文的作者数量是发表1篇论文作者数量的1/4······发表n篇论文的作者数量是发表1篇论文作者数量的1/n^2。

启示：关注 H 指数高的作者

### 齐夫定律 Zipf's law

印象：在自然语言的语料库里，一个单词出现的频率与它在词频表里的排名成反比。频率最高的单词出现的频率大约是出现频率第二位的单词的2倍，而出现频率第二位的单词则是出现频率第三位的单词的1.5倍。

启示：找到每个领域最小知识集合，集合中的元素出现的频率总和会占到该领域总和的很大比例。

### 文献增长率（动态）

Price 定律《巴比伦以来的科学》，信息量随时间而不断增加的规律，一般认为，非科技文献每30～50年增加1倍，科技文献每10年左右增加1倍。

启示：找到每个领域最重要的实体，例如知识管理软件领域的 Zotero，Zotero 一定是信息爆炸最快的所在之一，跟随这样的实体一起成长一定错不了。

### 文献老化率（动态）

信息价值随时间推移而不断下降的规律。

启示：不同学科的文献的老化速度不一样，学习的策略也会不同，老化快的需要花更多的精力去关注领域的新事物。不同学科的文献的老化速度可参考普莱斯指数，一般来说，普莱斯指数越大，半衰期就越小，文献老化次速度就越快 。

### 信息计量的统一模型

待补

### 六原理的联系

布拉德福定律和洛特卡定律，描述的是信息在不同载体（例如期刊和人）中的密度分布规律，考虑的是一个领域内信息载体层面的问题。齐夫定律描述的是，不同信息在领域中重要性程度的分布规律，考虑的是信息个体层面的问题。文献增长率和老化率，描述的是一个领域内信息的总体变化，不同领域间存在差异，考虑的是领域内信息总体层面的问题。

## 信息分析的方法论

\* 课程中最重要的信息分析方法

\+ 比较反直觉，比较难学的方法 

|           分类           |                 要点                 |                           方法论                            |
| :----------------------: | :----------------------------------: | :---------------------------------------------------------: |
|         思想实验         |        悖论、抽象、对话、格言        |                价值链分析法；战略模型分析法                 |
|         符号思考         |        维度、变形、求解、定义        |               时间序列数据分析；模糊数学方法                |
|         实验科学         |         变量、控制、差异显著         |     \*方差分析法；\*多变量统计法；个人构念法；+Q 分类法     |
| 计算模拟（对模式的验证） |           编译、模式、规约           |                      +\*社会网络分析法                      |
|         田野调查         | 本位与客位、解释原始资料、方言、隐喻 | 扎根理论法；\*内容分析法、叙事分析法、德尔菲法、SWOT 分析法 |
|         多元认知         |         问题解决、跨界、模型         |         \*元分析法、+\*口语报告、\*竞争性假设分析法         |

以小明是不是好丈夫的研究为例：

- 扎根理论法：访谈小明的朋友
- 内容分析法：分析朋友圈内容
- 叙事分析法：听小明老婆叙述
- 德尔菲法：咨询婚恋专家
- SWOT 分析法：和其他男性对比

## 从高阶模型到实践策略

### 本体论（Ontology）

本体论又称存在论，是形而上学的基本分支，主要探讨实体的存在的问题。实体如何存在，实在在怎样的情况下不存在了？

本体工程，又称为本体论工程，是计算机科学与信息科学当中的一个新兴领域，旨在研究用于构建本体的方法和方法学。本体工程关注的是本体开发过程、本体生命周期、用于构建本体的方法和方法学以及那些用于支持这些方面的工具套装和语言。

#### 如何用本体论构建一个世界？

建构实体-->创建分类-->建构关系-->创建实例

构建世界时需要注意的原则：

- 唯一实体原则：唯一编码，用于定位，避免语义的多重性
- 可供性原则：人与环境的生态关系，是否提供了稳定的交互方式，稳定的交互方式更易产生新的信息
- CRUD：个人的 CURD 和组织的 CURD

例子：构建只有书的世界

- 概念模型（Conceptualization）：设计唯一编码，赋予书更多属性
- 明确化（Explicit）：有些属性是外显的，有些是内隐的，把能外显的外显
- 形式化（Formal）：用什么格式去表示书？例如01编码、SECS Message Language (SML)
- 共享（Share）：书与书如何交换？

四步走完就是计算机中的规范：MARC、BIBFRAME

#### 例子：Zotero

- 实体：条目（此处找实体考虑到了社会意向性，最好在2~4个度，这里是三个度：业务中遇到的具体一本书-->书籍-->条目）
- 分类：书籍、期刊文章等
- 协议：CSL、WebDAV、worldcatlibraries OpenURL 解析器等
- 实例：具体条目

CRUD：文献库操作（个人记忆的快速提取）和群组的操作（正式立项的项目的协作）

很好解决了实体与实例的矛盾，对信息的抽象越高，对具体信息的保真度越差。Zotero 处理书籍、论文的颗粒度大，对信息划分精细。

参考：

- [本体论 - Wikiwand](https://www.wikiwand.com/zh/%E6%9C%AC%E4%BD%93%E8%AE%BA)
- [本体工程 - Wikiwand](https://www.wikiwand.com/zh/%E6%9C%AC%E4%BD%93%E5%B7%A5%E7%A8%8B)
- [本体 (信息科学) - Wikiwand](https://www.wikiwand.com/zh/%E6%9C%AC%E4%BD%93_(%E4%BF%A1%E6%81%AF%E7%A7%91%E5%AD%A6))

### 信息分析的不二法门：借助本体论构建最省力的方法

1. 快速发现任意一个领域的实体，以及实体的编码规律、交互原则、共享机制、聚集场所
2. 快速理解该领域的信息实例化机制，以及该实例化机制处理的层次、颗粒度等等，并从中寻找到破解机制，反推实体规律
3. 将实体、实例化规则总结为人脑好记忆、提取的东西

## ChangeLog

2018-05-04 初稿