# TCP 和 UDP 的区别？


## 什么是 TCP？

全称 Transmission Control Protocol，是一种传输层协议（为两个主机中进程之间的通信提供服务）。

TCP 是面向连接接的协议，发送数据前先建立连接，在发送方和接收方完成数据交换之前，连接会一直保持着。

面向连接的服务有一下几个特征：

1.  建立一条虚拟信道（比如 3 次握手）
2.  使用排序
3.  使用确认
4.  使用流量控制（比如缓冲、窗口机制和拥堵避免）

TCP 工作流程简单讲是，发送方从应用层收集数据，拆分成多个数据包，为每个数据包分配一个编号，然后将这些数据包发送到接收方；同样，在数据包发送到接收方应用层之前，会重新组合数据包。接收方会给发送方提供一条数据包的确认消息（是或否），同时有错误检查和恢复体系保证数据包顺序一致。

TCP 支持全双工服务器，即当接收者，又当发送者。

### TCP 的报文格式

![https://xieting-img.oss-cn-hangzhou.aliyuncs.com/20221013183728.png](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/20221013183728.png)

1.  源/目标端口（Source/Destination Port）：用于多路复用或者分解来自（送到）上层的数据。
2.  序列号（Sequence Number）：在连接建立时由计算机计算出的初始值，通过 SYN 包传给对端主机，每发送一次新的数据包，就累加一次该序列号的大小。用来解决网络包乱序问题。
3.  确认号（Acknowledgement Number）：指下次期望收到的序列号，发送端收到这个确认应答以后可以确认`确认应答号-1`的数据包已经被正常接收。
4.  首部长度（即数据偏移量）：给出报文头中 32 bit（位）的数目，4 位可表示 15 个数字，32bit（字）=4B（字节），所有 TCP 首部最多 15\*4=60 字节
5.  控制标志，6 位，每个一位，0 或 1
    1.  URG：为 1 表示紧急指针有效，为 0 则忽略紧急指针值
    2.  ACK：为 1 表示确认号有效，为 0 表示报文中不包含确认信息，忽略确认号字段
    3.  PSH：为 1 表示是带有 PUSH 标志的数据，指示接收方应该尽快将这个报文段交给应用层而不用等待缓冲区装满
    4.  RST：用于复位由于主机崩溃或其他原因而出现错误的连接。它还可以用于拒绝非法的报文段和拒绝连接请求。一般情况下，如果收到一个 RST 为 1 的报文，那么一定发生了某些问题
    5.  SYN：同步序号，为 1 表示连接请求，用于建立连接和使顺序号同步（ synchronize ）
    6.  FIN：用于释放连接，为 1 表示发送方已经没有数据发送了，即关闭本方数据流

### TCP 建立连接（三次握手）

![Untitled](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/jsljfljlwfejjwfp.png)

简单讲：

1.  客户端告诉服务端它可以发送
2.  服务端告诉客户端它能收到信息
3.  客户端告诉服务端它能收到反馈

## 什么是 UDP？

全称 User Datagram Protocol，用户数据报协议，提供一种尽力而为的数据传输，接收方不生成数据包的确认。

UDP 不保证数据包的有序传递。它是无状态的，不提供任何拥塞控制机制，到达一个网络节点不会缓存，直接发送到下一个网络节点。

## TCP 与 UDP 区别？

1.  UDP 是一种无连接协议，而 TCP 是一种面向连接的协议，具体是 4 个特征的区别（连接、有序、确认和流量控制）。
2.  错误检查：TCP 中有广泛的错误检查规则，而 UDP 中只有基本的错误检查技术，例如校验和。
3.  边界性区别：TCP 属于无边界的字节流协议，发送方连续发送数据包，是有边界的，接收方在缓存允许的大小接收；而 UDP 是有边界的报文协议，数据在添加首部后就交付给 IP 层，在到达接收方时验证其完整性。
4.  广播：TCP 不支持广播，UDP 支持。
5.  总的来说，UDP 是一种更快、更简单、开销更小的协议。但不一定，比如 TCP 的缓存机制会将数据填充到整个网段，最大利用带宽；而 UDP 沿路发送，可能会堵塞网络。
6.  用例：TCP 被用于 HTTPS（安全超文本传输协议）、HTTP（超文本传输协议）、SMTP（简单邮件传输协议）、FTP（文件传输协议）等等。UDP 用于视频流、视频电话、IP 语音服务（互联网呼叫）、DNS（域名系统）等。

## Ref

- [【TCP/IP】TCP 协议的流程图解 - 周二鸭 - 博客园](https://www.cnblogs.com/jojop/p/14111160.html)
- [TCP vs UDP——哪个协议更快？](https://chinese.freecodecamp.org/news/tcp-vs-udp-which-is-faster/)
- [(14 条消息) TCP 头的 offset data - CSDN](https://www.csdn.net/tags/MtTaAgysMzIxMDIxLWJsb2cO0O0O.html)
