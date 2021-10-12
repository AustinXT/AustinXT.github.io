---
title: 栈
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: false
mathjax: true
---

栈的存储结构主要有顺序栈和链栈。

## 出栈序列

n 个不同元素入栈， 出栈序列一共有 $\frac{C^n_{2n}}{n+1}$ 种不同排列。

## 顺序栈

定义

```C
#define MaxSize 500
typedef struct{
  ElemType data[MaxSize];
  int top;
}SqStack;
```

初始化

```C
void InitStack(SqStack &st)
{
    st.top = -1;
}
```

判断栈是否为空（栈为空返回 1）

```C
int StackEmpty(SqStack st)
{
    return(st.top==-1);
}
```

进栈算法

```C
int Push(SqStack &st, ElemType e)
{
    if(st.top==MaxSize-1)
        return 0;
    st.data[++st.top] = e;
    return 1;
}
```

出栈算法

```C
int Pull(SqStack &st, ElemType &e)
{
    if(st.top==-1)
        return 0;
    e = st.data[st.top--];
    return 1;
}
```

取栈顶元素算法

```C
int GetTop(SqStack st, ElemType &e)
{
    if(st.top==-1)
        return 0;
    e = st.data[st.top];
    return 1;
}
```

### 求解迷宫问题

```C
#include <stdio.h>
#define MaxSize 50

int main()
{	
	// 建立迷宫
	int mg[10][10]={
		{1,1,1,1,1,1,1,1,1,1},
		{1,0,0,1,0,0,0,1,0,1},	
		{1,0,0,1,0,0,0,1,0,1},
		{1,0,0,0,0,1,1,0,0,1},
		{1,0,1,1,1,0,0,0,0,1},
		{1,0,0,0,1,0,0,0,0,1},
		{1,0,1,0,0,0,1,0,0,1},
		{1,0,1,1,1,0,1,1,0,1},
		{1,1,0,0,0,0,0,0,0,1},
		{1,1,1,1,1,1,1,1,1,1}
	};
	
	// 建立路径栈
	struct{
		int i; // 行数，纵坐标
		int j;
		int di;
	}st[MaxSize];
	int top = -1;
	
	// 标记起点和终点
	int si, sj, ei, ej;
	si = sj = 1;
	ei = ej = 8;
	
	int i, j, di, find, k;
	// 初始方块进栈
	top++;
	st[top].i = si; st[top].j = sj;
	st[top].di = -1; // 方向还未确定之前赋值为-1
	mg[si][sj] = -1; // 走过的路赋值-1，避免重复走；退回时重赋值 0
    
    while(top>-1){
		i = st[top].i; j = st[top].j; di = st[top].di;
        if(i== ei && j==ej){
            printf("Find the path:\n");
			for(k=0; k<=top;k++){
				printf("(%d, %d)", st[k].i, st[k].j);
				if((k+1)%5==0)
					printf("\n");
			}
			return 1;
        }
		find = 0;
		while(di<4 && find==0){
			di++;
			switch(di){
				case 0: i = st[top].i; j = st[top].j+1; break;
				case 1: i = st[top].i+1; j = st[top].j; break;
				case 2: i = st[top].i; j = st[top].j-1; break;
				case 3: i = st[top].i-1; j = st[top].j; break;
			}
			if(mg[i][j]==0)
				find = 1;
		}
		if(find==1){
			st[top].di = di;
			top++;
			st[top].i = i; st[top].j = j; st[top].di = -1;
			mg[i][j] = -1;
		}
		else{
			mg[st[top].i][st[top].j] = 0;
			top--;
		}
    }
    printf("No path!");
    return 0;
}
```

求最短路径

