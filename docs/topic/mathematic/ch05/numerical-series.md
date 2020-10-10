# 常数项级数

## 定义

设有数列 $$\{u_n\}$$ ，则称 $$\sum_{n=1}^{\infty} u_n = u_1 + u_2 + \cdots +u_n + \cdots$$ 为无穷级数。令 $$S_n = u_1 + u_2 + \cdots +u_n(n=1,2,\cdots)$$ ，则称数列 $$\{S_n\}$$ 为级数 $$\sum_{n=1}^{\infty} u_n$$ 的部分和数列。

- 若 $$\lim \limits_{n \rightarrow \infty} S_n = S$$  ，则称级数 $$\sum_{n=1}^{\infty} u_n$$ 收敛，此时极限 S 称为级数 $$\sum_{n=1}^{\infty} u_n$$ 的和；
- 若 $$\{S_n\}$$ 没有极限，则称级数 $$\sum_{n=1}^{\infty} u_n$$ 发散。

由定义可得级数 $$\sum_{n=1}^{\infty} u_n$$ 收敛的必要条件是 $$\lim \limits_{n \rightarrow \infty} u_n = 0$$ 

## 级数的判别准则

### 正项级数

> $$\sum_{n=1}^{\infty} u_n,u_n \geq 0$$ 

基本定理：正项级数 $$\sum_{n=1}^{\infty} u_n$$ 收敛<=>部分和数列 $$\{S_n\}$$ 有界。

#### 比较判别法

若 $$0 \leq u_n \leq v_n$$ ，则 $$\sum_{n=1}^{\infty} v_n$$ 收敛 => $$\sum_{n=1}^{\infty} u_n$$ 收敛；$$\sum_{n=1}^{\infty} u_n$$ 发散 => $$\sum_{n=1}^{\infty} v_n$$ 发散。

比较判别法的极限形式：设 $$\lim \limits_{n \rightarrow \infty} \frac{u_n}{v_n} = l \quad (0 \leq l \leq + \infty)$$，

- 若 $$0<l<+ \infty$$ ，则 $$\sum_{n=1}^{\infty} u_n$$ 与 $$\sum_{n=1}^{\infty} v_n$$ 同敛散；
- 若 $$l=0$$ ，则 $$\sum_{n=1}^{\infty} v_n$$ 收敛 => $$\sum_{n=1}^{\infty} u_n$$ 收敛；
- 若 $$l= \infty$$ ，则 $$\sum_{n=1}^{\infty} v_n$$ 发散 => $$\sum_{n=1}^{\infty} u_n$$ 发散。

#### $\rho$ 判别法

比值判别法：设 $$\lim \limits_{n \rightarrow \infty} \frac{u_{n+1}}{u_n} = \rho$$ ，则

- 若 $$\rho < 1$$ ，则 $$\sum_{n=1}^{\infty} u_n$$ 收敛；
- 若 $$\rho > 1$$ ，则 $$\sum_{n=1}^{\infty} u_n$$ 发散；
- 若 $$\rho = 1$$ ，则 $$\sum_{n=1}^{\infty} u_n$$ 不确定；

根值判别法：设 $$\lim \limits_{n \to \infty} \sqrt[n] {u_n} = \rho$$ ，则

- 若 $$\rho < 1$$ ，则 $$\sum_{n=1}^{\infty} u_n$$ 收敛；
- 若 $$\rho > 1$$ ，则 $$\sum_{n=1}^{\infty} u_n$$ 发散；
- 若 $$\rho = 1$$ ，则 $$\sum_{n=1}^{\infty} u_n$$ 不确定；

#### 特定级数

几何级数： $$\sum_{n=1}^{\infty} r^n$$ ，当 $$|r|<1$$ 时收敛，当 $$|r| \geq 1$$ 时发散。

p 级数（对数 p 级数）： $$\sum_{n=1}^{\infty} \frac{1}{n^p}$$ ( $$\sum_{n=1}^{\infty} \frac{1}{nln^pn}$$)，当 $$p>1$$ 时收敛，当 $$p \leq 1$$ 时发散。

#### 判别法先后顺序

1. 判断 $$\lim \limits_{n \to \infty} u_n = 0?$$ 
2. $$\rho$$ 判别法
3. 比较判别法（无穷小量、特定级数）
4. 定义（部分和数列有界）

### 交错级数

> $$\sum_{n=1}^{\infty} (-1)^{n-1} u_n,u_n \geq 0$$

#### 莱布尼茨准则

若 $$ u_n \geq u_{n+1}(n = 1,2, \cdots)$$ 且 $$\lim\limits_{n \to \infty} u_n = 0$$ ，则级数 $$\sum_{n=1}^{\infty} (-1)^{n-1} u_n$$ 收敛。

使用该准则时，时可找一个可导函数 $$f(x)$$ ，使得 $$f(n) = u_n$$ ，再证明 $$f'(x)<0$$ 且 $$\lim \limits_{x \to \infty} f(x) = 0$$ 

### 任意项级数

> $$\sum_{n=1}^{\infty} u_n,u_n \in R$$

绝对收敛：若级数 $$\sum_{n=1}^{\infty} |u_n|$$ 收敛，则称级数 $$\sum_{n=1}^{\infty} u_n$$ 绝对收敛；

条件收敛：若级数 $$\sum_{n=1}^{\infty} u_n$$ 收敛，而级数 $$\sum_{n=1}^{\infty} |u_n|$$ 发散，则称级数 $$\sum_{n=1}^{\infty} u_n$$ 条件收敛。

设 $$\lim \limits_{n \rightarrow \infty} | \frac{u_{n+1}}{u_n}| = \rho$$ ，若 $$\rho > 1$$ ，则$$\lim \limits_{n \to \infty} |u_n| =+ \infty$$ ，且 $$\sum_{n=1}^{\infty} u_n$$ 发散。

## ChangeLog

> 2018.08.17 初稿