#include <cstdio>
#include <cstring>

int main(int argc, char const *argv[])
{
	char num[110];
	scanf("%s", num);
	char eng[10][10] = {"zero","one","two","three","four","five","six","seven","eight","nine"};
	int sum = 0;
	for (int i = 0; i < strlen(num); ++i)
	{
		sum += num[i] - '0';
	}
	int ans[10], j=0;
	if(sum==0){
		ans[0] = 0;
		j++;
	}
	while(sum){
		ans[j] = sum % 10;
		sum /= 10;
		j++;
	}
	for (int i = j-1; i >= 0; --i)
	{
		printf("%s", eng[ans[i]]);
		if(i>0)
			printf(" ");
	}
	return 0;
}