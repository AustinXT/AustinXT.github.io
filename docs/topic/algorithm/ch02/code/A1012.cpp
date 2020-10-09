#include <cstdio>
#include <algorithm>
#include <cstring>
using namespace std;

struct Student
{
	char id[10];
	int c, m, e;
	double a;
	int cr, mr, er, ar, br;
	char b;
};

bool cmpc(Student a, Student b){
	return a.c > b.c;
}
bool cmpm(Student a, Student b){
	return a.m > b.m;
}
bool cmpe(Student a, Student b){
	return a.e > b.e;
}
bool cmpa(Student a, Student b){
	return a.a > b.a;
}

int main(int argc, char const *argv[])
{
	int n, m;
	scanf("%d %d", &n, &m);
	struct Student s[n];
	for (int i = 0; i < n; ++i)
	{
		scanf("%s %d %d %d", s[i].id, &s[i].c, &s[i].m, &s[i].e);
		s[i].a = (s[i].c+s[i].m+s[i].e)/3;
	}

	sort(s, s+n, cmpa);
	s[0].ar = 1;
	for (int i = 1; i < n; ++i)
	{
		s[i].ar = i+1;
		if(s[i].a == s[i-1].a)
			s[i].ar = s[i-1].ar;
	}
	sort(s, s+n, cmpc);
	s[0].cr = 1;
	for (int i = 1; i < n; ++i)
	{
		s[i].cr = i+1;
		if(s[i].c == s[i-1].c)
			s[i].cr = s[i-1].cr;
	}
	sort(s, s+n, cmpm);
	s[0].mr = 1;
	for (int i = 1; i < n; ++i)
	{
		s[i].mr = i+1;
		if(s[i].m == s[i-1].m)
			s[i].mr = s[i-1].mr;
	}
	sort(s, s+n, cmpe);
	s[0].er = 1;
	for (int i = 1; i < n; ++i)
	{
		s[i].er = i+1;
		if(s[i].e == s[i-1].e)
			s[i].er = s[i-1].er;
	}

	for (int i = 0; i < n; ++i)
	{
		if(s[i].ar<=s[i].cr && s[i].ar<=s[i].mr && s[i].ar<=s[i].er){
			s[i].br = s[i].ar;
			s[i].b = 'A';
		}
		else if(s[i].cr<=s[i].mr && s[i].cr<=s[i].er){
			s[i].br = s[i].cr;
			s[i].b = 'C';
		}
		else if(s[i].mr<=s[i].er){
			s[i].br = s[i].mr;
			s[i].b = 'M';
		}else{
			s[i].br = s[i].er;
			s[i].b = 'E';
		}
	}

	for (int i = 0; i < m; ++i)
	{
		char id[10];
		scanf("%s", id);
		bool flag = true;
		for (int j = 0; j < n; ++j)
		{
			if(strcmp(id, s[j].id) == 0){
				printf("%d %c\n", s[j].br, s[j].b);
				flag = false;
			}
		}
		if(flag)
			printf("N/A\n");
	}
	return 0;
}