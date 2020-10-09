#include <cstdio>
#include <cstring>
#include <algorithm>
using namespace std;

struct Cars{
	char name[10];
	int pt; // total parking time
	int st; // start time point
	bool s; // situation, true = in
};

bool cmp(Cars a, Cars b){
	if(strcmp(a.name, b.name) != 0)
		return strcmp(a.name, b.name) < 0;
	else
		return a.st < b.st;
}

bool cmptime(Cars a, Cars b){
	if(a.pt == b.pt)
		return strcmp(a.name, b.name) < 0;
	else
		return a.pt > b.pt;
}

int main(int argc, char const *argv[])
{
	int n, m;
	scanf("%d %d", &n, &m);
	struct Cars car[n];
	char in[5] = "in";
	int i;
	for (i = 0; i < n; ++i){
		int hh, mm, ss, time;
		char situation[5];
		scanf("%s %d:%d:%d %s", car[i].name, &hh, &mm, &ss, situation);
		time = hh * 3600 + mm * 60 + ss;
		car[i].st = time;
		if(strcmp(situation, in)==0)
			car[i].s = true;
		else
			car[i].s = false;
	}
	sort(car, car+n, cmp);

	for (int j = 0; j < m; ++j){
		int hh, mm, ss;
		int tp; // time point
		int carscount = 0;
		scanf("%d:%d:%d", &hh, &mm, &ss);
		tp = hh * 3600 + mm * 60 + ss;
		for (i = 1; i < n; ++i){
			if(strcmp(car[i].name, car[i-1].name)==0 && car[i-1].s && !car[i].s && car[i-1].st<=tp && car[i].st>tp)
				carscount++;
		}
		printf("%d\n", carscount);
	}

	struct Cars rc[n]; // record car
	int count = 0;
	i = 0;
	strcpy(rc[count].name, car[0].name);
	rc[count].pt = 0;
	for (i = 1; i < n; ++i){
		if(strcmp(car[i].name, car[i-1].name) == 0){
			if(car[i-1].s && !car[i].s){
				rc[count].pt += car[i].st - car[i-1].st;
			}
		}else{
			count++;
			strcpy(rc[count].name, car[i].name);
			rc[count].pt = 0;
		}
	}
	sort(rc, rc+count+1, cmptime);
	i = 0;
	while(rc[i].pt == rc[i+1].pt){
		printf("%s ", rc[i].name);
		i++;
	}
	printf("%s %02d:%02d:%02d", rc[i].name, rc[i].pt/3600, rc[i].pt/60%60, rc[i].pt%60);
	return 0;
}