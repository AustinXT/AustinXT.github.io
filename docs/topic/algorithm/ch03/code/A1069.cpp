#include <cstdio>
#include <algorithm>
using namespace std;

bool cmp(int a,int b){
    return a>b;
}

void print(int a[], int n){
    for(int i=0; i<n; i++){
        printf("%d", a[i]);
    }
}

int toint(int a[], int n){
    int ans=0;
    for(int i=0; i<n; i++){
        ans=ans*10+a[i];
    }
    return ans;
}

int main(){
    int n;
    scanf("%d",&n);
    int a[4];
    if(n%1111==0) {
        printf("%04d - %04d = %04d\n", n,n,0);
        return 0;
    }
    if(n==6174){
        printf("7641 - 1467 = 6174\n");
        return 0;
    }
    while(n!=6174){
        for(int i=3;i>=0;i--){
            a[i]=n%10;
            n/=10;
        }
        sort(a,a+4,cmp);
        print(a,4);
        printf(" - ");
        n=toint(a,4);
        sort(a,a+4);
        print(a,4);
        printf(" = ");
        n=n-toint(a,4);
        printf("%04d\n",n);
    }
    return 0;
}
