#include <cstdio>

int main(){
	long long a, b, c, sum;
	int n;
	scanf("%d", &n);
	for(int i=0; i<n; i++){
		scanf("%lld %lld %lld", &a, &b, &c);
		sum = a+b;
		printf("Case #%d: ", i+1);
		if(a>0 && b>0 &sum<0)
			printf("true\n");
		else if(a<0 && b<0 & sum>=0)
			printf("false\n");
		else if(sum>c)
			printf("true\n");
		else
			printf("false\n");
	}
}