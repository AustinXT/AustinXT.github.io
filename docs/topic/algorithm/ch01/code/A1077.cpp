#include <cstdio>
#include <cstring>

int main(int argc, char const *argv[])
{
	int n;
	scanf("%d", &n);
	getchar();
	char s[100][256];
	int minlen = 256, ans=0;
	for (int i = 0; i < n; ++i)
	{
		gets(s[i]);
		int len = strlen(s[i]);
		if(len < minlen)
			minlen = len;
		for (int j = 0; j < len/2; ++j)
		{
			char tmp = s[i][j];
			s[i][j] = s[i][len-j-1];
			s[i][len-j-1] = tmp;
		}

	}
	for (int i = 0; i < minlen; ++i)
	{
		char c = s[0][i];
		bool same = true;
		for (int j = 1; j < n; ++j)
		{
			if(c != s[j][i]){
				same = false;
				break;
			}
		}
		if(same) ans++;
		else break;
	}
	if(ans)
		for(int i = ans -1; i >= 0; i--)
			printf("%c", s[0][i]);
	else printf("nai");
	return 0;
}