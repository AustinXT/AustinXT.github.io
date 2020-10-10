# 微积分的几何应用

## 切平面和切线

图形的空间关系

### 切平面

设曲面 $$\Sigma$$ 的方程为 $$F(x,y,z)=0$$ ，并设点 $$(x_0,y_0,z_0)\in \Sigma$$ ，三个偏导数不同时为零，则曲面在点 $$(x_0,y_0,z_0)$$ 处的法向量为
$$
\overrightarrow n = \{F'_x, F'_y,F'_z\}
$$

### 切线

设曲线 $$\Gamma$$ 的方程为一般式：$$\begin{cases} F(x,y,z)=0 \\ G(x,y,z)=0 \end{cases}$$ ，则该曲线在点 $$P_0(x_0,y_0)$$ 处的切向量为曲面 $$F(x,y,z)=0$$ 和 $$G(x,y,z)=0$$ 在该点的法向量 $$\overrightarrow n_1$$ 和 $$\overrightarrow n_2$$ 的向量积。

## 平面图形的几何问题

### 平面图形面积

#### 直角坐标系

可将图形分解为一对边界平行于坐标轴，另一对边界可用变量表达的图形，再求积分。

#### 极坐标系

极坐标曲线 $$r=r(\theta)$$ 介于两射线 $$\theta = \alpha,\theta = \beta (0<\beta -\alpha \leq 2\pi)$$ 之间的曲边扇形的面积 $$A=\frac{1}{2}\int_{\alpha}^{\beta}r^2(\theta)d\theta$$ 

### 平面曲线弧长

#### 参数方程曲线

参数方程曲线 $$\begin{cases} x=x(t)\\ y=y(t) \end{cases},\alpha \leq t \leq \beta$$ 的弧长（ $$x'(t),y'(t)$$ 均连续且不同时为零），$$s=\int_{\alpha}^{\beta}\sqrt{x'^2(t)+y'^2(t)}dt$$ 

#### 直角坐标

$$y=y(x),a<x<b$$ 的弧长（$$y'(x)$$ 连续），$$s=\int_a^b \sqrt{1+y'^2(x)}dx$$ 

#### 极坐标

极坐标曲线 $$r=r(\theta)，\alpha \leq \theta \leq \beta$$ 的弧长（$$r(\theta),r'(\theta)$$ 连续且不同时为零），$$s=\int_{\alpha}^{\beta}\sqrt{r^2(\theta)+r'^2(\theta)}d\theta$$ 

### 旋转体体积

曲线 $$y=y(x)$$ 与 $$x=a,x=b(a<b)$$ ，$$x$$ 轴围成的曲边梯形绕 $$x$$ 轴旋转一周所成的旋转体体积
$$
V=\pi \int_a^b y^2(x)dx
$$
曲线 $$y=y_1(x),y=y_2(x)$$ 与 $$x=a,x=b(b>a \geq 0,y_2(x) \geq y_1(x))$$ 围成的图形绕 $$y$$ 轴旋转一周所成的旋转体体积
$$
V=2\pi \int_a^b x(y_2(x)-y_1(x))dx
$$

### 旋转曲面面积

在区间 $$[a,b]$$ 上的曲线 $$y=f(x)$$ 的弧段绕 $$x$$ 轴旋转一周所成的旋转曲面面积
$$
S=2\pi \int_a^b|y|\sqrt{1+f'^2(x)}dx
$$

## ChangeLog

> 2018.09.14 初稿