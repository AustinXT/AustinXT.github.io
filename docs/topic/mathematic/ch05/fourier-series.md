# 傅里叶级数

## 三角函数及其正交性

三角函数系 $$\{1, \cos x, \sin x, \cos 2x, \sin 2x, \cdots ,\cos nx, \sin nx, \cdots \}$$ 在区间 $$[- \pi, \pi]$$ 上正交，即该函数系中任两个不同函数积在 $$[- \pi, \pi]$$ 上的积分为0.

## 傅里叶级数定义

$$
\begin{alignat}{2} a_n &= \frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\cos nx \ dx,n=0,1,2,\cdots \\ b_n &= \frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\sin nx \ dx,n=1,2,\cdots \end{alignat}
$$

为 $$f(x)$$ 的傅里叶系数，以此为系数的三角级数
$$
\frac{a_0}{2} +\sum_{n=1}^{\infty}(a_n \cos nx + b_n \sin nx)
$$
称为函数 $$f(x)$$ 的傅里叶级数，记为 $$f(x) \sim \frac{a_0}{2} +\sum_{n=1}^{\infty}(a_n \cos nx + b_n \sin nx)$$ 

### 狄利克雷定理（收敛性定理）

设 $$f(x)$$ 是以 $$2 \pi$$ 为周期的周期函数，且在区间 $$[- \pi, \pi]$$ 上满足

- 除有限个第一类间断点外都连续
- 只有有限个极值点

则傅里叶级数在 $$[- \pi, \pi]$$ 上出处收敛，且收敛于

- $$f(x)$$ ，当 $$x$$ 为 $$f(x)$$ 的连续点
- $$\frac{f(x^-)+f(x^+)}{2}$$ ，当 $$x$$ 为 $$f(x)$$ 的间断点
- $$\frac{f(\pi^-)+f(\pi^+)}{2}$$ ，当 $$x=\pm \pi$$ 的间断点

## 周期函数傅里叶展开

### 将周期为 $$2\pi$$ 的函数展开为傅里叶级数

- 计算傅里叶级数 $$a_n, b_n$$ ，并写出傅里叶级数
- 利用收敛定理确定傅里叶级数在 $$[-\pi, \pi]$$ 上的收敛情况

#### 在 [-π, π] 上展开：

$$
\begin{cases} a_n = \frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\cos nx \ dx,n=0,1,2,\cdots \\ b_n= \frac{1}{\pi}\int_{-\pi}^{\pi}f(x)\sin nx \ dx,n=1,2,\cdots \end{cases}
$$

可根据 $$f(x)$$ 的奇偶性化简。

#### 在 [0, π] 上展开为正弦级数

$$
\begin{cases} a_n = 0,&n=0,1,2,\cdots \\ b_n= \frac{2}{\pi}\int_0^{\pi}f(x)\sin nx \ dx,&n=1,2,\cdots \end{cases}
$$

#### 在 [0, π] 上展开为余弦级数

$$
\begin{cases} a_n = \frac{2}{\pi}\int_0^{\pi}f(x)\cos nx \ dx,&n=0,1,2,\cdots \\ b_n= 0,&n=1,2,\cdots \end{cases}
$$

### 将周期为 2L 的函数展开为傅里叶级数

将以上公式中的 π 换成 L

## ChangeLog



> 2018.08.21 初稿