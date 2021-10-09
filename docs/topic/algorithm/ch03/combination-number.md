---
title: 组合数
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
mathjax: true
---


## n! 有多少个质因子 p ?

答案是 $\lfloor \frac{n}{p} \rfloor + \lfloor \frac{n}{p^2} \rfloor + \lfloor \frac{n}{p^3} \rfloor \cdots$ 

```C
// 计算 n! 中有多少个质因子 p，复杂度为 O(longn)
int cal(int n, int p){
    int ans=0;
    while(n){
        ans+=n/p;
        n/p;
    }
    return ans;
}
```

## 组合数的计算

### 方法一：组合数递推公式

$C_n^m=C_{n-1}^m+C_{n-1}^{m-1}$ ，即 n 个不同的数中选 m 个数的方案数，等于不选第一个数，在剩下的数中选 m 个，加上选第一个数，再从剩下的数中选 m-1 个。

```C
int C(int n, int m){
    if(m==0 || n==m) return 1;
    return C(n-1,m)+C(n-1,m-1);
}
// 记录算过的数
int C(int n, int m){
    int res[N][N]={0};
    if(m==0 || n==m) return 1;
    return res[n][m]=C(n-1,m)+C(n-1,m-1);
}
```

### 方法二：组合数定义式变形

$$
C_n^m=\frac{n!}{m!(n-m)!}=\frac{n!/(n-m)!}{m!}=\dfrac{\dfrac{\dfrac{\dfrac{(n-m+1)}{1}\times(n-m+2)}{2}\times \cdots}{\cdots}\times(n-m+m)}{m}
$$

第 i 层的结果为 $C_{n-m+i}^i$ 为整数。

```C
// 时间复杂度为 O(m)
int C(int n, int m){
    int ans=1;
    for(int i=1;i<=m;i++){
        ans=ans*(n-m+i)/i;
    }
    return ans;
}
```

## ChangeLog

> 2018.09.04 初稿