#include <cstdio>
#define Max 1010

int main(){
	int a, b, sum=0, i;
	double p[Max]={}, temp;
	scanf("%d", &a);
	sum += a;
	while(a--){
		scanf("%d", &i);
		scanf("%lf", &p[i]);
	}
	scanf("%d", &b);
	sum += b;
	while(b--){
		scanf("%d", &i);
		scanf("%lf", &temp);
		if(p[i] != 0.0)
			sum--;
		p[i] += temp;
		if(p[i] == 0.0)
			sum--; 
	}
	printf("%d", sum);
	for(i=Max-1; i>=0; i--){
		if(p[i] != 0.0)
			printf(" %d %.1lf", i, p[i]);
	}
}