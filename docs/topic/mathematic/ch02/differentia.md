# 一元函数微分学

## 导数与微分

### 导数定义

设 $$f(x)$$ 在 $$U(x_0)$$ 内有定义，并设 $$x_0+\Delta x \in U(x_0)$$ .若 $$\lim \limits_{\Delta x\to 0} \frac{f(x_0+\Delta x)-f(x_0)}{\Delta x}$$ 存在，则称 $$f(x)$$ 在点 $$x=x_0$$ 处可导，并称上述极限为 $$f(x)$$ 在 $$x=x_0$$ 处的导数，记为 $$\lim \limits_{\Delta x\to 0} \frac{f(x_0+\Delta x)-f(x_0)}{\Delta x}=f'(x_0)=\frac{df(x)}{dx}|_{x=x_0}$$ 

若 $$x_0+\Delta x \in U^+(x_0)$$ 或 $$x_0+\Delta x \in U^-(x_0)$$ 可相应定义左导数和右导数。

### 微分定义

设 $$ y=f(x)$$ 在 $$U(x_0)$$ 内有定义，并设 $$x_0+\Delta x \in U(x_0)$$ .若 $$\Delta y=f(x_0+\Delta x)-f(x_0)=A\Delta x+o(\Delta x)$$ 成立，其中 A 与 $$\Delta x$$ 无关，则称 $$f(x)$$ 在点 $$x=x_0$$ 处可微，并称 $$A\Delta x$$ 为 $$f(x)$$ 在 $$x=x_0$$ 处的微分，记为 $$dy=A\Delta x$$ 或 $$dy=Adx$$ .

#### 一阶微分形式不变性

设 $$ y=f(u)$$ 可微，则微分 $$dy=f'(u)$$ ，其中不论 $$u$$ 是自变量还是中间变量。

#### 可微判别

若 $$\lim \limits_{x \to x_0} \frac{\Delta y-A\Delta x}{\Delta x}=0$$ ，则 $$y=f(x)$$ 在点 $$x_0$$ 可微，否则不可微。

### 连续、可导、可微与函数增量

#### 一元函数连续与可导的关系

设 $$f(x)$$ 在 $$x=x_0$$ 处可导，则设 $$f(x)$$ 在 $$x=x_0$$ 处必连续。

#### 一元函数可微和可导的关系

一元函数的可微和可导等价。

#### 一元函数可微与增量的关系

设 $$ y=f(x)$$ 在 $$x=x_0$$ 处可导（可微），则 $$\Delta y=dy+o(\Delta x)$$ ；设 $$ y=f(x)$$ 在 $$x_0$$ 的某区间存在二阶导数，则 $$\Delta y-dy=\frac{1}{2} f''(\xi)(\Delta x)^2$$ ，其中 $$\xi$$ 介于 $$x_0$$ 与 $$x_0+\Delta x$$ 之间。

### 导数与极限

若 $$f'(x_0)$$ 存在 ，$$\lim \limits_{x \to x_0}g(x)=\lim \limits_{x \to x_0}h(x)=x_0$$ ，则

- 当 $$g(x) \neq x_0$$ 时，$$\lim \limits_{x \to x_0} \frac{f(g(x))-f(x_0)}{g(x)-x_0} = f'(x_0)$$ 
- 当 $$\lim \limits_{x \to x_0} \frac{g(x)-x_0}{x-x_0}$$ 存在时， $$\lim \limits_{x \to x_0} \frac{f(g(x))-f(x_0)}{x-x_0}=f'(x_0)\lim \limits_{x \to x_0} \frac{g(x)-x_0}{x-x_0}$$ 
- 当 $$\lim \limits_{x \to x_0} \frac{g(x)-x_0}{x-x_0}$$ 及 $$\lim \limits_{x \to x_0} \frac{h(x)-x_0}{x-x_0}$$ 均存在时，$$\lim \limits_{x \to x_0} \frac{f(g(x))-f(h(x))}{x-x_0}=f'(x_0)\lim \limits_{x \to x_0} \frac{g(x)-h(x)}{x-x_0}$$ 

### 含绝对值函数的可导性

设 $$g(x)$$ 在 $$x=x_0$$ 处 连续，则函数 $$f(x)=|x-x_0|g(x)$$ 在 $$x=x_0$$ 处可导的充要条件是 $$g(x_0)=0$$ 

设 $$f(x_0)=0$$ ，$$f'(x_0)$$ 存在，则 $$|f(x)|$$ 在 $$x_0$$ 处可导的充要条件是 $$f'(x_0)=0$$ 

## 导数计算

### 基本初等函数的导数

$$(log_ax)'=\frac{1}{xlna}(a>0,a \neq 1)$$ 

$$(\tan x)'=\sec ^2 x$$ 

$$(\cot x)'=-\csc ^2 x$$ 

$$(\sec x)'=\sec x \tan x$$

$$(\csc x)' =-\csc x \cot x$$ 

$$(\arcsin x)'=\frac{1}{\sqrt{1-x^2}}$$ 

$$(\arccos x)'=-\frac{1}{\sqrt{1-x^2}}$$ 

$$(\arctan x)'=\frac{1}{1+x^2}$$ 

$$(arccot x)'=-\frac{1}{1+x^2}$$ 

### 变限积分求导

设 $$f(t)$$ 为连续函数，$$\varphi_1(x),\varphi_2(x)$$ 均可导，则有 $$(\int_{\varphi_1(x)}^{\varphi_2(x)})'=f(\varphi_2(x))\varphi'_2(x)-f(\varphi_1(x))\varphi'_1(x)$$ 

### 高阶导数

#### 乘积的高阶导数的莱布尼茨公式

$$(uv)^{(n)} =u^{(n)}v+C_n^1u^{(n-1)}v'+\cdots +C_n^ku^{(n-k)}v{(k)}+\cdots +uv^{(n)}$$ 

#### 常见初等函数高阶导数

$$(\sin ax)^{(n)}=a^n\sin (\frac{n\pi}{2}+ax)$$ 

$$(\cos ax)^{(n)}=a^n\cos (\frac{n\pi}{2}+ax)$$

$$(ln(1+x))^{(n)}=\frac{(-1)^{n-1}(n-1)!}{(1+x)^n}$$ 

$$((1+x)^a)^{(n)}=a(a-1)\cdots (a-n+1)(1+x)^{a-n}$$ ， a 不为整数

## ChangeLog

> 2018.09.09 初稿