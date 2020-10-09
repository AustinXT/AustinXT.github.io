#include <stdio.h>
#include <time.h>
#include <math.h>

clock_t start, stop;
/* clock_t 是clock()函数返回的变量类型*/
double duration;
/*duration单位为秒*/

#define MAXN 1000
double f1( int n, double a[], double x);
double f2( int n, double a[], double x);

int main()
{
	int i;
	double a[MAXN];
	for(i=0; i<MAXN; i++)
		a[i] = (double)i;

	start = clock();
	f1(MAXN-1, a, 1.1);
	stop = clock();
	duration = ((double)(stop - start))/CLOCKS_PER_SEC;
	printf("ticks1 = %f\n", (double)(stop - start));
	printf("duration1 = %6.2e\n", duration);
	
	start = clock();
	f2(MAXN-1, a, 1.1);
	stop = clock();
	duration = ((double)(stop - start))/CLOCKS_PER_SEC;
	printf("ticks2 = %f\n", (double)(stop - start));
	printf("duration2 = %6.2e\n", duration);

	return 0;
}

double f1( int n, double a[], double x )
{
	int i;
	double p = a[0], xx = 1;
	for (i = 0; i <= n; i++)
	{
		p += a[i] * xx;
		xx *=x;
	}
	printf("%f\n", p);
	return p;
}

double f2( int n, double a[], double x )
{
	int i;
	double p = a[n];
	for ( i=n; i>0; i--)
		p = a[i-1] + p*x;
	printf("%f\n", p);
	return p;
}