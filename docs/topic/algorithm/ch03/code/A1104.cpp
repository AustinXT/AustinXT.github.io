#include <cstdio>

int main(){
    int n;
    scanf("%d", &n);
    double a[100010];
    double ans=0.0;
    for(int i=0;i<n;i++){
        scanf("%lf", &a[i]);
        ans+=a[i]*(i+1)*(n-i);
    }
    printf("%.2f", ans);
}
