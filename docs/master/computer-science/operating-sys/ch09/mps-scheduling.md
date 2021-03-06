# 多处理机系统进程调度

## 评价进程调度性能的因素

- 任务流时间：即任务完成所需时间
- 调度流时间：系统上所有处理机上的任务流时间的总和
- 平均流：调度流时间/任务数，反应系统资源利用率
- 处理机利用率
- 加速比：各处理机忙时间之和/并行工作时间，各处理机忙时间之和也就是调度流时间，并行工作时间就是第一个任务开始到最后一个结束的时间
- 吞吐率：单位时间内系统完成的任务数，可用任务流的最小完成时度量

## 进程分配方式

### 对称多处理机系统中的进程分配方式

SMP 系统中的所有处理机都相同，可把所有的处理机作为一个处理机池（Processor pool），由调度程序或基于处理器的请求，将任何一个进程分配给池中的任何一个处理机去处理。

- 静态分配（Static Assigenment）方式：指一个进程从开始执行直到完成，都被固定分配到一个处理器上执行，每个处理器设置一个专用的就绪队列
- 动态分配（Dynamic Assignment）方式：在系统中设置一个公共的就绪队列，所有进程都放在该就绪队列上，分配进程时，可将进程分配到任何一个处理器上。

### 非对称多处理机系统中的进程分配方式

非对称 MPS 一般采用主从（MasterSlave）式 OS，即 OS 核心部分驻留在一台主机上，从机只用应用程序，进程调度由主机执行，主机持有一个就绪队列。每当从机空闲时，便向主机发送一求索进程信号。

## 进程（线程）调度方式

### 自调度（Self-Scheduling）方式

在系统中设置一个公共的进程（或线程）就绪队列，所有的处理器在空闲时，都可以自己到该队列中取得一进程（或线程）来运行。在自调度方式中，可采用单处理机环境下所用的调度算法，例如 FCFS、最高优先权（FPF）。

### 成组调度（Gang Scheduling）方式

将一个进程中的一组线程分配到一组处理器上去执行，避免线程被频繁切换。

有两种为应用程序分配处理器时间的方式。

- 面向所有应用程序平均分配处理器时间
- 面向所有线程平均分配处理机时间

### 专用处理机分配（Dedicated Processor Assignment）

在一个应用程序的执行期间，专门为该应用程序分配一组处理机，每个线程一个处理机。

### 动态调度方式

允许进程在执行期间动态改变其线程的数目，OS 负责把处理机分配给作业，作业负责将分配到的处理机再分配给自己的某一部分可运行任务。

## 死锁

在多处理机系统中，死锁可分为资源死锁和通信死锁（在分布式系统中，由于处于不同节点的进程，因发送和接收报文而竞争缓冲区引起的，即出现既不能发送又不能接收的状态）。

死锁的检测有两种

- 集中式检测：每台处理机上都有一张进程资源图，用于描述进程及其占有资源的状况。在负责控制的中心处理机上，配置一张整个系统的进程资源图，并设置一个检测进程负责整个系统的死锁检测。当检测进程检测到环路（检测进程需要再次向各个进程发出请求信息，对可能产生死锁的时间点进行确认）时，就选择终止环路中的一个进程以解决死锁。
- 分布式检测两种：通过系统中竞争资源的各个进程间相互协作，实现对死锁的检测。在每个节点中都设置一个死锁检测进程，在每个消息上附加逻辑时钟，并依次对请求和释放资源的消息进行排队，在一个进程对某资源操作前，必须先向所有其他进程发送请求信息，在获得这些进程的响应信息后，才把请求资源的消息发给该资源的管理进程。每个进程都要将资源已分配情况通知所有进程。

## ChangeLog

> 2018.10.05 初稿