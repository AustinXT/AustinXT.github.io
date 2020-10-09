---
title: 图的最短路径
date: 2018-09-09
tags:
  - 算法
publish: false
mathjax: true
---

## Dijkstra 算法

适用于无负权图的单源最短路径问题，复杂度为 $O(V^2+E)$ 

### 最短距离

#### 伪码

```C
// 数组 d[] 为源点 s 到达各点的最短路径长度
Dijkstra(G, d[], s){
    初始化;
    for(循环 n 次){
        u=使 d[u] 最小的还未被访问的顶点标号;
        记 u 已被访问;
        for(从 u 出发所有能到达的顶点 v){
            if(v 未被访问 &&
               以 u 为中介点使 s 到顶点 v 的最短距离 d[v] 更优)
                优化 d[v];
        }
    }
}
```

#### 邻接矩阵

```C
const int maxv=1000;
const int inf=0x3fffffff;

int n,G[maxv][maxv];
int d[maxv];
bool vis[maxv]={false};

void Dijkstra(int s){
    // 初始化
    fill(d,d+maxv,inf);
    d[s]=0;
    for(int i=0;i<n;i++){
    	// 查找使 d[u] 最小的还未被访问的顶点标号 u
        int u=-1,min=inf;
        for(int j=0;j<n;j++){
            if(vis[j]==false && d[j]<min){
                u=j;
                min=d[j];
            }
        }
        // 找不到满足条件的 u
        if(u==-1) return;
        // 标记 u 已被访问;
        vis[u]=true;
        // 优化 vis 集到 u 所能到达的为被访问的顶点的距离
        for(int v=0;v<n;v++){
            if(vis[v]==false && G[u][v]!=inf &&
              d[u]+G[u][v]<d[v])
                d[v]=d[u]+G[u][v];
        }
    } 
}
```

#### 邻接表

```C
const int maxv=1000;
const int inf=0x3fffffff;

int n;
int d[maxv];
bool vis[maxv]={false};
struct Node{
    int v,dis;
};
vector<Node> Adj[maxv];

void Dijkstra(int s){
    fill(d,d+maxv,inf);
    d[s]=0;
    for(int i=0;i<n;i++){
        int u=-1,min=inf;
        for(int j=0;j<n;j++){
            if(vis[j]==false && d[j]<min){
                u=j;
                min=d[j];
            }
        }
        if(u==-1) return;
        vis[u]=true;
        for(int j=0;j<Adj[u].size();j++){
            int v=Adj[u][j].v;
            if(vis[v]==false && d[u]+Adj[u][j].dis<d[v])
                d[v]=d[u]+Adj[u][j].dis;
        }
    }
}
```

### 最短路径

#### 伪码

在求最短距离伪码的 `优化 d[v];` 之后，加上 `令 v 的前驱为 u;`

```C
// 数组 d[] 为源点 s 到达各点的最短路径长度
Dijkstra(G, d[], s){
    初始化; // 初始化令每个节点的前驱为自身
    for(循环 n 次){
        u=使 d[u] 最小的还未被访问的顶点标号;
        记 u 已被访问;
        for(从 u 出发所有能到达的顶点 v){
            if(v 未被访问 &&
               以 u 为中介点使 s 到顶点 v 的最短距离 d[v] 更优){
                优化 d[v];
                令 v 的前驱为 u; // 仅此处改动
            }  
        }
    }
}
```

#### 邻接表

```C
#define MAXV 500
#define INF 999999
typedef int ElemType;

typedef struct 
{
	int no; // 顶点编号
	ElemType info; // 顶点其他信息
}VertexType; // 声明顶点类型
typedef struct 
{
	int edges[MAXV][MAXV]; // 邻接矩阵
	int n, e; // 定点数和边数
	VertexType vexs[MAXV];  // 存放顶点信息
}MGraph; // 声明图的邻接矩阵类型

// 初始化图的邻接矩阵
void CreateMat(MGraph &g, int A[][MAXV], int n)
{	// 由数组 A[n][n] 生成邻接矩阵 g
	int i, j;
	g.n = n;
	g.e = 0;
	for(i=0; i<g.n; i++){
		for(j=0; j<g.n; j++){
			g.edges[i][j] = A[i][j];
			if(g.edges!=0)
				g.e++;
		}
	}
}
// 迪克斯特拉算法
void Dijkstra(MGragh g, int v)
{
	int dist[MAXV]; // U 集合中的各节点到 v 的最短距离
	int path[MAXV]; // 用于记录最短路径中每一节点的前一节点
	int S[MAXV]; // 已访问集合
	int mindist, i, j, u;
	// 将源点归入 S 集合，其余节点归入 U 集合
	// 初始化 U 集合中各节点到 S 集合的距离
	// 将与 S 集合相连的节点的路径中的前一节点标记为源节点
	for(i=0; i<g.n; i++){
		S[i] = 0;
		dist[i] = g.edges[v][i];
		if(g.edges[v][i]<INF)
			path[i] = v;
		else
			path[i] = -1;
	}
	S[v] = 1;

	for(i=0; i<g.n; i++){
		// 在 U 集合中找出距离 S 集合最近的节点
		mindist = INF;
		for(j=0; j<g.n; j++){
			if(!S[j] && dist[j]<mindist){
				mindist = dist[j];
				u = j;
			}
		}
		S[u] = 1; // 将 u 点加入到 S 中
		// 修改 U 集合中各节点到 v 的最短距离
		for(j=0; j<g.n; j++){
			if(g.edges[u][j]<INF && dist[u]+g.edges[u][j]<dist[j]){
				dist[j] = dist[u] + g.edges[u][j];
				path[j] = u;
			}
		}
	}
	DispAllPath(g, dist, path, S, v);
}

void DispAllPath(MGraph g, int dist[], int path[], int S[], int v)
{
	int i, j, k;
	int apath[MAXV], d;
	for(i=0; i<g.n; i++){
		if(S[i] && i!=v){
			printf("The shortest path from %d to %d is %d:", v, i, dist[i]);
			d = 0; apath[d] = i;
			k = path[i];
			if(k==-1)
				printf("None\n");
			else{
				while(k!=v){
					d++;apath[d] = path[k];
					k = path[k];
				}
				d++; apath[d] = v;
				printf("%d", apath[d]);
				for(j=d-1; j>=0; j--)
					printf("-->%d", apath[j]);
				printf("\n");
			}
		}
	}
}
```

