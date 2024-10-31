---
layout: post
title: LaTeX 常用数学符号
date: 2017-11-30
categories: [知识整理]
tags: [LaTeX, 速查]
description:
mathjax: true
---

查 LaTeX 常用数学符号的时候，一开始去[官网：LaTeX - A document preparation system](https://www.latex-project.org/)找[官方文档：LaTeX Documentation](https://www.latex-project.org/help/documentation/)，然后又找了 CTEX 的[在线文档：LATEX2e 插图指南](http://www.ctex.org/documents/latex/graphics/index.html)，内容都太丰富了。

在网上看了几个博客，发现了[一份不太简短的 LATEX2ε 介绍 ](https://github.com/CTeX-org/lshort-cn/)，`git clone`到本地，再用终端切换到`scr`所在的目录，依次在终端输入命令行即可。再从几个博客粘贴一些，整理了一份常用数学符号。

## 函数

一般函数名称，要么前面加 `\` ，要么加 `\operatorname{}` 。

|           函数           |         LaTeX         |            函数            |         LaTeX          |
| :----------------------: | :-------------------: | :------------------------: | :--------------------: |
|      $$\sin\theta$$      |      \sin\theta       |       $$\cos\theta$$       |       \cos\theta       |
|     $$\frac{L}{r}$$      |      \frac{L}{r}      |        $$\pmod{m}$$        |        \pmod{m}        |
| $$\operatorname{sh} j$$  |  \operatorname{sh} j  | $$\operatorname{argsh} k$$ | \operatorname{argsh} k |
| $$\lim_{\Delta x\to 0}$$ | \lim\_{\Delta x\to 0} |       $$\limsup S$$        |       \limsup S        |
|       $$\pmod{m}$$       |       \pmod{m}        |       $$a \bmod b$$        |       a \bmod b        |
|       $$\sqrt{3}$$       |       \sqrt{3}        |      $$\sqrt[n]{n}$$       |      \sqrt[n]{n}       |

行内公式有些下标会出现在右边

## 复杂表达式

| 功能       | 效果                                                                                                          | 语法                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 小型分数   | $$\tfrac{2}{4} = 0.5$$                                                                                        | \tfrac{2}{4} = 0.5                                                                                        |
| 大型分数   | $$\dfrac{2}{4} = 0.5 \qquad \dfrac{2}{c + \dfrac{2}{d +\dfrac{2}{4}}} = a$$                                   | \dfrac{2}{4} = 0.5 \qquad \dfrac{2}{c + \dfrac{2}{d +\dfrac{2}{4}}} = a                                   |
| 二项式系数 | $$\dbinom{n}{r}=\binom{n}{n-r}=C^n_r=C^n_{n-r}$$                                                              | \dbinom{n}{r}=\binom{n}{n-r}=C^n*r=C^n*{n-r}                                                              |
| 矩阵       | $$\begin{matrix} x & y \\ z & v \end{matrix}$$                                                                | `\begin{matrix} x & y \\ z & v \end{matrix}`                                                              |
|            | $$\begin{vmatrix} x & y \\ z & v \end{vmatrix}$$                                                              | `\begin{vmatrix} x & y \\ z & v \end{vmatrix}`                                                            |
|            | $$\begin{Vmatrix} x & y \\ z & v \end{Vmatrix}$$                                                              | `\begin{Vmatrix} x & y \\ z & v \end{Vmatrix}`                                                            |
|            | $$\begin{bmatrix} 0      & \cdots & 0      \\ \vdots & \ddots & \vdots \\ 0      & \cdots & 0 \end{bmatrix}$$ | `\begin{bmatrix} 0 & \cdots & 0 \\ \vdots & \ddots & \vdots \\ 0 & \cdots & 0 \end{bmatrix}`              |
|            | $$\begin{Bmatrix} x & y \\ z & v \end{Bmatrix}$$                                                              | `\begin{Bmatrix} x & y \\ z & v \end{Bmatrix}`                                                            |
|            | $$\begin{pmatrix} x & y \\ z & v \end{pmatrix}$$                                                              | `\begin{pmatrix} x & y \\ z & v \end{pmatrix}`                                                            |
| 条件定义   | $$f(n) = \begin{cases}  n/2,  & \mbox{if }n\mbox{ is even} \\ 3n+1, & \mbox{if }n\mbox{ is odd} \end{cases}$$ | `f(n) = \begin{cases} n/2, & \mbox{if }n\mbox{ is even} \\ 3n+1, & \mbox{if }n\mbox{ is odd} \end{cases}` |
| 多行等式   | $$\begin{align} f(x) & = (m+n)^2 \\ & = m^2+2mn+n^2 \\ \end{align}$$                                          | `\begin{align} f(x) & = (m+n)^2 \\ & = m^2+2mn+n^2 \\ \end{align}`                                        |
|            | $$\begin{alignat}{2} f(x) & = (m-n)^2 \\ f(x) & = (-m+n)^2 \\ & = m^2-2mn+n^2 \\ \end{alignat}$$              | `\begin{alignat}{2} f(x) & = (m-n)^2 \\ f(x) & = (-m+n)^2 \\ & = m^2-2mn+n^2 \\ \end{alignat}`            |
| 方程组     | $$\begin{cases} 3x + 5y +  z \\ 7x - 2y + 4z \\ -6x + 3y + 2z \end{cases}$$                                   | `\begin{cases} 3x + 5y + z \\ 7x - 2y + 4z \\ -6x + 3y + 2z \end{cases}`                                  |
| 数组       | $$\begin{array}{\|c\|c\|\|c\|} a & b & S \\ \hline 0&0&1\\ 0&1&1\\ 1&0&1\\ 1&1&0\\ \end{array}$$              | `\begin{array}{\|c\|c\|\|c\|} a & b & S \\ \hline 0&0&1\\ 0&1&1\\ 1&0&1\\ 1&1&0\\ \end{array}`            |

## 希腊字母

|     字母      |  LaTeX   |       字母       |    LaTeX    |
| :-----------: | :------: | :--------------: | :---------: |
|  $$\alpha$$   |  \alpha  |    $$\beta $$    |    \beta    |
|  $$\gamma $$  |  \gamma  |   $$\delta $$    |   \delta    |
| $$\epsilon $$ | \epsilon | $$\varepsilon $$ | \varepsilon |
|  $$\zeta $$   |  \zeta   |    $$\eta $$     |    \eta     |
|  $$\theta $$  |  \theta  |   $$\kappa $$    |   \kappa    |
| $$\lambda $$  | \lambda  |     $$\mu $$     |     \mu     |
|   $$\nu $$    |   \nu    |     $$\xi $$     |     \xi     |
|    $$o $$     |    o     |     $$\pi $$     |     \pi     |
|   $$\rho $$   |   \rho   |   $$\sigma $$    |   \sigma    |
|   $$\tau $$   |   \tau   |    $$\phi $$     |    \phi     |
| $$\varphi $$  | \varphi  |    $$\chi $$     |    \chi     |
|   $$\psi $$   |   \psi   |   $$\omega $$    |   \omega    |
|  $$\Gamma $$  |  \Gamma  |   $$\Sigma $$    |   \Sigma    |
| $$\Lambda $$  | \Lambda  |    $$\Psi $$     |    \Psi     |
|  $$\Delta $$  |  \Delta  |   $$\Omega $$    |   \Omega    |
|  $$\Theta $$  |  \Theta  |     $$\Pi $$     |     \Pi     |
|   $$\Phi $$   |   \Phi   |                  |             |

## 符号

### 二元关系和二元运算

|       符号       |    LaTeX    |         符号         |      LaTeX      |
| :--------------: | :---------: | :------------------: | :-------------: |
|    $$\leq $$     |    \leq     |      $$\geq $$       |      \geq       |
|   $$\equiv $$    |   \equiv    |       $$\gg $$       |       \gg       |
|   $$\simeq $$    |   \simeq    |      $$\sim $$       |      \sim       |
|   $$\subset $$   |   \subset   |     $$\supset $$     |     \supset     |
|  $$\subseteq $$  |  \subseteq  |     $$\approx $$     |     \approx     |
|     $$\in $$     |     \ni     |      $$\sim $$       |      \sim       |
|     $$\ni $$     |     \ni     |     $$\propto $$     |     \propto     |
|  $$\parallel $$  |  \parallel  |      $$\perp $$      |      \perp      |
|   $$\notin $$    |   \notin    |      $$\neq $$       |      \neq       |
|     $$\pm $$     |     \pm     |       $$\mp $$       |       \mp       |
|    $$\cdot $$    |    \cdot    |      $$\div $$       |      \div       |
|    $$\cap $$     |    \cap     |      $$\cup $$       |      \cup       |
|   $$\times $$    |   \times    |     $$\otimes$$      |     \otimes     |
|    $$\land$$     |    \land    |      $$\lor $$       |      \lor       |
| $$\rightarrow $$ | \rightarrow | $$\longrightarrow $$ | \longrightarrow |
| $$\Rightarrow $$ | \Rightarrow | $$\leftrightarrow $$ | \leftrightarrow |

### 巨算符

|   符号    | LaTeX |    符号    | LaTeX |
| :-------: | :---: | :--------: | :---: |
| $$\sum $$ | \sum  | $$\prod $$ | \prod |
| $$\int $$ | \int  | $$\iint $$ | \iint |

### 数学头标符号、底标符号、字体

|                    符号                    |                 LaTeX                 |                                符号                                 |                               LaTeX                               |
| :----------------------------------------: | :-----------------------------------: | :-----------------------------------------------------------------: | :---------------------------------------------------------------: | ------------------ | ------------ |
|                $$\hat{a} $$                |                \hat{a}                |                            $$\bar{a} $$                             |                              \bar{a}                              |
|                $$\dot{a} $$                |                \dot{a}                |                            $$\vec{a} $$                             |                              \vec{a}                              |
|               $$\tilde{a} $$               |               \tilde{a}               |                         $$\widehat{AAA} $$                          |                           \widehat{AAA}                           |
|       $$\overbrace{1+2+\cdots+100}$$       |     `\overbrace{1+2+\cdots+100}`      | $$\begin{matrix} 5050 \\ \overbrace{ 1+2+\cdots+100 }\end{matrix}$$ | `\begin{matrix} 5050 \\ \overbrace{ 1+2+\cdots+100 }\end{matrix}` |
|          $$\overrightarrow{AB} $$          |            \overrightarrow            |                          $$ \triangleq $$                           |                            \triangleq                             |
|              $$\underline A$$              |             \underline A              |                      $$\iint \limits_{x+y=1}$$                      |                      \iint \limits\_{x+y=1}                       |
|   $$\underrightarrow{\text{你的文字}}$$    |   \underrightarrow{\text{你的文字}}   |                    $$B \xrightarrow[T]{n>0} C$$                     |                     B \xrightarrow[T]{n>0} C                      |
| $$\underset{0\leq j \leq k-1}{\arg\min} $$ | \underset{0\leq j \leq k-1}{\arg\min} |                          $$\overset{?}=$$                           |                           \overset{?}=                            |
|   $$\sum_{\substack{0<i<n \\ 0<j<n}} $$    |   \sum\_{\substack{0<i<n \\ 0<j<n}}   |                      $$\overset{\frown} {AB}$$                      |                       \overset{\frown} {AB}                       |
|               加粗 $$\bf a$$               |      \bf a, \textbf a, \mathbf a      |             $$\big\|_{x = x_0}$$、$$\bigg\|_{x = x_0}$$             |                               `\big                               | \_{x = x_0}、\bigg | \_{x = x_0}` |
|               $$a^{\circ}$$                |               a^{\circ}               |                                                                     |                                                                   |

### 其他符号

|         符号          |       LaTeX       |               符号               |           LaTeX            |
| :-------------------: | :---------------: | :------------------------------: | :------------------------: |
|      $$\dots $$       |       \dots       |           $$\cdots $$            |           \cdots           |
|      $$\vdots $$      |      \vdots       |           $$\ddots $$            |           \ddots           |
|     $$\forall $$      |      \forall      |           $$\exists $$           |          \exists           |
|     $$\partial $$     |     \partial      |           $$\infty $$            |           \infty           |
|       $$\bot $$       |       \bot        |           $$\angle $$            |           \angle           |
|      $$\lnot $$       |       \lnot       |         $$\mathrm{d}x$$          |        \mathrm{d}x         |
|     $$\triangle$$     |     \triangle     |        $${}_1^2\!X_3^4$$         |       {}\_1^2\!X_3^4       |
| $$\alpha\quad\beta$$  | \alpha\quad\beta  |      $$\alpha\qquad\beta$$       |     \alpha\qquad\beta      |
|  $$\alpha \ \beta$$   |  \alpha \ \beta   | $$ \left( \frac{a}{b} \right) $$ | \left( \frac{a}{b} \right) |
| $$\lfloor a \rfloor$$ | \lfloor a \rfloor |       $$\lceil a \rceil$$        |      \lceil a \rceil       |

## ChangeLog

- 2018-08-09 添加 \limits\_{}、符号头标和底标
- 2017-11-30 初稿
