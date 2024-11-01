# 调试代码常用方法


调试代码的学习，需要了解它的构成，有静态代码、打印、日志、第三方日志、调试器和专用工具，然后利用合适的工具和方法去实践。

## 打印调试法与日志

> 最有效的 debug 工具就是细致的分析，配合恰当位置的打印语句。
> — Brian Kernighan, _Unix 新手入门_。

调试代码的第一种方法往往是在您发现问题的地方添加一些打印语句，然后不断重复此过程直到您获取了足够的信息并找到问题的根本原因。

另外一个方法是使用日志，而不是临时添加打印语句。日志较普通的打印语句有如下的一些优势：

- 您可以将日志写入文件、socket 或者甚至是发送到远端服务器而不仅仅是标准输出；
- 日志可以支持严重等级（例如 INFO, DEBUG, WARN, ERROR 等)，这使您可以根据需要过滤日志；
- 对于新发现的问题，很可能您的日志中已经包含了可以帮助您定位问题的足够的信息。

有很多技巧可以使日志的可读性变得更好，我最喜欢的一个是技巧是对其进行着色。到目前为止，您应该已经知道，以彩色文本显示终端信息时可读性更好。但是应该如何设置呢？

`ls` 和 `grep` 这样的程序会使用 [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code)，它是一系列的特殊字符，可以使您的 shell 改变输出结果的颜色。例如，执行 `echo -e "\e[38;2;255;0;0mThis is red\e[0m"` 会打印红色的字符串：`This is red` 。只要您的终端支持[真彩色](https://gist.github.com/XVilka/8346728#terminals--true-color)。如果您的终端不支持真彩色（例如 MacOS 的 Terminal.app），您可以使用支持更加广泛的 16 色，例如：”\\e\[31;1mThis is red\\e\[0m”。

下面这个脚本向您展示了如何在终端中打印多种颜色（只要您的终端支持真彩色）

```
#!/usr/bin/env bash
for R in $(seq 0 20 255); do
    for G in $(seq 0 20 255); do
        for B in $(seq 0 20 255); do printf "\e[38;2;${R};${G};${B}m█\e[0m";
        done
    done
done
```

## 第三方日志系统

如果您正在构建大型软件系统，您很可能会使用到一些依赖，有些依赖会作为程序单独运行。如 Web 服务器、数据库或消息代理都是此类常见的第三方依赖。

和这些系统交互的时候，阅读它们的日志是非常必要的，因为仅靠客户端侧的错误信息可能并不足以定位问题。

幸运的是，大多数的程序都会将日志保存在您的系统中的某个地方。对于 UNIX 系统来说，程序的日志通常存放在 `/var/log`。例如， [NGINX](https://www.nginx.com/) web 服务器就将其日志存放于`/var/log/nginx`。

目前，系统开始使用 **system log**，您所有的日志都会保存在这里。大多数（但不是全部的）Linux 系统都会使用 `systemd`，这是一个系统守护进程，它会控制您系统中的很多东西，例如哪些服务应该启动并运行。`systemd` 会将日志以某种特殊格式存放于`/var/log/journal`，您可以使用 [`journalctl`](http://man7.org/linux/man-pages/man1/journalctl.1.html) 命令显示这些消息。

类似地，在 macOS 系统中是 `/var/log/system.log`，但是有更多的工具会使用系统日志，它的内容可以使用 [`log show`](https://www.manpagez.com/man/1/log/) 显示。

对于大多数的 UNIX 系统，您也可以使用[`dmesg`](http://man7.org/linux/man-pages/man1/dmesg.1.html) 命令来读取内核的日志。

如果您希望将日志加入到系统日志中，您可以使用 [`logger`](http://man7.org/linux/man-pages/man1/logger.1.html) 这个 shell 程序。下面这个例子显示了如何使用 `logger`并且如何找到能够将其存入系统日志的条目。

不仅如此，大多数的编程语言都支持向系统日志中写日志。

```
logger "Hello Logs"
# On macOS
log show --last 1m | grep Hello
# On Linux
journalctl --since "1m ago" | grep Hello
```

正如我们在数据整理那节课上看到的那样，日志的内容可以非常的多，我们需要对其进行处理和过滤才能得到我们想要的信息。

如果您发现您需要对 `journalctl` 和 `log show` 的结果进行大量的过滤，那么此时可以考虑使用它们自带的选项对其结果先过滤一遍再输出。还有一些像 [`lnav`](http://lnav.org/) 这样的工具，它为日志文件提供了更好的展现和浏览方式。

## 调试器

当通过打印已经不能满足您的调试需求时，您应该使用调试器。

调试器是一种可以允许我们和正在执行的程序进行交互的程序，它可以做到：

- 当到达某一行时将程序暂停；
- 一次一条指令地逐步执行程序；
- 程序崩溃后查看变量的值；
- 满足特定条件时暂停程序；
- 其他高级功能。

### python

很多编程语言都有自己的调试器。Python 的调试器是[`pdb`](https://docs.python.org/3/library/pdb.html).

下面对`pdb` 支持的命令进行简单的介绍：

- **l**(ist) - 显示当前行附近的 11 行或继续执行之前的显示；
- **s**(tep) - 执行当前行，并在第一个可能的地方停止；
- **n**(ext) - 继续执行直到当前函数的下一条语句或者 return 语句；
- **b**(reak) - 设置断点（基于传入的参数）；
- **p**(rint) - 在当前上下文对表达式求值并打印结果。还有一个命令是**pp** ，它使用 [`pprint`](https://docs.python.org/3/library/pprint.html) 打印；
- **r**(eturn) - 继续执行直到当前函数返回；
- **q**(uit) - 退出调试器。

让我们使用`pdb` 来修复下面的 Python 代码（参考讲座视频）

```
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(n):
            if arr[j] > arr[j+1]:
                arr[j] = arr[j+1]
                arr[j+1] = arr[j]
    return arr

print(bubble_sort([4, 2, 1, 8, 7, 6]))
```

注意，因为 Python 是一种解释型语言，所以我们可以通过 `pdb` shell 执行命令。 [`ipdb`](https://pypi.org/project/ipdb/) 是一种增强型的 `pdb` ，它使用[`IPython`](https://ipython.org) 作为 REPL 并开启了 tab 补全、语法高亮、更好的回溯和更好的内省，同时还保留了`pdb` 模块相同的接口。

更多可以学习 [这份](https://github.com/spiside/pdb-tutorial) `pdb` 实践教程并熟悉相关的命令。更深入的信息您可以参考[这份](https://realpython.com/python-debugging-pdb)教程。

### C

对于更底层的编程语言，您可能需要了解一下 [`gdb`](https://www.gnu.org/software/gdb/) ( 以及它的改进版 [`pwndbg`](https://github.com/pwndbg/pwndbg)) 和 [`lldb`](https://lldb.llvm.org/)。

它们都对类 C 语言的调试进行了优化，它允许您探索任意进程及其机器状态：寄存器、堆栈、程序计数器等。

### 可逆调试

这篇文章可了解 [可逆调试](https://undo.io/resources/reverse-debugging-whitepaper/)

C 可以使用 [`rr`](https://rr-project.org/) ，它基于 gdb.

Python 可以使用[pytrace](https://app.pytrace.com/?open=v0.1-interactive-demo)

## 专门工具

### 操作系统内核

即使您需要调试的程序是一个二进制的黑盒程序，仍然有一些工具可以帮助到您。当您的程序需要执行一些只有操作系统内核才能完成的操作时，它需要使用 [系统调用](https://en.wikipedia.org/wiki/System_call)。有一些命令可以帮助您追踪您的程序执行的系统调用。在 Linux 中可以使用[`strace`](http://man7.org/linux/man-pages/man1/strace.1.html) ，在 macOS 和 BSD 中可以使用 [`dtrace`](http://dtrace.org/blogs/about/)。`dtrace` 用起来可能有些别扭，因为它使用的是它自有的 `D` 语言，但是我们可以使用一个叫做 [`dtruss`](https://www.manpagez.com/man/1/dtruss/) 的封装使其具有和 `strace` (更多信息参考 [这里](https://8thlight.com/blog/colin-jones/2015/11/06/dtrace-even-better-than-strace-for-osx.html))类似的接口

下面的例子展现来如何使用 `strace` 或 `dtruss` 来显示`ls` 执行时，对[`stat`](http://man7.org/linux/man-pages/man2/stat.2.html) 系统调用进行追踪对结果。若需要深入了解 `strace`，[这篇文章](https://blogs.oracle.com/linux/strace-the-sysadmins-microscope-v2) 值得一读。

```
# On Linux
sudo strace -e lstat ls -l > /dev/null
4
# On macOS
sudo dtruss -t lstat64_extended ls -l > /dev/null
```

### 网络数据包

有些情况下，我们需要查看网络数据包才能定位问题。像 [`tcpdump`](http://man7.org/linux/man-pages/man1/tcpdump.1.html) 和 [Wireshark](https://www.wireshark.org/) 这样的网络数据包分析工具可以帮助您获取网络数据包的内容并基于不同的条件进行过滤。

### web 开发

对于 web 开发， Chrome/Firefox 的开发者工具非常方便，功能也很强大：

- 源码 -查看任意站点的 HTML/CSS/JS 源码；
- 实时地修改 HTML, CSS, JS 代码 - 修改网站的内容、样式和行为用于测试（从这一点您也能看出来，网页截图是不可靠的）；
- Javascript shell - 在 JS REPL 中执行命令；
- 网络 \- 分析请求的时间线；
- 存储 \- 查看 Cookies 和本地应用存储。

## 静态分析

有些问题是您不需要执行代码就能发现的。例如，仔细观察一段代码，您就能发现某个循环变量覆盖了某个已经存在的变量或函数名；或是有个变量在被读取之前并没有被定义。 这种情况下 [静态分析](https://en.wikipedia.org/wiki/Static_program_analysis) 工具就可以帮我们找到问题。静态分析会将程序的源码作为输入然后基于编码规则对其进行分析并对代码的正确性进行推理。

### python

下面这段 Python 代码中存在几个问题。 首先，我们的循环变量`foo` 覆盖了之前定义的函数`foo`。最后一行，我们还把 `bar` 错写成了`baz`，因此当程序完成`sleep` (一分钟)后，执行到这一行的时候便会崩溃。

```
import time

def foo():
    return 42

for foo in range(5):
    print(foo)
bar = 1
bar *= 0.2
time.sleep(60)
print(baz)
```

静态分析工具可以发现此类的问题。当我们使用[`pyflakes`](https://pypi.org/project/pyflakes) 分析代码的时候，我们会得到与这两处 bug 相关的错误信息。[`mypy`](http://mypy-lang.org/) 则是另外一个工具，它可以对代码进行类型检查。这里，`mypy` 会经过我们`bar` 起初是一个 `int` ，然后变成了 `float`。这些问题都可以在不运行代码的情况下被发现。

```
$ pyflakes foobar.py
foobar.py:6: redefinition of unused 'foo' from line 3
foobar.py:11: undefined name 'baz'

$ mypy foobar.py
foobar.py:6: error: Incompatible types in assignment (expression has type "int", variable has type "Callable[[], Any]")
foobar.py:9: error: Incompatible types in assignment (expression has type "float", variable has type "int")
foobar.py:11: error: Name 'baz' is not defined
Found 3 errors in 1 file (checked 1 source file)
```

### shell

在 shell 工具那一节课的时候，我们介绍了 [`shellcheck`](https://www.shellcheck.net/)，这是一个类似的工具，但它是应用于 shell 脚本的。

```
#!/bin/sh
# Exampl#e: a typical script with several problems
for f in $(ls *.m3u)
do grep -qi hq.*mp3 $f \
	&& echo -e 'Playlist $f contains a HQ file in mp3 format'
done
```

也可以在 Vim 中可以通过 neomake 插件来集成 shellcheck

```
git clone xxx.git ~/.vim/pack/vendor/start/xxx
```

### 工具集成

大多数的编辑器和 IDE 都支持在编辑界面显示这些工具的分析结果、高亮有警告和错误的位置。 这个过程通常称为 **code linting** 。风格检查或安全检查的结果同样也可以进行相应的显示。

在 vim 中，有 [`ale`](https://vimawesome.com/plugin/ale) 或 [`syntastic`](https://vimawesome.com/plugin/syntastic) 可以帮助您做同样的事情。 在 Python 中， [`pylint`](https://www.pylint.org) 和 [`pep8`](https://pypi.org/project/pep8/) 是两种用于进行风格检查的工具，而 [`bandit`](https://pypi.org/project/bandit/) 工具则用于检查安全相关的问题。

对于其他语言的开发者来说，静态分析工具可以参考这个列表：[Awesome Static Analysis](https://github.com/mre/awesome-static-analysis) (您也许会对 _Writing_ 一节感兴趣) 。对于 linters 则可以参考这个列表： [Awesome Linters](https://github.com/caramelomartins/awesome-linters)。

对于风格检查和代码格式化，还有以下一些工具可以作为补充：用于 Python 的 [`black`](https://github.com/psf/black)、用于 Go 语言的 `gofmt`、用于 Rust 的 `rustfmt` 或是用于 JavaScript, HTML 和 CSS 的 [`prettier`](https://prettier.io/) 。这些工具可以自动格式化您的代码，这样代码风格就可以与常见的风格保持一致。 尽管您可能并不想对代码进行风格控制，标准的代码风格有助于方便别人阅读您的代码，也可以方便您阅读它的代码。

