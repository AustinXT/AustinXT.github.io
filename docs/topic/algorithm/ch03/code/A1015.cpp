#include <cstdio>

bool isPrime(int n){
    if(n<=1) return false;
    for(int i=2;i*i<=n;i++){
        if(n%i==0) return false;
    }
    return true;
}

int change(int n, int rd){
    int a[20];
    int i=0;
    while(n){
        a[i]=n%rd;
        n/=rd;
        i++;
    }
    int ans=0;
    for(int j=0;j<i;j++){
        ans=ans*rd+a[j];
    }
    return ans;
}

int main(){
    int n, rd, flag;
    while(1){
        flag=0;
        scanf("%d",&n);
        if(n<0) break;
        scanf("%d",&rd);
        if(isPrime(n)) flag++;
        n=change(n,rd);
        if(isPrime(n)) flag++;
        if(flag==2) printf("Yes\n");
        else printf("No\n");
    }
    return 0;
}
