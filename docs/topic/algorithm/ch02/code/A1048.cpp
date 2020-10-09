#include <cstdio>

int main(int argc, char const *argv[])
{
	int n,m;
	scanf("%d %d", &n, &m);
	int coin[1005]={0};
	for (int i = 0; i < n; ++i)
	{
		int value;
		scanf("%d", &value);
		coin[value]++;
	}
	for (int i = 1; i <= m/2; ++i)
	{
		if(coin[i] && coin[m-i]){
			if(i==m-i && coin[i]<=1)
				continue;
			printf("%d %d", i, m-i);
			return 0;
		}
	}
	printf("No Solution");
	return 0;
}