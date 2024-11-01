# 常用性能分析工具


学习性能分析，最开始是查看执行时间，然后用工具帮助排查问题，用资源监控辅助。

即使您的代码能够像您期望的一样运行，但是如果它消耗了您全部的 CPU 和内存，那么它显然也不是个好程序。算法课上我们通常会介绍大 O 标记法，但却没教给我们如何找到程序中的热点。 鉴于 [过早的优化是万恶之源](http://wiki.c2.com/?PrematureOptimization)，您需要学习性能分析和监控工具，它们会帮助您找到程序中最耗时、最耗资源的部分，这样您就可以有针对性的进行性能优化。

## 计时

和调试代码类似，大多数情况下我们只需要打印两处代码之间的时间即可发现问题。

通常来说，用户时间+系统时间代表了您的进程所消耗的实际 CPU （更详细的解释可以参照[这篇文章](https://stackoverflow.com/questions/556405/what-do-real-user-and-sys-mean-in-the-output-of-time1)）。

- 真实时间 \- 从程序开始到结束流失掉的真实时间，包括其他进程的执行时间以及阻塞消耗的时间（例如等待 I/O 或网络）；
- _User_ \- CPU 执行用户代码所花费的时间；
- _Sys_ \- CPU 执行系统内核代码所花费的时间。

### Python

下面这个例子中，我们使用了 Python 的 [`time`](https://docs.python.org/3/library/time.html)模块。

```
import time, random
n = random.randint(1, 10) * 100

# 获取当前时间 start = time.time()

# 执行一些操作 print("Sleeping for {} ms".format(n))
time.sleep(n/1000)

# 比较当前时间和起始时间 print(time.time() - start)

# Output
# Sleeping for 500 ms
# 0.5713930130004883
```

也可以用 [`timeit`]([timeit --- 测量小代码片段的执行时间 — Python 3.11.2 文档](https://docs.python.org/zh-cn/3/library/timeit.html)) 计算一小段 Python 代码的耗时，它有   命令行接口以及一个   可调用方法。

```bash
python -m timeit -r 10 -vp -n 1000 -s 'flag="-"' 'l=[str(i) for i in range(100)]' 'flag.join(l)'
```

```python
def test():
    """Stupid test function"""
    L = [i for i in range(100)]

if __name__ == '__main__':
    import timeit
    print(timeit.timeit("test()", setup="from __main__ import test"))
```

#### shell

例如，试着执行一个用于发起 HTTP 请求的命令并在其前面添加 [`time`](http://man7.org/linux/man-pages/man1/time.1.html) 前缀。网络不好的情况下您可能会看到下面的输出结果。请求花费了 2s 才完成，但是进程仅花费了 15ms 的 CPU 用户时间和 12ms 的 CPU 内核时间。

```
$ time curl https://missing.csail.mit.edu &> /dev/null
real    0m2.561s
user    0m0.015s
sys     0m0.012s
```

## 性能分析工具（profilers）

### CPU

大多数情况下，当人们提及性能分析工具的时候，通常指的是 CPU 性能分析工具。 CPU 性能分析工具有两种： 追踪分析器（_tracing_）及采样分析器（_sampling_）。 追踪分析器 会记录程序的每一次函数调用，而采样分析器则只会周期性的监测（通常为每毫秒）您的程序并记录程序堆栈。它们使用这些记录来生成统计信息，显示程序在哪些事情上花费了最多的时间。

另外还有，Valgrind 的 [Callgrind](http://valgrind.org/docs/manual/cl-manual.html)可让你运行程序并计算所有的时间花费以及所有调用堆栈（即哪个函数调用了另一个函数）。然后，它会生成带注释的代码版本，其中包含每行花费的时间。但是，它会使程序运行速度降低一个数量级，并且不支持线程。

还有，用于用户程序内核跟踪的[eBPF](http://www.brendangregg.com/blog/2019-01-01/learn-ebpf-tracing.html) 。如果需要低级的性能分析， [`bpftrace`](https://github.com/iovisor/bpftrace) 值得一试。

#### Python

##### 按函数分析

在 Python 中，我们使用 `cProfile` 模块来分析每次函数调用所消耗的时间。 在下面的例子中，我们实现了一个基础的 grep 命令：

```
#!/usr/bin/env python
import sys, re

def grep(pattern, file):
    with open(file, 'r') as f:
        print(file)
        for i, line in enumerate(f.readlines()):
            pattern = re.compile(pattern)
            match = pattern.search(line)
            if match is not None:
                print("{}: {}".format(i, line), end="")

if __name__ == '__main__':
    times = int(sys.argv[1])
    pattern = sys.argv[2]
    for i in range(times):
        for file in sys.argv[3:]:
            grep(pattern, file)
```

我们可以使用下面的命令来对这段代码进行分析。通过它的输出我们可以知道，IO 消耗了大量的时间，编译正则表达式也比较耗费时间。因为正则表达式只需要编译一次，我们可以将其移动到 for 循环外面来改进性能。

```
$ python -m cProfile -s tottime grep.py 1000 '^(import|\s*def)[^,]*$' *.py

[omitted program output]

 ncalls  tottime  percall  cumtime  percall filename:lineno(function)
   8000    0.266    0.000    0.292    0.000 {built-in method io.open}
   8000    0.153    0.000    0.894    0.000 grep.py:5(grep)
  17000    0.101    0.000    0.101    0.000 {built-in method builtins.print}
   8000    0.100    0.000    0.129    0.000 {method 'readlines' of '_io._IOBase' objects}
  93000    0.097    0.000    0.111    0.000 re.py:286(_compile)
  93000    0.069    0.000    0.069    0.000 {method 'search' of '_sre.SRE_Pattern' objects}
  93000    0.030    0.000    0.141    0.000 re.py:231(compile)
  17000    0.019    0.000    0.029    0.000 codecs.py:318(decode)
      1    0.017    0.017    0.911    0.911 grep.py:3(<module>)

[omitted lines]
```

关于 Python 的 `cProfile` 分析器（以及其他一些类似的分析器），需要注意的是它显示的是每次函数调用的时间。看上去可能快到反直觉，尤其是如果您在代码里面使用了第三方的函数库，因为内部函数调用也会被看作函数调用。

##### 按行分析

```
#!/usr/bin/env python import requests
from bs4 import BeautifulSoup

# 这个装饰器会告诉行分析器
# 我们想要分析这个函数
@profile
def get_urls():
    response = requests.get('https://missing.csail.mit.edu')
    s = BeautifulSoup(response.content, 'lxml')
    urls = []
    for url in s.find_all('a'):
        urls.append(url['href'])

if __name__ == '__main__':
    get_urls()
```

如果我们使用 Python 的 `cProfile` 分析器，我们会得到超过 2500 行的输出结果，即使对其进行排序，我仍然搞不懂时间到底都花在哪了。如果我们使用 [`line_profiler`](https://github.com/pyutils/line_profiler)，它会基于行来显示时间：

```
$ kernprof -l -v a.py
Wrote profile results to urls.py.lprof
Timer unit: 1e-06 s

Total time: 0.636188 s
File: a.py
Function: get_urls at line 5

Line #  Hits         Time  Per Hit   % Time  Line Contents
==============================================================
 5                                           @profile
 6                                           def get_urls():
 7         1     613909.0 613909.0     96.5      response = requests.get('https://missing.csail.mit.edu')
 8         1      21559.0  21559.0      3.4      s = BeautifulSoup(response.content, 'lxml')
 9         1          2.0      2.0      0.0      urls = []
10        25        685.0     27.4      0.1      for url in s.find_all('a'):
11        24         33.0      1.4      0.0          urls.append(url['href'])
```

如果您希望了解更多相关信息，可以参考[这篇](https://jvns.ca/blog/2017/12/17/how-do-ruby---python-profilers-work-) 介绍性的文章。

profilehooks 是一个性能测试装饰器集合。

### 内存

#### C

像 C 或者 C++ 这样的语言，内存泄漏会导致您的程序在使用完内存后不去释放它。为了应对内存类的 Bug，我们可以使用类似 [Valgrind](https://valgrind.org/) 这样的工具来检查内存泄漏问题。

#### Python

对于 Python 这类具有垃圾回收机制的语言，内存分析器也是很有用的，因为对于某个对象来说，只要有指针还指向它，那它就不会被回收。

下面这个例子及其输出，展示了 [memory-profiler](https://pypi.org/project/memory-profiler/) 是如何工作的（注意装饰器和 `line-profiler` 类似）。

```
@profile
def my_func():
    a = [1] * (10 ** 6)
    b = [2] * (2 * 10 ** 7)
    del b
    return a

if __name__ == '__main__':
    my_func()
```

```
$ python -m memory_profiler example.py
Line #    Mem usage  Increment   Line Contents
==============================================
     3                           @profile
     4      5.97 MB    0.00 MB   def my_func():
     5     13.61 MB    7.64 MB       a = [1] * (10 ** 6)
     6    166.20 MB  152.59 MB       b = [2] * (2 * 10 ** 7)
     7     13.61 MB -152.59 MB       del b
     8     13.61 MB    0.00 MB       return a
```

### 事件分析

在我们使用`strace`调试代码的时候，您可能会希望忽略一些特殊的代码并希望在分析时将其当作黑盒处理。[`perf`](http://man7.org/linux/man-pages/man1/perf.1.html) 命令将 CPU 的区别进行了抽象，它不会报告时间和内存的消耗，而是报告与您的程序相关的系统事件。

例如，`perf` 可以报告不佳的缓存局部性（poor cache locality）、大量的页错误（page faults）或活锁（livelocks）。下面是关于常见命令的简介：

- `perf list` \- 列出可以被 pref 追踪的事件；
- `perf stat COMMAND ARG1 ARG2` \- 收集与某个进程或指令相关的事件；
- `perf record COMMAND ARG1 ARG2` \- 记录命令执行的采样信息并将统计数据储存在`perf.data`中；
- `perf report` \- 格式化并打印 `perf.data` 中的数据。

### 可视化

#### 采样分析器

对于采样分析器来说，常见的显示 CPU 分析数据的形式是 [火焰图](http://www.brendangregg.com/flamegraphs.html)，火焰图会在 Y 轴显示函数调用关系，并在 X 轴显示其耗时的比例。火焰图同时还是可交互的，您可以深入程序的某一具体部分，并查看其栈追踪（您可以尝试点击下面的图片）。

[Flamegraphs](http://www.brendangregg.com/flamegraphs.html) 是对采样分析器结果的可视化工具。

[![FlameGraph](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/cpu-bash-flamegraph.svg)

#### 调用图

调用图和控制流图可以显示子程序之间的关系，它将函数作为节点并把函数调用作为边。将它们和分析器的信息（例如调用次数、耗时等）放在一起使用时，调用图会变得非常有用，它可以帮助我们分析程序的流程。 在 Python 中您可以使用 [`pycallgraph`](http://pycallgraph.slowchop.com/en/master/) 来生成这些图片。

![Call Graph](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/A_Call_Graph_generated_by_pycallgraph.png)

计算斐波那契数列 Python 代码，它为计算每个数字都定义了一个函数：

```
#!/usr/bin/env python def fib0(): return 0

def fib1(): return 1

s = """def fib{}(): return fib{}() + fib{}()"""

if __name__ == '__main__':

	for n in range(2, 10):
		exec(s.format(n, n-1, n-2))
	# from functools import lru_cache
	# for n in range(10):
	#     exec("fib{} = lru_cache(1)(fib{})".format(n, n))
	print(eval("fib9()"))
```

1. 安装[`graphviz`](http://graphviz.org/)，`brew install graphviz` ，(如果您能够执行`dot`, 则说明已经安装了 GraphViz.)
2. 安装 [`pycallgraph`](http://pycallgraph.slowchop.com/en/master/)，`pip install pycallgraph`
3. 使用 `pycallgraph graphviz -- ./fib.py` 来执行代码并查看`pycallgraph.png` 这个文件。

## 资源监控

有时候，分析程序性能的第一步是搞清楚它所消耗的资源。程序变慢通常是因为它所需要的资源不够了。例如，没有足够的内存或者网络连接变慢的时候。

有很多很多的工具可以被用来显示不同的系统资源，例如 CPU 占用、内存使用、网络、磁盘使用等。

### 通用监控

最流行的工具要数 [`htop`](https://htop.dev/),了，它是 [`top`](http://man7.org/linux/man-pages/man1/top.1.html)的改进版。`htop` 可以显示当前运行进程的多种统计信息。`htop` 有很多选项和快捷键，常见的有：`<F6>` 进程排序、 `t` 显示树状结构和 `h` 打开或折叠线程。

还可以留意一下 [`glances`](https://nicolargo.github.io/glances/) ，它的实现类似但是用户界面更好。

如果需要合并测量全部的进程， [`dstat`](http://dag.wiee.rs/home-made/dstat/) 是也是一个非常好用的工具，它可以实时地计算不同子系统资源的度量数据，例如 I/O、网络、 CPU 利用率、上下文切换等等；

### I/O 操作

[`iotop`](http://man7.org/linux/man-pages/man8/iotop.8.html) 可以显示实时 I/O 占用信息而且可以非常方便地检查某个进程是否正在执行大量的磁盘读写操作；

### 磁盘使用

[`df`](http://man7.org/linux/man-pages/man1/df.1.html) 可以显示每个分区的信息，而 [`du`](http://man7.org/linux/man-pages/man1/du.1.html) 则可以显示当前目录下每个文件的磁盘使用情况（ **d**isk **u**sage）。`-h` 选项可以使命令以对人类（**h**uman）更加友好的格式显示数据；[`ncdu`](https://dev.yorhel.nl/ncdu)是一个交互性更好的 `du` ，它可以让您在不同目录下导航、删除文件和文件夹；

### 内存使用

[`free`](http://man7.org/linux/man-pages/man1/free.1.html) 可以显示系统当前空闲的内存。内存也可以使用 `htop` 这样的工具来显示；

### 打开文件

[`lsof`](http://man7.org/linux/man-pages/man8/lsof.8.html) 可以列出被进程打开的文件信息。 当我们需要查看某个文件是被哪个进程打开的时候，这个命令非常有用；

例如，执行 `lsof | grep LISTEN` 打印出所有监听端口的进程及相应的端口。

### 网络连接和配置

[`ss`](http://man7.org/linux/man-pages/man8/ss.8.html) 能帮助我们监控网络包的收发情况以及网络接口的显示信息。`ss` 常见的一个使用场景是找到端口被进程占用的信息。

如果要显示路由、网络设备和接口信息，您可以使用 [`ip`](http://man7.org/linux/man-pages/man8/ip.8.html) 命令。注意，`netstat` 和 `ifconfig` 这两个命令已经被前面那些工具所代替了。

### 网络使用

[`nethogs`](https://github.com/raboof/nethogs) 和 [`iftop`](http://www.ex-parrot.com/pdw/iftop/) 是非常好的用于对网络占用进行监控的交互式命令行工具。

## 专用工具

### 增加负载

如果您希望测试资源监控工具，您可以使用 [`stress`](https://linux.die.net/man/1/stress) 命令来为系统人为地增加负载。

执行 `stress -c 3` 并使用`htop` 对 CPU 消耗进行可视化。

执行`taskset --cpu-list 0,2 stress -c 3` 并可视化，会发现限制了 CPU 负载增加的数量。

阅读[`man taskset`](http://man7.org/linux/man-pages/man1/taskset.1.html)获取更多。

[`cgroups`](http://man7.org/linux/man-pages/man7/cgroups.7.html) 也是一个控制系统资源的工具。

### 基准测试

有时候，您只需要对黑盒程序进行基准测试，并依此对软件选择进行评估。 类似 [`hyperfine`](https://github.com/sharkdp/hyperfine) 这样的命令行可以帮您快速进行基准测试。例如，我们在 shell 工具和脚本那一节课中我们推荐使用 `fd` 来代替 `find`。我们这里可以用`hyperfine`来比较一下它们。

例如，下面的例子中，我们可以看到`fd` 比 `find` 要快 20 倍。

```
$ hyperfine --warmup 3 'fd -e jpg' 'find . -iname "*.jpg"'
Benchmark #1: fd -e jpg
  Time (mean ± σ):      51.4 ms ±   2.9 ms    [User: 121.0 ms, System: 160.5 ms]
  Range (min … max):    44.2 ms …  60.1 ms    56 runs

Benchmark #2: find . -iname "*.jpg"
  Time (mean ± σ):      1.126 s ±  0.101 s    [User: 141.1 ms, System: 956.1 ms]
  Range (min … max):    0.975 s …  1.287 s    10 runs

Summary
  'fd -e jpg' ran
   21.89 ± 2.33 times faster than 'find . -iname "*.jpg"'
```

### 浏览器

和 debug 一样，浏览器也包含了很多不错的性能分析工具，可以用来分析页面加载，让我们可以搞清楚时间都消耗在什么地方（加载、渲染、脚本等等）。 更多关于 [Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Performance/Profiling_with_the_Built-in_Profiler) 和 [Chrome](https://developers.google.com/web/tools/chrome-devtools/rendering-tools)的信息可以点击链接。

### 抓包工具

#### Wireshark

让 [Wireshark](https://www.wireshark.org/) 解密以 RSA 为密钥交换算法的 ssl 流量，需要给 wireshark 设置 ssl 证书私钥。 RSA 交换算法已经普遍被禁用了, 对于主流的 DH 或者 ECDH 交换算法, wireshark 无法解密。但是, 工业上的一个实际标准可以使 wireshark 解密这些 ssl 链接。

设置 SSLKEYLOGFILE 环境变量解密 HTTPS 流量

```bash
# 设置环境变量
touch ~/.sslkey.log
sudo chmod 777 ~/.sslkey.log
echo "export SSLKEYLOGFILE=~/.sslkey.log" >> ~/.zshrc
source ~/.zshrc
# 保存私钥，运行curl会检测这个环境变量SSLKEYLOGFILE, 它指向一个文件, curl会把 DH 交换的私钥保存到这个文件里面
curl --resolve www.baidu.com:443:183.232.231.174 https://www.baidu.com
cat ~/.sslkey.log
```

配置 wireshark，打开 perferences -> Protocols -> TSL。配置 (Pre)-Master-Secret log filename，路径为上述 .sslkey.log 的全路径。

