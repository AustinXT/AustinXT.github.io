# 进程同步机制

### 两种形式的制约关系 

- 间接相互制约关系：多个程序在并发执行时，由于共享系统资源，如CPU、 I/ 设备等，致使在这些并发执行的程序之间形成相互制约的关系。
- 直接相互制约关系：某些应用程序，为了完成某任务而建立了两个或多个进程。

### 临界区(critical section) 

人们把在每个进程中访问临界资源的那段代码称为临界区(critical section)。 显然若能保证诸进程互斥地进入自己的临界区，便可实现诸进程对临界资源的互斥访问。因此，必须在临界区前面增加一段用于检查对欲访问的临界资源是否正被访问的代码，把这段代码称为进入区(entry section)。相应地，在临界区后面也要加上一段称为退出区(exit section)的代码，用于将临界区正被访问标志恢复为未被访问的标志。进程中除上述进入区、临界区及退出区之外的其它部分的代码在这里都称为剩余区。这样，可把一个访问临界资源的循环进程描述如下： 

```c
while(True){
    // 进入区
    // 临界区
    // 退出去
    // 剩余区
}
```

### 同步机制应遵循的规则 

所有同步机制都应遵循下述四条准则： 

- 空闲让进
- 忙则等待
- 有限等待：对欲访问临界资源的进程，应保证在有限的时间内能进入自己的临界区。
- 让权等待：当进程不能进入临界区时，应立即释放处理机。

## 硬件同步机制

一下三种硬件指令能有效实现进程互斥，但不符合「让权等待」原则。

### 关中断

在进入锁测试之前关闭中断，知道完成锁测试并上锁之后才能打开中断，保证锁测试和关锁操作的连续性。

不过关中断方法有很大缺陷：

- 滥用关中断可能导致严重后果
- 关中断时间过长，影响系统效率
- 不适用于多 CPU 系统

### 利用 Test-and-Set 指令实现互斥

利用 TS 指令实现互斥的循环进程结构：

```
// 为每个临界资源设置一个全局的布尔变量 lock
boolean lock = False;

boolean TS(boolean *lock){
    boolean old = *lock;
    *lock = True; // *lock 为 True 时，表示资源正在被使用
    return old;
}

do{
    while TS(&lock);
    critical section;
    lock = False;
    remainder section;
}while(True);
```

### 利用 Swap 指令实现进程互斥

```
// 为每个临界资源设置一个全局的布尔变量 lock
boolean lock = False;

void swap(boolean *a, boolean *b){
    boolean temp = *a;
    *a = *b;
    *b = temp;
}

do{
    boolean key = True;
    do{
        swap(&lock, &key);
    }while(key!=False);
    critical section;
    lock = False;
}while(True);
```

## 信号量机制

1965年，Dijkstra 提出信号量（Semaphores）机制，并持续发展。

### 整型信号量

整型信号量是一个用于表示资源数目的整形量 S，除初始化外，它仅能通过两个标准原子操作（Atomic Operation）wait(S) 和 signal(S) 访问，简称 P 和 V 操作。

```
wait(S){
    while(S<=0); // 处于忙等状态
    S--;
}
signal(S){
	S++;
}
```

### 记录型信号量

相比于整型信号量增加一个进程链表指针 list

```
typedef struct{
    int value;
    // list 用于所有等待进程
    struct process_control_block *list;
}semaphore;

wait(semaphore *S){
    S->value--;
    // 阻塞进程，放弃处理机
    if(S->value<0)block(S->list);
}
signal(semaphore *S){
    S->value++;
    // 将 S->list 链表的第一个等待进程唤醒
    if(S->value<=0)wakeup(S->list);
}
```

#### 生产者消费者问题

