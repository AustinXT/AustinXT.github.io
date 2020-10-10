---
title: 二叉树的遍历算法
date: 2018-09-09
tags:
  - 算法
---

## 递归算法

```C
// 二叉树先序遍历、中序遍历、后序遍历的
void PreOrder(BTNode *b)
{
  if(b!=NULL){
    // 遍历的顺序取决于输出语句的位置
    printf("%c", b->data);
    PreOrder(b->lchild);
    PreOrder(b->rchild);
  }
}
```

## 非递归算法

### 二叉树先序遍历的非递归算法

```C
void PreOrder(BTNode *b)
{
  BTNode *St[MaxSize], *p;
  int top = -1;
  if(b!=NULL){
    top++;
    St[top] = b;
    while(top>-1){
      p = St[top];
      top--;
      printf("%c", p->data);
      if(p->rchild!=NULL){
        top++;
      St[top] = p->rchild;
      }
      if(p->lchild!=NULL){
        top++;
      St[top] = p->lchild;
      }
    }
    printf("\n");
  }
}
```

### 二叉树中序遍历的非递归算法

```C
void InOrder(BTNode *b)
{
  BTNode *St[MaxSize], *p;
  int top = -1;
  if(b!=NULL){
    p = b;
    while(p!=NULL || top>-1){
      while(p!=NULL){
        top++;
        St[top] = p;
        p = p->lchild;
      }
      if(top>-1){
        p = St[top];
        top--;
        printf("%c", p->data);
        p = p->rchild;
      }
    }
    printf("\n");
  }
}
```

### 二叉树后序遍历的非递归算法

```C
void PostOrder(BtNode *b){
  BTNode *St[Maxsize], *p;
  int top = -1, flag;
  if(b!=NULL){
    do{
      while(b!=NULL){
        top++;
        St[top] = b;
        b = b->lchild;
      }
      p = NULL;
      flag = 1;//访问栈顶元素
      while(top>-1 && falg){
        b = St[top];
        //b 的右孩子已经访问过或不存在有孩子，输出之
        if(b->rchild==p){
          printf("%c", b->data);
          top--;
          p = b;
        }else{
          flag = 0;
          b = b->rchild;
        }
      }
    }while(top>-1);
    printf("\n");
  }
}
```

## 二叉树层次遍历

```C
void LevelOrder(BTNode *b)
{
  BTNode *Qu[Maxsize], *p;
  int front = -1, rear = -1;
  if(b!=NULL){
    rear++;
    Qu[rear] = b;
    while(rear!=front){
      front = (front+1)%MaxSize;
      p = Qu[front];
      printf("%c", p->data);
      if(p->lchild!=NULL){
        rear = (rear+1)%MaxSize;
        Qu[rear] = p->lchild;
      }
      if(p->rchild!=NULL){
        rear = (rear+1)%MaxSize;
        Qu[rear] = p->rchild;
      }
    }
    printf("\n");
  }
}
```

## 二叉树构造

由先序和中序序列构造二叉树

```C
BTNode *CreateBT(char *pre, char *in, int n)
{
    BTNode *b;
    char *p;
    int k;
    if(n<=0)
        return NULL;
    b=(BTNode *)malloc(sizeof(BTNode));
    b->data=*pre;
    for(p=in;p<in+n;p++)
        if(*p==*pre)break;
    k=p-in;
    b->lchild=CreateBT(pre+1, in, k);
    b->rchild=CreateBT(pre+k+1,p+1,n-k-1);
    return b;
}
```

由后序和中序序列构造二叉树

```C
BTNode *CreateBT(char *post, char *in, int n)
{
    BTNode *b;
    char r, *p;
    int k;
    if(n<=0)return NULL;
    r=*(post+n-1);
    b=(BTNode *)malloc(sizeof(BTNode));
    b->data=r;
    for(p=in;p<in+n;p++)
        if(*p=r)break;
    k=p-in;
    b->lchild=CreateBT(post, in, k);
    b->rchild=CreateBT(post+k, p+1, n-k-1);
    return b;
}
```

#### 