---
title: 线性表
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: false
---

## 概念

线性表是具有相同特性的数据元素的一个有限序列。

### 逻辑特征

线性表中的元素位置是有序的，这种位置关系构成了一种线性关系，因此线性表是一个线性结构，即对于至少含有一个数据元素的线性表，除起始元素外均有且仅有一个前驱，除终端元素外均有且仅有一个后继。若线性表中的元素按照某种顺序排列，则称该线性表为有序表。

### 存储结构

有顺序和链式两种存储结构，分别称为顺序表和链表。链表的每个节点包含数据域和指针域，第一个节点的存储位置称为头指针，如果链表带有头结点，那头指针为头结点的地址，否者为起始节点。

## 顺序表

定义

```c
#define MaxSize 50
typedef struct
{
  ElemType data[MaxSize];
  int length;
}SqList;
```

初始化顺序表

```C
void InitList(SqList &L)
{
  L.length = 0;
}
```

求指定位置元素

```C
int GetElem(SqList L, int i, ElemType &e)
{
  if(i < 1 || i > L.length)
    return 0;
  e = L.data[i-1];
  return 1;
}
```

按元素查找

```C
int LocateElem(SqList L, int &n, ElemType e)
{
  if(L == NULL)
    return 0;
  int i = 0;
  while(L.data[i] != e && i < L.length)
    i++;
  if(i == L.length)
    return 0;
  n = i+1;
  return 1;
}
```

插入数据元素（插到第 i 个位置上）

```C
int ListInsert(SqList &L, ElemType e, int i)
{
  if(i < 1 || i > L.length+1)
    return 0;
  L.length++;
  int j;
  for(j = L.length-1; j >= i; j--)
    L.data[j] = L.data[j-1];
  L.data[j] = e;
  return 1;
}
```

删除数据元素

```C
int ListDelete(SqList &L, int i, ElemType &e)
{
  if(i < 1 || i > L.length)
    return 0;
  e = L.data[i-1];
  for(int j = i-1; j < L.length-1; j++)
    L.data[j] = L.data[j+1];
  L.lenght--;
  return 1;
}
```

有序顺序表的归并算法

```C
void MergeList(SqList L1, SqList L2, SqList &L3)
{
  int i = 0, j = 0, k = 0;
  while(i < L1.length && j < L2.length){
    if(L1.data[i] < L2.data[j]){
      L3.data[k] = L1.data[i];
      k++; i++;
    }else if(L1.data[i] > L2.data[j]){
      L3.data[k] = L2.data[j];
      k++; j++;
    }else{
      L3.data[k] = L1.data[i];
      k++; i++; j++;
    }
  }
  while(i < L1.length){
    L3.data[k] = L1.data[i];
      k++; i++;
  }
  while(j < L2.length){
    L3.data[k] = L1.data[j];
      k++; j++;
  }
  L3.length = k;
}
```

## 单链表

定义

```C
typedef struct LNode{
  ElemType data;
  LNode *next;
}LinkList;
```

头插法建立单链表（次序与原来次序相反）

```C
void CreateListF(LinkList *&L, ElemType a[], int n)
{
  LinkList *s; int i;
  L = (LinkList *)malloc(sizeof(LinkList)); //创建头结点
  L->next = NULL;
  for(i = 0, i < n, i++){
    s = (LinkList *)malloc(sizeof(LinkList));
    s->data = a[i];
    s->next = L->next;
    L->next= s;
  }
}
```

尾插法建立单链表（次序与原来次序相同）

```C
void CreateListR(LinkList *&L, ElemType a[], int n)
{
  LinkList *s, *r; int i;
  L = (LInkList *)malloc(sizeof(LinkList));
  L->next = NULL;
  r = L;
  for(i=0, i<n, i++){
    s = (LinkList *)malloc(sizeof(LinkList));
    s->data = a[i];
    r->next = s;
    r = s;
  }
  r->next = NULL;
}
```

按元素查找

```C
int LocateElem(LinkList *L, ElemType e)
{
  LinkList *p = L->next;
  int i = 1;
  while(p!=NULL && p->data!=e){
    p = p->next;
    i++;
  }
  if(p==NULL)
    return 0;
  else
    return i;
}
```

将 e 插入到单链表的第 i 个节点位置上

```C
int InsertElem(LinkList *&L, ElemType e, int n)
{
  LinkList *p = L, *s; // p 为第一个节点位置的前一个节点
  int j = 0;
  while(p!=NULL && j<n-1){
    p = p->next;
    j++;
  }
  if(p!=NULL){
    s = (LinkList *)malloc(sizeof(LinkList));
    s->data = e;
    s->next = p->next;
    p->next = s;
    return 1;
  }
  else
    return 0;
}
```

删除第 i 个节点位置上的元素

```C
int DeleteElem(LinkList *&L, ElemType &e, int n)
{
  LinkList *p = L, *q; // p 为第一个节点位置的前一个节点
  int j = 0;
  while(p!=NULL && j<n-1){
    p = p->next;
    j++;
  }
  if(p!=NULL && p->next!=NULL){
    q = p->next;
    p->next = q->next;
    free(q);
    return 1;
  }
  else
    return 0;
}
```

有序单链表的归并（新建单链表）

