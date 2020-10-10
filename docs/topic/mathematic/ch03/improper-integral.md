# 反常积分及其计算

## 定义

### 无穷区间上的反常积分

设 $$f(x)$$ 在 $$[a,+\infty)$$ 上连续，称 $$\int _a^{+\infty} f(x)dx=\lim \limits_{b \to +\infty} \int_a^bf(x)dx$$ 为 $$f(x)$$ 在 $$[a,+\infty)$$ 上的反常积分。若右边极限存在，则称反常积分收敛；否则反常积分发散。

设 $$f(x)$$ 在 $$(-\infty,+\infty)$$ 上连续，则反常积分定义为 $$\int_{-\infty}^{+\infty}f(x)dx=\int_{-\infty}^{x_0} f(x)dx+\int_{x_0}^{+\infty}f(x)dx$$ 

### 无界函数的反常积分

设 $$f(x)$$ 在 $$[a,b)$$ 上连续，且 $$\lim \limits_{x \to b^-}f(x)=\infty$$ ，称 $$\int _a^b f(x)dx=\lim \limits_{\beta \to b^-} \int_{\alpha}^{\beta}f(x)dx$$ 为 $$f(x)$$ 在 $$[a,b)$$ 上的反常积分（瑕积分），点 $$b$$ 称为 $$f(x)$$ 的奇点（瑕点）。

若点 $$a$$ 也是奇点，则 $$\int_a^bf(x)dx=\int_a^{x_0}f(x)dx+\int_{x_0}^bf(x)dx,a<x_0<b$$ ，若右边两个反常积分有一个发散，则左边反常积分发散。

若开区间 $$(a,b)$$ 内部点 $$c$$ 为奇点，则反常积分定义为 $$\int_a^bf(x)dx=\int_a^c f(x)dx+\int_c^bf(x)dx,a<x_0<b$$ 

## 对称区间上奇偶函数的反常积分

设 $$f(x)$$ 在 $$(-\infty,+\infty)$$ 上连续，且为奇函数，若 $$\int_0^{+\infty}f(x)dx$$ 收敛，则 $$\int_{-\infty}^{+\infty}f(x)dx=0$$ 

设 $$f(x)$$ 在 $$(-\infty,+\infty)$$ 上连续，且为偶函数，若 $$\int_0^{+\infty}f(x)dx$$ 收敛，则 $$\int_{-\infty}^{+\infty}f(x)dx=2\int_0^{+\infty}f(x)dx$$ 

设 $$f(x)$$ 在 $$[-a,a]$$ 上除 $$x=\pm c$$ 外均连续， $$x=\pm c$$ 为 $$f(x)$$ 的奇点，$$0 \leq c \leq a$$ ，又设 $$f(x)$$ 为奇函数，若 $$\int_0 af(x)dx$$ 收敛，则 $$\int_{-a}^af(x)dx=0$$ 

设 $$f(x)$$ 在 $$[-a,a]$$ 上除 $$x=\pm c$$ 外均连续， $$x=\pm c$$ 为 $$f(x)$$ 的奇点，$$0 \leq c \leq a$$ ，又设 $$f(x)$$ 为偶函数，若 $$\int_0 af(x)dx$$ 收敛，则 $$\int_{-a}^af(x)dx=2\int_0^af(x)dx$$ 

## 反常积分分部积分

设 $$f(x),g(x)$$ 在 $$[a,+\infty)$$ 上有连续导数，当且仅当 $$\lim \limits_{x \to +\infty}f(x)g(x)$$ 存在，且 $$\int_a^{+\infty}f'(x)g(x)dx$$ 收敛，则有 $$\int_a^{+\infty}f(x)g‘(x)dx=f(x)g(x)|_a^{+\infty}-\int_a^{+\infty}f'(x)g(x)dx$$ ，否则 $$\int_a^{+\infty}f(x)g'(x)dx=[f(x)g(x)-\int f'(x)g(x)dx]_a^{+\infty}$$ 

## 重要反常积分

$$\int_{-\infty}^{+\infty} e^{-x^2}dx=2\int_0^{+\infty} e^{-x^2}dx=\sqrt{\pi}$$ 

若 $$a>0$$ ，则 $$\int_a^{+\infty} \frac{dx}{x^p}=\begin{cases} \frac{a^{1-p}}{p-1},& p>1\\ +\infty ,&p \leq 1 \end{cases}$$ 

若 $$a>1$$ ，则 $$\int_a^{+\infty} \frac{dx}{x\ln^px}=\begin{cases} \frac{\ln^{1-p}a}{p-1},& p>1\\ +\infty ,&p \leq 1 \end{cases}$$ 

## ChangeLog

> 2018.09.13 初稿