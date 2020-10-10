---
title: 字符串
date: 2018-09-09
tags:
  - 算法
mathjax: true
---

串是由 n (n>=0) 个字符组成的有限序列。n=0 时为空串，用 $\Phi$ 或 () 表示，串长为 0。

串的主要存储结构有顺序串和链串。

## 顺序串

定义

```C
#define MaxSzie 100
typedef struct{
    char data[MaxSize];
    int length;
}SqString;
```

创建串

```C
void StrAssign(SqString &str, char cstr[])
{
    int i;
    for(i=0; cstr[i]!='\0';i++)
        str.data[i] =  cstr[i];
    str.length = i;
}
```

复制串

```C
void StrCopy(SqString &s, SqString t)
{
    int i;
    for(i=0; i<t.length; i++)
        s.data[i] = t.data[i];
    s.length = t.length;
}
```

求串长

```C
int StrLength(SqString str)
{
    return str.length;
}
```

串连接

```C
// t 连接到 s 之后
SqString Concat(SqString s, SqString t)
{
    SqString str;
    int i;
    str.length = s.length + t.length;
    for(i=0; i<s.length;i++)
        str.data[i] = s.data[i];
    for(i=0; i<t.length; i++)
        str.data[s.length+i] = t.data[i];
    return str;
}
```

求子串算法

```C
// 返回 s 中从第 i 个字符开始的，有 j 个连续字符组成的字符串
SqString SubStr(SqString s, int i, int j)
{
    SqString str;
    int k;
    str.length = 0;
    if(i<=0||j<0||i+j-1>s.length)
        retrun str;
    for(k=i-1;k<i+j-1;k++)
        str.data[k-i+1] = s.data[k];
    str.length = j;
    retrun str;
}
```

串插入算法

```C
// 将串 s2 插入串 s1 第 i 个字符中(即 s2 的第一个字符作为 s1 的第 i 个字符)
SqString InsStr(SqString s1, int i, SqString s2)
{
    int j;
    SqString str;
    str.length = 0;
    if(i<=0||i>s1.length+1)
        return s1;
    for(j=0;j<i-1;j++)
        str.data[j] = s1.data[j];
    for(j=0;j<s2.length;j++)
        str.data[i+j-1] = s2[j];
    for(j=i-1;j<s1.length;j++)
        str.data[s2.length+j] = s1.data[j];
    str.length = s1.length + s2.length;
    return str;
}
```

删除子串的算法

```C
// 删去第 i 个字符起长度为 j 的子串
SqString DelStr(SqString s, int i, int j)
{
    SqString str;
    str.length = 0;
    if(i<=0||j<=0||i+j-1>s.length)
        return str;
    int k;
    for(k=0;k<i-1;k++)
        str.data[k] = s.data[k];
    for(k=i-1+j;k<s.length;k++)
        str.data[k-j] = s.data[k];
    str.length = s.length - j;
    return str;
}
```

输出串的算法

```C
void DispStr(SqString s)
{
    int i;
    if(s.length>0){
        for (i=0;i<s.length;i++)
            printf("%c", s.data[i]);
        printf("\n");
    }
}
```

## 链串

 定义

```C
typedef struct snode{
    char data;
    struct snode *next;
}LiString;
```

创建链串、复制、连接均采用尾插法

## 模式匹配

设有主串 s 和子串 t ，子串 t 定位是指在主串 s 中找到一个与子串 t 相等的子串。通常称主串 s 为目标串，子串 t 为模式串，定位为模式匹配。

#### Brute-Forces 算法

一种简单匹配算法，从第一个字符开始匹配，匹配失败则从第二个字符开始匹配。

两个完全等价的算法：

```C
int index1(SqString s, SqString t)
{
    int i=0, j, k;
    while(i<s.length){
        for(j=i,k=0;j<s.length&&k<t.length
            &&s.data[j]==t.data[k];j++,k++);
        if(k=t.length)
            return i;
        i++;
    }
    return 0;
}
```

```C
int index2(SqString s, SqString t)
{
    int i, j;
    while(i<s.length&&j<t.length){
        if(s.data[i]==t.data[j]){
            i++;
            j++;
        } 
        else{
            j=i-j+1;
            j=0;
        }
    }
    if(j==t.length)
        return i-t.length;
    else
        return 0;
}
```

