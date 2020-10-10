
Markdown语法
===
工具：Typora
reference
---
* [Markdown使用规则](http://daringfireball.net/projects/markdown/)
* [shawn0lee0笔记](https://shawn0lee0.gitbooks.io/python-omooc2py/content/markdownyu_fa_jian_jie.html)
* [Markdown生态链整理 - 阳志平的网志](http://www.yangzhiping.com/tech/markdown-ecosystem.html)
* [Markdown主页](http://daringfireball.net/projects/markdown/)
* [Markdown使用说明](http://wowubuntu.com/markdown/index.html)

##<a name="index"/>目录
* [横线](#line)
* [标题](#title)
* [文本](#text)
   * 普通文本
   * 换行 
   * 单行文本
   * 多行文本
   * 文字高亮
   * 删除线 粗体 斜体
* [链接](#link)
   * 文本超链接
      *   链接外部URL
      *   链接内部URL
   * 描点
   * 图片超链接
* [图片](#pic)
   * 来源于网络中的图片
   * 来源于GitHub中的图片  
* [列表](#list)
   * 圆点列表
   * 数字列表
   * 复选框列表
* [块引用](#blockquotes)
* [代码](#code)
* [表格](#table) 
* [表情](#emoji)
* [数学公式LaTeX](#LaTeX)

<a name="line"/>
###横线

***
---
___

###<a name="title"/>标题
#样本
##样本
###样本
####样本
#####样本
######样本


样本
===


样本
---  

###<a name="text"/>文本
普通文本<br>
换行<br> 
或者 文末空两个  
	当行文本

	多行文本
	多行文本
高亮`文字`<br>
~~删除线~~
**粗体**
***斜体***

###<a name="link"/>链接
外部链接<br>
[baidu](http://www.baidu.com)  
[baidu][]
[baidu]: http://www.baidu.com
[baidu][1]
[1]: http://www.baidu.com
内部链接  
[回到目录](#index)  
[回到顶部](#TEST)


###<a name="pic"/>图片  
来自网络  
![baidu](http://www.baidu.com/img/bdlogo.gif "百度logo")  
*来自github库![](https://assets-cdn.github.com/images/modules/contact/goldstar.gif)  
给图片加上超链接  
[![head]](http://blog.csdn.net/guodongxiaren/article/details/23690801)
[head]: https://github.com/guodongxiaren/ImageCache/raw/master/Logo/jianxin.jpg	"点击图片进入我的博客"
###<a name="tist"/>列表
- 列表
  - 列表
+ 列表
   + 列表
      + 列表

####一般效果
就是在数字后面加一个点，再加一个空格。不过看起来起来可能不够明显。    
面向对象的三个基本特征：

1. 封装
2. 继承
3. 多态

####数字列表自动排序
也可以在第一行指定`1. `，而接下来的几行用星号`*`（或者继续用数字1. ）就可以了，它会自动显示成2、3、4……。    
面向对象的七大原则：

1. 开闭原则
* 里氏转换原则
* 依赖倒转原则
* 接口隔离原则
* 组合/聚合复用原则
* “迪米特”法则
* 单一直则原则  
####多级数字列表
和圆点的列表一样，数字列表也有多级结构：  

1. 这是一级的数字列表，数字1还是1
   1. 这是二级的数字列表，阿拉伯数字在显示的时候变成了罗马数字
      1. 这是三级的数字列表，数字在显示的时候变成了英文字母
      2. 四级的数字列表显示效果，就不再变化了，依旧是英文字母 
### 复选框列表
- [x] C
- [x] C++
- [x] Java
- [x] Qt
- [x] Android
- [ ] C#
- [ ] .NET

您可以使用这个功能来标注某个项目各项任务的完成情况  
###<a name="blockquotes"/>块引用
####文本摘自《深入理解计算机系统》P27
　令人吃惊的是，在哪种字节顺序是合适的这个问题上，人们表现得非常情绪化。实际上术语“little endian”（小端）和“big endian”（大端）出自Jonathan Swift的《格利佛游记》一书，其中交战的两个派别无法就应该从哪一端打开一个半熟的鸡蛋达成一致。因此，争论沦为关于社会政治的争论。只要选择了一种规则并且始终如一的坚持，其实对于哪种字节排序的选择都是任意的。
><b>“端”（endian）的起源</b><br>
>以下是Jonathan Swift在1726年关于大小端之争历史的描述：<br>
>“……下面我要告诉你的是，Lilliput和Blefuscu这两大强国在过去36个月里一直在苦战。战争开始是由于以下的原因：我们大家都认为，吃鸡蛋前，原始的方法是打破鸡蛋较大的一端，可是当今的皇帝的祖父小时候吃鸡蛋，一次按古法打鸡蛋时碰巧将一个手指弄破了，因此他的父亲，当时的皇帝，就下了一道敕令，命令全体臣民吃鸡蛋时打破较小的一端，违令者重罚。”
####块引用有多级结构
>数据结构
>>树
>>>二叉树
>>>>平衡二叉树
>>>>>满二叉树  
###<a name="code"/>代码高亮
```Java
public static void main(String[]args){} //Java
```
###<a name="table"/>显示表格
| 表头1          | 表头2          |
| ------------ | ------------ |
| Content Cell | Content Cell |
| Content Cell | Content Cell |
表格可以指定对齐方式

| 左对齐           |       居中        |   右对齐 |
| :------------ | :-------------: | ----: |
| col 3 is      | some wordy text | $1600 |
| col 2 is      |    centered     |   $12 |
| zebra stripes |    are neat     |    $1 |
###<a name="emoji"/>添加表情
Github的Markdown语法支持添加emoji表情，输入不同的符号码（两个冒号包围的字符）可以显示出不同的表情。

比如`:blush:`，可以显示:blush:  
:laughing:

具体每一个表情的符号码，可以查询GitHub的官方网页[http://www.emoji-cheat-sheet.com](http://www.emoji-cheat-sheet.com)。
###<a name="LaTeX"/>数学公式LaTeX
正太分布：$f(X)=\frac{1}{\sqrt{2\pi }\sigma }e^{-\frac{1}{2}(\frac{X-\mu }{\sigma })^2} , \quad \quad -\infty<X<+\infty$