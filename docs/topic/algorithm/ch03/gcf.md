---
title: 最大公约数与最小公倍数
date: 2018-09-09
tags:
  - 算法
publish: false
mathjax: true
---

## 求最大公约数

```C
// 欧几里得算法
int gcf(int a, int b){
    return !b?a:gcf(b,a%b);
}
```

## 求最小公倍数

最小公倍数=数1*数2/最大公约数

## 二元一次方程整数解

方程 $ax+by=c(a,b,c  \in Z,\ a,b \neq 0)$ 存在整数解的充要条件是 $c\%gcf(a,b)=0$ .

设 $(x_0,y_0)$ 是方程 $ax+by=gcf(a,b),(a,b  \in Z,\  a,b\neq 0)$ 的一组整数解，则 $(\frac{cx_0}{gcf}, \frac{cy_0}{gcf})$ 为方程 $ax+by=c$ 的一组整数解。

设 $(x^*,y^*)$ 是方程 $ax+by=c(a,b \neq 0)$ 的一组整数解，则方程的通解为 $(x^*+\frac{b}{gcf}K,y^* -\frac{a}{gcf}K)$ 

```C
// 求解方程 ax+by=gcf(a,b) ，最后函数返回 gcf
int exgcf(int a, int b, int& x, int& y){
    if(b==0){
        x=1;
        y=0;
        return a;
    }
    int g=exgcf(a,a%b,x,y);
    int tmp=x;
    x=y;
    y=tmp-a/b*y;
    return g;
}

// 求解方程 ax+by=c
int solve(int a, int b, int c, int& x, int& y){
    int g=exgcf(a,b,x,y);
    if(c%gcf!=0) return 0; // 无整数解
    x=c*x/gcf;
    y=c*y/gcf;
    return 1;
}
```

## 同余式求解



同余式 $ax \equiv c\pmod{m} \ (a,c,m\in Z,\ m\geq 1)$ 等价于 $(ax-c)\%m=0$ ，即存在整数 y ，使得 $ax+my=c$ 。

- 若 $c\%gcf(a,m) \neq 0$ ，则同余式方程 $ax \equiv c\pmod{m} \ (a,c,m\in Z,\ m\geq 1)$ 无解。
- 若 $c\%gcf(a,m) = 0$ ，则同余式方程 $ax \equiv c\pmod{m} \ (a,c,m\in Z,\ m\geq 1)$ 恰有 $gcf(a,m)$ 个模 $m$ 意义下不同的解，解为 $x=x^*+\frac{m}{gcf(a,m)}K$ ，其中 $K=0,1,\cdots ,gcf(a,m)-1$ ，$x$ 是方程 $ax+my=c$ 的一个解。

## 乘法逆元求解

已知 $ab\%m=(a\%m)(b\%m)\%m$ ，则 $a/b\%m=?$ ，其中 $(a\%b=0)$ .这里需要用到逆元。 

设 $a,b,m \in Z,\ m>1$ 且有 $ab \equiv 1 \pmod{m}$ ，则称 $a,b$ 互为乘法逆元。求解逆元即求解同余式方程 $ax \equiv 1\pmod{m} \ (a,c,m\in Z,\ m>1)$ ，且在 $(0,m)$ 内有唯一解，实际使用中一般称方程在 $(0,m)$ 内的解为 $a$ 的逆元。

由此

- 若 $gcf(a,m) \neq 1$ ，则 $a$ 不存在模 $m$ 的逆元。
- 若 $gcf(a,m) =1$ ，则存在逆元如下

```C
int inverse(int a, int m){
    int x, y;
    int g=exgcf(a,m,x,y);
    return (x%m+m)%m;
}
```

费马小定理：设 $m$ 是素数，$a$ 是任意整数且 $a \not\equiv 0 \pmod {m}$ ，则 $a^{m-1} \equiv 1 \pmod{m}$ 

当 $gcf(a,m) =1$ 时，逆元等于 $a^{m-2}\%m$ 

## ChangeLog

> 2018.09.04 初稿