#include <cstdio>
#define inf 1000000010
#define maxN 100010
int main(){
    int n;
    scanf("%d", &n);
    int a[maxN];
    bool lisp[maxN]={0}, risp[maxN]={0};
    int counts=0;
    int maxn=0, minn=inf;
    for(int i=0;i<n;i++){
        scanf("%d",&a[i]);
        if(maxn<a[i]){
            maxn=a[i];
            lisp[i]=1;
        }
    }
    for(int i=n-1;i>=0;i--){
        if(minn>a[i]){
            minn=a[i];
            risp[i]=1;
            counts+=lisp[i]*risp[i];
        }
    }
    printf("%d\n",counts);
    bool flag=false;
    for(int i=0;i<n;i++){
        if(lisp[i]*risp[i]==1){
            if(flag) printf(" ");
            printf("%d",a[i]);
            flag=true;
        }
    }
    printf("\n");
    return 0;
}
