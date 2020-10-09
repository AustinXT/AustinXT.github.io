---
title: 其他高效技巧
date: 2018-09-09
tags:
  - 算法
publish: false
---

## two pointers

利用问题本身与序列的特性，使用两个下标 i,j 对序列进行扫描，以较低的复杂度解决问题。

典型的应用有归并排序和快速排序。

## 打表

打表是典型的用空间换时间的技巧，常见用法有

- 在程序中一次性计算出所有需要的结果，之后直接查询取值
- 在 B 程序中分一次或多次计算所有需要的结果，手工把结果写在 A 程序的数组中，然后在 A 程序中可直接使用。例如，n 皇后问题
- 对于想不出算法的题目，先用暴力程序计算小范围数据的结果，然后找蛛丝马迹

## 活用递推

例如，有几个 PAT 的题目，找每个 A 左侧的 P 和右侧的 T

## 随机选择算法

```C
// 随机选择算法，从递增序列 a[left, right] 中返回第 K 小的数
int randSelect(int a[], int left, int right, int K){
    if(left==right) return a[left]; // 递归边界
    // p 为 A[left] 在 a[left, right] 中的位置
    int p=partition(a,left,right); 
    // p 是 在 a[left, right] 第 M 小的数
    int M=p-left+1;
    if(K==M) return a[p];
    if(K<M) return randSelect(a,left,p-1,K);
    else return randSelect(a,p+1,right,M-K);
}
```

## ChangeLog

> 2018.09.03 初稿

