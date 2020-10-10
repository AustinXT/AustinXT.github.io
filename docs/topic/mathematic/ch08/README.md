# 向量

## 向量组

### Schmidt 正交

向量组 $$\alpha_1, \alpha_2, \alpha_3$$ 线性无关，$$\beta_1=\alpha_1,\beta_2= \alpha_2-\frac{(\alpha_2,\beta_1)}{(\beta_1,\beta_1)}\beta_1,\beta_3= \alpha_3-\frac{(\alpha_3,\beta_1)}{(\beta_1,\beta_1)}\beta_1-\frac{(\alpha_3,\beta_2)}{(\beta_2,\beta_2)}\beta_2$$  

### 向量空间

全体 n 维向量连同向量的加法和数乘运算合称为 n 维向量空间。

若向量空间 V 中的 m 个向量 $$\alpha_1, \alpha_2, \cdots,\alpha_m$$ 满足

-  $$\alpha_1, \alpha_2, \cdots,\alpha_m$$ 线性无关
- 对于 V 中任意向量 $$\beta$$ ，  $$\beta$$ 均可由向量组 $$\alpha_1, \alpha_2, \cdots,\alpha_m$$ 线性表出，即 $$x_1\alpha_1 + x_2\alpha_2 + \cdots + x_m\alpha_m = \beta$$  

则称 $$\alpha_1, \alpha_2, \cdots,\alpha_m$$ 为向量空间 V 的一个基底，m 为向量空间的维数，向量 $$\beta$$ 的表示系数 $$x_1,x_2,\cdots, x_m$$ 称为向量 $$\beta$$ 在基底 $$\alpha_1, \alpha_2, \cdots,\alpha_m$$ 下的坐标。

### 过渡矩阵

在 n 维向量空间给定两组基， $$\alpha_1, \alpha_2, \cdots,\alpha_n$$ 和 $$\beta_1,\beta_2,\cdots,\beta_3$$ ，若 $$[\beta_1,\beta_2,\cdots,\beta_3]=[\alpha_1, \alpha_2, \cdots,\alpha_n]C$$ ，则 $$C_{nn}$$ 称为由基 $$\alpha_1, \alpha_2, \cdots,\alpha_n$$ 过渡到 $$\beta_1,\beta_2,\cdots,\beta_3$$ 的过渡矩阵，过渡矩阵可逆。若 $$\alpha_1, \alpha_2, \cdots,\alpha_n$$ 和 $$\beta_1,\beta_2,\cdots,\beta_3$$ 都是规范正交基的充要条件是 C 是正交矩阵。

若向量 $$\gamma$$ 在基 $$\alpha_1, \alpha_2, \cdots,\alpha_n$$ 的坐标为 $$x_1,x_2,\cdots, x_n$$ ，向量 $$\gamma$$ 在基 $$\beta_1,\beta_2,\cdots,\beta_3$$ 的坐标为 $$y_1,y_2,\cdots, y_n$$ ，则坐标变换公式为 $$[x_1,x_2,\cdots, x_n]^T=C[y_1,y_2,\cdots, y_n]^T$$ 

## 线性方程组

### 克拉默法则

若 n 个方程 n 个未知量构成的非齐次线性方程组 $$Ax=b$$ 的系数行列式 $$|A| \neq 0$$ ，则方程组有唯一解，且 $$x_i=\frac{|A_i|}{|A|}$$ ，其中 $$A_i$$ 为第 i 列元素（即 $$x_i$$  的系数）换成右边的常数项所构成的矩阵。

### 齐次线性方程组基础解系

齐次线性方程组 $$Ax=0$$ 的解满足，

-  若 r(A)<n，则存在基础解系，r(A)+线性无关解的个数=n 
- 若 r(A)=n，则只有零解

### 非齐次线性方程组有解条件

- $$A_{m\times n}x=b$$ 有解 
- b 可由 A 的列向量 $$\alpha_1, \alpha_2, \cdots,\alpha_n$$ 线性表出
- r(A)=r(A|b)

三者等价

