---
title: 散列
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: false
---

将元素通过一个函数转化为一个整数，使得整数可以尽量唯一的代表这个元素。

较常用的有线性变换（H(key)=a*key+b）和除留余数法（H(key)=key%mod）。

```C
// 除留余数法输出 key 对应的位置
void printSit(bool HashTable, int mod){
    int a, h;
    scanf("%d", &a);
    h=a%mod;
    if(HashTable[h]==false){
        printf("%d", h);
        HashTable[h]=true;
    }
    else{
        printf("-");
    }
}
```

## 冲突解决

### 线性探查法（Linear Probing）

```C
// 除留余数法输出 key 对应的位置
void printSit(bool HashTable, int mod){
    int a, h;
    scanf("%d", &a);
    h=a%mod;
    if(HashTable[h]==false){
        printf("%d", h);
        HashTable[h]=true;
    }
    else{
        int tmp=(h+1)%mod;
        while(tmp!=h){
            if(HashTable[tmp]==false){
                printf("%d", h);
       			HashTable[h]=true;	
                break;
            }else{
                tmp=(tmp+1)%mod;
            }
        }
        if(tmp==h) printf("-");
    }
}
```

### 平方探查法（Quadratic Probing）

```C
// 除留余数法输出 key 对应的位置
void printSit(bool HashTable, int mod){
    int a, h;
    scanf("%d", &a);
    h=a%mod;
    if(HashTable[h]==false){
        printf("%d", h);
        HashTable[h]=true;
    }
    else{
        int step=1;
        while(step<mod){
            int sign[2]={1,-1};
            for(int i=0;i<2;i++){
                h=((a+sign[i]*step*step)%mod+mod)%mod;
                if(HashTable[h]==false){
                    printf("%d", h);
                    HashTable[h]=true;	
                    break;
                }else{
                    step++;
                }
            }
        }
        if(step==mod) printf("-");
    }
}
```

### 链地址法（拉链法）

把所有 H(key) 相同的 key 连接成一条单链表。

## ChangeLog

> 2018.09.03 初稿