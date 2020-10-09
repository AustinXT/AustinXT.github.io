#include <cstdio>
#include <queue>
#include <algorithm>
using namespace std;
const int maxn=100;
int ran=0;

struct Node{
    int data;
    int lchild, rchild;
}node[maxn];

int integer[maxn];

int inTraversal(int root){
    if(root!=-1){
        inTraversal(node[root].lchild);
        node[root].data=integer[ran++];
        inTraversal(node[root].rchild);
    }
}

void BFS(int root){
    bool flag=false;
    queue<int> q;
    q.push(root);
    while(!q.empty()){
        int nown=q.front();
        q.pop();
        if(flag)printf(" ");
        printf("%d",node[nown].data);
        flag=true;
        if(node[nown].lchild!=-1) q.push(node[nown].lchild);
        if(node[nown].rchild!=-1) q.push(node[nown].rchild);
    }
}

int main(){
    int n;
    scanf("%d",&n);
    for(int i=0;i<n;i++){
        int l,r;
        scanf("%d%d",&l,&r);
        node[i].lchild=l;
        node[i].rchild=r;
    }
    for(int i=0;i<n;i++){
        scanf("%d",&integer[i]);
    }
    sort(integer,integer+n);
    inTraversal(0);
    BFS(0);
    return 0;
}
