# 挖掘 AceMap 和 Altmetric 信息点，以及批量获取

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [0. 摘要](#0-%E6%91%98%E8%A6%81)
- [1. 背景](#1-%E8%83%8C%E6%99%AF)
- [2. 分析过程](#2-%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B)
  - [2.1 思路](#21-%E6%80%9D%E8%B7%AF)
  - [2.2 具体步骤](#22-%E5%85%B7%E4%BD%93%E6%AD%A5%E9%AA%A4)
    - [论文一：Automatic Diﬀerentiation in Machine Learning: a Survey](#%E8%AE%BA%E6%96%87%E4%B8%80automatic-di%EF%AC%80erentiation-in-machine-learning-a-survey)
    - [论文二：Information-Geometric Optimization Algorithms: A Unifying Picture via Invariance Principles](#%E8%AE%BA%E6%96%87%E4%BA%8Cinformation-geometric-optimization-algorithms-a-unifying-picture-via-invariance-principles)
    - [论文三：Ontology learning from text: A look back and into the future](#%E8%AE%BA%E6%96%87%E4%B8%89ontology-learning-from-text-a-look-back-and-into-the-future)
- [3. 结论](#3-%E7%BB%93%E8%AE%BA)
- [4. 讨论](#4-%E8%AE%A8%E8%AE%BA)
  - [4.1 对结论的讨论](#41-%E5%AF%B9%E7%BB%93%E8%AE%BA%E7%9A%84%E8%AE%A8%E8%AE%BA)
  - [4.2 可优化的环节](#42-%E5%8F%AF%E4%BC%98%E5%8C%96%E7%9A%84%E7%8E%AF%E8%8A%82)
  - [4.3 收获：获取论文相关的实践](#43-%E6%94%B6%E8%8E%B7%E8%8E%B7%E5%8F%96%E8%AE%BA%E6%96%87%E7%9B%B8%E5%85%B3%E7%9A%84%E5%AE%9E%E8%B7%B5)
- [5. 参考文献](#5-%E5%8F%82%E8%80%83%E6%96%87%E7%8C%AE)
- [ChangeLog](#changelog)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 0. 摘要

该报告分为两部分：

- 一是对一篇论文的引用数据深入挖掘：借助 Altmetric，从 Twitter 和 Wikipedia 找到可用的信息；借助 AceMap 的 Mentorship 栏目，将论文与已知的学者建立联系。
- 用爬虫抓取 Google Scholar、 AceMap 和 Altmetric 三个网站的引用数据，以便筛选出重要的论文。这里用 Python 获取 Altmetric API 数据，而不是用 R。

## 1. 背景

> ch2 检索实操题：请从查询一本你感兴趣的英文期刊，从 2018 年发表的论文中任选三篇自己感兴趣的，检索它的学术引用和社会引用数据，形成一份信息报告。

## 2. 分析过程

### 2.1 思路

1. 挑选一本英语期刊中的三篇论文
2. 查找学术引用数据，可用 AceMap
3. 查找社会引用数据，可用 Almetric

### 2.2 具体步骤

#### 论文一：Automatic Diﬀerentiation in Machine Learning: a Survey

1. 之前从 Google Scholar --> Metrics --> Top publication 获取了 Top 20 Artificial Intelligence Journal List，选择其中的 Journal of Machine Learning Research，Google 之，进入其官网 [Journal of Machine Learning Research Homepage](http://www.jmlr.org/)。

2. 点击 Papers --> Volume 18，到达页面如下，用Chrome 的插件 chrono 批量下载论文。

   ![](http://images.austinxt.com/6598638534.png)

3. 选择一篇能读懂摘要的论文：Automatic Diﬀerentiation in Machine Learning: a Survey，去[Acemap](http://acemap.sjtu.edu.cn/)搜索该篇论文的标题，得到搜索结果：

   ![](http://images.austinxt.com/394570932745.png)

4. 信息不多，而且这篇在 JMLR 2018年发表的论文，在2015年就已经发表了（可见计算机领域，期刊论文会滞后）。去看一下四位作者，一次点击四位作者，其中有两位有较高的 Hindex，分别为23和16。其中一位作者的页面如下图，右侧的合作者关系图能找到该篇论文四位作者中的三位（Acemap也会遗漏信息）。

   ![](http://images.austinxt.com/382639485.png)

5. 点击 Mentorship 右侧的 More，进入师徒关系的大图，调整后得到下图，其中一作和三作是四作的学生，是二作的徒孙，而二作是 Hinton 老先生的学生。 Hinton 是反向传播算法和对比散度算法的发明人之一，也是深度学习的积极推动者，领域中的顶级学者。此时将该篇论文归类到 Hinton 门下，我们对它就没那么陌生了。

   ![](http://images.austinxt.com/590830984579.png)

6. 该论文在 Acemap 的引用数为0，此时没有获取到所需的信息，再去 Google Scholar 查看它的引用数，如图：

   ![](http://images.austinxt.com/72345709374059.png)

7. 在[[1502.05767] Automatic differentiation in machine learning: a survey](https://arxiv.org/abs/1502.05767)点击 Almetric 书签，页面右上角出现下图，指数为75，有料！

   ![](http://images.austinxt.com/34597345.png)

8. 点击 Click for more details，进入详情页，可以看出该论文的影响力蛮强的，排名在前5%-10%。

   ![](http://images.austinxt.com/857347598234509.png)

9. 从详情页的左侧可看到，Twitter 提及该篇论文113次，点开查看。往下拉发现了一个信息点，一群人在转发同一条一条推特，跟 PyTorch 有关，这条推特是 Soumith Chintala 发出的，其关注人数达4万+，应该是重要的人物。

   ![](http://images.austinxt.com/7394875932478.png)

10. 点击进入 Soumith 的推特主页，发现他是 PyTorch 的创始人，该篇论文应该有助于开发 PyTorch 的Automatic Diﬀerentiation 功能。

   ![](http://images.austinxt.com/752309457235.png)

11. 点击进入 Wikipedia 栏目，有一次引用如图。Automatic Diﬀerentiation 是评价 Deep Learning Software 的一项重要指标，而 Automatic Differentiation 概念来自气象学等领域， Automatic Diﬀerentiation in Machine Learning: a Survey 这篇论文清晰的阐述了机器学习中 the main differentiation techniques and their interrelationships。

    ![](http://images.austinxt.com/394579324.png)

#### 论文二：Information-Geometric Optimization Algorithms: A Unifying Picture via Invariance Principles 

1. 在 acemap 检索标题，获取引用数为 **Citations:** 18
2. 在 Google Scholar 检索标题，获取引用数为 94
3. 在论文的 publisher site: [PDF for 1106.3708v3](http://cn.arxiv.org/pdf/1106.3708v3.pdf)，点击 altmetric 书签，获得 Attention Score：9

#### 论文三：Ontology learning from text: A look back and into the future

1. 在 acemap 检索标题，查无此论文
2. 在 Google Scholar 检索标题，获取引用数为 273
3. 在论文的 publisher site: [Ontology learning from text](https://dl.acm.org/citation.cfm?id=2333115)，点击 altmetric 书签，获得 Attention Score：4

## 3. 结论

- Automatic Diﬀerentiation 是评价 Deep Learning Software 的一项重要指标，而 Automatic Differentiation 概念来自气象学等领域， Automatic Diﬀerentiation in Machine Learning: a Survey 这篇论文清晰的阐述了机器学习中 the main differentiation techniques and their interrelationships。PyTorch 的创始人推荐他的团队关注这篇论文，PyTorch 的 Automatic Diﬀerentiation 功能应该与这篇论文有关系。这篇论文的作者是 Hinton 的门徒。
- 从 Zotero 导出论文条目数据，格式为 CSL JSON，用爬虫抓取 Google Scholar、 AceMap 和 Altmetric 三个网站的引用数据（只写了[ Jupyter Notebook](https://github.com/MatrixXT/IA001/blob/master/ch2/getCitations.ipynb)，待写成脚本），部分结果如下：

| publish_year                                                                | gs_citation | acemap_citation | altmetric_score | top_all | top_journal | altmetric_url |                                                   |
| --------------------------------------------------------------------------- | ----------- | --------------- | --------------- | ------- | ----------- | ------------- | ------------------------------------------------- |
| title                                                                       |             |                 |                 |         |             |               |                                                   |
| Context based object categorization: a critical survey                      | 2010        | 281             | 81              | 6       | 0.17        | 0.09          | http://www.altmetric.com/details.php?citation_... |
| A review of machine learning for automated planning                         | 2012        | 42              | 4               | None    | None        | None          | None                                              |
| Regret analysis of stochastic and nonstochastic multi-armed bandit problems | 2012        | 909             | None            | 3       | 0.27        | 0.81          | http://www.altmetric.com/details.php?citation_... |
| Kernels for vector-valued functions: a review                               | 2011        | 204             | 21              | 4.5     | 0.22        | 0.11          | http://www.altmetric.com/details.php?citation_... |
| An introduction to conditional random fields                                | 2010        | 704             | 61              | 15.7    | 0.07        | 0.02          | http://www.altmetric.com/details.php?citation_... |
| Randomized algorithms for matrices and data                                 | 2011        | 440             | 37              | 41.5    | 0.03        | 0.01          | http://www.altmetric.com/details.php?citation_... |
| A few useful things to know about machine learning                          | 2012        | 1045            | 110             | 24.31   | 0.04        | 0.02          | http://www.altmetric.com/details.php?citation_... |
| Translation techniques in cross-language information retrieval              | 2012        | 45              | 77              | 9.064   | 0.12        | 0.09          | http://www.altmetric.com/details.php?             |

## 4. 讨论

### 4.1 对结论的讨论

- 在查找学术引用数据的时候，一开始挺沮丧的，论文引用次数为0。做下去之后，信息越来越丰满，也大致了解了这篇论文在领域中的作用和 Automatic Diﬀerentiation 这个知识点，在下也因这些信息记住了这篇论文。下次需要深入理解 Automatic Diﬀerentiation 或遇到比较不同的深度学习软件，可以从这篇论文开始。

- 手动一篇篇去获取引用数据还是比较繁琐，批量获取可节省时间，只需从结果中选择被引数较高的论文，点开查看。不过也有不足的地方，获取 Altmetric 数据要求有唯一编码，Altmetric id、doi、ads、arxiv、pmid 中的一种。

### 4.2 可优化的环节

步骤2，实践后得知，批量下载再导入 Zotero 的论文， 抓取 PDF 元数据时不能获取年份。更好的做法是获取左下角 RSS 的URL，在 Zotero 新建订阅，再批量添加到 Library 的对应目录下。

![](http://images.austinxt.com/759873045032.png)

### 4.3 收获：获取论文相关的实践

从 Altmetric，可挖掘出学界以外的人士对论文的反应。一般，有一群人不断转发同一条 Twitter 等的信息，意味着一个团体（可能是一个项目的不同成员）在关注该论文，而这个项目就是一种实践。

## 5. 参考文献

* [GitHub - lnielsen/python-altmetric: Altmetric API v1 wrapper for Python](https://github.com/lnielsen/python-altmetric)
* [Altmetric API Support – Altmetric](https://www.altmetric.com/support/almetric-api/)
* [Getting Started | Altmetric API documentation](http://api.altmetric.com/)

## ChangeLog

2018-05-19 初稿