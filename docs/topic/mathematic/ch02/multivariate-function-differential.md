# 多元函数微分学

多元函数微分学研究的是，在高位空间中，图形的分布特点和变化方式。以三维中的二维图形为例，可以研究二维图形中某一点的变化方式（往哪个方向变化最快，研三个垂直方向分解出来的变化快慢如何）、图形的空间分布特点（图形在某个方向上延伸的局部极限和全局极限）。

图形并不是都是连续的、光滑的，因此图形的变化会出现特殊情况，要考虑连续、可微。图形的变化有一些内在逻辑，因此有了定理（例如，可微的充分条件、必要条件）。有时需要借助一些工具去帮助我们去看清内在关系，因此有了方法（例如，极限）。

如果图形不止一个，那还需要考虑不同图形的空间关系（例如，切线、切平面）。

### 二元函数的概念

设$$D$$是平面上一个点集，若对于每个点 $$P(x,y)\in D$$ ，都有确定的按照一定法则与之对应的变量 $$z$$ ，则称 $$z$$ 是自变量 $$x,y$$ 的二元函数，记为 $$z=f(x,y)$$ ，其中点集 $$D$$ 为函数的定义域， $$x,y$$ 为自变量， $$z$$ 为因变量，数集 $$\{z|z=f(x,y),(x,y)\in D\}$$ 称为函数的值域。

类似可定义多元函数。

二元函数的几何意义是一章飘荡在 $$xOy$$ 平面上的一张曲面，不上下重叠。

## 极限、连续、偏导及全微分

首先用极限的方法考虑图形局部一点的变化情况。

### 重极限的概念

设 $$P(x_0, y_0)$$ 为平面 $$xOy $$ 上一点， $$ \delta >0$$，则与 $$P(x_0, y_0)$$ 距离小于 $$\delta $$ 的所有点的集合称为 $$ P $$ 的 $$ \delta $$ 领域，记作 $$U(P,\delta )$$ .

设函数 $$f(x,y)$$ 的定义域为 D ，点 $$P_0(x_0,y_0)\in D$$ ，若 $$ \forall \space \epsilon >0, \exist \space \delta >0$$ ，$$\forall \space P(x,y)\in U(P_0,\delta ) \cap D$$ 有 $$|f(x,y)-A|<\epsilon$$ ，则称 $$ A $$ 为当 $$ P \to P_0$$ 时 $$f(x,y)$$ 的极限，记作
$$
\lim _{x\rightarrow x_0 \\ y\rightarrow y_0}f(x,y)=A 
$$

* 可由点 $$P$$ 沿不同路径趋近于 $$P_0$$ 时，$$f(x,y)$$ 趋于不同的值；或点 $$P$$ 趋近于 $$P_0$$ 时，$$f(x,y)$$ 不存在来证明重极限不存在
* 重极限的极限运算（有理运算，复合运算）和性质（保号性，夹逼性，局部有界性，极限与无穷小的关系）与一元函数完全类似

### 二元函数连续

设函数 $$f(x,y)$$ 在区域 $$D$$ 内有定义，点 $$P_0(x_0,y_0)$$ 是 $$D$$ 上的点（边界点或内点），且 $$P_0\in D$$，若
$$
 \lim _{x\rightarrow x_0 \\ y\rightarrow y_0}f(x,y)=f(x_0,y_0)
$$
则称函数 $$f(x,y)$$ 在点 $$P_0(x_0,y_0)$$ 连续。

多元函数有与一元函数完全类似的性质

* 连续函数的四则运算和复合运算仍连续
* 最值定理
* 介值定理

### 二元函数的偏导数

设函数 $$z=f(x,y)$$ 在点 $$(x_0,y_0)$$ 的某邻域内有定义，若
$$
\lim _{\Delta x\rightarrow 0} \frac{f(x_0+\Delta x, y_0)-f(x_0,y_0)}{\Delta x}
$$
存在，则称此极限为函数 $$z=f(x,y)$$ 在点 $$(x_0,y_0)$$ 处对 $$x$$ 的偏导数，记作 $$f’_x(x_0,y_0)$$

若$$f’_x(x_0,y_0), f’_y(x_0,y_0) $$ 均存在，则称函数 $$z=f(x,y)$$ 在点 $$(x_0,y_0)$$ 处可导

实际上 $$f’_x(x_0,y_0)$$ 是一元函数 $$\varphi(x)=f(x,y_0) $$在 $$x=x_0$$ 处的导数，由此其几何意义为，曲面在 $$y=y_0$$ 位置作平行于平面 $$xOz$$ 的切线，切线与$$ x$$ 轴正方向的夹角为 $$\alpha$$ ，则 $$f’_x(x_0,y_0)=\tan {\alpha}$$

### 全微分

