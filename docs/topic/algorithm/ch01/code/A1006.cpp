#include <cstdio>

struct item
{
	int hh, mm, ss;
	char id[20];
}tmp, ans1, ans2;

bool compare(struct item a, struct item b)
{
	if(a.hh != b.hh)
		return a.hh > b.hh;
	if(a.mm != b.mm)
		return a.mm > b.mm;
	return a.ss > b.ss;
}

int main(int argc, char const *argv[])
{
	int n;
	scanf("%d", &n);
	ans1.hh=24, ans1.mm=0, ans1.ss=0;
	ans2.hh=0, ans1.mm=0, ans1.ss=0;
	for (int i = 0; i < n; ++i)
	{
		scanf("%s %d:%d:%d", &tmp.id, &tmp.hh, &tmp.mm, &tmp.ss);
		if(compare(ans1, tmp))
			ans1 = tmp;
		scanf("%d:%d:%d", &tmp.hh, &tmp.mm, &tmp.ss);
		if(compare(tmp, ans2))
			ans2 = tmp;
	}
	printf("%s %s", ans1.id, ans2.id);
	return 0;
}