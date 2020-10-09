#include <cstdio>

bool isPrime(int n){
    if(n<=1) return false;
    for(int i=2;i*i<=n;i++){
        if(n%i==0) return false;
    }
    return true;
}

int main(){
    int m,n;
    scanf("%d%d",&m,&n);
    while(isPrime(m)==false){
        m++;
    }
    bool full[11111]={0};
    for(int i=0;i<n;i++){
        int a;
        scanf("%d",&a);
        int M=a%m;;
        if(full[M]==false){
            printf("%d",M);
            full[M]=true;
        }
        else{
            int step;
            for(step=1;step<m;step++){
                M=(a+step*step)%m;
                if(full[M]==false){
                    printf("%d",M);
                    full[M]=true;
                    break;
                }
            }
            if(step>=m) printf("-");
        }
        if(i<n-1) printf(" ");
    }
    return 0;
}
