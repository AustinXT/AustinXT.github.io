#include <cstdio>

int value(char c[]){
	int v = 0;
	if(c[0]>='0' && c[0]<='9')
		v += (c[0] - '0') * 13;
	if(c[0]>='A' && c[0]<='C')
		v += (c[0] -'A' + 10) * 13;
	if(c[1]>='0' && c[1]<='9')
		v += c[1] - '0';
	if(c[1]>='A' && c[1]<='C')
		v += c[1] -'A' + 10;
	return v;
}

void print(int v){
	if(v>=0 && v<=9)
		printf("%c", v+'0');
	if(v>9 && v<16)
		printf("%c", v-10+'A');
}


int main(int argc, char const *argv[])
{
	char r[3], g[3], b[3];
	scanf("%s %s %s", r, g, b);
	printf("#");
	int v[3];
	v[0] = value(r), v[1] = value(g), v[2] = value(b);
	for(int i=0; i<3; i++){
		print(v[i]/16);
		print(v[i]%16);
	}
	return 0;
}