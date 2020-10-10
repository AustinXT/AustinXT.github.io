---
title: 排序
date: 2018-09-09
tags:
  - 算法
---

## 冒泡排序（n^2）

每次交换把当前剩余元素中最大的元素移动到一端，剩余元素不断交换直至剩余元素为0

```C
// 从小到大排序
void bubbleSort(int a[], int n){
    for(int i=1; i<n; i++){
        for(int j=0; j<n-i; j++){
            if(a[j]>a[j+1]){
                int temp = a[j+1];
                a[j+1] = a[j];
                a[j] = temp;
            }
        }
    }
}
```

## 简单选择排序（n^2）

每次将当前剩余元素中最小的元素与剩余元素的第一个元素交换，直至剩余元素为0

```C
// 从小到大排序
void selectSort(int a[], int n){
    for(int i=0; i<n; i++){
        int k = i;
        for(int j=i; j<n; j++){
            if(a[j]<a[k])
                k = j;
        }
        int temp = a[k];
        a[k] = a[i];
        a[i] = temp;
    }
}
```

## 直接插入排序（n^2）

数列分为前面有序、后面无序两部分，每次将第一个无序的数插入到前面有序数列中，直至剩余无序元素为0

```C
// 从小到大排序
void insertSort(int a[], int n){
    for(int i=1; i<n; i++){
        int temp = a[i], j = i;
        while(j>1 && temp<a[j-1]){
            a[j] = a[j-1];
            j--;
        }
        a[j] = temp;
    }
}
```

## 两路归并排序

```C
// 合并有序序列
const int maxn=100;
void merge(int a[], int L1, int R1, int L2, int R2){
    int i=L1, j=L2;
    int tmp[maxn], index=0;
    while(i<=R1 && j<=R2){
        if(a[i]<=a[j]) tmp[index++]=a[i++];
        else tmp[index++]=a[j++];
    }
    while(i<=R1) tmp[index++]=a[i++];
    while(j<=R2) tmp[index++]=a[j++];
    for(i=0;i<index;i++){
        a[L1+i]=tmp[i];
    }
}
// 递归实现
void mergeSort(int a[], int left, int right){
    if(left<right){
        int mid=(left+right)/2;
        mergeSort(a, left, mid);
        mergeSort(a, mid+1, right);
        merge(a, left, mid, mid+1, right);
    }
}
// 非递归实现
void mergeSort(int a[]){
    for(int step=2;step/2<=n;step*=2){
        for(int i=1;i<=n;i+=step){
            int mid=i+step/2-1;
            if(mid+1<=n){
                merge(a,i,mid,mid+1,min(i+step-1,n));
            }
        }
    }
}
```

### 递归实现

## 快速排序（nlogn）

```C
// 对区间 [left, right] 进行划分，使得 a[left] 左边的数都小于它，右边的数都大于它
int partition(int a[], int left, int right){
    int tmp=a[left];
    while(left<right){
        while(left<right && A[right]>tmp) right--;
        A[left]=A[right];
        while(left<right && A[left]<tmp) left++;
        A[right]=A[left];
    }
    A[left]=tmp;
    return left; // 返回相遇的下标
}
// 快速排序
void quickSort(int a[], int left, int right){
    if(left<right){
        int pos=partition(a,left,right);
        quickSort(a,left,pos-1);
        quickSort(a,pos+1,right);
    }
}
```

## ChangeLog

> 2018.08.25 初稿
>
> 2018.09.03 添加归并排序和快速排序

