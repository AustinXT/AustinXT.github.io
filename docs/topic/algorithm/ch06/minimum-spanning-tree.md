---
title: 图的最小生成树
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

最小生成树（Minimum Spanning Tree）是在给定无向图 G(V,E) 中求一棵树 T，使得 T 包含所有 V，且 T 的所有边都来自 E，并且满足整棵树的边权之和最小。

## prim 算法

稠密图效果更佳。

### 伪码

```C
Prim(G,d[]){
    init;
    for(n){
        u=使 d[u]最小的还未被访问的顶点标号;
        记 u 已被访问;
        for(从 u 出发所能到达的顶点 v){
            if(v 未被访问 &&
               以 u 为中介点使得 v 与集合 S 的最短距离 d[v] 更优)
                将 G[u][v] 赋值给 v 与集合 S 的最短距离 d[v];
        }
    }
}
```

### 邻接矩阵

```C
const int maxv=1000;
const int inf=0x3fffffff;
bool vis[maxv]={false};
int d[maxv];

int prim(){
    fill(d,+maxv,inf);
    d[0]=0;
    int ans=0;
    for(int i=0;i<n;i++){
        int u=-1,min=inf;
        for(int j=0;j<n;j++){
            if(vis[j]==false && d[j]<min){
                u=j;
                min=d[j];
            }
        }
        if(u==-1) return -1;
        vis[u]=true;
        ans+=d[u];
        for(int v=0;v<n;v++){
            if(vis[v]==false && G[u][v]!=inf &&
              G[u][v]<d[v])
                d[v]=G[u][v];
        }
    }
    return ans;
}
```

### 邻接表

```C
const int maxv=1000;
vector<Node> Adj[maxv];
bool vis[maxv]={false};
int d[maxv];

int Prim(){
    fill(d,d+maxv,inf);
    d[0]=0;
    int ans=0;
    for(int i=0;i<n;i++){
        int u=-1,min=inf;
        for(int j=0;j<n;j++){
            if(vis[u]==false && d[j]<min){
                u=j;
                min=d[j];
            }
        }
        if(u==-1) return -1;
        vis[u]=true;
        ans+=d[u];
        for(int j=0;j<Adj[u].size();j++){
            int v=Adj[u][j].v;
            int dis=Adj[u][j].dis;
            if(vis[v]==false && dis<d[v])
                d[v]=dis;
        }
    }
    return ans;
}
```

## kruskal 算法

稀疏图效果更佳。

### 伪码

```C
int kruskal(){
    令最小生成树的边权之和为 ans、最小生成树的当前边数为 num;
    将所有边按边权从小到大排序;
    for(从小到大枚举所有边){
        if(当前测试边的两个端点在不同的连通块中){
            将该测试边加入最小生成树中;
            ans+=测试边的边权;
            num++;
            if(num==顶点数-1) break;
        }
    }
    return ans;
}
```

### C++ 实现

```C
const int maxv=1000;
struct edge{
    int u,v; // 边的两端点
    int cost; // 边权
}E[maxv];

bool cmp(edge a, edge b){
	return a.cost<b.cost;
}
int father[N]; // 并查集
int findFather(int x){
    
}
int kruskal(int n, int m){ // n=边数，m=顶点数
	int ans=0, num=0;
    for(int i==1;i<=n;i++){
        father[i]=i; // 并查集初始化
    }
    sort(E,E,cmp);
    for(int i=0;i<m;i++){
        int fau=findFather(E[i].u);
        int fav=findFather(E[i].v);
        if(fau!=fav){
            father[fau]=fav;
            ans+=E[i].cost;
            num++;
            if(num==n-1) break;
        }
    }
    if(num!=n-1) return -1;
    else return ans;
}
```

