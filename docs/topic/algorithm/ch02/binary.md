---
title: 二分法
date: 2018-09-09
tags:
  - 算法
mathjax: true
---

## 整数二分查找(O(logn))

### 不可重复数列二分查找

```C
// A[] 为不重复递增数列，x 为需要查找的值
int binarySearch(int A[], int left, int right, int x){
    int mid;
    while(left<=right){
        mid=left+(right-left)/2; // 防止溢出
        if(A[mid]==x) return mid;
        else if(A[mid]>x) right=mid-1;
        else left=mid+1;
    }
    return -1;
}
```

### 可重复数列二分查找

假设目标值 x 分布在 [L, R) 之间，则可分别查找 L 和 R

```C
// A[] 为可重复递增数列，查找第一个大于等于 x 的数
int lower_bound(int A[], int left, int right, int x){
    int mid;
    while(left<right){// left==right 时，找到唯一位置
        mid=left+(right-left)/2;
        if(A[mid]>=x) right=mid;
        else left=mid+1;
    }
    if(A[right]>=x) return left;
    else return -1;
}
```

```C
// A[] 为可重复递增数列，查找第一个大于 x 的数
int upper_bound(int A[], int left, int right, int x){
    int mid;
    while(left<right){
        mid=left+(right-left)/2;
        if(A[mid]>x) right=mid;
        else left=mid+1;
    }
    if(A[right]>x) return left;
    else return -1;
}
```

### 寻找可重复数列中满足条件 C 的元素位置

查找可重复数列中满足条件 C 的元素位置可以分解为

- 查找第一个满足条件 C 的数 L
- 查找第一个满足条件 C 的数起，第一个不满足条件 C 的数 R
- 满足条件 C 的元素位置为 [L, R)

```C
// A[] 为可重复递增数列，查找第一个满足条件 C 的数
int lower_bound(int A[], int left, int right){
    int mid;
    while(left<right){
        mid=(left+right)/2;
        if(C(mid)) right=mid;
        else left=mid+1;
    }
    if(C(right)) return left;
    else return -1;
}
// 查找第一个满足条件 C 的数起，第一个不满足条件 C 的数
int upper_bound(int A[], int left, int right){
    left=lower_bound(A, left, right);
    if(left==-1) return -1;
    else(left==right) return right+1;
    int mid;
    while(left<right){
        mid=(left+right)/2;
        if(!C(mid)) right=mid;
        else left=mid+1;
    }
    return left;
}
```

## 二分法拓展

将二分查找的范围从整数拓展到实数时，判断是否找到需要考虑精度。

```C
// 求实数范围 [left, right] 上，递增函数 f(x)=0 的解
double solve(double left, double right){
    const double eps=1e-5;
    while(right-left<eps){
        mid=(left+right)/2;
        if(f(x)>0) right=mid; // f(x) 递减，则改为 <0
        else left=mid;
    }
    return mid;
}
```

## 快速幂

给定三个正整数 $a,b,m\ (a<10^9,b<10^18,1<m<10^9)$ ，求 $a^b\%m$ 

#### 循环写法（O(b)）

```C
typedef long long LL;
LL power(LL a, LL b){
    a%=m;
    LL ans=1;
    for(int i=0;i<b;i++){
        ans=ans*a%m;
    }
    return ans;
}
```

#### 递归写法（O(logb)）

```C
typedef long long LL;
LL power(LL a, LL b){
    a%=m;
	if(b==0) return 1; // b=0 时，a^0=1
    // b 为奇数，转换为 b-1
    if(b%2==1) return a*power(a,b-1,m)%m;
    else {// b 为偶数，转换为 b/2
        LL mul=power(a,b/2,m);
        return mul*mul%m;
    }
}
```

#### 迭代写法（O(logb)）

```C
typedef long long LL;
LL power(LL a, LL b){
    a%=m; 
    LL ans=1;
    while(b>0){
        if(b&1){// 若 b 的二进制末位为1，则 true(等于 b%2)
            ans=ans*a%m;
        }
        a=a*a%m;
        b>>=1; // 将 b 的二进制右移1位(等于 b/=2)
    }
    return ans;
}
```

## ChangeLog

> 2018.09.03 初稿