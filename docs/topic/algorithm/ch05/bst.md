---
title: 二叉查找树
date: 2018-09-09
tags:
  - 算法
---

## 定义

二叉查找树的递归定义：

- 二叉查找树是一棵空树
- 或者二叉查找树由根节点、左子树、右子树组成，其中左子树和右子树都是二叉查找树，且左子树所有节点的数据域均小于或等于根节点的数据域，左子树所有节点的数据域均大于根节点的数据域。

## 基本操作

### 查找元素

```C
void search(node* root, int x){
    if(root=NULL){
        printf("search failed\n");
        return;
    }
    if(x==root->data) printf("%d\n",root->data);
    else if(x<root->data) search(root->lchild,x);
    else search(root->right,x);
}
```

### 插入元素

```C
void insert(node* &root, int x){
    if(root==NULL){
        root=newNode(x);
        return;
    }
    if(x==root->data) return; // 节点已存在
    else if(x<root->data) insert(root->lchild,x);
    else insert(root->right,x);
}
```

### 建立二叉查找树

```C
node* Create(int data[], int n){
    node* root=NULL;
    for(int i=0;i<n;i++){
        insert(root,data[i]);
    }
    return root;
}
```

### 删除节点

```C
node* findMax(node* root){
    while(root->rchild!=NULL){
        root=root->rchild;
    }
    return root;
}
node* findMin(node* root){
    while(root->lchild!=NULL){
        root=root->lchild;
    }
    return root;
}
```

```C
void deleteNode(node* &root, int x){
    if(root==NULL) return;
    if(root->data==x){
        if(root->lchild==NULL && root->rchild==NULL)
            root=NULL;
        else if(root->lchild!=NULL){
            node* pre=findMax(root->lchild);
            root->data=pre->data;
            deleteNode(root->lchild,pre->data);
        }else{
            node* next=findMin(root->right);
            root->data=next->data;
            deleteNode(root->rchild,next->data);
        }
    }
    else if(root->data>x) deleteNode(root->lchild,x);
    else deleteNode(root->right,x);
}
```

