# 函数极限

## 定义

### 邻域

设 $$\delta > 0$$ ，实数集合 $$U(x_0,\delta ) = \{x|0 \leq |x-x_0| \leq \delta \}$$ 称为点 $$x_0$$ 半径为 $$\delta$$ 的邻域。$$\overset{o}U(x_0,\delta)$$ 表示去心邻域，$$U^+(x_0,\delta)$$ 表示右邻域。 

### 函数极限定义

设函数 $$f(x)$$ 在 $$\overset{o}U(x_0,\delta)$$ 内有定义，若存在常数 $$A$$ ，$$\forall \ \epsilon >0$$ ，总存在 $$\delta >0$$ ，使得当 $$0<|x-x_0|<\delta$$ 时，对应的函数值 $$f(x)$$ 都满足不等式 $$|f(x)-A|<\epsilon$$ ，则 $$A$$ 为函数 $$f(x)$$ 当 $$x \to x_0$$ 时的极限，记作 $$\lim \limits_{x \to x_0}f(x)=A$$ 或 $$f(x) \to A(x \to x_0)$$ .

函数极限存在的充要条件左极限和右极限均存在且相等。

### 函数极限的运算法则

若 $$\lim f(x) =A,\lim g(x) =B,f(x)-A=\alpha(x),g(x)-B=\beta(x)$$ ，则

- $$ \lim[f(x)\pm g(x)]=A\pm B$$ 
- $$ \lim[f(x)\cdot g(x)]=A\cdot B$$
- $$\lim \frac{f(x)}{g(x)}=\frac{A}{B}$$
- $$\lim f(x)^{g(x)}=A^B(A>0)$$ （定义法） 

## 函数极限性质

### 唯一性

若 $$\lim \limits_{x \to x_0}f(x)$$ 存在，则此极限值必唯一。

### 局部有界性

若 $$\lim \limits_{x \to x_0}f(x)=A$$ ，则 $$f(x)$$ 在 $$\overset{o}U(x_0,\delta)$$ 内有界。

### 局部保号性

若 $$\lim \limits_{x \to x_0}f(x)=A(A>0)$$ ，则存在 $$\delta >0$$ ，使得当 $$0<|x-x_0|<\delta$$ 时，有 $$f(x)>0$$ .

若在 $$\overset{o}U(x_0,\delta)$$ 内有 $$f(x) \geq 0$$ ，且 $$\lim \limits_{x \to x_0}f(x)=A$$ ，则 $$A \geq 0$$ .

### 海涅定理

若函数 $$f(x)$$ 在 $$\overset{o}U(x_0,\delta)$$ 内有定义，则 $$\lim \limits_{x \to x_0}f(x)=A$$ 存在的充要条件是，对任何以 $$x_0$$ 为极限的数列 $$\{x_n \}(x_n \neq x_0)$$ ，极限 $$\lim \limits_{n \to \infty}f(x_n)=A$$ 存在。

$$x \to \infty$$ 时，要求 $$f(x)$$ 当 $$|x|>X$$ 时有定义

### 夹逼准则

设函数 $$f(x),g(x),\varphi(x)$$ 满足

- $$g(x)\leq f(x) \leq \varphi(x)$$ 
- $$\lim g(x)=\lim \varphi (x)=A$$ 

则 $$\lim f(x)$$ 存在且 $$\lim f(x) = A$$ .

注意

- $$x \to x_0$$ 时，要求 $$f(x)$$ 在 $$\overset{o}U(x_0,\delta)$$ 内有定义
- $$x \to \infty$$ 时，要求 $$f(x)$$ 当 $$|x|>X$$ 时有定义，$$X$$ 为充分大的正数

## 洛必达法则

设

- 当 $$x\to x_0$$ （或 $$x\to \infty$$ ）时，函数 $$f(x),F(x)$$ 都趋于 0 或 $$\infty$$ 
- 在 $$\overset{o}U(x_0,\delta)$$ 内（或 $$|x|>X$$ ，$$X$$ 为充分大的正数），$$f'(x),F'(x)$$ 存在且 $$F'(x) \neq 0$$ 
- $$\lim \limits_{x \to x_0}\frac{f(x)}{F(x)}$$ （或 $$\lim \limits_{x \to \infty}\frac{f(x)}{F(x)}$$ ） 存在或为无穷大

则 $$\lim \limits_{x \to x_0}\frac{f(x)}{F(x)} = \lim \limits_{x \to x_0}\frac{f'(x)}{F'(x)}$$ （或 $$\lim \limits_{x \to \infty}\frac{f(x)}{F(x)}=\lim \limits_{x \to \infty}\frac{f'(x)}{F'(x)}$$ ）

一般表达式中含有 $$\lim \limits_{x \to x_0} \sin \frac{1}{x-x_0}$$ 或 $$\lim \limits_{x \to \infty} \cos x$$ 等时，不用洛必达法则。

