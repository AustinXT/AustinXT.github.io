#include <cstdio>
#include <cstring>

int main()
{
	char str1[70], str2[70], str3[70], str4[70];
	char week[7][4] = {"MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"};
	scanf("%s", str1);
	scanf("%s", str2);
	scanf("%s", str3);
	scanf("%s", str4);
	int i;
	for (i = 0; i < strlen(str1) && i < strlen(str2); ++i)
	{
		if(str1[i] == str2[i] && str1[i] >= 'A' && str1[i] <= 'G'){
			printf("%s ", week[str1[i]-'A']);
			break;
		}
	}
	for (i++; i < strlen(str1) && i < strlen(str2); ++i)
	{
		if(str1[i] == str2[i]){
			if(str1[i] >='0'&& str1[i]<='9'){
				printf("%02d:", str1[i]-'0');
				break;
			}
			if(str1[i] >='A'&& str1[i]<='N'){
				printf("%02d:", str1[i]-'A'+10);
				break;
			}
		}
	}
	for (i = 0; i < strlen(str3) && i < strlen(str4);i++){
		if(str3[i] == str4[i]){
			if ((str3[i] >= 'A' && str3[i] <= 'Z') || (str3[i] >= 'a' && str3[i] <= 'z'))
			{
				printf("%02d", i);
				break;
			}
		}
	}	
	return 0;
}