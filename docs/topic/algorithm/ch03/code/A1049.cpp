#include <cstdio>

int main(){
    int n;
    scanf("%d", &n);
    int a;
    int ans=0;
    int step=1;
    while(n/step>0){
        int stepp=step*10;
        a=n/step%10;
        if(a>1) ans+=(n/stepp+1)*step;
        else if(a==1) ans+=n/stepp*step+n%step+1;
        else ans+=n/stepp*step;
        step=stepp;
    }
    printf("%d\n", ans);
}