### 求所有最短路径

将 `pre[maxv]` 换成 `vector<int> pre[maxv]`

```C
vector<int> pre[maxn];
void Dijkstra(int s){
    fill(d,d+maxv,inf);
    d[s]=0;
    for(int i=0;i<n;i++){
        int u=-1,min=inf;
        for(int j=0;j<n;j++){
            if(vis[j]==false && d[j]<min){
                min=d[j];
                u=j;
            }
        }
        if(u==-1) return;
        vis[u]=true;
        for(int v=0;v<n;v++){
            if(vis[v]==false && G[u][v]!=inf){
                if(d[u]+G[u][v]<d[v]){
                    d[v]=d[u]+G[u][v];
                    pre[v].clear();
                    pre[v].push_bakc(u);
                }else if(d[u]+G[u][v]==d[v]){
                    pre[v].push_bakc(u);
                }
            }
        }
    }
}
```

### 第二标尺

第一标尺是路径长度，有时题目还会有第二标尺。

## Bellman-Ford 算法与 SPFA 算法

复杂度为 $O(VE)$ 

### 最短距离

```C
// 邻接表
struct Node{
    int v, dis;
};
vector<Node> Adj[maxn];
int n;
int d[maxn];

bool Bellman(int s){
    fill(d,d+maxn,inf);
    d[s]=0;
    // 求解数组 d
    for(int i=0;i<n-1;i++){
        for(int u=0;u<n;u++){
            for(int j=0;j<n;j++){
                int v=Adj[u][j].v;
                int dis=Adj[u][j].dis;
                if(d[u]+dis<d[v])
                    d[v]=d[u]+dis;
            }
        }
    }
    // 判断负环
    for(int u=0;u<n;u++){
        for(int j=0;j<Adj[u].size();j++){
            int v=Adj[u][j].v;
            int dis=Adj[u][j].dis;
            if(d[u]+dis<d[v])
                return false;
        }
    }
    return true;
}
```

### 最短路径条数

因为该算法会反复累计已经算过的顶点，设置记录前驱的数组 `set<int> pre[maxv];` ，遇到一条与已有最短路径长度相同的路径时，重新计算最短路径条数。

```C
// ...
else if(d[u]+dis==d[v]){
    pre[v].insert(u);
    num[v]=0;
    set<int>:: iterator it;
    for(it=pre[v].begin();it!=pre[v].end();it++){
        num[v]+=num[*it];
    }
}
```

### SPFA (Shortest Path Faster Algorithm)

在 Bellman-Ford 算法，每次都要访问所有边，而实际上只有当某个顶点 u 的 d[u] 值改变时，从它出发的邻接点 v 的 d[v] 值才会改变。对此进行优化，得到 SPFA。

#### 伪码

```C
queue<int> q;
源点 s 入队;
while(q非空){
    for(u 的所有邻接边 u->v){
        if(d[u]+dis<d[v]){
            d[v]=d[u]+dis;
            if(v 当前不再队列){
                v 入队;
                if(v 入队次数大于 n-1)
                    说明有可达负环, return;
            }
        }
    }
}
```

#### 邻接表

```C
vector<Node> Adj[maxv];
int n, d[maxv],num[maxv]; // num 记录顶点的入队次数
bool inq[maxv];

bool SPFA(int s){
    // 初始化
    memset(inq,false,sizeof(inq));
    memset(num,0,sizeof(num));
    fill(d,d+maxv,inf);
    // 源点入队
    queue<int> q;
    q.push(s);
    inq[s]=true;
    num[s]++;
    d[s]=0;
    // 主体
    while(!q.empty()){
        int u=q.front();
        q.pop();
        inq[u]=false;
        // 遍历 u 的所有邻接边 v
        for(int j=0;j<Adj[u].size();j++){
            int v=Adj[u][j].v;
            int dis=Adj[u][j].dis;
            if(d[u]+dis<d[v]){
                d[v]=d[u]+dis;
                if(!inq[v]){
                    q.push(v);
                    inq[v]=true;
                    num[v]++;
                    if(num[v]>=n) return false;
                }
            }
        }
    }
    return true;
}
```

## Floyd 算法

适用于解决全源最短路径问题，时间复杂度为 $O(V^3)$ 

### 伪码

```C
枚举顶点 k in [1,n];
	以顶点为中介点，枚举所有顶点对 i,j in [1,n]
		if(dis[i][k]+dis[k][j]<dis[i][j])
            dis[i][j]=dis[i][k]+dis[k][j];
```



