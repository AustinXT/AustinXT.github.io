---
title: 队列
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

队列主要有两种存储结构，顺序队和链队。

## 顺序队

队列定义

```C
#define MaxSize 500
typedef struct{
    ElemType data[MaxSize];
    int front, rear;
}SqQueue;
```

### 非循环队列

非循环队列的初始化通常让 front = rear = -1，让 rear 指向刚进队元素的位置，让 front 指向刚出队元素的位置。

* 队空条件：rear == front
* 队满条件：rear ==  MaxSize - 1
* 元素 x 进队：rear++; data[rear] = x
* 出队 x：front++; x = data[front]

非循环队列保存了所有入队元素。

### 循环队列

初始化

```C
void InitQueue(SqQueue &qu)
{
    qu.front = qu.rear = 0;
}
```

判断队空

```C
int QueueEmpty(SqQueue qu)
{
    return(qu.front==qu.rear);
}
```

进队

```C
int EnQueue(SqQueue &qu, ElemType e)
{
    qu.rear = (qu.rear+1)%MaxSize;
    qu.data[qu.rear] = e;
    return 1;
}
```

出队

```C
int DeQueue(SqQueue &qu, ElemType &e)
{
    if(qu.front==qu.rear)
        return 0;
    qu.front = (qu.front+1)%MaxSize;
    e = qu.data[qu.front];
    return 1;
}
```

## 链队

在单链表的表头进行出队操作，在表尾进行入队操作。

![](http://images.austinxt.com/IMG_20180322_110346.jpg)

定义

```C
// 声明链队数据节点类型
typedef struct qnode{
    Elemtype data;
    struct qnode *next;
}QNode;
// 声明链队类型
typedef struct{
	QNode *front;
    Qnode *rear;
}LiQueue;
```

初始化

```C
void InitQueue(LiQueue *&lqu)
{
    lqu = (LiQueue *)malloc(sizeof(LiQueue));
    lqu->front = lqu->rear = NULL;
}
```

 判断队空

```C
int QueueEmpty(LiQueue *lqu)
{
    return(lqu->rear==NULL);
}
```

进队

```C
void EnQueue(LiQueue *&lqu, ElemType e)
{
    Qnode *s;
    s = (QNode *)malloc(sizeof(QNode));
    s->data = e;
    s->next = NULL;
    // 若队列为空，则 rear 和 front 均指向新节点
    if(lqu->rear==NULL)
        lqu->rear = lqu->front = s;
    else{
        lqu->rear->next = s;
        lqu->rear = s;
    }
}
```

 出队

```C
int DeQueue(LiQueue *&lqu, ElemType &e)
{	
    Qnode *p;
    if(lqu->rear==NULL)
        return 0;
    p = lqu->front
    else if(lqu->front==lqu->rear)
        lqu->front = lqu->rear = NULL;
    else 
        lqu->front = p->next;
    e = p->data;
    free(p);
    return 1;
}
```

