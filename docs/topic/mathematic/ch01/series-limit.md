# 数列极限

> 数列的项数是无穷的

## 数列极限的定义

给定数列 $$\{x_n \}$$ 及常数 $$a$$ ，$$\forall \epsilon > 0$$ ，存在 $$N \in N^+$$ ，当 $$n>N$$ 时，恒有 $$|x_n -a|<\epsilon$$ ，称 $$a$$ 为数列 $$\{x_n \}$$ 的极限，或称数列收敛域 $$a$$ ，记作 $$\lim \limits_{n \to \infty}x_n =a$$ 或 $$x_n \to a (n \to \infty)$$ .

## 数列极限的性质

### 唯一性

若数列 $$\{x_n \}$$ 的极限存在，则极限值必唯一。

### 有界性

若数列 $$\{x_n \}$$ 收敛，则数列 $$\{x_n \}$$ 有界。

证：存在 $$N\in N^+$$ ，当 $$n>N$$ 时，恒有 $$a-\epsilon <x_n <a+\epsilon$$ ，则存在 $$M>0$$ ，使得 $$|\min\{x_1,x_2,\cdots,x_n\} +a-\epsilon|<M$$ 且 $$|\max\{x_1,x_2,\cdots,x_n\} +a+\epsilon|<M$$ .

### 保号性

若 $$\lim \limits_{n \to \infty}x_n =a$$ ，且 $$a>0(a<0)$$ ，则存在 $$N\in N^+$$ ，当 $$n>N$$ 时，恒有 $$x_n>0(x_n<0)$$ .

#### 推论

若 $$\lim \limits_{n \to \infty}x_n =a,\lim \limits_{n \to \infty}y_n = b, a>b$$ ，则 存在 $$N\in N^+$$ ，当 $$n>N$$ 时，恒有 $$x_n >y_n$$ .

若存在 $$N\in N^+$$ ，当 $$n>N$$ 时，恒有 $$x_n\geq 0$$ ，且 $$\lim \limits_{n \to \infty}x_n =a$$ ，则 $$a\geq 0$$ .

### 夹逼定理

若数列 $$\{x_n\},\{y_n\},\{z_n\}$$ 满足

- 存在 $$N\in N^+$$ ，当 $$n>N$$ 时，恒有 $$y_n \leq x_n \leq z_n$$ 
-  $$\lim \limits_{n \to \infty}y_n =a,\lim \limits_{n \to \infty}z_n =a$$ 

则  $$\lim \limits_{n \to \infty}x_n =a$$ 

### 单调有界数列必收敛



数列 $$\{x_n \}$$ 单调不减，且有上界，则数列 $$\{x_n \}$$ 必有极限。

## 子数列

设数列 $$\{x_n \}$$ ，存在自然数严格递增数列 $$\{n_k \}$$ ，即 $$n_1<n_2<\cdots <n_k<\cdots$$ ，则称其为数列 $$\{x_n \}$$ 的子数列，记作数列 $$\{x_{n_k} \}$$ 

 $$\lim \limits_{n \to \infty}x_n =a$$ 的充要条件是对数列 $$\{x_n \}$$的任意子数列 $$\{x_{n_k} \}$$ 都有 $$\lim\limits_{n \to \infty}x_{n_k} =a$$ 

## 利用积分和式求数列极限



> 针对数列和为 n 项和或 n 项积的情形

设 $$f(x)$$ 在 $$[0,1]$$ 上连续，则 $$ \lim \limits_{n \to \infty} \frac{1}{n} \sum_{k=1}^n f(\frac{k}{n}) = \int_0^1 f(x)dx$$ .

设 $$f(x)$$ 在 $$[a,b]$$ 上连续，则 $$ \lim \limits_{n \to \infty} \frac{b-a}{n} \sum_{k=1}^n f(a+\frac{b-a}{n}k) = \int_a^b f(x)dx$$ .

## 常用极限

$$\lim\limits_{n \to \infty}\sqrt[n]{n}=1$$ 

## ChangeLog

> 2018.09.01 初稿