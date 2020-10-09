---
title: 素数及其应用
date: 2018-09-09
tags:
  - 算法
publish: false
mathjax: true
---

## 素数判断

```C
// 用 sqrt 函数
bool isPrime(int n){
    if(n<=1) return false;
    int sqr=(int)sqrt(1.0*n);
    for(int i=2;i<=sqr;i++){
        if(n%i==0) return false;
    }
    return true;
}

// 更简洁写法
bool isPrime(int n){
    if(n<=1) return false;
    for(int i=2;i*i<=n;i++){
        if(n%i==0) return false;
    }
    return true;
}
```

## 素数表获取

- 素数表的获取一种是逐个判断是否为素数，复杂度为 O(n√n)

- 还有一种是埃式（Eratosthenes）筛法，复杂度为 O(nloglogn)

```C
const int maxn=101; // 范围限定为100以内
int prime[maxn], pnum=0;
bool p[maxn]={0};
void findPrime(){
    for(int i=2;i<maxn;i++){
        if(p[i]==false){
            prime[pnum++]=i;
            for(int j=i+i;j<maxn;j+=i){
                p[j]=true;
            }
        }
    }
}
```

## 质因子分解

可对每个质因子计算其阶数，设质因子 $p_i$ 的阶数为 $e_i$ ，共有 n 个质因子，则

- 因子个数为 $\Pi_{i=1}^n e_i$ 
- 所有因子的和为 $\Pi_{i=1}^n (1+p_i+\cdots +p_i^{e_i})=\Pi_{i=1}^n \frac{1-p_i^{e_i+1}}{1-p_i}$ 

## ChangeLog

> 2018.09.04 初稿