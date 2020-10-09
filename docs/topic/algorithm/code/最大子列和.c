#include <stdio.h>
#include <stdlib.h>


// 算法1 T(N)=O(N3)
int MaxSubsequence1(int a[], int n){
	int thisSum, maxSum = 0;
	for (int i = 0; i < n; ++i){// i是子列左端位置
		for (int j = i; j < n; ++j){// j是子列右端位置
			thisSum = 0;
			for ( int k = i; k < j; ++k){
				thisSum += a[k];
				if (thisSum > maxSum)
					maxSum = thisSum;
			}
		}
	}
	return maxSum;
}


// 算法2 T(N)=O(N2)
int MaxSubsequence2(int a[], int n){
	int thisSum, maxSum = 0;
	for (int i = 0; i < n; ++i){// i是子列左端位置
		thisSum = 0;
		for ( int j = i; j < n; ++j){// j是子列右端位置
			thisSum += a[j];
			if ( thisSum > maxSum)
				maxSum = thisSum;
		}
	}
	return maxSum;
}


// 算法3 T(NlogN) 分而治之

int max3(int a, int b, int c){// 返回三个数中最大的
	return a>b?a>c?a:c:b>c?b:c;
}

int devideAddConquer(int list[], int left, int right){
	// 分而求list[left]到list[right]的最大子列和
	int maxLeftSum, maxRightSum;// 存放左右子问题的解
	int maxLeftBorderSum, maxRightBorderSum;// 存放跨分界线的解
	int leftBorderSum, rightBorderSum;
	int center, i;

	if (left == right){// 递归的终止条件
		if(list[left] > 0){
			return list[left];
		} else {
			return 0;
		}
	}

	// 分
	center = (left + right) / 2;
	// 递归求左右两边子列的最大和
	maxLeftSum = devideAddConquer(list, left, center);
	maxRightSum = devideAddConquer(list, center+1, right);
	// 求跨分界线的最大子列和
	maxLeftBorderSum = 0;
	leftBorderSum = 0;
	// 从中线向左扫描
	for (i = center; i >= left; --i){
		leftBorderSum += list[i];
		if (leftBorderSum > maxLeftBorderSum){
			maxLeftBorderSum = leftBorderSum;
		}
	}
	// 从中线向右扫描 
	maxRightBorderSum = 0;
	rightBorderSum = 0;
	for (i = center+1; i < right; ++i){
		rightBorderSum += list[i];
		if (rightBorderSum > maxRightBorderSum){
			maxRightBorderSum = rightBorderSum;
		}
	}
	return max3(maxLeftSum, maxRightSum, maxLeftBorderSum + maxRightBorderSum);
}

int MaxSubsequence3(int a[], int n){// 分而求和接口
	return devideAddConquer(a, 0, n-1);
}


//算法4 T(N) 在线处理
int MaxSubsequence4(int a[], int n){
	int thisSum, maxSum = 0;
	for (int i = 0; i < n; ++i){
		thisSum += a[i];
		if (thisSum > maxSum){
			maxSum = thisSum;
		}else if (thisSum < 0){
			thisSum = 0;
		}
	}
	return maxSum;
}

int main(){
	int arrlen;
	int *arr;
	scanf("%d", &arrlen);
	arr = (int *)malloc(arrlen * sizeof(int));
	for (int i = 0; i < arrlen; ++i){
		scanf("%d", &arr[i]);
	}
//	printf("%d\n", MaxSubsequence1(arr, arrlen));
//	printf("%d\n", MaxSubsequence2(arr, arrlen));
//	printf("%d\n", MaxSubsequence3(arr, arrlen));
	printf("%d\n", MaxSubsequence4(arr, arrlen));
	free(arr);

	return 0;
}