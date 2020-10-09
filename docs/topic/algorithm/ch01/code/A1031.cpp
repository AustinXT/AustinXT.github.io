#include <cstdio>
#include <cstring>

int main(int argc, char const *argv[])
{
	char line[90];
	scanf("%s", line);
	int length, highth, weighth;
	length = strlen(line);
	highth = (length +2) / 3;
	weighth = length + 2 - 2 * highth;
	for (int i = 0; i < highth-1; ++i)
	{
		printf("%c%*.s%c\n", line[i], weighth-2,"", line[length-i-1]);
	}
	for (int j = 0; j < weighth; ++j)
	{
		printf("%c", line[highth-1+j]);	
	}
	return 0;
}