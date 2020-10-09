#include <cstdio>
#include <cstring>
#include <algorithm>
using namespace std;
typedef long long LL;
LL inf=(1LL<<63)-1;

int init(char num){
    if(num>='0' && num<='9'){
        return num-'0';
    }
    else if(num>='a' && num<='z'){
        return num-'a'+10;
    }
}

LL change(char n[], LL rd, LL t){
    int len=strlen(n);
    LL ans=0;
    for(int i=0; i<len; i++){
        ans=ans*rd+init(n[i]);
        if(ans<0||ans>t)
            return -1;
    }
    return ans;
}

int cmp(char n[], LL rd, LL t){
    int len=strlen(n);
    LL num=change(n, rd, t);
    if(num<0) return 1;
    if(num<t) return -1;
    else if(t==num) return 0;
    else return 1;
}

LL largestnum(char n[]){
    int len=strlen(n);
    int ans=-1;
    for(int i=0; i<len; i++){
        int tmp=init(n[i]);
        if(ans<tmp)
            ans=tmp;
    }
    return ans+1;
}


int main(){
    char n1[12],n2[12];
    int tag, r;
    scanf("%s %s %d %d", n1, n2, &tag, &r);
    if(tag==2){
        char tmp[12];
        strcpy(tmp,n1);
        strcpy(n1,n2);
        strcpy(n2,tmp);
    }

    LL a, b;
    LL a1=change(n1, r, inf);
    a=largestnum(n2);
    b=max(a,a1)+1;

    while(a<=b){
        int m=(a+b)/2;
        int flag=cmp(n2,m,a1);
        if(flag==1){
            b=m-1;
        }
        else if(flag==-1){
            a=m+1;
        }
        else{
            printf("%d", m);
            return 0;
        }
    }
    printf("Impossible");
    return 0;

}
