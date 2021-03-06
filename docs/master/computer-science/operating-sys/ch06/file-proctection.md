# 文件保护

文件保护一般有三方面措施

- 通过存取控制机制，防止由人为因素所造成的文件不安全性
- 采取系统容错技术，防止系统部分故障所造成的文件不安全性
- 建立后备系统，防止由自然因素所造成的不安全性

## 保护域

访问权（Access right），指一个进程能对某对象执行操作的权利。

保护域，指进程对一组对象访问权的集合，简称域。

进程和保护域的联系方式有

- 静态联系：一个进程仅联系一个保护域，且在进程的整个生命周期中保持不变。
- 动态联系：一个进程联系多个保护域，且将进程的运行分为若干个阶段，每个阶段联系其中一个保护域。

## 访问矩阵（Access Matrix）

访问矩阵是用来描述 OS 访问控制的矩阵，行代表域，列代表对象，矩阵的每一项由一组访问权组成。访问矩阵的访问权通常由资源的拥有者或管理中所决定。

为实现进程和域之间的动态联系，在访问矩阵中加入域切换权，即将域添加到列中。若域 D1 所在的行，有域 D2 所在的列的访问权 switch ，则域 D1 中运行的进程可切换到 D2。

## 访问矩阵修改

为实现访问矩阵有控制的修改，可在访问权中添加拷贝权、拥有权和控制权。

- 拷贝权：运行在某个域中的进程，可将其在该于所拥有的访问权（不包括拷贝权）扩展到同一列的其它域中。
- 所有权：若运行在某个域中的进程，是某个对象的拥有者，则可增加或删除所有域中的运行进程对该对象的访问权限。
- 控制权：用于改变矩阵内同一行（域）中的各项访问权，即用于改变在某个域中运行的进程对不同对象的访问权。若域 D1 所在的行，有域 D12所在的列的控制权 ，则域 D1 中运行的进程可改变域 D2的各项访问权。

## 访问矩阵实现

访问矩阵是一个稀疏矩阵，可将访问矩阵按列划分或按行划分，分别形成访问控制表或访问权限表（删除空项）。

### 访问控制表（Access Control List）

一种常见实现方式中，域表示用户，对象表示文件；另一种实现方式中，域表示进程。

### 访问权限表（Capabilities List）

当域为用户（进程），对象为文件时，访问权表便可用来描述一个用户（进程）对每个文件所能执行的一组操作。

访问权限表一般存储到系统区的一个专用区中，只有通过合法性检查的程序才能访问该表。

目前，大多数系统同时采用访问控制表和访问权限表，在系统中为每个对象配置一张访问控制表。当一个进程第一次试图去访问一个对象时，先检查访问控制表，若无访问权限，则由系统来拒绝进程访问；否则便允许访问，并为该进程建立一个访问权限，将之连接到进程，以后进程便可直接利用这一返回的权限去访问该对象。

## ChangeLog

> 2018.09.21 初稿