在生产者和消费者之间设置了一个具有n个缓冲区的缓冲池，生产者进程将其所生产的产品放入一个绥冲区中；消费者进程可从一个缓冲区中取走产品去消费。可利用一个数组 buffer 来表示缓冲池。此外，还引入一个整型变量counter，其初始值为0。每当生产者进程向缓冲池中投放（或取走)一个产品后，使counter加1(或减1）。

```
int in=0, out=0;
item buffer[n];
// mutex 用以实现互斥，empty 和 full 分别表示空缓冲区数和满缓冲区数
semaphore mutex=1, empty=n, full=0;
void producer(){
    do{
        producer an item nextp;
        wait(empty);
        wait(mutex)；
        buffer[in]=nextp;
        in=(in+1)%n;
        signal(mutex);
        signal(full);
    }while{True};
}
void consumer(){
    do{
        wait(full);
        wait(mutex);
        nextc=buffer[out];
        out=(out+1)%n;
        signal(mutex);
        signal(empty);
        consumer the item in nextc;
    }while(True);
}

void main(){
	cobegin
		producer();
		consumer();
	coend
}
```

### AND 型信号量

AND 型信号量适用于一个进程需要获得多个共享资源的情况。

```
Swait(S1,S2,...,Sn){
    while(True){
        if(S1>=1&&S2>=1&&...&&Sn>=1){
            for(i=1; i<=n; i++)Si++;
            break;
        }
        else{
            // 阻塞进程进入与第一个小于0的Si对应阻塞队列
        }
    }
}
Ssignal(S1,S2,...,Sn){
    while(True){
        for(int i=1; i<=n; i++){
            Si++;
            将与以上Si对应的阻塞队列转为就绪队列
        }
    }
}
```

#### 哲学家进餐问题

圆桌坐着五位哲学家，每位哲学家之间放置一只筷子，他们一边思考一边用餐，如何避免五位哲学家同时都只拿一只筷子而无法吃菜，即死锁？

```
semaphore chopstick[5]={1,1,1,1,1};
do{
    // think
    Swait(chopstick[(i+1)%5], chopstick[i]);
    // eat
    Signal(chopstick[(i+1)%5, chopstick[i]]);
}while(True);
```

### 信号量集

信号量集适用于一个进程一次需要多个某类临界资源的情形

设进程对资源的需求值为 d，资源分配的下限为 t，则相应的 Swait 和 Ssignal 格式为

- Swait(S1,t1,d1,...,Sn,tn,dn); 
- Ssignal(S1,d1,...,Sn,dn); 

常用的有：

- Swait(S,d,d)，进程需要 d 个信号量 S，当S≥d 时，给予分配；否则不分配
- Swait(S,1,0)，当 S≥1 时，允许进程进入某一特定区域，否则拒绝进入某一区域

信号量机制需要每个访问临界资源的进程都需要自备同步操作 wait(S) 和 signal(S)，会导致系统管理麻烦，而且容易导致系统死锁。

#### 读者-写者问题

读可以多个同时读，写只能一个在写，而且读写不能同时进行。

```
int RN // 最多允许同时读的个数
semaphore L=RN, mx=1; // L 为信号量
void Reader(){
    do{
        Swait(L,1,1);
        Swait(mx,1,0);
        // read
        Ssignal(L,1);
    }while(True);
}
void Writer(){
    do{
        Swait(mx,1,1;L,RN,0);
        // write
        Ssignal(mx,1);
    }while(True);
}
void main(){
    cobegin
    	Reader(); Writer();
    coend
}
```

## 管程机制

由于共享资源可由共享数据结构抽象表示，可将进程对共享数据结构实施的申请、释放等操作定义为一组过程，由以上共享数据结构和对特定共享数据结构实施特定操作的一组过程组成的资源管理程序就是管程（一个 OS 资源管理模块）。对于请求访问共享资源的诸多并发进程，可根据资源的情况接受和阻塞，确保每次仅有一个进程进入管程，执行这组过程，使用共享资源，实现互斥。

### 管程结构

管程由四部分组成：

- 管程名称
- 局部于管程的共享数据结构说明
- 对该数据结构进行操作的一组过程
- 对局部于管程的共享数据初始化语句

```
Monitor monitor_name{ // 管程名
	share variable declarations; // 共享变量说明
	cond declarations; // 条件变量说明
	public:
	viod P1(){}
	...
	viod Pn(){}
	
	{ // 管程主体
        initialization code; // 初始化代码
	}
}
```

### 条件变量

条件变量用来解决一个进程在管程中被阻塞或挂起而为释放管程的情形。管程中设置多个条件变量对应多个被阻塞或挂起的原因，每个条件变量保存一个链表记录所有被该原因阻塞的所有进程，对条件变量的操作只有 wait 和 signal。

当正在调用管程的进程因 x 条件被阻塞或挂起时，该进程将调用 x.wait 将自己插入到 x 条件的等待队列中，并释放管程。

当正在调用管程的进程发现 x 条件发生变化时，该进程将执行 x.signal 唤醒一个进程，根据具体规定选择当下调用管程的进程或被唤醒的进程调用管程。

#### 生产者-消费者问题

```
Monitor producerconsumer{
    item buffer[N];
    int in, out;
    condition notfull, notempty;
    int count;
    public:
    void put(item x){
        if(count>N)cwait(notfull);
        buffer[in]=x;
        in=(in+1)%N;
        count++;
        csignal(notempty);
    }
    void get(item x){
        if(count<=0)cwait(notempty);
        x=buffer[out];
        out=(out+1)%N;
        count--;
        csignal(notfull);
    }
    {in=0;out=0;count=0;}
}PC;

void producer(){
    item x;
    while(True){
        // produce an item in nextp
        PC.put(x);
    }
}
void consumer(){
    item x;
    while(True){
        PC.get(x);
        // consume the item in nextc
    }
}

void main(){
    cobegin
    	producer(); consumer();
    coend
}
```

## ChangeLog

> 2018.08.19 初稿