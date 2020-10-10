# 重积分

## 二重积分

### 定义

设 $$z=f(x,y)$$ 是平面上有界闭区域 $$D$$ 上的有界函数
$$
\iint \limits_D f(x,y)\mathrm{d} \sigma \triangleq \lim _{d\rightarrow0} \sum_{k=1}^n f(\xi_k, \eta_k)\triangle \sigma_k
$$
其中 $$d$$ 是 $$n$$ 个小区域直径的最大值，$$\triangle \sigma_k$$ 是第 $$k$$ 个小区域的面积，$$(\xi_k, \eta_k)$$ 是$$\triangle \sigma_k$$ 上任一点。

若 $$f(x,y)$$ 在 $$D$$ 上连续，则 $$\iint \limits_D f(x,y)\mathrm{d} \sigma $$ 总存在。

二重积分几何意义：若 $$f(x,y)$$ 在区域 $$D$$ 上连续非负，则二重积分在几何上的意义是，以 $$z=f(x,y)$$ 为顶，以沿着 $$D$$ 的边界的柱面围城的曲顶柱体体积。

### 二重积分计算

1. 直角坐标：若 $$y$$ 可由 $$x$$ 表达，则先积分 $$y$$

2. 极坐标

   坐标转换公式为： $$\iint \limits_{D} f(x,y) \mathrm{d} \sigma = \int _\alpha ^\beta \mathrm{d}\theta \int_{\rho_1(\theta)}^{\rho_2(\theta)} f(\rho \cos \theta, \rho \sin \theta) \rho \mathrm{d} \rho$$ 

   适合用极坐标的被积函数表达式有：$$f(\sqrt{x^2+y^2})$$ 、$$f(\frac {x}{y})$$

   中心在坐标轴上且边界过原点的圆域边界表达式：$$\rho$$ 轴上方圆面向上的半圆为 $$\cos \theta$$ ，$$\rho$$ 轴上方圆面向右的半圆为 $$\sin \theta$$

3. 对称性

   若积分区域关于 x 轴对称，且被积函数关于 y 的奇函数，则积分值等于0

   若积分区域关于 x 轴对称，且被积函数关于 y 的偶函数，则原积分值等于两倍的以 x 轴上半部分为积分区域的积分值

   若积分区域关于 x 和 y 变量轮换对称，则被积函数中 x 和 y 对调积分值不变

   若积分区域关于直线 $$x=x_0$$ ，则 $$\iint \limits_D(x-x_0) d\sigma = 0$$

### 二重积分中值定理

设函数 $$f(x,y)$$ 在闭区域 $$D$$ 上连续，$$S$$ 为 $$D$$ 的面积，则 $$D$$ 上至少存在一点 $$(\xi, \eta)$$ ，使得 
$$
\iint \limits_{D} f(x,y) \mathrm{d} \sigma = f(\xi, \eta)S
$$
例如：$$\iint \limits_D x d\sigma = \bar{x} S$$，其中 $$\bar{x}$$ 为积分区域 $$D$$ 形心的横坐标，由形心的计算公式 $$\bar{x} = \frac {\iint \limits_D x d\sigma }{S}$$ 得到

### 柯西积分不等式

$$(\int _a^b f(x)g(x)dx)^2 \leq \int _a^b f^2(x)dx \cdot \int _a^b g^2(x)dx$$

## 三重积分

### 三重积分定义

设 $$f(x,y,z)$$ 是空间有界闭区域 $$\Omega$$ 上的有界函数
$$
\iiint \limits_{\Omega} f(x,y,z)\mathrm{d} V \triangleq \lim _{\lambda \rightarrow0} \sum_{k=1}^n f(\xi_k, \eta_k,\zeta_k)\triangle v_k
$$
其中 $$\lambda$$ 是 $$n$$ 个小区域直径的最大值，$$\triangle v_k$$ 是第 $$k$$ 个小区域的面积，$$(\xi_k, \eta_k,\zeta_k)$$ 是 $$\triangle v_k$$ 上任一点。

物理意义：若 $$f(x,y,z)$$ 是空间体 $$\Omega$$ 的体密度，则积分值为空间体质量。

### 三重积分计算

1. 直角坐标

   先一后二：$$\Omega$$ 在 $$xOy$$ 的投影为 $$D$$ ，先固定 $$(x,y)$$ ，写出竖线穿过的上下两个边界的表达式 $$z_1(x,y)$$ 和 $$z_2(x,y)$$，计算积分 $$\iint \limits_{D} f(x,y) \mathrm{d} x\mathrm{d} y\int_{z_1f(x,y)}^{z_2f(x,y)}f(x,y,z)\mathrm{d} z $$

   先二后一：先固定 $$z$$ ，获得出被界面所截平面闭区间 $$D_z$$ ，计算积分 $$\int _a^b \mathrm{d} z \iint \limits_{D_z} f(x,y,z) \mathrm{d} x\mathrm{d}y$$（最好 $$D_z$$ 容易计算且$$f(x,y,z)$$ 仅是 $$z$$ 的一元函数）

2. 柱坐标：$$dV = rdrd\theta dz$$

3. 球坐标：$$\iiint \limits_{\Omega} f(x,y,z)\mathrm{d} V =\iiint \limits_{\Omega} f(r\sin \varphi \cos \theta,r\sin \varphi \sin \theta, r\cos \varphi)r^2\sin \varphi dr d\varphi d\theta$$ ，$$\varphi \in [0,\pi]$$ ，且为与 $$z$$ 轴的夹角

4. 对称性

   若积分域关于 $$xOy$$ 平面对称，且被积函数是关于 $$z$$ 的奇函数，则积分值等于0

   若积分域关于 $$xOy$$ 平面对称，且被积函数是关于 $$z$$ 的偶函数，则原积分值等于两倍的以 $$xOy$$ 上半部分为积分区域的积分值

   若积分区域关于 x 和 y 变量轮换对称，则被积函数中 x 和 y 对调积分值不变

   若积分区域关于平面 $$z=z_0$$ ，则 $$\iiint \limits_{\Omega}(z-z_0) dV = 0$$

5. 交换积分次序：三重积分相邻的积分次序可以当做二重积分进行积分次序交换

6. 形心坐标：由形心的计算公式 $$\bar{x} = \frac {\iiint \limits_{\Omega} x dV }{V}$$ ，得到 $$\iiint \limits_{\Omega} x dV = \bar{x} V$$，其中 $$\bar{x}$$ 为积分区域 $$\Omega$$ 形心的横坐标。

## ChangeLog

> 2018.09.14 从多元函数积分分离出来