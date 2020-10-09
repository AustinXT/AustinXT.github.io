#include <cstdio>

int main(){
	const int cards = 55;
	int n;
	int order[cards], old[cards], shuff[cards];
	scanf("%d", &n);
	for(int i=1; i<cards; i++)
		scanf("%d", &order[i]);
	for(int i=0; i<cards; i++)
		old[i] = i;
	for(int j=0; j<n; j++){
		for(int i=1; i<cards; i++)
			shuff[order[i]] = old[i];
		for(int i=1; i<cards; i++)
			old[i] = shuff[i];
	}
	for(int i=1; i<cards; i++){
		switch((shuff[i]-1)/13){
			case 0:
				printf("S");
				break;
			case 1:
				printf("H");
				break;
			case 2:
				printf("C");
				break;
			case 3:
				printf("D");
				break;
			default: printf("J");
		}
		printf("%d", (shuff[i]-1)%13+1);
		if(i<cards-1)
			printf(" ");
	}
}