---
title: 图的遍历
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

## DFS 遍历法

### 伪码

```C
// 伪码
DFS(u){
    vis[u]=true;
    for(从 u 出发可到达的所有顶点 v){
        if(vis[v]==false) DFS(v);
    }
}
DFSTrave(G){
    for(G 的所有顶点 u){
        if(vis[u]==false) DFS(u);
    }
}
```

### 邻接矩阵

```C
const int maxv=1000;
const int inf=0x7fffffff;

int n, G[maxv][maxv];
bool vis[maxv]={false};
void DFS(int u, int depth){
    vis[u]=true;
    for(int v=0;v<n;v++){
        if(G[u][v]!=inf && vis[v]==false) DFS(v,depth+1);
    }
}
void DFSTrave(int G[][]){
    // 访问 u 所在连通块
    for(int u=0;u<n;u++){
        if(vis[u]==false) DFS(u,1);
    }
}
```

### 邻接表

```C
const int maxv=1000;

vector<int> Adj[maxv];
bool vis[maxv]={false};

void DFS(int u, int depth){
    vis[u]=true;
    for(int i=0;i<Adj[u].size();i++){]
        int v=Adj[u][i];
        if(vis[v]==false) DFS(v,depth+1);
    }
}
void DFSTrave(vector<int> Adj[]){
    for(int u=0;u<n;u++){
        if(vis[u]==false) DFS(u,1);
    }
}
```

## BFS 遍历法

### 伪码

```C
BFS(u){
    queue q;
    u 入队；
    inq[u]=true; // 设置 u 已加入队列
    while(q 非空){
        取出 q 的队首元素进行访问;
        for(从 u 出发可到达的所有顶点 v){
            if(inq[v]==false){
                v 入队;
                inq[v]=true;
            }
   		}
    }
}
BFSTrave(G){
    for(G 的所有顶点 u){
        if(inq[u]==false) BFS(u);
    }
}
```

### 邻接矩阵

```C
const int maxv=1000;
const int inf=0x7fffffff;

int n,G[maxv][maxv];
bool inq[maxv]={false};

void BFS(int u){
    queuq<int> q;
    q.push(u);
    inq[u]=true;
    while(!q.empty()){
        u=q.front();
        q.pop();
        for(int v=0;v<n;v++){
            if(inq[v]==false && G[u][v]!=inf){
                q.push(v);
                inq[v]=true;
            }
        }
    }
}
void BFSTrave(int G[][]){
    for(int u=0;u<n;u++){
        if(inq[u]==false) BFS(u);
    }
}
```

### 邻接表

```C
const int maxv=1000;

vector<int> Adj[maxv];
bool inq[maxv]={false};

void BFS(int u){
    queue<int> q;
    q.push(u);
    inq[u]=true;
    while(!empty()){
        u=q.front();
        q.pop();
        for(int i=0;i<Adj[u].size();i++){
            int v=Adj[u][i];
            if(inq[v]==false){
                q.push(v);
                inq[v]=true;
            }
        }
    }
}
void BFSTrave(vector<int> Adj[]){
    for(int u=0;u<n;u++){
        if(inq[u]==false) BFS(u);
    }
}
```