若函数 $$z=f(x,y)$$ 在点 $$(x,y)$$ 处的全增量 $$\Delta z = f(x+\Delta x, y + \Delta y)-f(x,y)$$ 可表示为 $$\Delta z = A\Delta x + B\Delta y +o(\rho)$$，其中 $$A,B$$ 不依赖于 $$\Delta x, \Delta y$$ 存在，而仅与 $$x, y$$ 有关， $$\rho = \sqrt{(\Delta x)^2+(\Delta y)^2}$$ ，则称函数 $$z=f(x,y)$$ 在点 $$(x,y)$$ 处可微，而 $$A\Delta x + B\Delta y$$ 称为函数 $$z=f(x,y)$$ 在点 $$(x,y)$$ 的微分，记作 $$\mathrm{d} z = A\Delta x + B\Delta y$$.

* 必要条件：若函数 $$z=f(x,y)$$ 在点 $$(x,y)$$ 处可微，则函数 $$z=f(x,y)$$ 在点 $$(x,y)$$ 处的偏导数存在，且$$\mathrm{d} z = \frac {\partial z}{\partial x}\Delta x + \frac {\partial z}{\partial y}\Delta y$$
* 充分条件：若函数 $$z=f(x,y)$$ 的偏导数在点 $$(x,y)$$ 处连续，则函数 $$z=f(x,y)$$ 在点 $$(x,y)$$ 处可微。

二元函数连续、可导、可微关系：一阶偏导数连续->可微->（可导+连续）

## 多元函数微分法

### 复合函数求导法则

多元函数与一元函数的复合：若函数 $$ u=\varphi(t),v=\psi(t) $$ 都在点 $$t $$ 可导，函数 在 $$z=f(u,v) $$ 在对应的点 $$(u,v) $$ 具有连续一阶偏导数，则复合函数 $$z=f[\varphi (t), \psi (t)] $$在点 $$t $$ 可导，且
$$
\frac{\mathrm{d} z}{\mathrm{d} t} = \frac {\partial z}{\partial u}\frac{\mathrm{d} u}{\mathrm{d} t} +  \frac {\partial z}{\partial v}\frac{\mathrm{d} v}{\mathrm{d} t}
$$
多元函数与多元函数的复合：若函数 $$ u=\varphi(x,y),v=\psi(x,y) $$ 都在点 $$(x,y)$$ 可导，函数 在 $$z=f(u,v) $$ 在对应的点 $$(u,v) $$ 具有连续一阶偏导数，则复合函数 $$z=f[\varphi (x,y), \psi (x,y)] $$在点 $$(x,y)$$ 可导，且
$$
\frac{\mathrm{d} z}{\mathrm{d} x} = \frac {\partial z}{\partial u}\frac{\mathrm{d} u}{\mathrm{d} x} +  \frac {\partial z}{\partial v}\frac{\mathrm{d} v}{\mathrm{d} x} ,\frac{\mathrm{d} z}{\mathrm{d} y} = \frac {\partial z}{\partial u}\frac{\mathrm{d} u}{\mathrm{d} y} +  \frac {\partial z}{\partial v}\frac{\mathrm{d} v}{\mathrm{d} y}
$$

### 全微分形式不变性

设函数 $$z=f(x,y)$$ 和 $$ u=\varphi(x,y),v=\psi(x,y) $$ 都具有连续一阶偏导数，则复合函数 $$z=f[\varphi (x,y), \psi (x,y)] $$ 可微，且
$$
\mathrm{d} z = \frac {\partial z}{\partial x}\mathrm{d} x +  \frac {\partial z}{\partial y}\mathrm{d} y= \frac {\partial z}{\partial u}\mathrm{d}  u+  \frac {\partial z}{\partial v}\mathrm{d} v
$$

### 混合偏导数与求导次序无关问题

若函数 $$z=f(x,y)$$ 的两个混合偏导数 $$\frac {\partial ^2z}{\partial x \partial y}$$ 和 $$\frac {\partial ^2z}{\partial y \partial x}$$ 在点 $$(x_0,y_0)$$ 都连续，则在 $$(x_0,y_0)$$ 点$$\frac {\partial ^2z}{\partial x \partial y}=\frac {\partial ^2z}{\partial y \partial x}$$

### 隐函数的偏导数与全微分

设函数 $$F(x,y,z) $$ 有连续一阶偏导数，且 $$F’_z \neq 0,z=z(x,y)$$ 由方程 $$F(x,y,z)=0$$ 所确定，则
$$
\frac {\partial z}{\partial x}=-\frac{F'_x}{F'_z},\frac {\partial z}{\partial y}=-\frac{F'_y}{F'_z}
$$
其原理是，先求 $$F$$ 的全微分，再把后面的条件代进去即可。

## ChangeLog

> 2018.09.09 初稿