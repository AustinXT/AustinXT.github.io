#include <stdio.h>
#include <stdlib.h>

typedef struct PolyNode *Polynomial;
struct PolyNode{
	int coef;
	int expon;
	Polynomial link;
};

Polynomial ReadPoly();
Polynomial Mult(Polynomial P1, Polynomial P2);
Polynomial Add(Polynomial P1, Polynomial P2);
void PrintPoly(Polynomial P);
void Attach(int c, int e, Polynomial *pRear);

int main (int argc, char const *argv[]){
	Polynomial P1, P2, PS, PP;
	
	P1 = ReadPoly();
	P2 = ReadPoly();
	PP = Mult(P1, P2);
	PrintPoly(PP);
	PS = Add(P1, P2);
	PrintPoly(PS);
	
	return 0;
}

Polynomial ReadPoly(){
	Polynomial P, Rear, t;
	int n, c, d;
	scanf("%d", &n);
	P = (Polynomial)malloc(sizeof(struct PolyNode));
	P->link = NULL;
	Rear = P;
	while(n--){
		scanf("%d %d", &c, &d);
		Attach(c, d, &Rear);
	}
	t = P; P = P->link; free(t);
	return P;
}

Polynomial Mult(Polynomial P1, Polynomial P2){
	if(!P1 || !P2)return NULL;

	Polynomial PP, t1 = P1, t2 = P2, P, Rear, t;
	P = (Polynomial)malloc(sizeof(struct PolyNode));
	P->link = NULL;
	Rear = P;

	while(t2){
		Attach(t1->coef * t2->coef, t1->expon + t2->expon, &Rear);
		t2 = t2->link;
	}
	t = P; P = P->link;
	PP = Add(P, NULL);

	t1 = t1->link;
	while(t1){
		t2 = P2;
		while(t2){
			P->coef = t1->coef * t2->coef;
			P->expon = t1->expon + t2->expon;
			t2 = t2->link;
			P = P->link;
		}
		P = t->link;
		PP = Add(PP, P);
		t1 = t1->link;
	}
	free(t);

	return PP;
}

Polynomial Add(Polynomial P1, Polynomial P2){
	Polynomial t1 = P1, t2 = P2, P, Rear, t;
	P = (Polynomial)malloc(sizeof(struct PolyNode));
	P->link = NULL;
	Rear = P;
	while(t1&&t2){
		if(t1->expon == t2->expon){
			if(t1->coef+t2->coef != 0){
				Attach(t1->coef+t2->coef, t1->expon, &Rear);
				t1 = t1->link; t2 = t2->link;
			}
		}else if(t1->expon > t2->expon){
			Attach(t1->coef, t1->expon, &Rear);
			t1 = t1->link;
		}
		else{
			Attach(t2->coef, t2->expon, &Rear);
			t2 = t2->link;
		}
	}
	while(t1){
		Attach(t1->coef, t1->expon, &Rear);
		t1 = t1->link;
	}
	while(t2){
		Attach(t2->coef, t2->expon, &Rear);
		t2 = t2->link;
	}
	t = P; P = P->link; free(t);
	return P;
}

void PrintPoly(Polynomial P){
	int flag = 0;
	if(!P){
		printf("0 0\n");
		return;
	}
	while(P){
		if(!flag) flag = 1;
		else printf(" ");
		printf("%d %d", P->coef, P->expon);
		P = P->link;
	}
	printf("\n");
}

void Attach(int c, int e, Polynomial *pRear){
	Polynomial P = (Polynomial)malloc(sizeof(struct PolyNode));
	P->coef = c;
	P->expon = e;
	P->link = NULL;
	(*pRear)->link = P;
	*pRear = P;
}