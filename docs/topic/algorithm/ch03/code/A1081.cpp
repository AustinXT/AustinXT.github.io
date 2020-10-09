#include <cstdio>

struct frac{
    int a,b;
};

int gcd(int a, int b){
    if(b==0) return a;
    else return gcd(b,a%b);
}

int main(){
    struct frac ans, tmp;
    ans.a=0;
    ans.b=1;
    int n;
    scanf("%d",&n);

    for(int i=0;i<n;i++){
        scanf("%d/%d", &tmp.a, &tmp.b);
        ans.a=ans.b*tmp.a+ans.a*tmp.b;
        ans.b=ans.b*tmp.b;
        int g=gcd(ans.a, ans.b);
        ans.a/=g;
        ans.b/=g;
        if(ans.b<=0){
            ans.a=-ans.a;
            ans.b=-ans.b;
        }
    }
    if(ans.a>=ans.b && ans.a%ans.b==0 || ans.a==0) printf("%d\n", ans.a/ans.b);
    else if(ans.a>ans.b) printf("%d %d/%d\n", ans.a/ans.b,ans.a%ans.b,ans.b);
    else printf("%d/%d\n", ans.a%ans.b,ans.b);
    return 0;
}
