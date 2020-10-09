#include <stdio.h>
#define MAXV 500
#define INF 999999
typedef struct 
{
	int n;
	int m;
	int edges[MAXV][MAXV];
	int teams[MAXV];
}MGraph;

void Dijkstra(int start, int end, MGraph g);

int main(int argc, char const *argv[])
{	// create the graph
	MGraph g;
	int start, end;
	scanf("%d %d %d %d", &g.n, &g.m, &start, &end);
	for (int i = 0; i < g.n; ++i)
		scanf("%d", &g.teams[i]);
	for (int i = 0; i < g.n; ++i)
	{
		for (int j = 0; j < g.n; ++j)
			g.edges[i][j] = INF;
	}
	for (int i = 0; i < g.m; ++i)
	{
		int a, b;
		scanf("%d %d", &a, &b);
		scanf("%d", &g.edges[a][b]);
		g.edges[b][a] = g.edges[a][b];
	}

	Dijkstra(start, end, g);
	return 0;
}

void Dijkstra(int start, int end, MGraph g)
{
	int S[g.n], dist[g.n], ateams[g.n], count[g.n];
	int mindist = INF, u;
	for (int i = 0; i < g.n; ++i){
		S[i] = 0; 
		count[i] = 1;
		dist[i] = INF;
	}
	S[start] = 1;
	u = start;
	dist[u] = 0;
	ateams[u] = g.teams[u];
	while(u!=end){
		for (int j = 0; j < g.n; ++j){
			if(S[j]==0){
				if(dist[j]>dist[u]+g.edges[u][j]){
					dist[j] = dist[u] + g.edges[u][j];
					ateams[j] = ateams[u] + g.teams[j];
					count[j] = count[u];
				}else if(dist[j]==dist[u]+g.edges[u][j]){
					if(ateams[j]<ateams[u]+g.teams[j])
						ateams[j] = ateams[u] + g.teams[j];
					count[j] += count[u];
				}
			}
		}
		mindist = INF;
		for (int j = 0; j < g.n; ++j){
			if (S[j]==0 && dist[j]<mindist){
			mindist = dist[j];
			u = j;
			}
		}
		S[u] = 1;
	}
	printf("%d %d", count[end], ateams[end]);
}