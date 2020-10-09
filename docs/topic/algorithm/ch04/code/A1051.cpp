#include <cstdio>
#include <stack>
using namespace std;

int main(){
    int m,n,k;
    scanf("%d%d%d",&m,&n,&k);
    int arr[1010];
    for(int i=1;i<=n;i++){
        arr[i]=i;
    }
    while(k--){
        stack<int> st;
        int pos=1;
        int test[1010];
        for(int i=0;i<n;i++){
            scanf("%d",&test[i]);
        }
        for(int i=0;i<n;i++){
            int tmp=test[i];
            while(st.size()<m && (st.empty() || st.top()!=tmp) && pos<=n){
                st.push(arr[pos++]);
            }
            if(st.top()==tmp){
                st.pop();
            }
            else if(st.size()==m || pos==n+1){
                printf("NO\n");
                break;
            }
        }
        if(st.empty()) printf("YES\n");
    }
    return 0;
}
