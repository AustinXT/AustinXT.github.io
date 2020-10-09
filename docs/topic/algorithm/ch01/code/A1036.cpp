#include <cstdio>

struct stu
{
	char name[20];
	char gender;
	char id[20];
	int grade;
}fh, ml, tmp;

int main(int argc, char const *argv[])
{
	int n;
	scanf("%d", &n);
	bool m = false, f = false;
	fh.grade = -1;
	ml.grade = 101;
	for (int i = 0; i < n; ++i)
	{
		scanf("%s %c %s %d", tmp.name, &tmp.gender, tmp.id, &tmp.grade);
		if(tmp.gender == 'F'){
			f = true;
			if(tmp.grade > fh.grade)
				fh = tmp;
		}
		else
		{
			m = true;
			if (ml.grade > tmp.grade)
			{
				ml = tmp;
			}
		}
	}
	if (f)
		printf("%s %s\n", fh.name, fh.id);
	else
		printf("Absent\n");
	if(m)
		printf("%s %s\n", ml.name, ml.id);
	else
		printf("Absent\n");
	if(m && f)
		printf("%d", fh.grade-ml.grade);
	else
		printf("NA");
	return 0;
}