#### KMP（Knuth-Morris-Pratt） 算法

假设主串 s 有 n 个字符，模式串 p 有 m 个字符。当主串第 i 个字符与模式中第 j 个字符失配时，主串的第 i 个字符应与模式串的哪个字符相配？

假设应与模式串中的第 k 个字符继续比较，则模式中的前 k-1 个字符的子串必须满足 $'p_1p_2 \dots p_{k-1}'='s_{i-k+1}s_{i-k+2}\dots s_{i-1}'$ 且不可能存在 k'>k 满足上式，而已有的匹配结果是 $'p_{j-k+1}p_{j-k+2} \dots p_{j-1}'='s_{i-k+1}s_{i-k+2}\dots s_{i-1}'$，由此有 $'p_1p_2 \dots p_{k-1}'='p_{j-k+1}p_{j-k+2} \dots p_{j-1}'$，即若模式串中存在满足上式的两个子串，则失配时，仅需将模式串向右滑动至模式串中的第 k 个字符和主串中的第 i 个字符对齐。

若令 $next[j] = k$，则 $next[j]$ 表明当模式串中第 j 个字符失配时，模式串中需要重新和主串匹配的字符位置，由此有：
$$
next[j]=\left \{
\begin{array}{}
0 & 当j=1时\\
Max\{k|1<k<j \space and \space 'p_1p_2 \dots p_{k-1}'='p_{j-k+1}p_{j-k+2} \dots p_{j-1}'\} & 此集合不为空时\\
1 & 其他情况
\end{array} \right .
$$

若 $p_k=p_j$ ，则有 $'p_1p_2 \dots p_k'='p_{j-k+1}p_{j-k+2} \dots p_j'$，且不可能存在更大的 k 满足等式，因此有 $next[j+1]=k+1=next[j]+1$。

若 $p_k\not= p_j$，则表明 $'p_1p_2 \dots p_k' \not= 'p_{j-k+1}p_{j-k+2} \dots p_j'$，此时把求 next 函数值看成模式匹配问题，需将模式串向右滑动至模式串中的第 next[k] 个字符和主串中的第 i 个字符对齐，重复此操作直至 $p_k=p_j$，因此有 $next[j+1]=next[k]+1$。若 $p_j$ 与模式串中的字符均不匹配，则 $next[k]=0,\space next[j+1]=1$ 。

例如：

![](http://oohkn7mnd.bkt.clouddn.com/download_resize_2.jpeg.jpg?imageView/2/w/300/q/90)

```C
void GetNext(SqString t, int next[])
{
    int j=1,k=0;
    next[1] == 0;
    while(j<t.length-1){
        if(k==0||t.data[j]==t.data[k]){
            j++;k++;
            next[j] = k;
        }
        else
            k = next[k];
    }
}
int KMPIndex(SqString s, SqString t)
{
    int next[MaxSize], i=0, j=0;
    GetNext(t, next);
    while(i<s.length && j<t.length){
        if(j==0 || s.data[i]==t.data[j]){
            i++; j++;
        }
        else
            j = next[j];
    }
    if(j>t.length)
        return i-t.length;
    else
        return 0;
}
```

#### 修正后的 KMP 算法

因为定义 next[j] = k，即模式串中有 $p_j=p_k$ ，则主串中字符 s_i 与 p_i 比较不等时，无需在和 p_k 比较，而直接和 $p_{next[k]}$ 比较，或者说此时 next[j] 应和 next[k] 相同。

例如：

![](http://oohkn7mnd.bkt.clouddn.com/download_resize_1.jpeg?imageView/2/w/300/p/90)

```C
void GetNextval(SqString t, int nextval[])
{
    int j=1, k=0;
    nextval[1] = 0;
    while(j<t.length){
        if(k==0 || t.data[j]==t.data[k]){
            j++;k++;
            if(t.data[j]!=t.data[k])
                nextval[j] = k;
            else
                nextval[j] = nextval[k];
        }
        else
            k = nextval[k];
    }
}
```