```C
#include <stdio.h>
#define MaxSize 50

int main()
{	
	// 建立迷宫
	int mg[10][10]={
		{1,1,1,1,1,1,1,1,1,1},
		{1,0,0,1,0,0,0,1,0,1},	
		{1,0,0,1,0,0,0,1,0,1},
		{1,0,0,0,0,1,1,0,0,1},
		{1,0,1,1,1,0,0,0,0,1},
		{1,0,0,0,1,0,0,0,0,1},
		{1,0,1,0,0,0,1,0,0,1},
		{1,0,1,1,1,0,1,1,0,1},
		{1,1,0,0,0,0,0,0,0,1},
		{1,1,1,1,1,1,1,1,1,1}
	};
	
	// 建立路径栈
	struct{
		int i; // 行数，纵坐标
		int j;
		int di;
	}st[MaxSize], path[MaxSize];
	int top = -1;
	
	// 标记起点和终点
	int si, sj, ei, ej;
	si = sj = 1;
	ei = ej = 8;
	
	int i, j, di, find, k;
	// 初始方块进栈
	top++;
	st[top].i = si; st[top].j = sj;
	st[top].di = -1; // 方向还未确定之前赋值为-1
	mg[si][sj] = -1; // 走过的路赋值-1，避免重复走；退回时重赋值 0
    int minlen = MaxSize, count = 0;
    
    while(top>-1){
		i = st[top].i; j = st[top].j; di = st[top].di;
        if(i== ei && j==ej){
			count++;
			if(top+1<minlen){
			    minlen = top + 1;
                for(k=0; k<=top; k++){
                	path[k].i=st[k].i;
					path[k].j=st[k].j;
					path[k].di=st[k].di;
                }
			}
            mg[st[top].i][st[top].j] = 0; //让该位置重新变为可走
            top--;
            i = st[top].i; j = st[top].j; di = st[top].di;
        }
		find = 0;
		while(di<4 && find==0){
			di++;
			switch(di){
				case 0: i = st[top].i; j = st[top].j+1; break;
				case 1: i = st[top].i+1; j = st[top].j; break;
				case 2: i = st[top].i; j = st[top].j-1; break;
				case 3: i = st[top].i-1; j = st[top].j; break;
			}
			if(mg[i][j]==0)
				find = 1;
		}
		if(find==1){
			st[top].di = di;
			top++;
			st[top].i = i; st[top].j = j; st[top].di = -1;
			mg[i][j] = -1;
		}
		else{
			mg[st[top].i][st[top].j] = 0; // 未找到下一个方块，则恢复环境
			top--; // 回溯
		}
    }
	if(count>0){
		printf("There are total %d paths.\n", count);
	    printf("Find the shortest path in %d steps that:\n", minlen);
		for(k=0; k<minlen;k++){
			printf("(%d, %d)", path[k].i, path[k].j);
			if((k+1)%5==0)
				printf("\n");
		}
		return 1;
	}
    printf("No path!");
    return 0;
}
```

## 链栈

链栈的所有操作都在表头进行，起始节点是链栈的栈顶。

定义

```C
typedef struct linknode{
    ElemType data;
    struct linknode *next;
}LiStack; //声明链栈节点类型
```

初始化

```C
void InitStack(LiStack *&lst)
{
    lst = (LiStack *)malloc(sizeof(LiStack));
    lst->next = NULL;
}
```

判断链栈是否为空

```C
int LiStackEmpty(LiStack *lst)
{
    return(lst->next==NULL);
}
```

进栈算法

```C
void Push(LiStack *lst, ElemType e)
{
    LiStack *s;
    s = (LiStack *)malloc(sizeof(LiStack));
    s->data = e;
    s->next = lst->next;
    l->next = s;
}
```

出栈算法

```C
int Pop(LiStack *lst, ElemType e)
{
    if(lst->next==NULL)
        return 0;
    LiStack *p = lst->next;
    e = p->data;
    lst->next = p->next;
    free(p);
    return 1;
}
```

取栈顶元素算法

```C
int Get(LiStack *lst, ElemType e)
{
    if(lst->next==NULL)
        return 0;
    e = lst->next->data;
    return 1;
}
```