# 一阶与可降阶二阶微分方程

## 一阶微分方程

### 变量可分离的微分方程

微分方程 $$\frac{dy}{dx} = h(x)g(y)$$ 称为变量可分离的方程，分离变量 $$\frac{dy}{g(y)} = h(x)dx$$ ，两边积分得到便通解。

### 齐次微分方程

微分方程 $$\frac{dy}{dx} = f(x,y)$$ 中 $$f(x,y)$$ ，若令 $$y=ux$$ ，当 $$x \neq 0$$ 时，可化为 $$f(x,y) = f(x,ux) = \varphi(u)$$ ，则称为齐次微分方程。

其解法是，令 $$y=ux$$ ，带入得 $$u+x\frac{du}{dx} = \varphi (u)$$ ，分离变量得 $$\frac{du}{\varphi (u) - u} = \frac{dx}{x}$$ 

### 一阶线性微分方程

微分方程 $$y' + p(x)y = q(x)$$ 称为一阶线性微分方程，其通解为 $$y = e^{-\int p(x)dx}[\int q(x)e^{\int p(x)dx}dx+C]$$ 

### 伯努利方程

方程 $$y'+p(x)y = q(x)y^n, (n\neq 0,1)$$ 称为伯努利方程，其解法是，将原式化为 $$y^{-n}\frac{dy}{dx} +p(x)y^{1-n} = q(x)$$ ，令 $$z = y^{1-n}$$ 得一阶线性微分方程 $$\frac{1}{1-n}\frac{dz}{dx} +p(x)z=q(x)$$ 。

## 全微分方程

若存在二元函数 $$u(x,y)$$ 使 $$du(x,y) = P(x,y)dx+Q(x,y)dy$$ ，则称微分方程 $$P(x,y)dx+Q(x,y)dy=0$$ 为全微分方程，其通解为 $$u(x,y)=C$$ 

## 可降阶二阶微分方程

### y''=f(x) 型

通解为 $$y=\int(\int f(x)dx)dx +C_1x +C_2$$ 

### y''=f(x,y') 型

令 $$p=y',y''=\frac{dp}{dx}$$ ，原方程化为 $$\frac{dp}{dx} = f(x,p)$$ 

### y''=f(y,y') 型

令 $$p=y',y''=\frac{dp}{dx} = \frac{dp}{dx} \frac{dy}{dx} = p\frac{dp}{dy}$$ ，原方程化为 $$p\frac{dp}{dy} = f(y,p)$$ 

## ChangeLog

> 2018.08.23 初稿