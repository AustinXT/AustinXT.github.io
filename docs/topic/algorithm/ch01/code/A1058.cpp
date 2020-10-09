#include <cstdio>

int main(int argc, char const *argv[])
{
	struct money{
		int a, b, c;
	}in[2], out={0,0,0};
	for(int i=0; i<2; i++){
		scanf("%d.%d.%d", &in[i].a, &in[i].b, &in[i].c);
	}
	out.c += in[0].c + in[1].c;
	if(out.c >=29){
		out.c -= 29;
		out.b++;
	}
	out.b += in[0].b + in[1].b;
	if(out.b >= 17){
		out.b -= 17;
		out.a++;
	}
	out.a += in[0].a + in[1].a;
	printf("%d.%d.%d", out.a, out.b, out.c);
	return 0;
}