---
title: 简单技巧
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

> 一些算不上算法的简单技巧

## 进制转换

一个 P 进制的数转换为 Q 进制的数，需要先转换为 10 进制数。

```C
// rd 进制的数 n 转化为 10 进制数
int to10(int n, int rd){
    int ans=0, prod=1;
    while(n>0){
        ans+=n%rd*prod;
        n/=10;
        prod*=rd;
    }
    return ans;
}
```

```C
// 10 进制的数 n 转化为 rd 进制
void tord(int n, int rd){
    int ans[Max], i=0;
    // 0 到 i-1 为低位到高位
    do{
        ans[i++]=n%rd;
        n/=rd;
    }while(n>0); 
}
```



