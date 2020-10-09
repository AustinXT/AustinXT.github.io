#include <cstdio>
#include <algorithm>
using namespace std;
int n, p;
int ns[100010];

int main(){
    scanf("%d %d", &n, &p);
    for(int i=0; i<n; i++){
        scanf("%d", &ns[i]);
    }
    sort(ns,ns+n);
    int ans=1;
    for(int i=0; i<n; i++){
        int j=upper_bound(ns+i+1,ns+n,(long long) ns[i]*p)-ns;
        ans=max(ans,j-i);
    }
    printf("%d",ans);
    return 0;
}
