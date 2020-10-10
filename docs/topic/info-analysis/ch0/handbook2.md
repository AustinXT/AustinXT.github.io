# 检索技巧

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [完整检索流程（自检清单）](#%E5%AE%8C%E6%95%B4%E6%A3%80%E7%B4%A2%E6%B5%81%E7%A8%8B%E8%87%AA%E6%A3%80%E6%B8%85%E5%8D%95)
- [基本检索技巧](#%E5%9F%BA%E6%9C%AC%E6%A3%80%E7%B4%A2%E6%8A%80%E5%B7%A7)
  - [布尔逻辑](#%E5%B8%83%E5%B0%94%E9%80%BB%E8%BE%91)
  - [精准检索和模糊检索](#%E7%B2%BE%E5%87%86%E6%A3%80%E7%B4%A2%E5%92%8C%E6%A8%A1%E7%B3%8A%E6%A3%80%E7%B4%A2)
  - [以图搜图](#%E4%BB%A5%E5%9B%BE%E6%90%9C%E5%9B%BE)
- [调整关键词](#%E8%B0%83%E6%95%B4%E5%85%B3%E9%94%AE%E8%AF%8D)
- [更多 Web 高级检索技巧](#%E6%9B%B4%E5%A4%9A-web-%E9%AB%98%E7%BA%A7%E6%A3%80%E7%B4%A2%E6%8A%80%E5%B7%A7)
- [ChangeLog](#changelog)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 完整检索流程（自检清单）

![ia0wsearchprogress.jpg](http://cardstatic.openmindclub.com/InfoAnalysis/ia0wsearchprogress.jpg)

## 基本检索技巧

### 布尔逻辑 

以 Google Search 为例：

| 布尔逻辑 |        与         |                或                |           非           |
| :------: | :---------------: | :------------------------------: | :--------------------: |
| 检索符号 |      AND、&       |                OR                | -(-前有空格，后无空格) |
|   例子   | 北京大学 AND 深圳 | 财务危机 OR 财务困境 OR 企业破产 |      Git -GitHub       |

多种检索式可以组合使用，例如：新一线城市 AND 杭州 AND 成都 -武汉 -重庆；周杰伦 AND 演唱会 AND (北京 OR 广州)

### 精准检索和模糊检索

如果要搜索指定网页中的内容，或按某种特定格式检索，如何实现呢？如果要搜索的内容记不准确，或只有模糊的碎片，如何表达模糊的关键词？有些技巧可以上可精确、下可模糊，收放自如。

|             功能             |          符号          |                         使用规则                         |
| :--------------------------: | :--------------------: | :------------------------------------------------------: |
|           精准搜索           |           ""           |                        "创新算法"                        |
| 在网页标题、链接和主体中搜索 | intitle；inurl；intext |          intitle:"创新算法"； inurl:"创新算法"           |
|        在指定网站搜索        |          site          | site:douban.com/doulist/ 机器学习；"科学发展观" site:gov |
|         指定类型搜索         |        filetype        |                 "创新算法" filetype:pdf                  |
|           模糊匹配           |           *            |                      第*届奥斯卡奖                       |

更多技巧：

- [File types indexable by Google - Search Console Help](https://support.google.com/webmasters/answer/35287?hl=en)
- [Refine web searches - Google Search Help](https://support.google.com/websearch/answer/2466433?hl=en)
- [Google 高级搜索](https://www.google.com.hk/advanced_search?gws_rd=cr)
- [Google 高级图片搜索](http://www.google.com.hk/advanced_image_search?gws_rd=cr)

### 以图搜图

常见应用场景：

- 用旅游照片搜景点地名

- 用剧照找到电影名称
- 识别他人头像出处、是否情侣头像
- 搜索产品图片了解相关报道

常用的图片搜索引擎：

- [Google 图片](https://www.google.com.hk/imghp?hl=zh-CN&gws_rd=cr,ssl)
- [淘宝网 - 淘！我喜欢](https://www.taobao.com/)

## 调整关键词

搜索过程中反复调节关键词，可以导向更相关的结果。

- 搜索前思考最能搜索主题的关键词是什么。
- 使用上位词、同义词、下位词、换为英文关键词，进行搜索（可借助工具获取关键词）。
- 将复合名词拆开，写成检索式：词1的词族或关系 与 词2的词族或关系
- n + v > n + n：实体+对实体的界定 > 检索两个实体

## 更多 Web 高级检索技巧

- [万方数据知识服务平台](http://www.wanfangdata.com.cn/index.html)首页右上侧 「智能拓展」功能
- [Google Search Help](https://support.google.com/websearch#topic=3378866)
- [Search Tips & Tricks – Inside Search – Google](https://www.google.com/intl/en_u/insidesearch/tipstricks/all.html)
- [百度搜索帮助中心-百度搜索技巧](http://d.baidu.com/search/skill.html#05)
- [虫部落 — 让搜索更简单](http://www.chongbuluo.com/)

想挑战更多有趣的题目，请移步：

- [虫部落-搜索技能强化练习题集锦](http://bbs.chongbuluo.com/thread-2129-1-1.html) （尝试挑战后再查看 [参考答案](http://bbs.chongbuluo.com/thread-2129-1-1.html) 吧）

## ChangeLog

2018-05-04 初稿