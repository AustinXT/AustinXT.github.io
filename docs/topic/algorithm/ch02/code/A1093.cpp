#include <cstdio>
#include <cstring>

int main(){
    char str[100010];
    scanf("%s",str);
    int len=strlen(str);
    int p[100010], t[100010];
    int psum=0,tsum=0;
    int k=0;
    for(int i=0;i<len;i++){
        if(str[i]=='P'){
            psum++;
        }
        if(str[i]=='A'){
            p[k]=psum;
            k++;
        }
    }
    int tmp=k;
    for(int i=len-1;i>=0;i--){
        if(str[i]=='T')
            tsum++;
        if(str[i]=='A'){
            tmp--;
            t[tmp]=tsum;
        }
    }
    int ans=0;
    for(int i=0;i<k;i++){
        ans= (ans+p[i]*t[i])%1000000007;
    }
    printf("%d",ans);
    return 0;
}
