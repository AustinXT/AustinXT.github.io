# 幂级数

## 函数项级数

设 $$u_1(x), u_2(x), \cdots , u_n(x)$$ 是定义在区间 $$I$$ 上的函数序列，则称 $$\sum_{n=1}^{\infty} u_n(x)$$ 为定义在区间 $$I$$ 上的函数项级数。

若 $$x_0 \in I$$ ，函数项级数 $$\sum_{n=1}^{\infty} u_n(x_0)$$ ，则称 $$x_0$$ 为 $$\sum_{n=1}^{\infty} u_n(x)$$ 的收敛点，否则为发散点，所有的收敛点的集合称为收敛域。

函数项级数在收敛域内的和记为$$S(x)$$ ， $$S(x) =  \sum_{n=1}^{\infty} u_n(x)$$ 。

## 幂级数的定义

### 定义

形如 $$\sum_{n=0}^{\infty} a_n(x-x_0)^n$$ 的函数项级数称为 $$(x-x_0)$$ 的幂级数。

### 阿贝尔定理

- 若级数  $$\sum_{n=0}^{\infty} a_nx^n$$ 当 $$x=x^*(x^* \neq 0)$$ 时收敛，则当 $$|x|<|x^*|$$ 时 $$\sum_{n=0}^{\infty} a_nx^n$$ 绝对收敛；
- 若级数  $$\sum_{n=0}^{\infty} a_nx^n$$ 当 $$x=x^*$$ 时发散，则当 $$|x|>|x^*|$$ 时 $$\sum_{n=0}^{\infty} a_nx^n$$ 发散。

### 求收敛半径和收敛域

设幂级数 $$\sum_{n=0}^{\infty} a_nx^n$$ ，当 n 充分大时 $$a_n \neq 0$$ ， $$\lim \limits_{n \rightarrow \infty} \frac{a_{n+1}}{a_n} = \rho$$ ，则

- 若 $$\rho = +\infty$$ ，则收敛半径 $$R=0$$ 
- 若 $$0 < \rho < +\infty $$ ，则收敛半径 $$R= \frac{1}{\rho}$$ 
- 若 $$\rho = 0$$ ，则收敛半径 $$R= +\infty$$ 

设 $$\lim \limits_{n \to \infty} \sqrt[n] {a_n} = \rho$$ ，则

- 若 $$\rho = +\infty$$ ，则收敛半径 $$R=0$$ 
- 若 $$0 < \rho < +\infty $$ ，则收敛半径 $$R= \frac{1}{\rho}$$ 
- 若 $$\rho = 0$$ ，则收敛半径 $$R= +\infty$$ 

设幂级数的和函数为 $$S(x)$$ ，则其收敛域包括 $$(-R,R)$$ ，而 $$x=\pm R$$ 需要单独代入幂级数的和函数看是否收敛。若和函数收敛，则和函数的收敛域包含该点；否则不包含。

若幂级数  $$\sum_{n=0}^{\infty} a_n(x-x_0)^n$$ 在 $$x=b$$ 处条件收敛，则 $$x=b$$ 为该幂级数收敛区间的一个端点。

### 性质

设幂级数 $$\sum_{n=0}^{\infty} a_nx^n$$ 的收敛半径为 $$R_1$$ ，和函数为 $$S_1(x)$$ ，幂级数 $$\sum_{n=0}^{\infty} b_nx^n$$ 的收敛半径为 $$R_2$$ ，和函数为 $$S_2(x)$$ ， $$R=\min(R_1, R_2)$$ ，则

- $$\sum_{n=0}^{\infty} a_nx^n + \sum_{n=0}^{\infty} b_nx^n = \sum_{n=0}^{\infty} (a_n+b_n)x^n = S_1(x)+S_2(x),x\in(-R,R)$$ 
-  $$(\sum_{n=0}^{\infty} a_nx^n)(\sum_{n=0}^{\infty} b_nx^n)=\sum_{n=0}^{\infty} (a_0b_n+a_1b_{n-1}+\cdots+a_nb_0)x^n = S_1(x)S_2(x),x\in(-R,R)$$ 

设幂级数 $$\sum_{n=0}^{\infty} a_nx^n$$ 的和函数为 $$S(x)$$ ，则 $$S(x)$$ 在其收敛域内连续、可导和可积。

## 函数的幂级数展开

### 泰勒级数与麦克劳林级数

设 $$f(x)$$ 在 $$x=x_0$$ 处任意阶可导，则幂级数
$$
\sum_{n=0}^{\infty} \frac{f^{(n)}(x_0)}{n!}(x-x_0)^n = f(x_0)+f'(x_0)(x-x_0)+ \cdots + \frac{f^{(n)}(x_0)}{n!}(x-x_0)^n + \cdots
$$
称为 $$f(x)$$ 在$$x=x_0$$ 处的泰勒级数。

当 $$x_0 = 0$$ 时，泰勒级数即为麦克劳林级数。

### 泰勒级数的收敛定理

设 $$f(x)$$ 在 $$x=x_0$$ 处任意阶可导，则泰勒级数$$\sum_{n=0}^{\infty} \frac{f^{(n)}(x_0)}{n!}(x-x_0)^n$$ 在 $$|x-x_0|<R$$ 内收敛于 $$f(x)$$ 的充要条件是 $$\lim \limits_{n \to \infty} R_n(x) = 0(|x-x_0|<R)$$ ，其中 $$R_n(x) = \frac{f^{(n+1)}[x_0+\theta (x-x_0)]}{(n+1)!}(x-x_0)^{n+1}$$ 

### 常用的麦克劳林展开式

- $$\frac{1}{1-x} = 1+x+x^2+ \cdots +x^n+\cdots,x \in (-1,1)$$ 
- $$e^x = 1+x+\frac{x^2}{2!}+ \cdots + \frac{x^n}{n!}+ \cdots,x \in (-\infty,+\infty)$$ 
- $$\sin x =  x - \frac{x^3}{3!}+ \cdots + \frac{(-1)^nx^{2n+1}}{(2n+1)!} + \cdots,x \in (-\infty,+\infty)$$
- $$\cos x = 1 - \frac{x^2}{2!}+ \cdots + \frac{(-1)^nx^{2n}}{(2n)!} + \cdots,x \in (-\infty,+\infty)$$ 
- $$ln(1+x) = x - \frac{x^2}{2} + \cdots + \frac{(-1)^{n-1}x^n}{n}+\cdots,x \in (-1,1]$$ 
- $$(1+x)^a = 1 + ax + \frac{a(a-1)}{2!}x^2 + \cdots +\frac{a(a-1) \cdots (a-n+1)}{n!}x^n + \cdots,x \in(-1,1)$$ 

### 将函数展开为幂级数的方法

#### 直接法

1. 求出 $$f(x)$$ 在 $$x_0$$ 点处的各阶导数 $$f^{(n)}(x_0)$$ ，写出 $$f(x)$$ 在 $$x=x_0$$ 处泰勒级数 $$\sum_{n=0}^{\infty} \frac{f^{(n)}(x_0)}{n!}(x-x_0)^n$$ 
2. 考察极限 $$\lim \limits_{n \to \infty} \frac{f^{(n+1)}[x_0 + \theta (x-x_0)]}{(n+1)!}(x-x_0)^{n+1}$$ 是否为0

#### 间接法

利用常用的麦克劳林展开式变换求得

## ChangeLog

> 2018.08.19 初稿