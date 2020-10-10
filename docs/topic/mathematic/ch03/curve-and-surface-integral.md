# 曲线积分与曲面积分

## 对弧长的线积分（第一类线积分）

### 定义

设 $$L$$ 为 $$xOy$$ 平面上的分段光滑曲线弧段（每段都是光滑的）， $$f(x,y)$$ 为定义在 $$L$$ 上的有界函数，则 $$f(x,y)$$ 在 $$L$$ 上对弧长的积分为
$$
\int_L f(x,y) ds \triangleq \lim_{\lambda \rightarrow 0} \sum_{i=1}^n f(\xi_i, \eta_i) \Delta s_i
$$
其中 $$\Delta s_i$$ 表示第 $$i$$ 段小弧段长度，$$\lambda = \max \limits_{a \leq i \leq n} \Delta s_i$$ ，若 $$f(x,y)$$ 在 $$L$$ 连续，则 $$\int _L f(x,y) ds$$ 存在，且线性积分与积分路径方向无关。

### 计算

1. 直接法：转换为一元积分

  1. 参数方程：$$\int_L f(x,y) ds = \int_{\alpha}^{\beta} f(x(t),y(t)) \sqrt{x'^2(t)+y'^2(t)}dt$$ 
  2. 直角坐标系：$$\int_L f(x,y) ds = \int_{\alpha}^{\beta} f(x,y(x)) \sqrt{1+y'^2(x)}dx$$ 
  3. 极坐标：$$\int_L f(x,y) ds = \int_{\alpha}^{\beta} f(\rho (\theta)\cos \theta,\rho (\theta ) \sin \theta) \sqrt{\rho ^2(\theta)+\rho'^2(\theta)}d\theta$$ 

2. 对称性：

  1. 积分区域对称，积分函数奇偶性
  2. 变量对称

## 对坐标的线积分（第二类线积分）

### 定义

设 $$L$$ 为 $$xOy$$ 平面上的从 A 到 B 一段有向光滑曲线， $$P(x,y),Q(x,y)$$ 为 $$L$$ 上的有界函数，则 $$P(x,y),Q(x,y)$$ 沿 $$L$$ 对坐标的积分为
$$
\int_{L(AB)} P(x,y) dx + Q(x,y) dy = \lim_{\lambda \rightarrow 0} \sum_{i=1}^n [P(\xi_i, \eta_i) \Delta x_i + Q(\xi_i, \eta_i) \Delta y_i]
$$
其中 $$\Delta s_i$$ 表示第 $$i$$ 段小弧段长度，$$\lambda = \max \limits_{a \leq i \leq n} \Delta s_i$$ ，$$\Delta x_i,\Delta y_i$$ 分别是 $$\Delta s_i$$ 在 x, y  轴上的投影。若 P, Q 在 $$L$$ 连续，则上述积分存在，且线性积分与积分路径方向有关。

### 与对弧长的积分的关系

$$\int_L  (P \cos \theta + Q \sin \theta )ds = \int_L  P dx + Q dy$$ 

### 计算

1. 直接法：转化为一元积分

2. 格林公式：

   设闭区域 D 由分段光滑闭曲线  L  围成，函数 P(x,y) 及  Q(x,y) 在 D 上有一阶连续偏导数（分别对 y,x 有一阶连续偏导），则有 $$\int_LPdx+Qdy = \iint _D (\frac {\partial Q}{\partial x}- \frac {\partial P}{\partial y})dxdy$$ 其中 L 是 D 的取正向的边界曲线（L 的正向左侧为 D）。

3. 利用积分与路径无关：

   设 P(x,y), Q(x,y) 在单连通域 D 上有连续一阶偏导（分别对 y, x 偏导），则一下四条命题等价

   1. C 为 D 中任意光滑闭曲线，$$\int_C Pdx+Qdy=0$$ 
   2. L 为任意光滑曲线，$$\int_L Pdx+Qdy$$ 与路径无关
   3. 存在可微函数 $$F(x,y)$$ ，使得 $$Pdx +Qdy = dF$$ 
   4. 在 D 内任一点，$$\frac {\partial Q}{\partial x}=\frac {\partial P}{\partial y}$$ 

   证明：

   1->2：明显

   2->3：对 D 上任意两点 $$A(x_0,y_0),B(x,y)$$ ，令 $$u(x,y) = \int_{(x_0,y_0)} ^{(x,y)} Pdx+Qdy $$ ，则 $$\frac{\partial u}{\partial x} = \lim \limits_{\Delta x \rightarrow 0} \frac{u(x+\Delta x, y)-u(x,y)}{\Delta x} = \lim \limits_{\Delta x \rightarrow 0} \frac{P(x+\Delta x, y)-P(x,y)}{\Delta x} = \lim \limits_{\Delta x \rightarrow 0} P(x+\theta \Delta x,y) = P(x,y)$$ 

   3->4：F 的二阶偏导连续->二阶偏导相等

   4->1：格林公式

   运用：沿坐标轴积分 4->2；凑可微函数 $$\int_{(x_1,y_1)}^{(x_2,y_2)} dF$$ 4->3；闭曲线4->1

## 空间的线积分

### 计算

1. 直接法：转换为一元积分
2. 斯托克斯公式：设闭区域 $$\Sigma$$ 分段光滑的空间有向闭曲线  $$\Gamma$$  围成的分段光滑有向曲面，函数 P，Q，R 在 $$\Sigma $$  上有一阶连续偏导数，则有 $$\int_LPdx+Qdy +Rdz = \iint _\Sigma (\frac {\partial Q}{\partial x}- \frac {\partial P}{\partial y})dxdy + (\frac {\partial R}{\partial y}- \frac {\partial Q}{\partial z})dydz + (\frac {\partial P}{\partial z}- \frac {\partial R}{\partial x})dzdx$$ 

### 对面积的曲面积分（第一类曲面积分）

### 定义

设 $$\Sigma$$ 为分片光滑曲面片（每片都是光滑的），$$f(x,y,z)$$ 为定义在 $$\Sigma$$ 的有界函数，则 $$f(x,y,z)$$ 在 $$\Sigma $$ 上对面积积分为
$$
\iint_{\Sigma} f(x,y,z) dS \triangleq \lim_{\lambda \rightarrow 0} \sum _{i=0}^n f(\xi_i,\eta_i,\zeta_i) \Delta S_i
$$
其中 $$\Delta S_i$$ 为第 i 个小曲面块的面积，若 $$f(x,y,z)$$ 在 $$\Sigma$$ 上连续，则 $$\iint_{\Sigma} f(x,y,z) dS$$ 存在，且与曲面 $$\Sigma $$ 选取的侧无关。

### 计算

1. 直接法：$$\iint_{\Sigma} f(x,y,z) dS = \iint_D f(x,y,z(x,y))\sqrt{1+z_x'^2 + z_y'^2} dxdy$$ 
2. 对称性：面对称和变量对称

## 对坐标的面积分（第二类面积分）

### 定义

设 $$\Sigma$$ 为光滑有向曲面，$$P(x,y,z),Q(x,y,z),R(x,y,z)$$ 在 $$\Sigma$$ 上有界，则
$$
\iint_{\Sigma} Pdydz + Qdzdx +Rdzdy \triangleq \lim_{\lambda \rightarrow 0} \sum _{i=0}^n [P(\xi_i,\eta_i,\zeta_i) \Delta (S_i)_{yz} + Q(\xi_i,\eta_i,\zeta_i) \Delta (S_i)_{zx} + R(\xi_i,\eta_i,\zeta_i) \Delta (S_i)_{xy}]
$$
其中 $$(\Delta S_i)_{yz}$$ 为第 i 个小曲面块在坐标面 $$yOz$$ 上的投影，若 P, Q, R 在 $$\Sigma$$ 上连续，则 $$\iint_{\Sigma} Pdydz + Qdzdx +Rdzdy$$ 存在，且与曲面 $$\Sigma $$ 选取的侧有关。

### 两类曲面积分的联系

$$\iint_{\Sigma} Pdydz + Qdzdx +Rdzdy = \iint_{\Sigma} (P \cos \alpha + Q \cos \beta + R \cos \gamma) dS$$ 

其中 $$\cos \alpha, \cos \beta, \cos \gamma$$ 为曲面 $$\Sigma$$ 上一点指定侧的法向量的方向余弦（法向量指向指定侧，方向余项为法向量与坐标轴正向的夹角的余弦）。

### 计算

1. 直接法

   若有向曲面 $$ \Sigma : x=x(y,z), \quad (y,z) \in D_{yz}$$ ，则 
   $$
   \iint_{\Sigma} P(x,y,z) dydz = \pm \iint_{D_{yz}} P(x(y,z),y,z) dydz
   $$
   
   若有向曲面的法向量与 x 轴正向夹角为锐角，则上式为 +

   若有向曲面 $$ \Sigma : x=x(y,z), \quad (y,z) \in D_{yz}$$ ，$$ x=x(y,z)$$ 在 $$D_{yz}$$ 上与连续一阶偏导数，P, Q, R 在 $$\Sigma$$ 上连续，则 

   $$
   \iint_{\Sigma} Pdydz + Qdzdx +Rdzdy = \pm \iint_{D_{yz}} [P(x(y,z),y,z)  +Q(x(y,z),y,z) (-\frac{\partial x}{\partial y}) + R(x(y,z),y,z) (-\frac{\partial x}{\partial z})]dydz
   $$
   若有向曲面的法向量与 x 轴正向夹角为锐角，则上式为 +

2. 高斯公式

   设空间闭区域 $$\Omega$$ 是由分片光滑的闭曲面 $$\Sigma$$ 所围成，函数 $$P(x,y,z),Q(x,y,z),R(x,y,x)$$ 在 $$\Omega$$ 上有连续一阶偏导数，闭曲面 $$\Sigma$$ 取外侧，则
   $$
   \iint_{\Sigma} Pdydz + Qdzdx +Rdzdy = \iiint_{\Omega} (\frac{\partial P}{\partial x}+ \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z}) dV
   $$
   注意函数 P, Q, R 分母为零的点

3. 注意点

   当积分区域为有向区域时，用区域对称性化简时要考虑区域的方向。

## ChangeLog

> 2018.08.10 重积分
>
> 2018.08.14 曲线积分
>
> 2018.08.15 曲面积分
>
> 2018.08.16 场论初步、多元积分应用
>
> 2018.09.14 删除物理应用
>
> 2018.09.14 删除重积分