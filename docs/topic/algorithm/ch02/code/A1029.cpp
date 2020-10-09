#include <cstdio>
#define N 1000010
#define inf 0x7fffffff

int main(){
    int m,n;
    int a[N], b;
    scanf("%d",&m);
    for(int i=0;i<m;i++){
        scanf("%d",&a[i]);
    }
    scanf("%d",&n);
    scanf("%d",&b);
    a[m]=inf;
    int i=0,j=0,k=(m+n-1)/2;
    while(k){
        if(a[i]<b){
            i++;
        }
        else{
            j++;
            if(j<n) scanf("%d",&b);
            else b=inf;
        }
        k--;
    }
    if(a[i]<b)
        printf("%d", a[i]);
    else
        printf("%d", b);
    return 0;
}
