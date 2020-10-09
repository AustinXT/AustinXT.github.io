#include <cstdio>
#include <queue>
using namespace std;

struct Mouse{
    int weight;
    int R;
}mouse[1010];

int main(){
    int np,ng,order;
    scanf("%d%d",&np,&ng);
    for(int i=0;i<np;i++){
        scanf("%d",&mouse[i].weight);
    }
    queue<int> q;
    for(int i=0;i<np;i++){
        scanf("%d",&order);
        q.push(order);
    }
    int tmp=np,group;
    while(q.size()!=1){
        if(tmp%ng==0) group=tmp/ng;
        else group=tmp/ng+1;
        for(int i=0;i<group;i++){
            int k=q.front();
            for(int j=0;j<ng;j++){
                if(i*ng+j>=tmp) break;
                int fro=q.front();
                if(mouse[fro].weight>mouse[k].weight){
                    k=fro;
                }
                mouse[fro].R=group+1;
                q.pop();
            }
            q.push(k);
        }
        tmp=group;
    }
    mouse[q.front()].R=1;
    for(int i=0;i<np;i++){
        printf("%d",mouse[i].R);
        if(i<np-1) printf(" ");
    }
    return 0;
}
