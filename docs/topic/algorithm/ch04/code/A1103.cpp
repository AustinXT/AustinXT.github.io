#include <cstdio>
#include <vector>
#include <algorithm>
using namespace std;

int n,k,p,maxFacSum=-1;
vector<int> fac,ans,tmp; // ans=best fac, tmp=now fac

int power(int x){
    int ans=1;
    for(int i=0;i<p;i++){
        ans*=x;
    }
    return ans;
}

void init(){
    int i=0,tmp=0;
    while(tmp<=n){
        fac.push_back(tmp);
        tmp=power(++i);
    }
}

void DFS(int index,int nowk,int sum,int facsum){
    if(sum==n && nowk==k){
        if(facsum>maxFacSum){
            ans=tmp;
            maxFacSum=facsum;
        }
        return;
    }
    if(sum>n || nowk>k) return;
    if(index>=1){
        // choose index
        tmp.push_back(index);
        DFS(index,nowk+1,sum+fac[index],facsum+index);
        tmp.pop_back();
        // do not choose index
        DFS(index-1,nowk,sum,facsum);
    }
}

int main(){
    scanf("%d%d%d",&n,&k,&p);
    init();
    DFS(fac.size()-1,0,0,0);

    if(maxFacSum==-1) printf("Impossible\n");
    else{
        printf("%d = ",n);
        for(int i=0;i<k;i++){
            printf("%d^%d",ans[i],p);
            if(i<k-1) printf(" + ");
        }
    }
    return 0;
}
