---
title: 第六章：图
date: 2018-09-09
publish: false
---

## 图的基本术语

## 图的存储结构

### 邻接矩阵

```C
// 邻接矩阵适用于顶点数较小的情况(例如<1000)
// 有向图邻接矩阵的graph[i][j] 表示第i个节点指向第j个节点的边的权重
// 无向图邻接矩阵的graph[i][j] 表示连接第i个节点和第j个节点的边的权重
// 无向图邻接矩阵是对称阵
int graph[maxN][maxN];
```

### 邻接表

```C
// 无权重的图
vector<int> Adj[maxN];

// 有权重的图
struct Node{
    int v,w;
    Node(int _v, int _w): v(_v), w(_w) {}
};
vector<Node> Adj[maxN];
```

## 图的基本算法实现

