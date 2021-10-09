---
title: 树的遍历
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

## 数据结构

```C
struct node{
    typename data;
    int child[maxn]; // vector<int> child;
}Node[maxn];
```

```C
// 新建
int index=0;
int newNode(int v){
    Node[index].data=v;
    Node[index].child.clear();
    return index++; // 返回结点下标
}
```

## 树的遍历

### 先序遍历

```C
void preOrder(int root){
    printf("%d",Node[root].data);
    for(int i=0;i<Node[root].child.size();i++){
        preOder(Node[root].child[i]);
    }
}
```

### 层序遍历

```C
void layerOrder(int root){
    queue<int> q;
    q.push(root);
    while(!q.empty()){
        int front=q.front();
        printf("%d",Node[front].data);
        q.pop();
        for(int i=0;i<Node[front].child.size();i++){
            q.push(Node[front].child[i]);
        }
    }
}
```



​	