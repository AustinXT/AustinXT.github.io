# 一元函数积分

## 不定积分与定积分定义

### 不定积分定义

设 $$F'(x)=f(x),x\in (a,b)$$ ，则称 $$F(x)+C$$ 为 $$f(x)$$ 在 $$(a,b)$$ 上的一个原函数，记 $$\int f(x)dx=F(x)+C$$ .

### 定积分定义

设 $$f(x)$$ 在 $$[a,b]$$ 上有定义且有界，经过

1. 分割：用 $$n-1$$ 个分点分割区间 $$[a,b]$$ ；
2. 做乘积：$$f(\xi_i)\Delta x_i$$ ，其中 $$x_{i-1} \leq \xi_i \leq x_i,\Delta x_i=x_i-x_{i-1}$$ ；
3. 求和：$$\sum_{i=1}^nf(\xi_i)\Delta x_i$$ ；
4. 取极限：$$\lim \limits_{\lambda \to 0}\sum_{i=1}^nf(\xi_i)\Delta x_i$$ ，其中 $$\lambda = \underset{1\leq i \leq n} {max} |\Delta x_i|$$ .

若上述极限存在（与分法无关、与 $$\xi_i$$ 取法无关），则称 $$f(x)$$ 在在 $$[a,b]$$ 上可积，并称上述极限为 $$f(x)$$ 在 $$[a,b]$$ 上的定积分，记为 $$\lim \limits_{\lambda \to 0}\sum_{i=1}^nf(\xi_i)\Delta x_i=\int_a^b f(x)dx$$ 

## 不定积分与定积分性质

### 定积分存在定理

设 $$f(x)$$ 在 $$[a,b]$$ 上连续，则 $$\int_a^b f(x)dx$$ 存在。

设 $$f(x)$$ 在 $$[a,b]$$ 上有界，且只有有限个间断点，则 $$\int_a^b f(x)dx$$ 存在。

### 原函数存在定理

设 $$f(x)$$ 在 $$[a,b]$$ 上连续，则在 $$[a,b]$$ 上必存在原函数。

若 $$f(x)$$ 在 $$[a,b]$$ 上有跳跃间断点 $$x_0\in (a,b)$$ ，则 $$f(x)$$ 在 $$[a,b]$$ 上不存在原函数。

若 $$f(x)$$ 不连续，则原函数存在与否与定积分存在与否不相干。

### 不定积分与定积分的关系

设 $$f(x)$$ 在 $$[a,b]$$ 上连续，则 $$(\int_a^x f(t)dt)'=f(x),x\in [a,b]$$ 由此可知，$$\int_a^xf(t)dt$$ 是 $$f(x)$$ 的一个原函数，从而 $$\int f(x)dx=\int_a^x f(t)dt+C$$ 

若 $$f(x)$$ 在 $$[a,b]$$ 上除点 $$x=x_0\in(a,b)$$ 外均连续，而在 $$x=x_0$$ 处 $$f(x)$$ 有跳跃间断点，记 $$F(x)=\int_c^x f(t)dt$$ ，无论 $$c$$ 是否为 $$x_0$$ ，均有

- $$F(x)$$ 在 $$[a,b]$$ 上连续
- $$F'(x)=f(x),x\in[a,b],x \neq x_0$$ 
- $$F'_-(x_0)=f(x_0^-),F'_+(x_0)=f(x_0^+)$$ 

### 牛顿莱布尼茨定理

设 $$f(x)$$ 在 $$[a,b]$$ 上连续，$$F(x)$$ 是 $$f(x)$$ 的一个原函数，则 $$\int_a^b f(x)dx=F(x)|_a^b=F(b)-F(a)$$ 

### 积分中值定理

设 $$f(x)$$ 在 $$[a,b]$$ 上连续，至少存在一点 $$\xi \in (a,b)$$ 使 $$\int_a^b f(x)dx=f(\xi)(b-a)$$ 

推广：若 $$g(x)$$ B 不变号，则至少存在一点 $$\xi \in (a,b)$$ 使 $$\int_a^b f(x)g(x)dx=f(\xi)\int_a^b g(x)dx$$ 

## 不定积分与定积分计算

### 基本积分公式

设 $$a>0$$ ，则有

$$\int \tan x dx = -\ln|\cos x|+C$$

$$\int cot x dx = \ln|\sin x|+C$$ 

$$\int \sec x dx=\ln|\sec x +\tan x|+C$$ 

$$\int \csc x dx =\ln|\csc x -cot x| +C$$ 

$$\int \sec^2 x dx=\tan{x} +C$$ 

$$\int \csc^2{x} dx = -cotx +C$$ 

$$\int \frac{1}{a^2+x^2}dx=\frac{1}{a} \arctan {\frac{x}{a}}+C$$ 

$$\int \frac{1}{a^2-x^2}dx=\frac{1}{2a}\ln |\frac{a+x}{a-x}|+C$$ 

