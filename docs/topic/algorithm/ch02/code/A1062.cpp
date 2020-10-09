#include <cstdio>
#include <algorithm>
#include <cstring>
using namespace std;
#define Id 10

struct Man{
	char id[Id];
	int v, t, sum;
	int flag;
};

bool cmp(Man a, Man b){
	if(a.flag != b.flag)
		return a.flag < b.flag;
	else if(a.sum != b.sum)
		return a.sum > b.sum;
	else if(a.v != b.v)
		return a.v > b.v;
	else
		return strcmp(a.id, b.id)<0;
};

int main()
{
	int n, l, h, count=0;
	scanf("%d %d %d", &n, &l, &h);
	struct Man men[n];
	for (int i = 0; i < n; ++i)
	{
		char id[Id];
		int v, t;
		scanf("%s %d %d", id, &v, &t);
		if(v>=l && t>=l){
			strcpy(men[count].id, id);
			men[count].v = v, men[count].t = t, men[count].sum = v+t;
			if(men[count].v>=h && men[count].t>=h)
				men[count].flag = 1;
			else if(men[count].v>=h)
				men[count].flag = 2;
			else if(men[count].v>=men[count].t)
				men[count].flag = 3;
			else
				men[count].flag = 4;
			count++;
		}
	}
	printf("%d\n", count);
	sort(men, men+count, cmp);
	for (int i = 0; i < count; ++i)
	{
		printf("%s %d %d\n", men[i].id, men[i].v, men[i].t);
	}
	return 0;
}