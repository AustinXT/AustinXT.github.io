#include <cstdio>
#include <cmath>

int main(){
    int n;
    scanf("%d",&n);
    int sqr=(int)sqrt(n*1.0);
    int first, counts=0;
    for(int i=2;i<=sqr;i++){
        int j=i;
        int tmpc=0;
        int tmpn=n;
        while(tmpn%j==0){
            tmpc++;
            if(tmpc>counts){
                counts=tmpc;
                first=i;
            }
            tmpn/=j;
            j++;
        }
    }
    if(counts==0){
        first=n;
        counts=1;
    }
    printf("%d\n",counts);
    while(counts){
        printf("%d",first++);
        if(counts>1) printf("*");
        counts--;
    }
    return 0;
}
