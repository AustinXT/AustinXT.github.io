---
title: AOV 网和拓扑排序
date: 2018-09-09
sidebar: 'auto'
categories: 学习记录
author: 夜航星
tags:
  - 算法
  - 技术
publish: true
---

AOV（Activity On Vertex）网指用顶点表示活动，用边集表示活动间优先关系的有向无环图。

拓扑排序是指将有向无环图 G 的所有顶点排成的一个线性序列，且对图 G 中的任意两个顶点 u、v，若存在边 u->v ，则在序列中 u 一定在 v 前面。

```C
vector<int> Adj[maxv];
int n,m,inDegree[maxv];
bool topologicalSort(){
    int num=0;
    queue<int> q;
    for(int i=0;i<n;i++){
        if(inDegree[i]==0) q.push(i);
    }
    while(!q.empty()){
        int u=q.front();
        // printf("%d",u);
        q.pop();
        for(int i=0;i<Adj[u].size();i++){
            int v=Adj[u][i];
            inDegree[v]--;
            if(inDegree[v]==0) q.push(v);
        }
        Adj[u].clear();
        num++; // 每 pop 一个拓扑序列加1
    }
    if(num==n) return true;
    else return false;
}
```

