#include <cstdio>
#include <algorithm>

using namespace std;
int n, m;
int a[100010];
int sum[100010];
int cmp(int i, int mid){
    int ans=sum[mid]-sum[i]+a[i];
    if(ans==m) return 0;
    else if(ans<m)return -1;
    else return ans-m;
}

int print(){
    int flag=1000;
    int a,b;
    for(int i=0;i<n;i++){
        a=i;
        b=n-1;
        int mid, state;
        while(a<=b){
            mid=(a+b)/2;
            state=cmp(i, mid);
            if(state==-1) a=mid+1;
            else if(state>0){
                b=mid-1;
                if(flag>state) flag=state;
            }
            else{
                printf("%d-%d\n", i+1,mid+1);
                flag=0;
                break;
            }
        }
    }
    return flag;
}

int main(){
    scanf("%d%d",&n, &m);
    int tmp=0;
    for(int i=0;i<n;i++){
        scanf("%d", &a[i]);
        tmp+=a[i];
        sum[i]=tmp;
    }
    int delta=print();
    if(delta>0){
        m+=delta;
        print();
    }
}
