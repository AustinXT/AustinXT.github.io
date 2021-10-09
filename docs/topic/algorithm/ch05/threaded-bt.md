---
title: 线索二叉树
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

线索二叉树是二叉树线索化，实质是在遍历二叉树的过程中，检查当前节点的左右指针域是否为空，若为空，则将它们改为指向前驱节点或后继节点的线索。

## 定义

```C
typedef struct node
{
    ElemType data;
    int ltag, rtag; //增加线索标记，若为1，则表示指向前驱，否则指向孩子
    struct node *lchild;
    struct node *rchild;
}TBNode;
```

## 中序线索二叉树

```C
TBTNode *pre;
void Thread(TBTNode *&p)
{
    if(p!=NULL){
        Thread(p->lchild);
        // 建立当前节点的前驱线索
        if(p->lchild==NULL){
            p->lchild=pre;
            p->ltag=1;
        }
        else p->ltag=0;
        // 建立前驱节点的后继线索
        if(pre->rchild==NULL){
            pre-rchild=p;
            pre->rtag=1;
        }
        else pre->rtag=0;
        pre=p;
        Thread(p->rchild);
    }
}
TBTNode *CreaThread(TBTNode *b)
{	
    // 创建头结点
    TBTNode *root;
    root=(TBTNode *)malloc(sizeof(TBTNode));
    root->ltag=0;
    root->rtag=1;
    root->rchild=b;
    if(b==NUll)
        root->lchild=root;
    else{
        root->lchild=b;
        // pre 是 *p 的前驱节点，供加线索
        pre=root;
        Thread(b);
        // 最后加入指向头结点的线索和头结点线索化
        pre->rchild=root;
        pre->rtag=1;
        root->rchild=pre;
    }
    return root;
}
```

## 遍历线索二叉树

```C
void ThInOrder(TBTNode *tb)
{
    TBTNode *p=tb->lchild;
    while(p!=NULL){
        while(p->ltag==0)
            p=p->lchild;
        printf("%c", p->data);
        while(p->rtag==1 && p->rchild!=tb){
            p=p->rchild;
            printf("%c", p->data);
        }
        p=p->rchild;
    }
}
```

