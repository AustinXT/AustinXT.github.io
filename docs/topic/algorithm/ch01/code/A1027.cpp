#include <cstdio>

void print(int v){
	if(v>=0 && v<=9)
		printf("%c", v+'0');
	if(v>9 && v<13)
		printf("%c", v-10+'A');
}


int main(int argc, char const *argv[])
{
	int v[3];
	for(int i=0; i<3; i++){
		scanf("%d", &v[i]);
	}
	printf("#");
	for(int i=0; i<3; i++){
		print(v[i]/13);
		print(v[i]%13);
	}
	return 0;
}