#include <cstdio>
#include <cstring>
#define Max 1111

int main(int argc, char const *argv[])
{
	int n;
	scanf("%d", &n);
	char name[Max][20], pass[n][20];
	int modi[Max] = {0};
	int count = 0;
	for (int i = 0; i < n; ++i)
	{
		scanf("%s %s", name[i], pass[i]);
		for (int j = 0; j < strlen(pass[i]); ++j)
		{
			if(pass[i][j] == '1'){
				pass[i][j] = '@';
				modi[i] = 1;
			}
			else if(pass[i][j] == '0'){
				pass[i][j] = '%';
				modi[i] = 1;
			}
			else if(pass[i][j] == 'O'){
				pass[i][j] = 'o';
				modi[i] = 1;
			}
			else if(pass[i][j] == 'l'){
				pass[i][j] = 'L';
				modi[i] = 1;
			}
		}
		if(modi[i] == 1)
			count++;
	}
	if(count == 0)
		if(n == 1)
			printf("There is %d account and no account is modified", n);
		else
			printf("There are %d accounts and no account is modified", n);
	else{
		printf("%d\n", count);
		for (int i = 0; i < n; ++i)
		{
			if(modi[i] == 1){
				printf("%s %s", name[i], pass[i]);
				count--;
				if(count>0)
					printf("\n");
			}
		}
	}
	return 0;
}