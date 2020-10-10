# 向量代数

## 向量的基本概念

### 向量（矢量）

### 向量的模

### 向量的坐标和坐标表示

向量 $$\vec{a}$$ 在直角坐标系的三个坐标上的投影 $$\{a_x,a_y,a_z\}$$ 叫作向量 $$\vec{a}$$ 的坐标，记为 $$\vec{a}=\{a_x,a_y,a_z\}=a_x \vec{i}+a_y \vec{j}+a_z \vec{k}$$ ，此时 $$|a|=\sqrt{a_x^2+a_y^2+a_z^2}$$ 

#### 零向量

#### 单位向量

### 向量的夹角

#### 向量的方向余弦

若向量 $$\vec{a}$$ 为非零向量，它与 x 轴， y 轴， z 轴正向夹角分别为 $$\alpha, \beta, \gamma$$ ，则称 $$\cos{\alpha},\cos{\beta},\cos{\gamma}$$ 为向量 $$\vec{a}$$ 的方向余弦，且 $$a^{\circ}=\{\cos{\alpha},\cos{\beta},\cos{\gamma}\},\cos^2{\alpha}+\cos^2{\beta}+\cos^2{\gamma}=1$$ 

## 向量的运算和性质

### 向量积（或称叉积、外积）

#### 几何表示

模：$$|\vec{a} \times \vec{b}|=|\vec{a}||\vec{b}|\sin{\theta},\theta=<\vec{a},\vec{b}>$$ ，恰好等于以 $$\vec{a},\vec{b}$$ 为邻边的平行四边形的面积，两向量平行的为零

方向：$$\vec{a} \times \vec{b} \bot \vec{a},\vec{a} \times \vec{b} \bot \vec{b}$$ ，符合右手法则（右手大拇指、食指和中指的坐标系）

### 混合积

#### 定义

称 $$(\vec{a} \times \vec{b}) \cdot \vec{c}$$ 为三个矢量 $$\vec{a} ,\vec{b} , \vec{c}$$ 的混合积，记为 $$(\vec{a} \vec{b} \vec{c})$$ 。设 $$\vec{a}=\{a_x,a_y,a_z\},\vec{b}=\{b_x,b_y,b_z\},\vec{c}=\{c_x,c_y,c_z\}$$ ，则
$$
(\vec{a} \vec{b} \vec{c})=\begin{vmatrix}a_x & a_y & a_z\\b_x & b_y & b_z\\c_x & c_y & c_z \end{vmatrix}
$$

#### 运算规律

轮换对称：$$(\vec{a} \vec{b} \vec{c})=(\vec{b} \vec{c} \vec{a})=(\vec{c}\vec{a} \vec{b})$$ 

向量互换，混合积变号：$$(\vec{a} \vec{b} \vec{c})=-(\vec{b}\vec{a}  \vec{c})$$ 

#### 混合积在几何上的应用

以 $$\vec{a} ,\vec{b} , \vec{c}$$ 为棱的平行六面体体积：$$V=|(\vec{a} \vec{b} \vec{c})|$$ 

若 $$\vec{a} ,\vec{b} , \vec{c}$$ 共面，则 $$(\vec{a} \vec{b} \vec{c})=0$$ 

## ChangeLog

> 2018.09.16 初稿