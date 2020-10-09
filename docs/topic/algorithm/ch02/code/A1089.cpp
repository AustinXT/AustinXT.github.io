#include <cstdio>
#include <algorithm>
using namespace std;

int n;
int a[110], b[110], c[110];

bool cmp(int an[], int bn[], int n){
    for(int i=0;i<n;i++){
        if(an[i]!=bn[i]) return 0;
    }
    return 1;
}

void print(int an[], int n){
    for(int i=0;i<n;i++){
        printf("%d", an[i]);
        if(i<n-1) printf(" ");
    }
}


bool insertSort(){
    bool flag=false;
    for(int i=1;i<n;i++){
        sort(a,a+i+1);
        if(flag){
            print(a,n);
            return flag;
        }
        if(cmp(a,b,n)){
            printf("Insertion Sort\n");
            flag=true;
        }
    }
    return flag;
}

void mergeSort(){
    bool flag=false;
    for(int step=2;step/2<n;step*=2){
        for(int i=0;i<n;i+=step){
            sort(c+i,c+min(i+step,n));
        }
        if(flag){
            print(c,n);
            break;
        }
        if(cmp(c,b,n)){
            printf("Merge Sort\n");
            flag=true;
        }
    }
}

int main(){
    scanf("%d",&n);
    for(int i=0;i<n;i++){
        scanf("%d",&a[i]);
        c[i]=a[i];
    }
    for(int i=0;i<n;i++){
        scanf("%d",&b[i]);
    }
    if(insertSort()==0){
        mergeSort();
    }
    return 0;
}
