# 差分方程

## 定义

给定函数 $$y_t=f(t)$$ ，其自变量 $$t$$ 取值等间隔整数，则 $$f(t)$$ 在 $$t$$ 时刻的一阶差分定义为 $$\Delta y_t = y_{t+1}-t_t = f(t+1)-f(t)$$ ，一阶差分 $$\Delta y_t$$ 的差分称为 $$f(t)$$ 的二阶差分，记为 $$\Delta^2 y_t$$ ，即 $$\Delta^2 y_t=\Delta y_{t+1}-\Delta y_t=y_{t+2}-2y_{t+1}+y_t$$ 

一般的，$$\Delta^k y_t=\sum_{i=0}^k(-1)^iC_k^iy_{t+k-i}, k=1,2,\cdots$$

## 一阶常系数差分方程

方程 $$y_{t+1}-py_t=f(t)$$ ，$$p$$ 为非零常数 

通解为 $$y_t=kp^t+y^*_t$$ ，$$y_t^*$$ 为特解

若 $$f(t)=(A_0t^n+A_1t^{n-1}+\cdots + A_n)b^t$$ ，则 $$y_t^*=t^s(B_0t^n+B_1t^{n-1}+\cdots + B_n)b^t$$ ，其中 $$p=b$$ 时，$$s=1$$ ；  $$p\neq b$$ 时，$$s=0$$ 