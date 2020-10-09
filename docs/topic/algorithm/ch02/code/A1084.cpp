#include <cstdio>
#include <cstring>
using namespace std;

int main(int argc, char const *argv[])
	{
		char str1[90], str2[90];
		bool HashTable[128] = {false};
		scanf("%s%s", str1, str2);
		int l1 = strlen(str1);
		int l2 = strlen(str2);
		for (int i = 0; i < l1; ++i)
		{
			int j, c1, c2;
			for (j = 0; j < l2; ++j)
			{
				c1 = str1[i];
				c2 = str2[j];
				if(c1>='a' && c1<='z')c1-=32;
				if(c2>='a' && c2<='z')c2-=32;
				if(c1==c2)break;
			}
			if(j==l2 && HashTable[c1]==false){
				printf("%c", c1);
				HashTable[c1] = true;
			}
		}
		return 0;
	}	