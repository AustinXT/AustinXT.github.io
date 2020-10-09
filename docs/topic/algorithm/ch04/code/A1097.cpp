#include <cstdio>
#include <cmath>
#include <cstring>
using namespace std;

struct Node{
    int data;
    int next;
    bool flag;
}node[100010];

bool extable[10010];

int main(){
    int first,n,p;
    scanf("%d%d",&first,&n);
    for(int i=0;i<n;i++){
        int add,dat,nadd;
        scanf("%d%d%d",&add,&dat,&nadd);
        node[add].data=dat;
        node[add].next=nadd;
        node[add].flag=false;
    }
    memset(extable,false,sizeof(extable));
    p=first;
    bool f=false;
    while(p!=-1){
        int d=fabs(node[p].data);
        if(!extable[d]){
            extable[d]=true;
            node[p].flag=true;
            if(f) printf("%05d\n%05d %d ",p,p,node[p].data);
            else printf("%05d %d ",p,node[p].data);
            f=true;
        }
        p=node[p].next;
    }
    if(f) printf("-1\n");
    p=first;
    f=false;
    while(p!=-1){
        if(!node[p].flag){
            if(f) printf("%05d\n%05d %d ",p,p,node[p].data);
            else printf("%05d %d ",p,node[p].data);
            f=true;
        }
        p=node[p].next;
    }
    if(f) printf("-1\n");
    return 0;
}
