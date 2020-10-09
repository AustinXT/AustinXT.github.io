---
title: AOE 网和关键路径
date: 2018-09-09
tags:
  - 算法
publish: false
---

## 概念

AOE（Activity On Edge）网指用带权边集表示活动（边权表示活动完成需要的时间），用顶点表示事件的有向无环图。

AOE 网的最长路径称为关键路径。

### AOV 转化为 AOE

若给定 AOV 网各顶点活动所需时间，则可将 AOV 网转换为 AOE 网：将 AOV 网中的每个顶点拆成两个顶点，分别表示活动的起止，两顶点用有向边连接，边权为活动所需时间，原 AOV 网中的边边权为0，再根据需要添加超级源点和超级汇点即可。

## 最长路径

对于没有正环的图（指源点可达的正环），则将所有边的边权称-1，再用 Bellman-Ford 或 SPFA 算法求最短路径长度，结果乘-1即可。

若图中有正环，则最长路径不存在。

## 关键路径

```C
int ve[maxv];
int vl[maxv];
// topological series
stack<int> topOrder;
// 拓扑排序，顺便求 ve[]
bool topologicalSort(){
    queue<int> q;
    for(int i=0;i<n;i++){
        if(inDegree[i]==0) q.push(i);
    }
    while(!q.empty()){
        int u=q.front();
        q.pop();
        topOrder.push(u);
        for(int i=0;i<Adj[u];i++){
            int v=Adj[u][i].v;
            inDegree[v]--;
            if(inDegree[v]==0) q.push(v);
        }
        // 用 v 的前序节点 u 的 ve[u] 更新 ve[v]
        if(ve[u]+Adj[u][i].cost>ve[v]) ve[v]=ve[u]+Adj[u][i].cost;
    }
    if(topOrder.size==n) return true;
    else return false;
}
int CriticalPath(){
    memset(ve,0,sizeof(ve));
    if(topologicalSort()==false) return -1;
    
    int maxLength=0;
    for(int i=0;i<n;i++){
        if(ve[i]>maxLength){
            maxLength=ve[i];
        }
    }
    fill(v1,v1+n,maxLength); // 用汇点的值初始化 vl
    
    while(!topOrder.empty()){
        int u=topOrder.top();
        topOrder.pop();
        for(int i=0;i<Adj[u].size();i++){
            int v=Adj[u][i].v;
            // 用 u 的所有后继节点 v 的 vl[v] 值来更新 vl[u]
            if(vl[v]-Adj[u][i].w<vl[u]) vl[u]=vl[v]-Adj[u][i].w;
        }
    }
    // 遍历邻接表的所有边
    for(int u=0;u<n;u++){
        for(int i=0;i<Adj[u].size();i++){
            int v=Adj[u][i].v;
            // 活动的最早开始时间和最迟开始时间
            int e=ve[u],l=vl[v]-w;
            if(e==l) printf("%d->%d\n",u,v)
        }
    }
    return maxLength; // 返回关键路径长度
}
```



