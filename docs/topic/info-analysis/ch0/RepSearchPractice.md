# 寻找 w 开头的全球书籍搜索网站

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [0. 摘要](#0-%E6%91%98%E8%A6%81)
- [1. 背景](#1-%E8%83%8C%E6%99%AF)
- [2. 分析过程](#2-%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B)
  - [2.1 三种思路](#21-%E4%B8%89%E7%A7%8D%E6%80%9D%E8%B7%AF)
  - [2.2 具体步骤](#22-%E5%85%B7%E4%BD%93%E6%AD%A5%E9%AA%A4)
- [3. 结论](#3-%E7%BB%93%E8%AE%BA)
- [4. 讨论](#4-%E8%AE%A8%E8%AE%BA)
  - [4.1 对结论的讨论](#41-%E5%AF%B9%E7%BB%93%E8%AE%BA%E7%9A%84%E8%AE%A8%E8%AE%BA)
  - [4.2 可优化的环节](#42-%E5%8F%AF%E4%BC%98%E5%8C%96%E7%9A%84%E7%8E%AF%E8%8A%82)
  - [4.3 收获：用同类词思考搜索目标的所在](#43-%E6%94%B6%E8%8E%B7%E7%94%A8%E5%90%8C%E7%B1%BB%E8%AF%8D%E6%80%9D%E8%80%83%E6%90%9C%E7%B4%A2%E7%9B%AE%E6%A0%87%E7%9A%84%E6%89%80%E5%9C%A8)
  - [4.4 压力测试](#44-%E5%8E%8B%E5%8A%9B%E6%B5%8B%E8%AF%95)
- [5. 参考文献](#5-%E5%8F%82%E8%80%83%E6%96%87%E7%8C%AE)
- [ChangeLog](#changelog)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## 0. 摘要

一开始将 w 联想成 world 的缩写，在 Google 结合 intitle: world、inurl: www.world、“”、-amazon，检索 book information，注意到了 worldcat，并且发现 worldcat 被 Zotero Translater 收录。然后去[zotero/translators: Zotero Translators](https://github.com/zotero/translators)查找 w 开头的网站，发现只有 worldcat 符合。用 worldcat 网站的功能和 Wikipedia 介绍，来检验答案。

## 1. 背景

> ch0 检索实操题：有一个 w 开头的网站，可以搜索全球书籍信息。尝试找到这个网站，并记录你的检索时间和过程。完成 300 字左右的信息分析报告。

## 2. 分析过程

### 2.1 三种思路

- Google搜索：世界书籍信息网站，并不断调整中文关键词，尤其要用非逻辑排除豆瓣、亚马逊等网站

- Google搜索：世界书籍信息网站 AND "w*"，并不断调整中文关键词
- Google 搜索：world book information AND "w*"，并不断调整关键词

### 2.2 具体步骤

1. 明确检索目的：根据题目可获得两个信息：全球书籍信息网站、以 w 开头的网站
2. 选择检索工具：因为搜索对象是网站，所以选择用 Google Search 搜索
3. 确定关键词：推测 “w” 是 “world” 的缩写，因此尝试搜索：世界书籍信息网站
4. 筛选检索结果：检索第一条是[World Digital Library Home](https://www.wdl.org/en/)，资源不多，感觉不是特别满意
5. 调整检索策略：由于第一页的其他条目几乎不相关，直接跳到思路三，用英文搜索
6. 进行下一次检索：一次尝试
   1.   尝试锁定标题含“world”，Google检索：book information  intitle: world，第一页得到[World Book Encyclopedia 2018](https://www.worldbook.com/world-book-encyclopedia-2018)、[The World Book encyclopedia. (图书, 2015) [WorldCat.org]](http://www.worldcat.org/title/world-book-encyclopedia/oclc/884570974)、[Google Services And Products/Search - Wikibooks, open books for an open world](https://en.wikibooks.org/wiki/Google_Services_And_Products/Search)三个备选结果，查看网站首页，快速排除第一和第三，保留 [WorldCat.org:世界上最庞大的图书馆目录](https://www.worldcat.org/)。
   2. 前一次的检索结果是具体书籍的信息，因此加上另一本书书名去检索，Google检索："The Moon and Sixpence" book information -amazon intitle:world，第一页得到[The Moon and Sixpence by W. Somerset Maugham | World of rare Books.com](https://www.worldofbooks.com/the-moon-and-sixpence-by-w-somerset-maugham-9672027.html)、[The Moon And Sixpence by Maugham, Somerset. | World of rare Books.com](https://www.worldofrarebooks.com/the-moon-and-sixpence-by-maugham-somerset-1373510.html)都是卖书网站，排除该方案
   3. 尝试锁定URL含“www.world”检索：book information  inurl: world，依然是[World Book Encyclopedia 2018](https://www.worldbook.com/world-book-encyclopedia-2018)、[The World Book encyclopedia. (图书, 2012) [WorldCat.org]](http://www.worldcat.org/title/world-book-encyclopedia/oclc/746316064)、[Google Services And Products/Search - Wikibooks, open books for an open world](https://en.wikibooks.org/wiki/Google_Services_And_Products/Search)，此时发现 worldcat 被 Zotero Connecter 收录，确定 worldcat 是较理想的备选答案
   4. 去[zotero/translators: Zotero Translators](https://github.com/zotero/translators)，页面定位到" w"字母，得到备选结果Wiley Online Library、Winnipeg Free Press、WorldCat Discovery Service，若网站没有被 Zotero Translater 收录，它一定没那么重要，因此基本确定答案是三者之一。打开三个网站的首页，保留 worldcat。

## 3. 结论

用不同方法检验一下  [WorldCat.org:世界上最庞大的图书馆目录](https://www.worldcat.org/) 的正确性：

- 在 worldcat.org 中搜索：创新算法，有结果
- 在 Wikipedia 中搜索：worldcat，[WorldCat - Wikiwand](https://www.wikiwand.com/en/WorldCat)信息基本符合
- 以及之前“被 Zotero Translater 收录”这一筛选条件

确定答案为 worldcat.org

## 4. 讨论

### 4.1 对结论的讨论

筛选网站的主要依据是：是否被 Zotero Translater 收录，万一正确答案并没有被 Zotero Translater 收录呢？分析之后可以看出，worldcat 极其符合要求，不太可能有其他答案，如果有，那也是题目的问题。

### 4.2 可优化的环节

一开始未联系起常用的豆瓣读书与搜索目标的关系，豆瓣是搜索大陆书籍信息，搜索目标是全球版的豆瓣读书，豆瓣读书被 Zotero Translater 收录，那搜索目标是否也被 Zotero Translater 收录呢？

将 w 假定为 world 的缩写确实能过滤掉不少噪音，但也容易遗漏其他可能，不能应用在答案不唯一的场景。

用网络爬虫查找会怎样？可以精确筛选出，标题以 w 开头的网站。

### 4.3 收获：用同类词思考搜索目标的所在

因为题目不是要求你寻找信息（例如 Apple 的所有产品是什么），而是寻找某种东西（例如在家里找钥匙）。该实践用到的方法也因此不是检索，而是联系起一个你熟悉的类似的东西，这里是豆瓣读书，问自己，哪里会有这里东西的目录？直接去这些目录去寻找答案。

### 4.4 压力测试

如何查找 w 或其他字母开头的某类网站（或某种其他东西）？如何已知少量信息的某类网站（或某种其他东西）？此时，对目标会有一定的认知，也会知道一些类似的东西，或许不是非常类似；思考会收录类似东西的目录有吗？如果有，且搜索目标在该类东西中也是很重要的，那么很有可能会找到目标。

## 5. 参考文献

- 收录书籍、文献、wiki等数据库的目录：[zotero/translators: Zotero Translators](https://github.com/zotero/translators)

## ChangeLog

2018-05-04 初稿