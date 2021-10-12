---
title: 树与二叉树
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

## 树

树是由n (n≥0）个节点（元素）组成的有限集合（记为T）。其中，如果n=0，它是一棵空树，这是树的特例；如果n>0，这n个节点中存在（有仅存在)一个节点作为树的根，节点，简称为根节点，其余节点可分为m (m≥0)个互不相交的有限集T1, T2,..…,Tm，其中每一个子集本身又是一棵符合本定义的树，称为根节点的子树。

### 树的逻辑表示方法

树形表示法、文氏图表示法、凹入表示法和括号表示法

### 树的基本术语

节点的度与树的度：树中某个节点的子树的个数称为该节点的度，树中各节点的度的最大值称为树的度，通常将度为m的树称为m次树

分支节点与叶子节点：度不为零的节点称为非终端节点，又叫分支节点。度为零的节点称为终端节点或叶子节点。在分支节点中，每个节点的分支数就是该节点的度。

路径与路径长度：对于任意两个节点ki和kj，若树中存在一个节点序列ki、ki1、ki2、 ..…、kin、 kj，使得序列中除ki外的任一节点都是其在序列中的前一个节点的后继，则称该节点序列为由ki到kj的一条路径，用路径所通过的节点序列( ki，ki1，ki2，..…，kj )表示这条路径。路径的长度等于路径所通过的边的数目。

节点的层次和树的高度：树中的每个节点都处在一定的层次上。节点的层次从树根开始定义，根节点为第1层，它的孩子节点为第2层，依次类推，一个节点所在的层次为其双亲节，点所在的层次加1，树中节点的最大层次称为树的高度。

有序树和无序树：若树中各节点的子树是按照一定的次序从左向右安排的，且相对次序是不能随意变换的，则称为有有序树，否则称为无序树。通常意义上的树都指的是无序树。

森林：n（n≥0）个互不相交的树的集合称为森林。森林的概念与树的概念十分相近，因为只要把树的根节点删去就成了森林。反之，只要给n棵独立的树加上一个节点，并把这n棵树作为该节点的子树，则森林就变成了树。

满m次树：如果除根节点和叶子节点外，其他节点的度均为m，且所有叶子节点均在同一层，这样的树称为满m次树。满m次树可以按层从上到下、同层从左到右遍历，并对层次遍历的次序编号，根节点编号为1，然后依次递增，这称为满m次树的层序编号。对于高度为h的满m次树，节点编号范围为1~$\frac {m^h-1}{m-1}$

完全m次树：对于高度为h的满m次树，按满m次树的层序编号后，最高层连续缺少编号最大的若干个节点，但最高层中至少有一个节点，这样的树称为高度为h 的完全m次树。

### 树的性质

性质1：树中的节点数等于所有节点的度数加1。

性质2：度为m的树中第i层上至多有 $m^{i-1}$个节点 (i≥1)。

性质3：高度为h的m次树至多有 $\frac {m^h-1}{m-1}$ 个节点。s

性质4：具有n个节点的m次树的最小高度为$\lceil log_m(n(m-1)+1)\rceil$ 。

## 二叉树

一棵二叉树中含有n (n≥0)个节点，当n=0时，它是一棵空二叉树：当n>0时，它由一个根节点和两棵互不相交的称为左子树和右子树的二叉树组成。

### 二叉树性质

性质1：非空二叉树上叶子节点数等于双分支节点数加1。

性质2：在完全二叉树中，对于编号为i的节点（1≤i≤n，n≥1，其中n为节点数）：

- 若2i≤n，则编号为i的节点为分支节点，否则为叶子节点。
- 若编号为i的节点有左孩子节点，则左孩子节点的编号为2i;若编号为i的节点有右孩子节点，则右孩子节点的编号为(2i+1)。

性质3：具有n个( n>0)节点的完全二叉树的高度为 $\lceil log_2(n+1)\rceil$ 或 $\lfloor log_2n\rfloor +1$

### 二叉树与树、森林之间的转换

森林、树转换为二叉树：

- 在所有相邻兄弟节点（森林中每棵树的根节点可看成是兄弟节点）之间加一水平连线。
- 对每个非叶子节点k，除了其最左边的孩子节点外，删去k与其他孩子节点的连线。
- 将图形规整化，所有水平线段以左边节点为轴心顺时针旋转45。

### 存储结构

二叉树的顺序存储结构

```C
typedef ElemType SBTree[MaxSize]; //节点值从数组1开始存放
```

二叉树的链式存储结构

```C
typedef struct node {
    ElemType data;
    struct node *lchild;
    struct node *rchild;
}BTNode;
```

## 二叉树的基本运算算法

创建二叉树

```C
// 括号表示法创建二叉树
void CreateBTNode(BTNode *&b, char *str)
{
    BTNode *St[MaxSize], *p=NULL;
    int top=-1, k, j=0;//k 标志左右子树
    char ch;
    
    b=NULL;
    ch=str[j];
    while(ch!='\0'){
        switch(ch){
            case '(':top++;St[top]=p;k=1;break;
            case ')':top--;break;
            case ',':k=2;break;
            default:p=(BTNode *)malloc(sizeof(BTNode));
                p->data=ch;p->lchild=p->rchild=NULL;
                if(b==NULL)
                    b=p;
                else{
                    switch(k){
                        case 1:St[top]->lchild=p;break;
                        case 2:St[top]->rchild=p;break;
                    }
                }
        }
        ch=str[++j];
    }
}
```

求二叉树高度

```C
int BTNodeDepth(BTNode *b)
{
    int lchilddep, rchilddep;
    if(b==NULL)
        return 0;
    else{
        lchilddep=BTNodeDepth(b->lchild);
        rchilddep=BTNodeDepth(b->rchild);
        return lchilddep>rchilddep?(lchilddep+1):(rchilddep+1);
    }
}
```

#### 二叉树的递归算法设计

一般递归模型

```
f(b)=c	当 b=NULL;
f(b)=g(fun(b->lchild),fun(b->rchild),c1)	其他情况；
```

```C
DataType fun(BTNode *b)
{
    if(b==NULL)
        return(c);
    else
        return g(fun(b->lchild),fun(b->rchild),c1);
}
```