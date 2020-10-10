# 矩阵

## 行列式

### 逆序数

一个排列中，若一个大的数排在小的数钱，则两数构成一个逆序，一个排列的逆序总数称为排列的逆序数。

### 行列式的性质

- 经过转置的行列式的值不变

- 两行（两列）互换位置，行列式变号

- 若行列式某一行（列）同乘以 k，等于行列式乘以 k

- 若行列式某行（列）是两个元素之和，则可把行列式拆成两个行列式之和

 $$\begin{vmatrix} a_1+b_1 & a_2+b_2 & a_3+b_3 \\ c_1 & c_2 & c_3 \\ d_1 & d_2 & d_3 \end{vmatrix} = \begin{vmatrix} a_1 & a_2 & a_3 \\ c_1 & c_2 & c_3 \\ d_1 & d_2 & d_3 \end{vmatrix} = \begin{vmatrix} b_1 & b_2 & b_3 \\ c_1 & c_2 & c_3 \\ d_1 & d_2 & d_3 \end{vmatrix}$$ 

- 某一行（列）的 k 倍加到另一行（列），行列式的值不变

### 行列式展开公式

n 阶行列式的值等于它任何一行（列）元素，与其对应的代数余子式乘积之和。

行列式 D 的第 i 行第 j 列的元素 $$a_{ij}$$ 的代数余子式，等于 D 划去第 i 行第 j 列后的得到的行列式的值（即余子式）乘以 $$(-1)^{i+j}$$ 

### 范德蒙行列式

$$\begin{vmatrix} 1 & 1 & \cdots & 1 \\ x_1 & x_2 & \cdots &x_n \\ x_1^2 & x_2^2 & \cdots &x_n^2 \\ \vdots & \vdots & \ddots & \vdots \\ x_1^{n-1} & x_2^{n-1} & \cdots &x_n^{n-1} \end{vmatrix} = \prod_{1 \leq j<i \leq n} (x_i-x_j)$$ 

### 抽象 n 阶方阵行列式公式

- $$| AB  | =  | A  |   | B  |$$ 
- 若 A 可逆，则 $$|A^{-1}|=|A|^{-1}$$ 
- 若 $$\lambda_i$$ 是 A 的特征值，则 $$|A|=\prod_{i=1}^n \lambda_i$$ 
- 若方阵 A 与 B 相似，则 $$|A|=|B|$$ 

## 可逆矩阵

### 伴随矩阵

由矩阵 A 的行列式 |A| 所有的代数余子式所构成形如 $$\begin{bmatrix} A_{11} & A_{21} & \cdots & A_{n1} \\ A_{12} & A_{22} & \cdots & A_{n2} \\ \vdots & \vdots & \ddots & \vdots \\ A_{1n} & A_{2n} & \cdots & A_{nn} \end{bmatrix}$$ 的矩阵称为矩阵 A 的伴随矩阵，记为 A*

$$AA^*=|A|E$$ 

$$r(A^*)= \begin{cases} n, r(A)=n \\ 1, r(A)=n-1 \\ 0, r(A)<n-1 \end{cases}$$ 

### n 阶矩阵 A 可逆的充要条件

- 存在 n 阶矩阵 B ，使得 AB=E
- |A| ≠ 0，或秩r(A)=n ，或 A 的列（行）向量线性无关
- 齐次方程组 Ax=0 只有零解；对于 n 维列向量 b ，非齐次方程组 Ax=b 总有唯一解
- 矩阵 A 的特征值全不为 0

### 逆矩阵的运算性质

- 若 k≠0，则 $$(kA)^{-1}=\frac{1}{k}A^{-1}$$ 
- 若 A,B 可逆，则 $$(AB)^{-1}=B^{-1}A^{-1}$$ 
- 矩阵的逆、伴随和转置可互相交换位置

## 初等变换

### 三种初等变换

- 互换两行（列）
- 用非零常数乘以某行（列）的每个元素
- 把某行（列）的 k 倍加到另一行（列）

若矩阵 A 经过有限次初等变换得到矩阵 B，则矩阵 A 和 B 等价。

### 初等矩阵（单位经由一次初等变换得到的矩阵）

- $$E_{ij}$$ ，对换 E 的 i,j 行（列），$$E_{ij}^{-1}=E_{ij}^T=E_{ij}$$ 
- $$E_2(k)$$ ，E 的第 i 行（列）乘以 k，$$E^{-1}_2(k)=E_2(\frac{1}{k})$$ 
- $$E_{ij}(k)$$ ，E 的第 j 行乘以 k 加到第 i 行上，$$E^{-1}_{ij}(k)=E_{ij}(-k)$$ ，$$E^T_{ij}(k)=E_{ji}(k)$$ 

初等矩阵 P 左乘 A，相当于 A 做了一次和矩阵 P 同样的初等行变换；右乘就是相应的列变换。

## 矩阵的秩

- 经初等变换，矩阵的秩不变（若 A 可逆，则 $$r(AB)=r(BA)=r(B)$$ ）
- $$r(A^TA)=r(A)$$ 
- $$r(A+B) \leq r(A)+r(B)$$ 
- $$r(AB) \leq min(r(A),r(B))$$ 
- 设 $$A_{mn},B_{ns}$$ ，则 $$r(A)+r(B) \leq n+r(AB)$$ 

## 分块矩阵

### 分块矩阵运算

- 加法、数与矩阵的乘积、矩阵与矩阵的乘法，与普通矩阵运算形式相同
- 转置，设 $$A=\begin{bmatrix} A_{11} & \cdots & A_{1r} \\ \vdots & & \vdots \\ A_{s1} & \cdots & A_{sr} \end{bmatrix}$$ ，则  $$A^T=\begin{bmatrix} A_{11}^T & \cdots & A_{s1}^T \\ \vdots & & \vdots \\ A_{1r}^T & \cdots & A_{sr}^T \end{bmatrix}$$ 
- 对角矩阵，若分块矩阵 A 对角线上的子块都是方阵，则 $$A=\begin{bmatrix} A_1 & & & \\ & A_2 & & \\ & & \ddots & \\ & & & A_s \end{bmatrix}$$ ，则 $$|A|=|A_1||A_2| \cdots |A_s|$$ ；若 $$A_i \neq 0$$ ，则 $$A^{-1}= \begin{bmatrix} A_1^{-1} & & & \\ & A_2^{-1} & & \\ & & \ddots & \\ & & & A_s^{-1} \end{bmatrix}$$ 
- $$\begin{bmatrix} O & B \\ C & O \end{bmatrix}^{-1}= \begin{bmatrix} O & C^{-1} \\ B^{-1} & O \end{bmatrix}$$ 

## ChangeLog

> 2018.10.28 初稿