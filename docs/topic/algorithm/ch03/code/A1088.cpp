#include <cstdio>

typedef long long LL;
typedef struct frac{
    LL a,b;
}f;

LL gcd(LL a, LL b){
    if(b==0) return a;
    else return gcd(b, a%b);
}

void pprint(f ans){
    int g=gcd(ans.a, ans.b);
    ans.a/=g;
    ans.b/=g;
    if(ans.b<0){
        ans.b=-ans.b;
        ans.a=-ans.a;
    }
    if(ans.b==0) printf("Inf");
    else{
        if(ans.a<0) printf("(");
        if(ans.a%ans.b==0) printf("%d", ans.a/ans.b);
        else if(ans.a>ans.b) printf("%d %d/%d", ans.a/ans.b,ans.a%ans.b,ans.b);
        else if(-ans.a>ans.b) printf("-%d %d/%d", (-ans.a)/ans.b,(-ans.a)%ans.b,ans.b);
        else printf("%d/%d", ans.a,ans.b);
        if(ans.a<0) printf(")");
    }
}

int main(){
    f f1,f2,ans;
    scanf("%ld/%ld %ld/%ld", &f1.a, &f1.b, &f2.a, &f2.b);
    // sum
    pprint(f1);
    printf(" + ");
    pprint(f2);
    printf(" = ");
    ans.a=f1.a*f2.b+f1.b*f2.a;
    ans.b=f1.b*f2.b;
    pprint(ans);
    printf("\n");
    // difference
    pprint(f1);
    printf(" - ");
    pprint(f2);
    printf(" = ");
    ans.a=f1.a*f2.b-f1.b*f2.a;
    ans.b=f1.b*f2.b;
    pprint(ans);
    printf("\n");
    // product
    pprint(f1);
    printf(" * ");
    pprint(f2);
    printf(" = ");
    ans.a=f1.a*f2.a;
    ans.b=f1.b*f2.b;
    pprint(ans);
    printf("\n");
    // quotient
    pprint(f1);
    printf(" / ");
    pprint(f2);
    printf(" = ");
    ans.a=f1.a*f2.b;
    ans.b=f1.b*f2.a;
    pprint(ans);
    printf("\n");

    return 0;
}
