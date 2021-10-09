---
title: 堆
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

## 概念

堆（大顶堆，小顶堆）是一棵完全二叉树，树中每个节点的值都不小于（或不大于）其左右孩子节点的值。

### 数据结构

用数组存储堆（完全二叉树），节点可以按层序存储于数组中。

```C
// 堆数据结构
const int maxn=100;
// heap 为堆，n 为元素个数
int heap[maxn], n=10;
```

## 基本操作

### 向下调整

```C
// heap 数组在 [low,high] 范围内向下调整
void downAdjust(int low, int high){
    int i=low,j=i*2；
        while(j<=high){
            if(j+1<=high &&heap[j+1]>heap[j])
                j++;
            if(heap[j]>heap[i]){
                swap(heap[i],heap[j]);
                i=j;
                j=2*i;
            }else break;
        }
}
```

### 建堆

```C
void createHeap(){
    // 向下调整每个非叶子节点
    for(int i=n/2;i>=1;i--){
        downAdjust(i,n);
    }
}
```

### 删除对中最大元素

```C
void deleteTop(){
    heap[1]=heap[n--];
    downAdjust(1,n);
}
```

### 向上调整

```C
void upAdjust(int low, int high){
    int i=high,j=i/2;
    while(j>=low){
        if(heap[i]>heap[j]){
            swap(heap[i],heap[j]);
            i=j;
            j=i/2;
        }else break;
    }
}
```

### 插入元素

```C
void insert(int x){
    heap(++n)=x;
    upAdjust(1,n);
}
```

## 堆排序

堆排序指使用堆结构对一个序列进行排序。

```C
void heapSort(){
    // 建完堆之后，二叉树所有节点的值都不小于孩子节点
    createHeap();
    // 将序列排成按下标递增的序列
    for(int i=n;i>1;i--){
        swap(heap[i],heap[1]);
        downAdjust(1,i-1);
    }
}
```

