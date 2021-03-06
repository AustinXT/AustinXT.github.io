# 数据一致性控制

数据一致性指保存在多个文件中的同一数据，在任何情况下都必须能保持相同。

## 事务

### 事务定义

事务是用于访问和修改各种数据项的一个程序单位，可被看作一系列相关的读写操作。只有对分布在不同位置的同一数据所进行的读写操作全部完成时，才能以提交操作（Commit Operation）结束事务，确认事务的变化。若这些读写操作有一个失败了，则必须执行夭折操作（Abort Operation），将已被修改的数据恢复为原来的情况。

### 事务记录（Transaction Record）

完成事务操作（原子操作的一种），必须借助一数据结构（事务记录）来实现。事务记录含有字段：事务名、数据项名、旧值和新值。

在一个事务 T 开始执行时，「T 开始」记录被写入事务记录表中；在 T 执行期间，在 T 的任何写操作之前，须先写一适当的新纪录到事务记录表中；当 T 进行提交时，再把一个「T 提交」记录写入事务记录表中。

### 恢复算法

在事务记录表中有两类尚未清理的记录，一类是所包含的各类操作以完成的事务，另一类是所包含的各个操作并未全部完成的事务，分别采用两种操作

- redo T：把所有被事务修改过的数据设置为新值
- undo T：把所有被事务 T 修改过的数据恢复为修改前的值

## 检查点（check point）

引入检查点，是为了对事务记录表中的记录定期清理。

- 将驻留在易失性存储器中的当前事务记录表中的所有记录输出到稳定存储器中
- 将驻留在易失性存储器中的所有已修改数据输出到稳定器中
- 将事务记录表中的检查点记录输入到稳定器中
- 每当出现一个检查点记录时，系统便利用 redo 和 undo 执行恢复操作

当系统出现故障时，只需要对最后一个检查点之后的事务记录进行处理。

## 并发控制（Concurrent Control）

在多用户系统和计算机网络环境下，可能有多个用户在同时执行事务，各个事务按顺序执行，而用于实现事务顺序执行的技术成为并发控制。

可利用共享锁（允许多个事务对相应对象执行读操作）和互斥锁（仅允许一个事务去读写）实现，执行读操作的事务获得共享锁，执行写操作的事务获得互斥锁。

## 重复数据的数据一致性问题

为保证数据的安全性，常将关键文件或数据结构复制多份，分别存储在不同的地方，这里便需要不同处的同一数据结构中数据的一致性。

### 拷贝文件的一致性

UNIX 类型的目录的目录项可由一个文件名和若干索引编号组成，可从拷贝索引节点找到个拷贝的物理位置，对这些拷贝做同样修改，或用新拷贝去覆盖原来的拷贝。

### 链接数的一致性检查

在 UNIX 类型的文件目录中，共享文件的索引节点号会在目录中出现多次，共享文件的索引节点有一个链接计数 count，用来指出有共享文件的进程数，正常情况会与索引节点号在目录中出现的次数一致。

为检查数据一致性，需要配置一张计数器表，为每个文件建立一个表项，其中含有索引节点号计数。可从根目录开始对每个索引节点号进行检查，没出现一次便在计数器表的相应表项加一，再与链接计数比较。

- 若索引节点中的链接计数 count 值大于计数器表中相应索引节点号的计数值，则即使在所有共享此文件的用户都不再使用此文件时，count 仍不为“0”，可用正确的计数值去重新赋值 count；
- 反之，会导致共享此文件的用户所对应的目录项指向空节点（或其他文件的索引节点），访问失败（或潜在危险）。

## ChangeLog

> 2018.09.24 初稿

