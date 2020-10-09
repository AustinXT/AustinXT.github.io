#include <cstdio>
#define Max 1111

int main(){
	int a, b, i, counts=0;
	double p[2*Max]={},ap[Max]={}, temp;
	scanf("%d", &a);
	while(a--){
		scanf("%d", &i);
		scanf("%lf", &ap[i]);
	}
	scanf("%d", &b);
	while(b--){
		scanf("%d", &i);
		scanf("%lf", &temp);
		for(int j=Max; j>=0; j--){
			p[j+i] += ap[j] * temp;
		}
	}
	for(i=2*Max-1; i>=0; i--){
		if(p[i] != 0.0)
			counts++;
	}
	printf("%d", counts);
	for(i=2*Max-1; i>=0; i--){
		if(p[i] != 0.0)
			printf(" %d %.1f", i, p[i]);
	}
}