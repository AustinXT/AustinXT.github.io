---
title: 哈夫曼树
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

哈夫曼树是在 n 个带权叶子节点构成的二叉树中，带权路径长度最小的二叉树。一棵哈夫曼树是一棵二叉树，其中没有度为1的节点，因此具有 n 个叶子节点的哈弗曼树，共有 2n-1 个节点。

## 哈夫曼树的构造算法

1. 根据给定的n个权值(w1，w2， …，wn) 对应节点构成n棵二叉树的森林T=(T1，T2，… ，Tn) ，其中每棵二叉树Ti (1≤i≤no) 中都只有一个带权值为wi的根节点，其左、右子树均为空。
2. 在森林T中选取两棵节点的权值最小的子树分别作为左、右子树构造一棵新的二叉树，且置新的二叉树的根节点的权值为其左、右子树上根的权值之和。
3. 在森林 T 中用新得到的二叉树代替这两棵树。
4. 重复2和3，直到T只含一棵树为止，这棵树便是哈夫曼树。

### 节点类型

```C
typedef struct{
    ElemType data;
    float weight;
    int parent;
    int lchild;
    int rchild;
}HTNode;
```

### 构造算法

```C
#define Max 32767
void CreateHT(HTNode ht[], int n)
{
    int i, j, k, lnode, rnode;
    float min1, min2;
    // 所有节点的相关域置 -1
    for(i=0;i<2*n-1;i++)
        ht[i].parent=ht[i].lchild=ht[i].rchild=-1;
    // 构造哈夫曼树
    for(i=n;i<2*n-1;i++){
        min1=min2=Max;
        lnode=rnode=-1;
        for(k=0;k<=i-1;k++)
            if(ht[k].parent==-1){
                if(ht[k].weight<min1){
                    min2=min1;rnode=lnode;
                    min1=ht[k].weight;lnode=k;
                }
                else if(ht[k].weight<min2){
                    min2=ht[k].weight;rnode=k;
                }
            }
        ht[lnode].parent=i;ht[rnode].parent=i;
        ht[i].weight=ht[lnode].weight+ht[rnode].weight;
        ht[i].lchild=lnode;ht[i].rchild=rnode;
    }
}
```

## 哈夫曼编码

频率越高的采用越短的编码。

### 哈夫曼编码的节点类型

```C
typedef struct{
    char cd[N];
    int start;
}HCode;
```

### 求哈夫曼树对应的哈夫曼编码

```C
void CreateHCode(HTNode ht[], HCode hcd[], int n)
{
    int i, f, c;//father、child
    HCode hc;
    // 根据哈夫曼树求哈夫曼编码
    for(i=0;i<n;i++){
        hc.start=n;c=i;
        f=ht[i].parent;
        // 循环直至根节点
        while(f!=-1){
            // 当前节点是双亲节点的左孩子
            if(ht[f].lchild==c)
                hc.cd[hc.start--]='0';
            // 当前节点是双亲节点的右孩子
            else
                hc.cd[hc.start--]='1';
            c=f;f=ht[f].parent;
        }
        hc.start++;
        hcd[i]=hc;
    }
}
```

