---
title: 特殊数计算
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: false
---

## 分数计算

分数计算时比较简单的方法是写成假分数，运算完成之后再化简

```C
// 数据结构
struct Frac{
    int a, b;
}；
// 化简
Frac reduction(Frac result){
	if(result.b<0){
		result.a=-result.a;
		result.b=-result.b;
	}
	if(result.a==0) result.b=1;
    else{
    	int d=gcf(abs(result.a), abs(result.b));
    	result.a/=d;
    	result.b/=d;
    }
    return result;
}
```

分数的加减乘除按假分数的形式计算，注意分数除法的除数可能为0

## 大整数计算

```C
// 存储大整数
#define N 1000
// 大整数数据结构
struct bign{
    // 低位存储在下标小的数组上，个位下标为0
    int d[N];
    int len;
    // 构造函数初始化结构体，每次定义结构体时会自动初始化
    bign(){
        memset(d,0,sizeof(d));
        len=0;
    }
};
// 将字符串转化为结构体存储
bign change(char str[]){
    bign a;
    a.len=strlen(str);
    for(int =0；i<a.len;i++){
        a.d[i]=str[a.len-i-1]-'0';
    }
    return a;
}
```

```C
// 比较两数大小
int cmp(bign a, bign b){
    if(a.len>b.len) return 1;
    else if(a.len<b.len) return -1;
    else{
        for(int i=a.len-1;i>=0;i--){
            if(a.d[i]>b.d[i]) return 1;
            else if(a.d[i]<b.d[i]) return -1;
        }
        return 0;
    }
}
```

```C
// 两正整数加法
bign add(bign a, bign b){
    bign c;
    int carry=0; // 进位
    for(int i=0;i<a.len||i<b.len;i++){
        int tmp=a.d[i]+b.d[i]+carry;
        // tmp 个位为改为结果，十位为进位
        c.d[c.len++]=tmp%10;
        carry=tmp/10;
    }
    if(carry!=0) c.d[c.len++]=carry;
    return c;
}
```

```C
// 正整数减法，a≥b
bign sub(bign a, bign b){
	bign c;
    for(int i=0;i<a.len;i++){
        if(a.d[i]>=b.d[i]) c.d[c.len++]=a.d[i]-b.d[i];
        else{
            c.d[c.len++]=a.d[i]-b.d[i]+10;
            a.d[i+1]--;
        }
    }
    // 去除高位的0，保留个位的0
    while(c.len-1>=1 && c.d[c.len-1]==0){
        c.len--;
    }
    return c;
}
```

```C
// 正整数乘法
// 大正整数乘 int
bign multi1(bign a, int b){
    bign c;
    int carry=0;
    for(int i=0;i<a.len;i++){
        int tmp=b*a.d[i]+carry;
        c.d[c.len++]=tmp%10;
        carry=tmp/10;
    }
    while(carry>0){
        c.d[c.len++]=carry%10;
        carry/=10;
    }
    return c;
}
// 大正整数乘大正整数
bign multi2(bign a, bign b){
    bign c;
    for(int i=0;i<b.len;i++){
        c=add(c,multi1(a,b.d[i]));
        // b 的更高一位转化成 a*10
        a.len++;
        for(int j=a.len-1;j>0;j--){
            a.d[j]=a.d[j-1];
        }
        a.d[0]=0;
    }
    return c;
}
```

```C
// 除法
// 大正整数除以 int
bign divide1(bign a, int b, int& r){ // r 为余数
	bign c;
    c.len=a.len;
    for(int i=a.len-1;i>=0;i--){
        r=r*10+a.d[i];
        if(r<b) c.d[i]=0;
        else{
            c.d[i]=r/b;
            r=r%b;
        }
    }
    while(c.len-1>=1 && c.d[c.len-1]==0){
        c.len--;
    }
    return c;
}

// 大正整数除以大正整数
bign divide2(bign a, bign b, bign& r){
    bign c;
    c.len=a.len;
    for(int i=a.len-1;i>=0;i--){
        r.len++;
        for(int j=r.len-1;j>0;j--){
            r.d[j]=r.d[j-1];
        }
        r.d[0]=a.d[i];
        if(cmp(r,b)==-1) c.d[i]=0;
        else{
            while(cmp(r,b)>=0){
                c.d[i]++;
                r=sub(r,b);
            }
        }
    }
    while(c.len-1>=1 && c.d[c.len-1]==0){
        c.len--;
    }
    return c;
}
```

## ChangeLog

> 2018.09.04 初稿