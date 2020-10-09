#include <cstdio>
#include <algorithm>
using namespace std;

struct Cake{
	double amounts;
	double sell;
	double price;
};

bool cmp(Cake a, Cake b){
	return a.price > b.price;
}

int main(int argc, char const *argv[])
{
	int n;
	double d;
	scanf("%d %lf", &n, &d);
	struct Cake cakes[n];
	for (int i = 0; i < n; ++i)
	{
		scanf("%lf", &cakes[i].amounts);
	}
	for (int i = 0; i < n; ++i)
	{
		scanf("%lf", &cakes[i].sell);
		cakes[i].price = cakes[i].sell / cakes[i].amounts;
	}
	sort(cakes, cakes+n, cmp);
	double ans = 0;
	for (int i = 0; i < n; ++i)
	{
		if(cakes[i].amounts <= d){
			ans += cakes[i].sell;
			d -= cakes[i].amounts;
		}else{
			ans += cakes[i].price * d;
			break;
		}
	}
	printf("%.2lf", ans);
	return 0;
}