## 无穷大量和无穷小量

若当 $$x\to x_0$$ （或 $$x\to \infty$$ ）时，函数 $$f(x)$$ 都趋于 0 ，则称函数 $$f(x)$$ 为当 $$x\to x_0$$ （或 $$x\to \infty$$ ）时的无穷小。

若当 $$x\to x_0$$ （或 $$x\to \infty$$ ）时，函数 $$f(x)$$ 都趋于 $$\infty$$  ，则称函数 $$f(x)$$ 为当 $$x\to x_0$$ （或 $$x\to \infty$$ ）时的无穷大。

### 无穷小的比阶

设同一自变量的变化过程中，$$\lim \alpha(x)=0,\lim \beta (x)=0(\beta(x) \neq 0)$$ ，若 $$ \lim \frac{\alpha(x)}{\beta(x)}$$ 存在或无穷大，则 $$\alpha(x), \beta(x)$$ 可比阶。

### 等价无穷小代换

设同一自变量的变化过程中， $$\alpha_1(x), \alpha_2(x),\beta_1(x),\beta_2(x)$$ 都是无穷小，且 $$\alpha_1(x) \sim \alpha_2(x),\beta_1(x)\sim \beta_2(x)$$ 

- 若 $$ \lim \frac{\alpha_1(x)}{\beta_1(x)}$$ 存在或无穷大，则 $$\lim \frac{\alpha_2(x)}{\beta_2(x)}= \lim \frac{\alpha_1(x)}{\beta_1(x)}$$ .
- 若 $$ \lim \frac{\alpha_1(x)f(x)}{\beta_1(x)g(x)}$$ 存在或无穷大，则 $$\lim \frac{\alpha_2(x)f(x)}{\beta_2(x)g(x)}= \lim \frac{\alpha_1(x)f(x)}{\beta_1(x)g(x)}$$ .

### 无穷小的皮亚诺余项泰勒公式

$$e^x = 1+x+\frac{x^2}{2!}+ \cdots + \frac{x^n}{n!}+ o(x^n)$$ 

$$\sin x =  x - \frac{x^3}{3!}+ \cdots + \frac{(-1)^nx^{2n+1}}{(2n+1)!} + o(x^{2n+2})$$ 

$$\arcsin x = x+\frac{1}{6}x^3+\frac{3}{40}x^5+o(x^5)=x+\frac{1}{6}x^3+ \cdots +\frac{(2n-1)!!}{(2n)!!}\frac{x^{2n+1}}{2n+1} + o(x^{2n+3}) \ |x|<1$$ 

$$\cos x = 1 - \frac{x^2}{2!}+ \cdots + \frac{(-1)^nx^{2n}}{(2n)!} + o(x^{2n+1})$$ 

$$\tan x = x+\frac{1}{3}x^3 + \frac{2}{15}x^5+o(x^5)=x+\frac{1}{3}x^3 +\cdots + \frac{(-1)^{n-1}2^{2n}(2^{2n}-1)B_{2n}x^{2n-1}}{(2n)!}+o(x^{2n+1}) \ |x|< \frac{\pi}{2}$$ 

$$\arctan x = x-\frac{1}{3}x^3+\cdots +(-1)^n\frac{1}{2n+1}x^{2n+1}+o(x^{2n+1})$$ 

$$ln(1+x) = x - \frac{x^2}{2} + \cdots + \frac{(-1)^{n-1}x^n}{n}+o(x^n)$$ 

$$(1+x)^a = 1 + ax + \frac{a(a-1)}{2!}x^2 + \cdots +\frac{a(a-1) \cdots (a-n+1)}{n!}x^n + o(x^n)$$ 

## 常用极限

设 $$a(x)\to 0$$ ，且 $$\forall \ x \in \overset{o}U(x_0,\delta)$$ ，有 $$a(x) \neq 0$$ ，则 $$\lim \frac{sin(a(x))}{a(x)}$$ 

$$\lim \limits_{x\to +\infty}(x)^{\frac{1}{x}}=1$$ ，$$\lim \limits_{x\to 0^+}(x)^{\frac{1}{x}}=0$$ ，$$\lim \limits_{x\to 0^+}x^{x}=1​$$ 

$$\lim \limits_{x \to +\infty}\arctan x = \frac{\pi}{2}$$ ，$$\lim \limits_{x \to -\infty}\arctan x = -\frac{\pi}{2}$$ ，$$\lim \limits_{x \to +\infty}arccot x = 0$$ ，$$\lim \limits_{x \to -\infty}arccot x = \pi$$  

$$\lim \limits_{x \to 0^+}x^a(lnx)^k=0,\lim \limits_{x \to +\infty}x^ae^{-xk}=0(a>0,k>0)​$$ 

## ChangeLog

> 2018.09.01 初稿