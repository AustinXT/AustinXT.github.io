#include <cstdio>

int main(){
    int n;
    scanf("%d", &n);
    int before=0;
    int now;
    int ans=0;
    for(int i=0;i<n;i++){
        scanf("%d", &now);
        if(now-before>0){
            ans+=(now-before)*6;
        }
        else{
            ans+=(before-now)*4;
        }
        before=now;
        ans+=5;
    }
    printf("%d", ans);
}
