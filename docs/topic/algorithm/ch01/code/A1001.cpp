#include <cstdio>

int main(int argc, char const *argv[])
{
	int a, b, c;
	scanf("%d %d", &a, &b);
	c = a + b;
	if(c<0){
		printf("-");
		c = -c;
	}
	int n[10];
	int i = 0;
	if(c == 0)
		printf("0");
	while(c){
		n[i] = c % 1000;
		c /= 1000;
		i++;
	}
	for (int j = i-1; j>=0 ; --j)
	{
		if(j == i-1)
			printf("%d", n[j]);
		else
			printf("%03d", n[j]);
		if (j>0)
			printf(",");
	}
	return 0;
}