---
title: 并查集
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

## 定义

并查集是一种维护集合的数据结构，支持「合并」和「查找」两种操作，可用数组实现。

### 数据结构

```C
// father[i] 表示元素 i 的父亲节点
// 同一个并查集只有一个根节点
int father[N];
```

## 基本操作

### 初始化

```C
for(int i=1;i<=N;i++){
    father[i]=i; // 令 father[i]=-1 也可
}
```

### 查找

```C
// 返回 x 所在并查集的根节点
int findFather(int x){
    while(x!=father[x]){
        x=father[x];
    }
    return x;
}
```

### 合并

```C
void Union(int a, int b){
    int faA=findFather(a);
    int faB=findFather(b);
    if(faA!=faB) father[faA]=faB;
}
```

## 路径压缩

```C
int findFather(int x){
    int a=x;
    while(x!father[x]){
        x=father[x];
    }
    // 把路径上经过的所有节点的父亲节点都改为根节点
    while(a!=father[a]){
        int z=a;
        a=father[a];
        father[z]=x;
    }
    return x;
}
```

