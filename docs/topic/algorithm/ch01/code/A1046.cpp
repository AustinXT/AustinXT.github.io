#include <cstdio>

int main(){
	int n, m;
	scanf("%d",&n);
	int d, sum=0, D[n];
	D[0] = 0;
	for(int i=1; i<n+1; i++){
		scanf("%d", &d);
		sum += d;
		D[i] = sum;
	}
	scanf("%d", &m);
	for(int j=0; j<m; j++){
		int a, b, sum1=0, sum2=0;
		scanf("%d %d", &a, &b);
		if(a>b){
			int temp;
			temp = a;
			a = b;
			b = temp;
		}
		sum1 = D[b-1] - D[a-1];
		sum2 = sum - sum1;
		printf("%d\n", sum1<sum2?sum1:sum2);
	}
}