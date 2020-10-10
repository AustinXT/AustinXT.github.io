# 微积分的物理应用

## 场论

### 方向导数

方向导数定义：设 $$l$$ 是 $$xOy$$ 平面上以 $$P_0(x_0,y_0)$$ 为起始点的射线，$$P(x,y)$$ 是 $$l$$ 上一点，其中 $$x=x_0+t\cos \alpha ,y=y_0+t\cos \beta \quad (t\leq0)$$ ，$$\alpha,\beta$$ 为 $$l$$ 与 $$x,y$$ 轴的夹角，若极限
$$
\lim _{t\rightarrow0^+} \frac{f(x_0+t\cos \alpha ,y_0+t\cos \beta)-f(x_0,y_0)}{t}
$$
存在，则称此极限为 $$f(x,y)$$ 在点 $$P_0(x_0,y_0)$$ 处沿方向 $$l$$ 的方向导数，记作 $$\frac {\partial f}{\partial l}|_(x_0,y_0)$$

方向导数存在性与计算：若函数 $$f(x,y)$$ 在点 $$P_0(x_0,y_0)$$ 处可微，则函数在该店沿任意方向 $$l$$ 的方向导数存在，且
$$
\frac {\partial f}{\partial l}|_(x_0,y_0)=f'_x(x_0,y_0)\cos \alpha +f'_y(x_0,y_0)\cos \beta
$$
推广到空间 $$Oxyz$$ ：
$$
\frac {\partial f}{\partial l}|_(x_0,y_0,z_0)=\lim _{t\rightarrow0^+} \frac{f(x_0+t\cos \alpha ,y_0+t\cos \beta,z_0+t\cos \gamma)-f(x_0,y_0,z_0)}{t}
$$
若函数 $$f(x,y,z)$$ 在点 $$P_0(x_0,y_0,z_0)$$ 处可微，则
$$
\frac {\partial f}{\partial l}|_(x_0,y_0,z_0)=f'_x(x_0,y_0,z_0)\cos \alpha +f'_y(x_0,y_0,z_0)\cos \beta+f'_z(x_0,y_0,z_0)\cos \gamma \\ =\{f'_x(x_0,y_0,z_0),f'_y(x_0,y_0,z_0),f'_z(x_0,y_0,z_0)\} \cdot \overrightarrow e
$$
其中 $$\overrightarrow e=(\cos \alpha ,\cos \beta , \cos \gamma)$$ ，是射线 $$l$$ 方向的单位向量。

### 梯度

梯度的定义：设函数 $$u=u(x,y)$$ 在区域 $$D$$ 上有定义，点 $$P(x,y)\in D$$ ，若存在 $$\overrightarrow A(x,y)$$，使得其所指方向的方向导数最大，且等于 $$|\overrightarrow A(x,y)|$$ ，则称向量 $$\overrightarrow A(x,y)$$ 为函数 $$u=u(x,y)$$ 在点 $$P(x,y) $$ 处的梯度，记作
$$
grad \space u|_P = \overrightarrow A(x,y)
$$
梯度计算公式：设函数 $$u=u(x,y)$$ 在区域 $$D$$ 上有一阶偏导数，则
$$
grad \space u|_P = \frac {\partial u}{\partial x} \overrightarrow i +\frac {\partial u}{\partial y} \overrightarrow j
$$
梯度与方向向量的关系：设 $$\overrightarrow e_l$$ 是 方向向量 $$l$$ 的单位向量，则
$$
\frac {\partial u}{\partial l}|_p =grad \space u|_P \cdot \overrightarrow e
$$

### 通量

设有向量场 $$\mathbf{A} (x,y,z) = P(x,y,z) \mathbf{i} + Q(x,y,z) \mathbf{j} +R(x,y,z) \mathbf k$$ ，则称沿场中某有向曲面 $$\Sigma$$ 的某一侧的面积分 $$\Phi = \iint_{\Sigma} \mathbf A \cdot d \mathbf S$$ 为向量场穿过曲面 $$\Sigma$$ 这一侧的通量。由 $$\mathbf{A} = P \mathbf{i} + Q \mathbf{j} +R \mathbf k , d\mathbf S = dydz \mathbf i + dzdx \mathbf j + dzdy \mathbf k$$ 得到
$$
\Phi = \iint_{\Sigma} Pdydz + Qdzdx + Rdxdy
$$

