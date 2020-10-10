---
title: 平衡二叉树
date: 2018-09-09
tags:
  - 算法
---

## 定义

左右子树的高度差称为该节点的平衡因子，每个节点的平衡因子都不超过1的二叉树称为平衡二叉树（AVL），其高度能始终保持 O(logn) 级别。

### 数据结构

```C
// 节点数据结构
struct node{
    int data,height;
    node *lchild, *rchild;
};
```

```C
// 新建节点
node* newNode(int v){
    node* Node=new node;
    Node->data=v;
    Node->height=1;
    Node->lchild=Node->rchild=NULL;
    return Node;
}
```

```C
// 获取当前节点高度
int getHeight(node* root){
    if(root==NULL) return 0;
    return root.height;
}
```

```C
// 计算当前节点的平衡因子
int getBalanceFactor(node* root){
    return getHeight(root->lchild)-getHeight(root->rchild);
}
```

```C
// 更新当前节点的 height
void updateHeight(node* root){
    root->height=max(root->lchild->height,
                     root->rchild->height)+1;
}
```

## 基本操作

### 查找元素

```C
void search(node* root, int x){
    if(root==NULL){
        printf("search failed\n");
        return;
    }
    if(x==root->data) printf("%d\n",root->data);
    else if(x<root->data) search(root->lchild,x);
    else search(root->rchild,x);
}
```

### 插入元素

```C
// 左旋
void L(node* &root){
    node* tmp=root->rchild;
    root->rchild=tmp->lchild;
    tmp->lchild=root;
    updateHeight(root);
    updateHeight(tmp);
    root=tmp;
}
```

```C
// 右旋
void R(node* &root){
    node* tmp=root->lchild;
    root->lchild=tmp->rchild;
    tmp->rchild=root;
    updateHeight(root);
    updateHeight(tmp);
    root=tmp;
}
```

| 树形  |            判定条件             |        调整方法         |
| :---: | :-----------------------------: | :---------------------: |
|  LL   |  BF(root)=2,BF(root->lchild)=1  |         R(root)         |
|  LR   | BF(root)=2,BF(root->lchild)=-1  | L(root->lchild),R(root) |
|  RR   | BF(root)=-2,BF(root->rchild)=-1 |         L(root)         |
|  RL   | BF(root)=-2,BF(root->rchild)=1  | R(root->rchild),L(root) |

```C
// 插入元素
void insert(node* &root, int v){
    if(root==NULL){
        root=newNode(v);
        return;
    }
    if(v<root->data){
        insert(root->lchild,v);
        updateHeight(root);
        if(getBalanceFactor(root)==2){
            if(getBalanceFactor(root->lchild)==1) R(root);
            else if(getBalanceFactor(root->lchild==-1)){
                L(root->lchild);
                R(root);
            }
        }
    }
    else{
        insert(root->rchild,v);
        updateHeight(root);
        if(getBalanceFactor(root)==-2){
            if(getBalanceFactor(root->rchild)==-1) L(root);
            else if(getBalanceFactoe(root->rchild)==1){
                R(root->rchild);
                L(root);
            }
        }
    }
}
```

### AVL 建立

```C
node* Create(int data[], int n){
    node* root=NULL;
    for(int i=0;i<n;i++){
        insert(root,data[i]);
    }
    return root;
}
```



	