---
title: 数组和稀疏矩阵
date: 2018-09-09
tags:
  - 算法
publish: false
mathjax: true
---

数组是由相同类型的数据元素构成的一个有序序列。数组按维来划分，对于 m（m大于等于1） 维数组，每个元素受到 m 个线性关系的约束，所以数组是线性表的推广。

n 维数组的数据元素存储位置的计算公式：

$$LOC(j_i,j_2,\dots ,j_n)\\=LOC(0,0,\dots ,0)+(b_2\dots b_nj_1+b_3\dots b_nj_2+\dots+b_nj_{n-1}+j_n)L\\=LOC(0,0,\dots ,0)+(\sum \limits_{i=1}^{n-1}j_i\prod \limits _{k=i+1}^nb_k+j_n)L\\=LOC(0,0,\dots ,0)+\sum \limits_{i=1}^nc_ij_i, \quad where\quad c_n=L, \quad c_{i-1}=b_ic_i,\quad1<i\leq n$$

稀疏矩阵是非零元素相对于所有元素总数十分小的阶数较大的矩阵。

### 稀疏矩阵的三元组表示法

数据类型定义

```C
#define MaxSize 100
typedef struct{
    int r; //行号
    int c; //列号
    ElemType d; //元素值
}Triple;
typedef struct{
    int rows;//行数
    int cols;//列数
    int nums;//非零元素个数
    Triple data[MaxSize];
} TSMatrix;
```

转置矩阵（复杂度O(rows*cols^2)）

```C
void TranTat(TSMatrix t, TSMatrix &tb) //tb 为 t 的转置矩阵
{
    int p, q=0,v;
    tb.rows=t.cols;
    tb.cols=t.rows;
    tb.nums=t.nums;
    if(t.nums!=0){
        for(v=0;v<t.cols;v++)
            for(p=0;p<t.nums;p++){
                if(t.data[p].c==v){
                    tb.data[q].r=t.data[p].c;
                    tb.data[q].c=t.data[p].r;
                    tb.data[q].d=t.data[p].d;
                    q++;
                }
            }
    }
}
```

快速转置（复杂度O(rows*cols)）

```C
void FastTranTat(TSMatrix t, TSMatrix &tb)
{
    int col, p, q, v;
    int num[t.cols+1], cpot[t.cols+1];
    tb.rows=t.cols;
    tb.cols=t.rows;
    tb.nums=t.nums;
    if(t.nums!=0){
        // 求 t 中每一列含非零元素的个数
        for(col=1;col<=t.cols;++col)
            num[col]=0;
        for(v=1;v<=t.nums;++t)
            num[t.data[v].c]++;
        // 求第 col 列中第一个非零元素在 tb.data 中的序号
        cpot[1] = 1;
        for(col=2;col<=t.cols;++col)
            cpot[col] = cpot[col-1] + num[col-1];
        for(p=1;p<=t.nums;++p){
            col = t.data[p].c;
            q = cpot[col];
            tb.data[q].r = t.data[p].c;
            tb.data[q].c = t.data[p].r;
            tb.data[q].d = t.data[p].d;
            ++cpot[col];
        }
    }
}
```

### 稀疏矩阵的行逻辑链接顺序表

为了便于随机存取任一行的非零元素，则需知道每一行的第一个非零元在三元组中是位置。

定义

```C
typedef struct{
    Triple data[MaxSize];
    int rpos[MaxSize]; //各行第一个非零元素的位置表
    int rows, cols, nums;
}RLSMatrix;
```

两稀疏矩阵相乘

```C
int MultSMatrix(RLSMatrix M, RLSMatrix N, RLSMatrix &Q)
{
    if(M.cols!=N.rows)
        return 0;
    Q.rows = M.rows;
    Q.cols = N.cols;
    Q.nums = 0;
    int arow, brow, tp, p, t, q, ccol;
    int ctemp[M.rows];
    if(M.nums*N.nums!=0){ // Q 是非零矩阵
        for(arow=1; arow<=M.rows; ++arow){
            ctemp[arow] = 0;
            Q.rpos[arow] = Q.nums + 1;
            if(arow<M.rows)
                tp = M.rpos[arow+1];
            else
                tp = M.nums + 1;
            // 对当前行中每个非零元
            for(p=M.rpos[arow];p<tp;++p){
                // 找到对应元在 N 中的行号
                brow = M.data[p].c;
                if(brow<N.rows)
                    t = N.rpos[brow+1];
                else
                    t.N.nums + 1;
                for(q=N.rpos[brow];q<t;++q){
                    // 乘积元素在 Q 中的列号
                    ccol = N.data[q].c;
                    ctemp[ccol] += M.data[p].d * N.data[q].d;
                }
            }// 求得 Q 中第 arow 行的非零元
            for(ccol=1;ccol<Q.cols;++ccol){
                if(ctemp[ccol]){
                    if(++Q.nums>MaxSize)
                        return 0;
                    Q.data[Q.nums].r = arow;
                    Q.data[Q.nums].c = ccol;
                    Q.data[Q.nums].d = ctemp[ccol];
                }
            }
        }
    }
    return 1;
}
```

### 稀疏矩阵的十字链表表示法

十字链表为稀疏矩阵的每一行和每一列设置一个单独的链表，即每个非零元素包含在两个链表里。

表节点和头节点的定义

```C
#define M 3
#define N 4
#define Max ((M)>(N)?(M):(N))
typedef struct mtxn{
    int row, col;
    struct mtxn *right, *down;
    union{
        int value;
        struct mtxn *link;
    }tag;
}MatNode;
```

