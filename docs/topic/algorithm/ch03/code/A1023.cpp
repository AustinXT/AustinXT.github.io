#include <cstdio>
#include <cstring>

struct bign{
    int d[21];
    int len;
    bign(){
        memset(d,0,sizeof(d));
        len=0;
    }
};

void print(bign a){
    for(int i=a.len-1;i>=0;i--){
        printf("%d",a.d[i]);
    }
}

bign change(char str[]){
    bign a;
    a.len=strlen(str);
    for(int i=0;i<a.len;i++){
        a.d[i]=str[a.len-i-1]-'0';
    }
    return a;
}

bign doub(bign a){
    bign c;
    int carry=0;
    for(int i=0;i<a.len;i++){
        int tmp=a.d[i]*2+carry;
        c.d[c.len++]=tmp%10;
        carry=tmp/10;
    }
    while(carry!=0){
        c.d[c.len++]=carry%10;
        carry/=10;
    }
    return c;
}

bool dsame(bign a,bign b){
    if(a.len!=b.len) return 0;
    int counts[10]={0};
    for(int i=0;i<a.len;i++){
        counts[a.d[i]]++;
        counts[b.d[i]]--;
    }
    for(int i=0;i<10;i++){
        if(counts[i]!=0) return 0;
    }
    return 1;
}


int main(){
    char str[21];
    scanf("%s", str);
    bign a=change(str);
    bign b=doub(a);
    if(dsame(a,b)) printf("Yes\n");
    else printf("No\n");
    print(b);
    return 0;
}