$$\int \frac{1}{\sqrt{a^2-x^2}}dx=\arcsin \frac{x}{a}+C$$ 

$$\int \frac{1}{\sqrt{x^2 \pm a^2}}dx=\ln|x+\sqrt{x^2\pm a^2}|+C$$ 

### 基本积分方法

#### 第一换元法：不定积分的凑微分求积分法

设 $$f(u)$$ 连续，$$\varphi (x)$$ 具有连续的一阶导数，则有公式
$$
\int f(\varphi (x))\varphi '(x)=\int f(\varphi (x))d\varphi(x)\overset{\varphi(x)=u}=\int f(u)du\overset{if}=F(u)+C \overset{then}=F(\varphi (x))+C
$$

#### 第二换元法：不定积分的换元积分法

设 $$f(u)$$ 连续，$$x=\varphi (t)$$ 具有连续的一阶导数 $$\varphi '(t)$$ ，且 $$\varphi '(t)\neq 0$$ ，则
$$
\int f(x)dx\overset{x=\varphi (t)}=(\int f(\varphi(t))\varphi'(t)dt)_{t=\psi(x)}
$$
即右边对 $$t$$ 积分后再以 $$x=\varphi(t)$$ 的反函数 $$t=\psi(x)$$ 代回。

#### 定积分的换元法

设 $$f(x)$$ 在 $$[a,b]$$ 上连续，$$x=\varphi (t)$$ 满足条件：$$a=\varphi(\alpha),b=\varphi(\beta)$$ ，且当 $$t$$ 在以 $$\alpha,\beta$$ 为端点的闭区间 $$I$$ 上变动时，$$a\leq \varphi(t)\leq b$$ ，$$\varphi'(t)$$ 连续，则有定积分的换元公式
$$
\int_a^b f(x)dx=\int_{\alpha}^{\beta} f(\varphi(t))\varphi'(t)dt
$$

这里 $$\alpha,\beta$$ 未规定哪个大。

#### 不定积分与定积分的分部积分法

设 $$u(x),v(x)$$ 均有连续导数，则
$$
\int u(x)v'(x)dx=u(x)v(x)-\int v(x)u'(x)dx,\int _a^b u(x)v'(x)dx=u(x)v(x)|_a^b-\int_a^b v(x)u'(x)dx
$$

常见的有：$$\int x^ne^xdx,\int x^n \sin x dx,\int x^n \cos x dx, \\\int x^n \ln x dx,\int x^n \arctan x dx, \int x^n \arcsin x dx,\\ \int e^x \sin x dx,\int e^x \cos x dx$$ 

#### 常见的典型类型换元法

设 $$R(u,v)$$ 为 $$u,v$$ 的有理函数。

- $$\int R(x,\sqrt{a^2-x^2})dx,\int R(x,\sqrt{x^2 \pm a^2})dx,a>0$$ 型

  - 含 $$\sqrt{a^2-x^2}$$ ，则令 $$x=a\sin t$$ 
  - 含 $$\sqrt{x^2+a^2}$$ ，则令 $$x=a\tan t$$ 
  - 含 $$\sqrt{x^2-a^2}$$ ，则令 $$x=a\sec t$$ 

- $$\int R(x,\sqrt[n]{ax+b},\sqrt[m]{ax+b})dx,a \neq 0$$ 型

  令 $$t=\sqrt[mn]{ax+b}$$ ，$$x=\frac{t^{mn}-b}{a}$$ 

- $$\int R(x,\sqrt{\frac{ax+b}{cx+d}})​$$ 型

  令 $$t=\sqrt{\frac{ax+b}{cx+d}}$$ ，$$x=\frac{dt^2-b}{a-ct^2}$$ ，其中设 $$ad-bc \neq 0$$ 

- $$\int R(\sin x, \cos x)dx$$ 型

  令 $$\tan \frac{x}{2}=t$$ ，则 $$\sin x= \frac{2t}{1+t^2},\cos x=\frac{1-t^2}{1+t^2},dx=\frac{2}{1+t^2}dt$$ 

### 有用的定积分公式 

#### 直角坐标系中以原点为圆心的圆的积分

四分之一圆：$$\int_0^a \sqrt{a^2-x^2} dx = \frac{\pi}{4}a^2$$

半圆：$$\int_{-a}^a \sqrt{a^2-x^2} dx = \frac{\pi}{2}a^2$$ 

#### 华里士公式

$$\int_0^{\frac{\pi}{2}} \sin^n x dx = \int_0^{\frac{\pi}{2}} \cos^n x dx = \begin{cases} \frac{n-1}{n} \cdot  \frac{n-3}{n-2} \cdot \cdots \frac{1}{2} \cdot \frac{\pi}{2} \quad,n 为正偶数 \\ \frac{n-1}{n} \cdot  \frac{n-3}{n-2} \cdot \cdots \frac{2}{3} \cdot 1 \quad,n 为大于1的正奇数\end{cases} $$ 



## ChangeLog

> 2018.09.13 初稿