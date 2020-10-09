#include <stdio.h>
void PrintN1 (int N);
void PrintN2 (int N);

int main()
{
	int N;
	scanf("%d", &N);
	//PrintN1(N);
	PrintN2(N);
	return 0;
}

void PrintN1 (int N)
{
	int i;
	for(i=1; i<=N; i++){
		printf("%d\n", i);
	}
	return;
}

void PrintN2 (int N)
{
	if(N){
		PrintN2(N-1);
		printf("%d\n", N);
	}
	return;
}
