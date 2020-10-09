#include <cstdio>
#include <queue>
#include <vector>
using namespace std;

const int maxn=100;
int counts[maxn]={0};

struct Node{
    int level;
    vector<int> child;
}node[maxn];

void BFS(int root){
    int maxlevel=0;
    if(node[root].child.size()==0) counts[node[root].level]++;
    else{
        queue<int> q;
        q.push(root);
        while(!q.empty()){
            int nown=q.front();
            q.pop();
            if(node[nown].child.size()==0) counts[node[nown].level]++;
            else {
                for(int i=0;i<node[nown].child.size();i++){
                    int c=node[nown].child[i];
                    q.push(c);
                    node[c].level=node[nown].level+1;
                    if(node[c].level>maxlevel) maxlevel=node[c].level;
                }
            }
        }
    }
    for(int i=0;i<=maxlevel;i++){
        if(i!=0) printf(" ");
        printf("%d",counts[i]);
    }
    return;
}

int main(){
    int n,m;
    scanf("%d",&n);
    if(n==0) return 0;
    scanf("%d",&m);
    for(int i=0;i<m;i++){
        int id, num;
        scanf("%d%d",&id,&num);
        for(int j=0;j<num;j++){
            int idc;
            scanf("%d",&idc);
            node[id].child.push_back(idc);
        }
    }
    node[1].level=0;
    BFS(1);
    return 0;
}
