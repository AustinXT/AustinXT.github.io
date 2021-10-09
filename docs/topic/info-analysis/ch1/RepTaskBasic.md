# 人工智能领域的全局认识

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [0. 摘要](#0-%E6%91%98%E8%A6%81)
- [1. 背景](#1-%E8%83%8C%E6%99%AF)
- [2. 分析过程](#2-%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B)
  - [2.1 思路](#21-%E6%80%9D%E8%B7%AF)
  - [2.2 具体步骤](#22-%E5%85%B7%E4%BD%93%E6%AD%A5%E9%AA%A4)
- [3. 结论](#3-%E7%BB%93%E8%AE%BA)
- [4. 讨论](#4-%E8%AE%A8%E8%AE%BA)
  - [4.1 对结论的讨论](#41-%E5%AF%B9%E7%BB%93%E8%AE%BA%E7%9A%84%E8%AE%A8%E8%AE%BA)
  - [4.2 可优化的环节](#42-%E5%8F%AF%E4%BC%98%E5%8C%96%E7%9A%84%E7%8E%AF%E8%8A%82)
  - [4.3 收获：开放获取期刊初体验](#43-%E6%94%B6%E8%8E%B7%E5%BC%80%E6%94%BE%E8%8E%B7%E5%8F%96%E6%9C%9F%E5%88%8A%E5%88%9D%E4%BD%93%E9%AA%8C)
  - [4.4 收获：寻找优质资源遇见更多优质资源](#44-%E6%94%B6%E8%8E%B7%E5%AF%BB%E6%89%BE%E4%BC%98%E8%B4%A8%E8%B5%84%E6%BA%90%E9%81%87%E8%A7%81%E6%9B%B4%E5%A4%9A%E4%BC%98%E8%B4%A8%E8%B5%84%E6%BA%90)
- [5. 参考文献](#5-%E5%8F%82%E8%80%83%E6%96%87%E7%8C%AE)
- [ChangeLog](#changelog)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 0. 摘要

从 Google Scholar 获取大牛名称，从大牛的主页获取五位领域大牛的所有论文；从知网获取中文硕博论文；从 Google Scholar 和 Journal Rankings 获取顶级期刊名称，从其中的开方期刊获取它的订阅。

## 1. 背景

> ch1 基础任务：运用至少两种实践策略，形成对「心理学」或自己感兴趣领域的全局认识，记录探索过程，完成一份信息分析报告。
>
> 注意：使用的实践策略中须包含「获取该领域中文所有硕博论文」。

## 2. 分析过程

### 2.1 思路

学前思考：

- 如何做到全局认识具有较好的保真性？

- 之前写毕业论文的时候，做了[财务预警领域的全局认识](http://matrixxt.com/learning/2018/01/07/how-to-enter-into-a-new-academic-realm/)，当时的方法是

  1. 用三个关键词的或表达式在 WOF 检索论文，导出所有论文的记录
  2. 用罗绍峰老师推荐的 HistCite ，添加遗漏的文献；统计不同作者的文献频次，找到领域大牛；建立文献引用网络图，找出最重要的综述文献
  3. 从综述文献和大牛发表论文的变化，了解了领域已有的研究和前沿

  由于之前做的领域极小，WOF 核心期刊中仅有2000篇论文与领域相关，所有能用几个关键词去获取领域的全部文献，但此法用在这里可能就不适用了

- 没有想到清晰的实践步骤

思路：

1. 占有全局信息：获取前42大牛的论文、获取中文硕博论文、获取顶级期刊论文
2. 获取最小知识：源头论文、发展脉络、反驳观点

### 2.2 具体步骤

1. （耗时2.5h）获取领域大牛排名：[Profiles](https://scholar.google.com/citations?view_op=search_authors&hl=en&mauthors=label:artificial_intelligence)，挑选第一页5位听过的学者，批量下载他们的论文，以[Geoffrey Hinton](https://scholar.google.com/citations?user=JicYPdAAAAAJ&hl=en)为例：

   1. 维基百科一下学者的名字：[杰弗里·辛顿 - Wikiwand](https://www.wikiwand.com/zh/%E6%9D%B0%E5%BC%97%E9%87%8C%C2%B7%E8%BE%9B%E9%A1%BF)，是机器学习领域的加拿大首席学者，确定是大牛没错

   2. 点击 wiki 页面最下方的外部链接，到达他的个人主页：[Home Page of Geoffrey Hinton](http://www.cs.toronto.edu/~hinton/)

   3. 找到 Publication 页[Geoffrey E. Hinton's Publications: in reverse chronological order](http://www.cs.toronto.edu/~hinton/papers.html)，用 chrono 批量下载

   4. 下载后拖入 Zotero 对应的目录

      ![](http://images.austinxt.com/Zotero237466892.png)

2. （耗时0.5h）下载硕博论文

   1. 在知网首页打开硕博论文的检索页，选择人工智能这一学科，直接点击检索。勾选需要的结果

      ![](http://images.austinxt.com/435234534523.png)

   2. 导出文献

      ![](http://images.austinxt.com/42532542345.png)

   3. 将下载下来的 txt 格式的文件导入 EndNote，注意从 Option 选择导入的文件格式

   4. 从 Endnote 导出所有条目，格式为 XML，在从 Zotero 导入 XML 文件（不能拖入），得到![](http://images.austinxt.com/92749083593.png)

   5. 挑选感兴趣的标题，读一下摘要，获取信息点

3. （耗时2h）查找顶级期刊：

   1. 获取期刊排名：期刊的排名从两处获取：Google 的期刊排名（即模板的Top20-ArtificialIntelligence）和[Journal Rankings on Artificial Intelligence](http://www.scimagojr.com/journalrank.php?area=1700&category=1702)

   2. 挑选感兴趣的主题，例如 arXiv Artificial Intelligence (cs.AI)，恰好是开源库，搜索到期刊的主页[Artificial Intelligence authors/titles recent submissions](https://arxiv.org/list/cs.AI/recent)

   3. 在[arXiv.org e-Print archive](https://arxiv.org/)的最下方，点击 Feeds

      ![](http://images.austinxt.com/73450972.png)

   4. 获取订阅的 URL：http://export.arxiv.org/rss/cs.AI

   5. 在 Zotero 里订阅，点击方框-->新建订阅-->来自 URL，输入 URL，保存

      ![](http://images.austinxt.com/347985273.png)

4. 获取最小知识，待补充

## 3. 结论

占有了所有中文重要硕博论文，以及5位领域内大牛的所有论文，顺带关注了几个实验室和领域相关的经典论文[www.mlsurveys.com](http://www.mlsurveys.com/)。还未找出最小知识。

## 4. 讨论

### 4.1 对结论的讨论

- 中文硕博论文的元数据可在知网一处获取，较为容易，对于感兴趣的论文，也可借助学校的 VPN 获取资源。

- 大牛大多都不认识，未找到几个靠谱的排行榜进行交叉验证（只找到[Artificial Intelligence: Top 100 Influencers, Brands and Publications 2017](http://www.onalytica.com/blog/posts/artificial-intelligence-2017-top-100-influencers-brands-and-publications/)和[AI Influencers 2017: Top 30 people in AI you should follow on Twitter - Watson](https://www.ibm.com/blogs/watson/2017/02/ai-influencers-2017-top-25-people-ai-follow-twitter/)，混杂了企业家和科幻小说家），等对领域更加熟悉后再继续进行。

- 顶级期刊，论文数量远大于前两者，arxiv 等开发资源可借助网友提供的工具批量获取，例如[Arxiv Sanity Preserver](http://www.arxiv-sanity.com/)。但这么多的论文不知道怎么去管理，可能需要借助 Citespace 等知识图谱工具。人工智能领域与之前接触的财务管理领域不同，该领域顶级会议的论文似乎是最重要的，比期刊更加重要，因此要关注会议。从 [dblp: computer science bibliography](https://dblp.uni-trier.de/)获取的统计也证实了这一点。

  ![](http://images.austinxt.com/dblp__Distribution_of_publication_type.png)

### 4.2 可优化的环节

获取大牛的论文太耗时了，等对领域更熟悉之后，可整理出一个排名，然后 Google：XXX + Publications，快速找到大牛的论文

### 4.3 收获：开放获取期刊初体验

做作业的没忍住，了解了一下[arXiv.org e-Print archive](https://arxiv.org/)，arxiv 收录了数学/物理/计算机/统计等领域的论文，其他领域也有相似的开放期刊获取，参见[List of open access journals - Wikiwand](https://www.wikiwand.com/en/List_of_open_access_journals)。在开源数据库检索论文，会比 Google Scholar 的论文质量更高，更相关，时效性也更好。

### 4.4 收获：寻找优质资源遇见更多优质资源

用英文检索大牛和顶级期刊时，很多网页点进去，发现很多没见过，但被 Zotero Translators 收录的网页。大牛的主页也有很多优质资源，例如实验室、研究项目、课程、书籍、论文等等。

## 5. 参考文献

- [Profiles](https://scholar.google.com/citations?view_op=search_authors&hl=en&mauthors=label:artificial_intelligence)
- [中国知网](http://cnki.net/)
- [Journal Rankings on Artificial Intelligence](http://www.scimagojr.com/journalrank.php?area=1700&category=1702)
- [www.mlsurveys.com](http://www.mlsurveys.com/)
- [arXiv.org e-Print archive](https://arxiv.org/)
- [List of open access journals - Wikiwand](https://www.wikiwand.com/en/List_of_open_access_journals)
- [如何学习科学：开放科学工具箱 - 阳志平的网志](https://www.yangzhiping.com/psy/open-science-toolbox.html)
- [免费知识哪里来——Arxiv使用指南 – ThoughtWorks洞见](https://insights.thoughtworks.cn/how-to-use-arxiv/)

## ChangeLog

2018-05-10 初稿