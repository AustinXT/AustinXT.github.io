#include <cstdio>

int main(){
    int n;
    scanf("%d", &n);
    int sum[12]={0};
    int step=1;
    for(int i=1;i<10;i++){
        sum[i]+=step+sum[i-1]*10;
        step*=10;
    }
    int ans=0;
    int a[12]={0};
    int i=1;
    while(n>0){
        a[i]+=n%10;
        n/=10;
        i++;
    }
    int s=1;
    for(int j=1;j<i;j++){
        ans+=a[j]*sum[j-1];
        if(a[j]>1){
            ans+=sum[j];
        }
        if(a[j]==1){
            ans+=a[j-1]+1;
        }
    }
    printf("%d\n", ans);
}
