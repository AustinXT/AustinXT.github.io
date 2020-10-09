#include <cstdio>
#include <queue>
using namespace std;
int post[30], in[30];
struct Node{
    int data;
    Node *lchild, *rchild;
};

Node* create(int postL, int postR, int inL, int inR){
    if(postL>postR) return NULL;
    Node* root=new Node;
    root->data=post[postR];
    int k=inL;
    while(in[k]!=root->data){
        k++;
    }
    int numLeft=k-inL;
    root->lchild=create(postL,postL+numLeft-1,inL,k-1);
    root->rchild=create(postL+numLeft,postR-1,k+1,inR);
    return root;
}

void BFS(Node* root){
    if(root==NULL) return;
    queue<Node*> q;
    q.push(root);
    bool flag=false;
    while(!q.empty()){
        Node* node=q.front();
        q.pop();
        if(flag) printf(" ");
        printf("%d",node->data);
        flag=true;
        if(node->lchild!=NULL) q.push(node->lchild);
        if(node->rchild!=NULL) q.push(node->rchild);
    }
    return;
}

int main(){
    int n;
    scanf("%d",&n);
    for(int i=0;i<n;i++){
        scanf("%d",&post[i]);
    }
    for(int i=0;i<n;i++){
        scanf("%d",&in[i]);
    }
    Node *root=create(0,n-1,0,n-1);
    BFS(root);
    return 0;
}
