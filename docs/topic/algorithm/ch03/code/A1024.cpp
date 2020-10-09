#include <cstdio>
#include <cstring>

struct bign{
    int d[1000];
    int len;
    bign(){
        memset(d,0,sizeof(d));
        len=0;
    }
};

bign change(char str[]){
    bign a;
    a.len=strlen(str);
    for(int i=0;i<a.len;i++){
        a.d[i]=str[a.len-i-1]-'0';
    }
    return a;
}

bool judge(bign a){
    for(int i=0;i<a.len/2;i++){
        if(a.d[i]!=a.d[a.len-1-i]) return false;
    }
    return true;
}

void print(bign a){
    for(int i=a.len-1;i>=0;i--){
        printf("%d",a.d[i]);
    }
}

bign opera(bign a){
    bign c;
    int carry=0;
    for(int i=0;i<a.len;i++){
        int tmp=a.d[i]+a.d[a.len-i-1]+carry;
        c.d[c.len++]=tmp%10;
        carry=tmp/10;
    }
    if(carry!=0) c.d[c.len++]=carry;
    return c;
}

int main(){
    char str[12];
    int k;
    scanf("%s %d", str, &k);
    bign a=change(str);
    for(int i=0;i<k;i++){
        if(judge(a)){
            print(a);
            printf("\n%d",i);
            return 0;
        }
        a=opera(a);
    }
    print(a);
    printf("\n%d",k);
    return 0;
}
