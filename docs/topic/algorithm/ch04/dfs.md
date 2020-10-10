---
title: 深度优先搜索
date: 2018-09-09
tags:
  - 算法
mathjax: true
---

## 深度优先搜索

深度优先搜索是一种枚举完所有完整路径以遍历所有情况的搜索方法。一般用递归实现，递归的分叉就是搜索的岔路，递归的边界就是搜索的死胡同。

例如：有 n(n≤25) 件物品，每件种为 w[i]，价值为 c[i]，选出若干件放入限重为 W 的背包中，在不超重是前提下使得背包中的物品价值最大，求最大价值。

```C
#include <cstdio>
const int maxn=30;
int n,v,maxv=0;
int w[maxn], c[maxn];

void DFS(int index,int sumw,int sumv){
    if(index==n) return;
    // 岔路：选不选 index+1
    DFS(index+1,sumw,sumv);
    if(sumw+w[index]<=v){
        if(sumv+c[index]>maxv) maxv=sumv+c[index];
        DFS(index+1,sumw+w[index],sumv+c[index]);
    }
}

int main(){
    // 输入n,v c[i],w[i]
    DFS(0,0,0);
    // 输出 maxv
    return 0;
}
```

## 递归

递归求解的特征是分而治之，即将整个问题分割为与整个问题求解方法相同的子问题，反复划分子问题并求解子问题，最后得到整个问题的解。

### 复杂递归

递归问题的参数构成了递归状态。对于复杂问题，常采用试探方法。假设递归求解过程从状态 s0 到状态 sn，求解步骤如下：

* 假设当前状态为 si，将 si 的环境设置为已处理过。
* 求出从 si 出发可以到达状态 sj，若 sj=sn，输出一个解；否则递归调用 sj，表示从 sj 开始处理。
* 若从 si 出发不能到达任何状态，则回溯，将 si 状态设置为未处理过。

以求解迷宫问题为例：

```C
struct{
    int i;
    int j;
}path[MaxSize];
void mgpath(int si, int sj, int ei, int ej, int d)
{
    int i, j;
	mg[si][sj] = -1; // 将当前环境设置为已处理过
    
    di = -1; 
    // 判断所有相邻的方块是否可以达到
    while(di<4){
        di++;
        switch(di){
            case 0: i = si; j = sj+1; break;
            case 1: i = si+1; j = sj; break;
            case 2: i = si; j = sj-1; break;
            case 3: i = si-1; j = s.j; break;
        }
        // 若下一个状态为最终要达到的状态，则输出一个解
        if(i==ei && j==ej){
            printf("Find a path that:\n");
            path[d+1].i = i; path[d+1].j = j;
            for(int k=0; k<=d+1;k++){
                printf("(%d, %d)", path[k].i, path[k].j);
            }
        } 
        // 若存在下一个状态，则开始处理下一个状态，即递归调用
        else if(mg[i][j]==0){
            path[d+1].i = i; path[d+1].j = j;
            mgpath(i, j, ei, ej, d+1);
        }
    }
    // 不能达到任何状态，则恢复当前环境，回溯
    mg[i][j] = 0;
}
```

### 递归算法到非递归算法的转换

递归算法时间效率通常较差，因此需要手工转化为非递归算法。

#### 用循环消除单向递归

尾递归是指递归调用语句只有一个且处于算法的末尾，是单向递归的特例，例如阶乘。

单向递归是指递归函数虽然有一处以上的递归调用语句，但各次递归调用语句的参数只和主调用函数有关，与相互之间的参数无关。例如，求 Fibonacci 数列$f(n)=f(n-1)+f(n-2)$ ，递归调用$f(n-1)$ 和$f(n-2)$ 只和主调用 $f(n)$ 有关，因此可用循环消除递归：

```C
int Fib(int n)
{
    int f1 = 1;
    int f2 = 2;
    if(n==1)
        return f1;
    if(n==2)
        return f2;
    int f3;
    for(int i=3; i<=n; i++){
        f3 = f1 + f2;
        f1 = f2;
        f2 = f3;
    }
    return f3;
}
```

#### 利用栈消除非单向递归

主要注意两点：

* 建立一个结构用于存放各状态下产生的值和判断是否执行操作（不再递归）的标识
* 注意复杂问题当前状态不能继续时需要恢复环境

以求解梵塔问题为例：

设 $hanoi(n,x,y,z)$ 表示将 n 个圆盘从 x 通过 y 移动到 z 上，则有：

* $hanoi(n,x,y,z): move(n,x,z)$ ，当 n=1 时
* $hanoi(n,x,y,z): hanoi(n-1,x,z,y); move(n,x,z);hanoi(n-1,y,x,z)$ ，其他情况

对应的递归算法是：

```C
void hanoi(int n, char x, char y, char z)
{
    if(n==1)
        printf("move the % plate from %c to %c", n, x, z);
    else{
        hanoi(n-1, x, z, y);
        printf("move the % plate from %c to %c", n, x, z);
        hanoi(n-1, y, x, z);
    }
}
```

转化为非递归算法：

```C
#include <stdio.h>
#define MaxSize 100

int main()
{
    int n;
	char x, y, z;
	n = 3;
	x = 'A'; y = 'B'; z = 'C';
	
	struct stack{
		// 保存状态 n 下的值
	    int n; 
	    char x, y, z;
		// 标识可否执行操作，1 表示可执行
	    int tag;
	}st[MaxSize];
	int top = -1;
	
	char a, b, c;
	int m;
	// 将状态 n 入栈
	top++;
	st[top].n = n;
	st[top].x = x; st[top].y = y; st[top].z = z;
	st[top].tag = 0;
	
	while(top>-1){
		// 判断可否执行操作（或者称是否需要再递归）
		if(st[top].tag==0){
			// 判断是否达到递归的终止条件
			if(st[top].n==1){
				st[top].tag = 1;
			}
			// 将递归的状态入栈
			else{
				// 状态 n 退栈
				m = st[top].n;
				a = st[top].x; b = st[top].y; c = st[top].z;
				top--;
				
				// 状态 n-1 入栈，入栈的顺序与递归相反
				top++;
				st[top].n = m-1;
				st[top].x = b; st[top].y = a; st[top].z = c;
				st[top].tag = 0;
				
				top++;
				st[top].n = m;
				st[top].x = a; st[top].z = c;
				st[top].tag = 1;
				
				top++;
				st[top].n = m-1;
				st[top].x = a; st[top].y = c; st[top].z = b;
				st[top].tag = 0;
				
			}
		}
		else if(top>-1 && st[top].tag==1){
			printf("move the %d plate from %c to %c\n", st[top].n, st[top].x, st[top].z);
			top--;
		}
	}
	return 0;
}
```