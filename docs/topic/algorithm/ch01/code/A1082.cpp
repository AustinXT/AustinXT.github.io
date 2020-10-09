#include <cstdio>
#include <cstring>

int main(int argc, char const *argv[])
{
	char str[20];
	char num[10][5] = {"ling","yi","er","san","si","wu","liu","qi","ba","jiu"};
	char wei[10][5] = {"","Shi","Bai","Qian","Wan","Shi","Bai","Qian","Yi"};
	gets(str);
	int len = strlen(str), i=0;
	if(str[0] == '-'){
		printf("Fu ");
		i++;
	}
	bool flag = true;
	for (; i < len; ++i)
	{
		if(str[i] - '0'== 0 && flag){
			printf("%s ", num[str[i]]);
		}
		else{
			printf("%s", );
		}
	}
	return 0;
}