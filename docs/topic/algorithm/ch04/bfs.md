---
title: 广度优先搜索
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
mathjax: true
---

广度优先搜索碰到岔路口时，总是依次访问该路口可直接到达的所有岔路，直至遇到新的岔路口，并记下这些岔路口。下一次从新的岔路口依次重复原来的操作。广度优先搜索适合用队列实现，一个元素出队，将该元素可直接到达的所有元素依次放入队尾。

## 求解迷宫问题

```C
#include <stdio.h>
#define MaxSize 500

// 建立队列
struct SqQueue{
	int i, j;
	int pre;
}qu[MaxSize];
int front = -1, rear = -1;

void print(int front);

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
	
	// 标记起点和终点
	int si, sj, ei, ej;
	si = sj = 1;
	ei = ej = 8;
	
	// 在队列中放入起始点
	int i, j, di;
	rear++;
	qu[rear].i = si; qu[rear].j = sj; qu[rear].pre = -1;
	mg[si][sj] = -1;
	
	while(front!=rear){
		front++;
		i = qu[front].i; j = qu[front].j;
		if(i==ei && j==ej){
			print(front);
			return 1;
		}
		for(di=0; di<4; di++){
			// 将可能的状态入队
			switch(di){
				case 0: i = qu[front].i; j = qu[front].j+1; break;
				case 1: i = qu[front].i+1; j = qu[front].j; break;
				case 2: i = qu[front].i; j = qu[front].j-1; break;
				case 3: i = qu[front].i-1; j = qu[front].j; break;
			}
			if(mg[i][j]==0){
				rear++;
				qu[rear].i = i; qu[rear].j = j; qu[rear].pre = front;
				mg[i][j] = -1;
			}
		}
	}
	printf("There is no path!\n");
	return 0;
}
		
void print(int front)
{
	 int k = front, j;
	 do{
		 j = k;
		 k = qu[k].pre;
		 qu[j].pre = -1;
	 }while(k!=0);
	 printf("Find the path that:\n");
	 k = 0;
	 int ns = 0;
	 while(k<=front){
		 if(qu[k].pre==-1){
		 	ns++;
			printf("\t(%d, %d)", qu[k].i, qu[k].j);
			if(ns%5==0)
				printf("\n");
		 }
		k++; 
	 }
 }
```