void InorderTraversal( BinTree BT ){//递归算法，改变printf的位置可实现前中后序
	if(!BT) return;
	while (BT){
		InorderTraversal(BT->Left);
		printf(" %c", BT->Data);
		InorderTraversal(BT->Right);
	}
}
void PreorderTraversal( BinTree BT ){//非递归算法，改变printf的位置，可实现前中序
	if(!BT) return;
	BinTree T = BT;
	struct Stack{
		BinTree ch[100];
		int Top;
	}S;
	S.Top = -1;
	while(T || S.Top >= 0){
		while(T){
			S.Top++;
			printf(" %c", T->Data);
			S.ch[S.Top] = T;
			T = T->Left;
		}
		if(S.Top >= 0){
			T = S.ch[S.Top];
			S.Top--;
			T = T->Right;
		}
	}
}
void PostorderTraversal( BinTree BT ){
	if(!BT) return;
	enum State {start, reL, reR};
	typedef struct {
		enum State state;
		BinTree T;
	}StackElem;
	
	//模拟递归过程的非递归实现后序遍历
	StackElem item = {start,BT};
	struct Stack{
		StackElem items[100];
		int Top;
	}S;
	S.Top = -1;
	
	while(1){
		if(item.T){
			if(item.state == start){
				S.Top++;
				S.items[S.Top] = item;
				item.T = item.T->Left;
				item.state = start;
			}else if(item.state == reL){
				S.Top++;
				S.items[S.Top] = item;
				item.T = item.T->Right;
				item.state = start;
			}else{
				printf(" %c", item.T->Data);
				if(S.Top >= 0){
					item = S.items[S.Top];
					S.Top--;
					item.state++;
				}else{
					break;
				}
			}
		}else{
			if(S.Top >= 0){
				item = S.items[S.Top];
				S.Top--;
				item.state++;
			}else{
				break;
			}
		}
	}
}
void LevelorderTraversal( BinTree BT ){//用队实现非递归层级遍历
	if(!BT) return;
	BinTree T = BT;
	struct{
		BinTree ch[100];
		int front;
		int rear;
	}queue;
	
	queue.front = -1;
	queue.rear = -1;
	queue.front++;
	queue.ch[queue.front] = T;
	while(queue.front > queue.rear && queue.front < 100){
		queue.rear++;
		T = queue.ch[queue.rear];
		printf(" %c", T->Data);
		if(T->Left){
			queue.front++;
			queue.ch[queue.front] = T->Left;
		}
		if(T->Right){
			queue.front++;
			queue.ch[queue.front] = T->Right;
		}
	}
}	
