# 平面与直线

## 平面方程

### 一般式方程

一般式方程 $$Ax+By+Cz+D=0,\vec{n}=\{A,B,C\}$$ 为平面的法向量，其中 $$A,B,C$$ 不全为零。

### 点法式方程

点法式方程 $$A(x-x_0)+B(y-y_0)+C(z-z_0)=0$$ ，其中 $$(x_0,y_0,z_0)$$ 为平面上任意取定的一点，$$\vec{n}=\{A,B,C\}$$ 为平面的法向量，$$A,B,C$$ 不全为零。

### 截距式方程



截距式方程 $$\frac{x}{a}+\frac{y}{b}+\frac{z}{c}=1$$ ，其中 $$a,b,c$$ 分别为平面在三个坐标轴上的截距，且均不为零。

## 直线方程

### 一般式方程

假设 $$\{A_1,B_1,C_1\}$$ 与 $$\{A_2,B_2,C_2\}$$ 不共线，则一般式方程 $$\begin{cases} A_1x+B_1y+C_1z+D_1=0 \\ A_2x+B_2y+C_2z+D_2=0 \end{cases}$$ 为两平面的交线。

### 对称式方程

对称式方程 $$\frac{x-x_0}{l}=\frac{y-y_0}{m}=\frac{z-z_0}{n}$$ ，其中 $$(x_0,y_0,z_0)$$ 为直线上的任意取定的一点，$$\vec{s}={l,m,n} \neq 0$$ 为直线的方向向量。

### 参数式方程

参数式方程 $$\begin{cases} x=x_0+lt \\ y=y_0+mt \\ z=z_0+nt \end{cases}$$ ，其中 $$(x_0,y_0,z_0)$$ 为直线上的任意取定的一点，$$\vec{s}={l,m,n} \neq 0$$ 为直线的方向向量。

## 平面与直线的位置关系

### 平面与平面间的位置关系

设平面 $$\Pi_1:A_1x+B_1y+C_1z+D_1=0,\Pi_2:A_2x+B_2y+C_2z+D_2=0$$ ，则

- 平面 $$\Pi_1 // \Pi_2 \leftrightarrow \frac{A_1}{A_2}=\frac{B_1}{B_2}=\frac{C_1}{C_2}$$ ，其中若分母为零，则理解对应的分子也为零。
- 平面 $$\Pi_1 \bot \Pi_2 \leftrightarrow A_1A_2+B_1B_2+C_1C_2=0$$ 
-  平面 $$\Pi_1,\Pi_2$$ 的夹角为 $$\theta$$ ，则 $$\cos{\theta}=\frac{|A_1A_2+B_1B_2+C_1C_2|}{\sqrt{A_1^2+B_1^2+C_1^2}\sqrt{A_2^2+B_2^2+C_2^2}}，(0\leq \theta \leq \frac{\pi}{2})$$ 

### 直线与直线间的位置关系

设直线 $$L_1:\frac{x-x_1}{l_1}=\frac{y-y_1}{m_1}=\frac{z-z_1}{n_1},L_2:\frac{x-x_2}{l_2}=\frac{y-y_2}{m_2}=\frac{z-z_2}{n_2}$$ ，则

- 直线 $$L_1//L_2 \leftrightarrow \frac{l_1}{l_2}=\frac{m_1}{m_2}=\frac{n_1}{n_2}$$ ，其中若分母为零，则理解对应的分子也为零。
- 直线 $$L_1 \bot L_2 \leftrightarrow l_1l_2+m_1m_2+n_1n_2=0$$
- 平面 $$L_1,L_2$$ 的夹角为 $$\theta$$ ，则 $$\cos{\theta}=\frac{|l_1l_2+m_1m_2+n_1n_2|}{\sqrt{l_1^2+m_1^2+n_1^2}\sqrt{l_2^2+m_2^2+n_2^2}}，(0\leq \theta \leq \frac{\pi}{2})$$ 

### 平面与直线的位置关系

设平面 $$\Pi:Ax+By+Cz+D=0$$ ，直线 $$L:\frac{x-x_0}{l}=\frac{y-y_0}{m}=\frac{z-z_0}{n}$$ ，则

- $$\Pi // L \leftrightarrow Al+Bm+Cn=0$$ 
- $$\Pi \bot L \leftrightarrow \frac{A}{l}=\frac{B}{m}=\frac{C}{n}$$ ，其中若分母为零，则理解对应的分子也为零。
- $$L,\Pi$$ 的夹角为 $$\theta$$ ，则 $$\sin{\theta}=\frac{|Al+Bm+Cn|}{\sqrt{A^2+B^2+C^2}\sqrt{l^2+m^2+n^2}}，(0\leq \theta \leq \frac{\pi}{2})$$ 

## 距离

### 点到平面的距离

点 $$(x_0,y_0,z_0)$$ 到平面 $$\Pi:Ax+By+Cz+D=0$$ 的距离为
$$
d=\frac{|Ax_0+By_0+Cz_0+D|}{\sqrt{A^2+B^2+C^2}}
$$

### 点到直线的距离

点 $$(x_0,y_0,z_0)$$ 到直线 $$\frac{x-x_1}{l}=\frac{y-y_1}{m}=\frac{z-z_1}{n}$$ 的距离为
$$
d=\frac{|\{x_1-x_0,y_1-y_0,z_1-z_0\} \times \{l,m,n\}|}{\sqrt{l^2+m^2+n^2}}
$$

### 两不相交直线间的距离

设直线 $$L_1,L_2$$ 的方向向量分别为 $$\vec{s_1}=\{l_1,m_1,n_1\},\vec{s_2}=\{l_2,m_2,n_2\}$$ ，点 $$A\in L_1,B\in L_2$$ ，则 $$L_1,L_2$$ 间的距离
$$
d=\frac{|(\vec{s_1}\vec{s_2}\overrightarrow{AB})|}{|\vec{s_1} \times\vec{s_2}|}
$$

## ChangeLog

> 2018.09.17 初稿