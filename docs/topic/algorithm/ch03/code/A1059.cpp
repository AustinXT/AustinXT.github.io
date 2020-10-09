#include <cstdio>
#include <math.h>

const int maxn=100010;

int prime[maxn], pnum=0;
bool p[maxn]={0};

void getPrime(){
    for(int i=2;i<maxn;i++){
        if(p[i]==false){
            prime[pnum++]=i;
            for(int j=i+i;j<maxn;j+=i){
                p[j]=true;
            }
        }
    }
}

int main(){
    int n, tmp;
    scanf("%d", &n);
    tmp=n;
    getPrime();
    bool flag=false;
    if(tmp==1) printf("1=1");
    else {
        printf("%d=", tmp);
        for(int i=0;i<pnum && tmp>1 && prime[i]*prime[i]<=n;i++){
            if(tmp%prime[i]==0){
                if(flag) printf("*");
                printf("%d",prime[i]);
                flag=true;
                int counts=0;
                while(tmp%prime[i]==0){
                    counts++;
                    tmp/=prime[i];
                }
                if(counts>1) printf("^%d",counts);
            }
        }
        if(tmp>1) printf("%d", n);
    }
    return 0;
}
