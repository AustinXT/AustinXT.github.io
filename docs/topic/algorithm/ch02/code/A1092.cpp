#include <cstdio>
#include <cstring>
using namespace std;

int main(int argc, char const *argv[])
{
	int HarshTable[100] = {0};
	char str1[1111], str2[1111];
	scanf("%s%s",str1,str2);
	int len1 = strlen(str1);
	int len2 = strlen(str2);
	for (int i = 0; i < len1; ++i)
	{
		if(str1[i]>='a' && str1[i]<='z')
			HarshTable[str1[i]-'a'+10]++;
		else if(str1[i]>='A' && str1[i]<='Z')
			HarshTable[str1[i]-'A'+10+26]++;
		else if(str1[i]>='0' && str1[i]<='9')
			HarshTable[str1[i]-'0']++;

	}
	int delta=0;
	for (int i = 0; i < len2; ++i)
	{
		if(str2[i]>='a' && str2[i]<='z'){
			int temp = str2[i]-'a'+10;
			HarshTable[temp]--;
			if(HarshTable[temp]<0)
				delta++;

		}
		else if(str2[i]>='A' && str2[i]<='Z'){
			int temp = str2[i]-'A'+10+26;
			HarshTable[temp]--;
			if(HarshTable[temp]<0)
				delta++;
		}
		else if(str2[i]>='0' && str2[i]<='9'){
			int temp = str2[i]-'0';
			HarshTable[temp]--;
			if(HarshTable[temp]<0)
				delta++;
		}
	}
	if(delta>0)
		printf("No %d",delta);
	else
		printf("Yes %d", len1-len2);
	return 0;
}