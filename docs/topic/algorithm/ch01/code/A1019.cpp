#include <cstdio>

int main(int argc, char const *argv[])
{
	int n, b;
	scanf("%d %d", &n, &b);
	int a[40];
	int count=0;
	while(n > 0){
		a[count++] = n % b;
		n /= b;
	}
	count--;
	bool flag = true;
	for(int i = count; i>count/2; i--){
		if(a[i] != a[count-i])
			flag = false;
	}
	if(flag)
		printf("Yes\n");
	else
		printf("No\n");
	if (count == -1)
	{
		printf("0");
	}
	for(int i = count; i>=0; i--){
		printf("%d", a[i]);
		if(i>0)
			printf(" ");
	}
	return 0;
}