#include <stdio.h>
#include <stdlib.h>

#define MAXSIZE 5
#define ERROR -1
typedef enum {false, true} bool;
typedef int ElementType;
typedef int Position;
typedef struct LNode *List;
struct LNode {
    ElementType Data[MAXSIZE];
    Position Last; /* 保存线性表中最后一个元素的位置 */
};

List MakeEmpty(); 
Position Find( List L, ElementType X );
bool Insert( List L, ElementType X, Position P );
bool Delete( List L, Position P );

int main()
{
    List L;
    ElementType X;
    Position P;
    int N;

    L = MakeEmpty();
    scanf("%d", &N);
    while ( N-- ) {
        scanf("%d", &X);
        if ( Insert(L, X, 0)==false )
            printf(" Insertion Error: %d is not in.\n", X);
    }
    scanf("%d", &N);
    while ( N-- ) {
        scanf("%d", &X);
        P = Find(L, X);
        if ( P == ERROR )
            printf("Finding Error: %d is not in.\n", X);
        else
            printf("%d is at position %d.\n", X, P);
    }
    scanf("%d", &N);
    while ( N-- ) {
        scanf("%d", &P);
        if ( Delete(L, P)==false )
            printf(" Deletion Error.\n");
        if ( Insert(L, 0, P)==false )
            printf(" Insertion Error: 0 is not in.\n");
    }
    return 0;
}
List MakeEmpty()  
{  
    List L=(List)malloc(sizeof(struct LNode));
    L->Last=0;  
    return L;  
}  

Position Find( List L, ElementType X )  
{  
    for(int i=0;i<L->Last;i++)  
    {  
        if(L->Data[i]==X)  
            return i;  
    }  
    return ERROR;  
}  

bool Insert( List L, ElementType X, Position P )  
{  
    if(L->Last==MAXSIZE)  
    {  
        printf("FULL");  
        return false;  
    }  
    if(P>L->Last||P<0) 
    {  
        printf("ILLEGAL POSITION");  
        return false;  
    }  
    for(int i=L->Last;i>P;i--)  
    {  
        L->Data[i]=L->Data[i-1];  
    }  
    L->Last++;  
    L->Data[P]=X;  
    return true;  
}  

bool Delete( List L, Position P )  
{  
    if(P>=L->Last||P<0)  
    {  
        printf("POSITION %d EMPTY",P);  
        return false;  
    }  
    for(int i=P;i<L->Last-1;i++)  
        L->Data[i]=L->Data[i+1];  
    L->Last--;  
    return true;  
}  