```C
void MergeList1(LinkList *L1, LinkList *L2, LinkList *&L3)
{
  LinkList *s1 = L1->next, *s2 = L2->next, *r, *s;
  L3 = (LinkList *)malloc(sizeof(LinkList));
  L3->next = NULL;
  r = L3;

  while(s1!=NULL && s2!=NULL){
    if(s1->data < s2->data){
      s = (LinkList *)malloc(sizeof(LinkList));
      s->data = s1->data;
      r->next = s;
      r = s; s1 = s1->next;
    }else if(s1->data > s2->data){
      s = (LinkList *)malloc(sizeof(LinkList));
      s->data = s2->data;
      r->next = s; s2 = s2->next;
      r = s;
    }else{
      s = (LinkList *)malloc(sizeof(LinkList));
      s->data = s1->data;
      r->next = s;
      r = s; s1 = s1->next; s2 = s2->next;
    }
  }
  if(s2!=NULL)
    s1 = s2;
  while(s1!=NULL){
    s = (LinkList *)malloc(sizeof(LinkList));
    s->data = s1->data;
    r->next = s;
    r = s; s1 = s1->next;
  }
  r->next = NULL;
}
```

有序单链表的归并（要求空间复杂度为 O(1) ，即舍弃原来的两个单链表）

```C
void MergeList(LinkList *L1, LinkList *L2, LinkList *&L3)
{
  LinkList *p = L1->next, *q = L2->next;
  L3 = (LinkList *)malloc(sizeof(LinkList));
  L3 = L1;
  free(L2);
  r = L3;
  while(p!=NULL && q!=NULL){
    if(p->data < q->data){
      r->next = p;
      p = p->next;
    }
    else if(p->data > q->data){
      r->next = q;
      q = q->next;
    }
    else{
      r->next = p;
      p = p->next;
      q = q->next;
    }
  }
  if(q!=NULL)
	p = q;
  r->next = p;
}
```

## 双链表

双链表头尾不相接

定义

```C
typedef struct DLinkList{
  ElemType data;
  DLinkList *next;
  DLinkList *prior;
}DLinkList;
```

头插法建立双链表

```C
void CreateDListF(DLinkList *&L, ElemType a[], int n)
{
  DLinkList *s;
  L = (DLinkList *)malloc(sizeof(DLinkList));
  L->next = L->prior = NULL;
  for(int i=0; i<n; i++){
    s = (DLinkList *)malloc(sizeof(DLinkList));
    s->data = a[i];
    s->next = L->next;
    if(L->next!=NULL)
      L->next->prior = s;
    L->next = s;
    s->prior = L;
  }
}
```

尾插法建立双链表

```C
void CreateDListR(DLinkList *&L, ElemTyoe a[], int n)
{
  DLinkList *s, *r;
  L = (DLinkList *)malloc(sizeof(DLinkList));
  L->next = L->prior = NULL;
  r = L;
  for(int i=0; i<n; i++){
    s = (DLinkList *)malloc(sizeof(DLinkList));
    s->data = a[i];
    r->next = s;
    s->prior = r;
    r = s;
  }
  r->next = NULL;
}
```

查找指定元素节点

```C
int FindNode(DLinkList *L, ElemType e)
{
  DLinkList *p = L->next;
  int i = 1;
  while(p!=NULL && p->data != e){
    p = p->next;
    i++;
  }
  if(p!=NULL)
    return i;
  else
    return 0;
}
```

将 e 插入第 n 个节点位置

```C
int InsertNode(DLinkList *&L, ElemType e, int n)
{
  DLinkList *p, *s;
  int i = 0;
  p = L;
  while(p!=NULL && i<n-1){
    p = p->next;
    i++;
  }
  if(p!=NULL){
    s = (DLinkList *)malloc(sizeof(DLinkList));
    s->data = e;
    s->next = p->next;
    s->prior = p;
    if(p->next!=NULL){
      	p->next->prior = s;
    	p->next = s;
    }
    return 1;
  }
  else
    return 0;
}
```

删除第 n 个节点位置的元素

```C
int DeleteNode(DLinkList *&L, ElemType e, int n)
{
  DLinkList *p, *q;
  int i = 0;
  p = L;
  while(p!=NULL && i<n-1){
    p = p->next;
    i++;
  }
  if(p!=NULL){
    q=p->next;
    if q==NULL;
    	return 0;
    p->next = q->next;
    if(q->next!=NULL)
    	q->next->prior = p;
    free(q);
    return 1;
  }
  else
    return 0;
}
```

## 循环链表

定义

```C
typedef struct LNode{
  ElemType data;
  next LNode *next;
}LinkList;
```

头插法建立循环链表

```C
void CreateListF(LinkList *&L, ElemType a[], int n)
{
  LinkList *s;
  int i;
  L = (LinkList *)malloc(sizeof(LinkList));
  L->next = L;
  for(i=0; i<n; i++){
    s = (LinkList *)malloc(sizeof(LinkList));
    s->data = a[i];
    s->next = L->next;
    L->next = s;
  }
}
```

尾插法建立循环链表

```C
void CreateListR(LinkList *&L, ElemType a[], int n)
{
  LinkList *s, *r;
  int i;
  L = (LinkList *)malloc(sizeof(LinkList));
  L->next = L;
  r = L;
  for(i=0; i<n; i++){
    s = (LinkList *)malloc(sizeof(LinkList));
    s->data = a[i];
    r->next = s;
    r = s;
  }
  r->next = L;
}
```

查找元素值为 e 的节点

```C
int FindNode(LinkList *L, ElemTpye e)
{
  LinkList *p = L->next;
  int i = 1;
  while(p!=L && p->data = e){
    p = p->next;
    i++;
  }
  if(p==L)
    return 0;
  else
    return i;
}
```

## 静态链表

```C
struct Node{
    typename data; // 数据域
    int next; // 存放下一个结点的数组下标
    xxx; // 结点的某些性质
}
```

## 申请动态内存函数

### C 语言

malloc 函数：`typename* p=(typename*)malloc(sizeof(typename));`

对应的内存释放函数 free ：`free(p);`

### C++

new 函数：`typename* p=new typename;`

对应的内存释放函数 delete ：`delete(p);`