### 散度

设有向量场 $$\mathbf{A} (x,y,z) = P(x,y,z) \mathbf{i} + Q(x,y,z) \mathbf{j} +R(x,y,z) \mathbf k $$ ，其中 P, Q, R 有连续一阶偏导数，向量场 $$\mathbf A$$  在点 $$(x,y,z)$$ 处的散度计算公式为

$$
div \mathbf A = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z}
$$
[散度 - Wikiwand](https://www.wikiwand.com/zh-hans/%E6%95%A3%E5%BA%A6)、[高斯散度定理 - Wikiwand](https://www.wikiwand.com/zh-hans/%E9%AB%98%E6%96%AF%E6%95%A3%E5%BA%A6%E5%AE%9A%E7%90%86)

### 旋度

设有向量场 $$\mathbf{A} (x,y,z) = P(x,y,z) \mathbf{i} + Q(x,y,z) \mathbf{j} +R(x,y,z) \mathbf k $$ ，其中 P, Q, R 有连续一阶偏导数，向量场 $$\mathbf A$$  在点 $$(x,y,z)$$ 处的旋度计算公式为
$$
\mathbf{rotA} = 	\begin{vmatrix} \mathbf i & \mathbf j & \mathbf k \\ \frac{\partial }{\partial x} &  \frac{\partial }{\partial y} & \frac{\partial }{\partial z} \\ P & Q & R \end{vmatrix}
$$
[旋度 - Wikiwand](https://www.wikiwand.com/zh-hans/%E6%97%8B%E5%BA%A6)

## 简单物理应用

|                            |                       平面                       |                          空间体                           |                      曲线                       |                          曲面                          |
| :------------------------: | :----------------------------------------------: | :-------------------------------------------------------: | :---------------------------------------------: | :----------------------------------------------------: |
|          几何度量          |             面积 $$S=\iint_D dxdy$$              |              体积 $$V = \iiint_{\Omega} dv$$              |             弧长 $$L = \int_C ds$$              |             面积 $$S = \iint_{\Sigma} dS$$             |
| 质量 m（$$\rho $$ 为密度） |           $$\iint_D \rho (x,y) dxdy$$            |           $$ \iiint_{\Omega} \rho (x,y,z) dv$$            |           $$\int_C \rho (x,y,z) ds$$            |           $$\iint_{\Sigma} \rho (x,y,z) dS$$           |
|  质心（以 x 轴坐标为例）   | $$\bar x = \frac{\iint_D x \rho (x,y) dxdy}{m}$$ | $$\bar x = \frac{ \iiint_{\Omega} x \rho (x,y,z) dv}{m}$$ | $$\bar x = \frac{\int_C x \rho (x,y,z) ds}{m}$$ | $$\bar x = \frac{\iint_{\Sigma} x \rho (x,y,z)dS}{m}$$ |
|   转动惯量(以 x 轴为例)    |      $$I_x = \iint_D y^2 \rho (x,y) dxdy$$       |   $$I_x =  \iiint_{\Omega} (y^2+z^2) \rho (x,y,z) dv$$    |    $$I_x = \int_C (y^2+z^2)\rho (x,y,z) ds$$    |   $$I_x = \iint_{\Sigma} (y^2+z^2)\rho (x,y,z) dS$$    |

### 转动惯量

对形体内的每一质点到转轴垂直距离平方的积分，若转动轴是坐标轴以外的直线，先求出垂直距离的表达式，再积分

### 变力做功

设有向力场 $$\mathbf{F} (x,y,z) = P(x,y,z) \mathbf{i} + Q(x,y,z) \mathbf{j} +R(x,y,z) \mathbf k $$ ，则力 $$\mathbf F$$ 沿曲线 $$\overset{\frown} {AB}$$ 从 A 到 B 所做的功为
$$
W = \int_{\overset{\frown} {AB}} = Pdydz + Qdzdx + Rdxdy
$$

## ChangeLog

> 2018.08.26 初稿