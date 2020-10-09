#include <cstdio>
#include <cstring>

int main(int argc, char const *argv[])
{
	char str[10010];
	char sign;
	int e;
	scanf("%c%c.", &sign, &str[0]);
	int count=1;
	char tmp;
	while(scanf("%c", &tmp)){
		if(tmp == 'E')
			break;
		else
			str[count++] = tmp;
	}
	scanf("%d", &e);
	if(sign == '-')
		printf("-");
	if(e<0){
		printf("0.");
		for(int i=0; i>e+1; i--){
			printf("0");
		}
		printf("%s", str);
	}else if(e>0){
		int i;
		for(i=0; i<e+1 && i<strlen(str); i++)
			printf("%c", str[i]);
		if(e+1>=strlen(str)){
			for(;i<e+1;i++)
				printf("0");
		}else{
			printf(".");
			for(;i<strlen(str); i++)
				printf("%c", str[i]);
		}
	}else{
		printf("%c.", str[0]);
		for(int i=1; i<strlen(str); i++)
			printf("%c", str[i]);
	}
	return 0;
}