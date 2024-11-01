# Shell 工具和脚本入门


> 计算机的文字接口 Shell 处理 GUI 接口无法应对的剩下 20% 使用场景。

Shell 工具和脚本的学习，其实是三块内容，Shell 语言编程、Shell 场景&工具，以及脚本编写。

- Shell 语言编程，主要是词法、语法和应用，可以通过教程系统学习；
- Shell 场景&工具，按照日常使用需要，积累在不同场景的工具和使用技巧，可以通过文档、man、tldr 等了解工具使用；
- 脚本编写，主要是掌握流程，以及持续实践。

## Shell 语言

### 词法

- `\` 转义字符，例如传递的参数包含空格的场景，`\ `
- 引号：`'` 包裹纯字符串，`"` 包裹命令
- 变量：`$PATH` ，变量赋值 `foo=bar`
  - `$0` : 脚本名
  - `$1 $9` 脚本的参数。 $1 是第一个参数，依此类推。
  - `$@` : 所有参数
  - `$#` : 参数个数
  - `$?` : 前一个命令的返回值
  - `$$` : 当前脚本的进程识别码
  - `!!` : 完整的上一条命令，包括参数。常见应用：当你因为权限不足执行命令失败时，可以使用 sudo !!再尝试一次。
  - `$_` : 上一条命令的最后一个参数。如果你正在使用的是交互式 shell，你可以通过按下 Esc 之后键入 . 来获取这个值。
- `&&`（与操作符）和 `||`（或操作符）：命令通常使用 STDOUT 来返回输出值，使用 STDERR 来返回错误及错误码，返回值 0 表示正常执行，其他所有非 0 的返回值都表示有错误发生。程序 true 的返回码永远是 0，false 的返回码永远是 1。`false || echo "Oops, fail"`
- `;` ：分隔同一行的多个命令
- 命令替换 `$( CMD )` ：被 CMD 输出结果替换掉
- 进程替换 `<( CMD )` ：执行 CMD 并将结果输出到一个临时文件中，并将 <( CMD ) 替换成临时文件名。例如，`diff <(ls foo) <(ls bar)` 会显示文件夹 foo 和 bar 中文件的区别。
- 通配符： ? 和 \* 来匹配一个或任意个字符
- 花括号{} - 当你有一系列的指令，其中包含一段公共子串时，可以用花括号来自动展开这些命令。例如，`{foo,bar}/{a..h}` 创建 foo/a, foo/b, ... foo/h, bar/a, bar/b, ... bar/h 这些文件

### 语法

#### FOR-IF

```bash
for file in "$@"; do
    grep foobar "$file" > /dev/null 2> /dev/null
    # 如果模式没有找到，则grep退出状态为 1
    # 我们将标准输出流和标准错误流重定向到Null，因为我们并不关心这些信息
    if [[ $? -ne 0 ]]; then
        echo "File $file does not have any foobar, adding one"
        echo "# foobar" >> "$file"
    fi
done
```

### Debug

[koalaman/shellcheck: ShellCheck, a static analysis tool for shell scripts](https://github.com/koalaman/shellcheck) 定位 sh/bash 脚本中的错误。

### Tips

#### 常见命令行标志参数及模式

命令行工具的用法千差万别，阅读 `man` 页面可以帮助你理解每种工具的用法。即便如此，下面我们将介绍一下命令行工具一些常见的共同功能。

- 大部分工具支持 `--help` 或者类似的标志参数（flag）来显示它们的简略用法。
- 会造成不可撤回操作的工具一般会提供“空运行”（dry run）标志参数，这样用户可以确认工具真实运行时会进行的操作。这些工具通常也会有“交互式”（interactive）标志参数，在执行每个不可撤回的操作前提示用户确认。
- `--version` 或者 `-V` 标志参数可以让工具显示它的版本信息（对于提交软件问题报告非常重要）。
- 基本所有的工具支持使用 `--verbose` 或者 `-v` 标志参数来输出详细的运行信息。多次使用这个标志参数，比如 `-vvv`，可以让工具输出更详细的信息（经常用于调试）。同样，很多工具支持 `--quiet` 标志参数来抑制除错误提示之外的其他输出。
- 大多数工具中，使用 `-` 代替输入或者输出文件名意味着工具将从标准输入（standard input）获取所需内容，或者向标准输出（standard output）输出结果。
- 会造成破坏性结果的工具一般默认进行非递归的操作，但是支持使用“递归”（recursive）标志函数（通常是 `-r`）。
- 有的时候你可能需要向工具传入一个 _看上去_ 像标志参数的普通参数，比如：
  - 使用 `rm` 删除一个叫 `-r` 的文件；
  - 在通过一个程序运行另一个程序的时候（`ssh machine foo`），向内层的程序（`foo`）传递一个标志参数。
  这时候你可以使用特殊参数 `--` 让某个程序 _停止处理_ `--` 后面出现的标志参数以及选项（以 `-` 开头的内容）：
  - `rm -- -r` 会让 `rm` 将 `-r` 当作文件名；
  - `ssh machine --for-ssh -- foo --for-foo` 的 `--` 会让 `ssh` 知道 `--for-foo` 不是 `ssh` 的标志参数。

## Shell 场景&工具

### 查看命令行如何使用

1. `--help`
2. tldr：[tldr pages](https://tldr.sh/)
3. man

### 在 Shell 中导航

命令

- `cd`
- `ls`
- `pwd`
- `mv`（用于重命名或移动文件）
- `cp`（拷贝文件）
- `mkdir`（新建文件夹）
- autojump/fasd: 查找最常用或最近使用的文件和目录
- tree/broot/nnn/ranger: 概览目录结构

### 程序间创建链接

- 重定向：` < file` 从文件输入， `> file` 输出到文件， `>> file` 来向文件追加内容
- 管道 `a | b` ：将 a 程序的输出作为 b 程序的输入

### 权限

`ls -lht` 的第一列 `drwxr-xr-x	nv	staff	200B Feb  8 10:48 info.json` 一共有 10 个位置。

- 第一个表示是否是目录，d 表示目录，-表示文件。
- 后续每三个字符构成一组（rwx）， 文件所有者（nv），用户组（staff） 以及其他所有人具有的权限，其中 - 表示该用户不具备相应的权限。

命令

- `chmod`

### 查找文件

find

```bash
# 查找所有名称为src的文件夹
find . -name src -type d
# 查找所有文件夹路径中包含test的python文件
find . -path '*/test/*.py' -type f
# 查找前一天修改的所有文件
find . -mtime -1
# 查找所有大小在500k至10M的tar.gz文件
find . -size +500k -size -10M -name '*.tar.gz'

# 删除全部扩展名为.tmp 的文件
find . -name '*.tmp' -exec rm {} \;
# 查找全部的 PNG 文件并将其转换为 JPG
find . -name '*.png' -exec convert {} {}.jpg \;
```

fd

以模式 PATTERN 搜索的语法是 fd PATTERN。

locate

locate 使用一个由 updatedb 负责更新的数据库，在大多数系统中 updatedb 都会通过 cron 每日更新。

### 查找代码

grep

- -C：获取查找结果的上下文（Context），grep -C5 会输出匹配结果前后五行
- -v 将对结果进行反选
- -R 会递归地进入子目录并搜索所有的文本文件

rg: ripgrep

```bash
# 查找所有使用了 requests 库的文件
rg -t py 'import requests'
# 查找所有没有写 shebang 的文件（包含隐藏文件）
rg -u --files-without-match "^#!"
# 查找所有的foo字符串，并打印其之后的5行
rg foo -A 5
# 打印匹配的统计信息（匹配的行和文件的数量）
rg --stats PATTERN
```

类似还有：ack、ag

### 查找 Shell 命令

- Ctrl+R 对命令历史记录进行回溯搜索
- fzf 通用对模糊查找工具，多场景通用！

## 脚本

脚本应该指的是能够在开发环境下单独调用的程序，可以用 Shell 写，也可以用其他语言写。

### Tips

`env` 命令，利用环境变量中的程序来解析该脚本。

```bash
#!/usr/bin/env python
```

#### 使用 Python VS Bash 脚本 VS 其他语言?

通常来说，Bash 脚本对于简短的一次性脚本有效，比如当你想要运行一系列的命令的时候。但是 Bash 脚本有一些比较奇怪的地方，这使得大型程序或脚本难以用 Bash 实现：

- Bash 对于简单的使用情形没什么问题，但是很难对于所有可能的输入都正确。例如，脚本参数中的空格会导致 Bash 脚本出错。
- Bash 对于代码重用并不友好。因此，重用你先前已经写好的代码很困难。通常 Bash 中没有软件库的概念。
- Bash 依赖于一些像 `$?` 或 `$@` 的特殊字符指代特殊的值。其他的语言却会显式地引用，比如 `exitCode` 或 `sys.args`。

因此，对于大型或者更加复杂的脚本我们推荐使用更加成熟的脚本语言例如 Python 和 Ruby。 你可以找到很多用这些语言编写的，用来解决常见问题的在线库。 如果你发现某种语言实现了你所需要的特定功能库，最好的方式就是直接去使用那种语言。

#### `source script.sh` 和 `./script.sh` 有什么区别?

这两种情况 `script.sh` 都会在 bash 会话中被读取和执行，不同点在于哪个会话执行这个命令。 对于 `source` 命令来说，命令是在当前的 bash 会话中执行的，因此当 `source` 执行完毕，对当前环境的任何更改（例如更改目录或是定义函数）都会留存在当前会话中。 单独运行 `./script.sh` 时，当前的 bash 会话将启动新的 bash 会话（实例），并在新实例中运行命令 `script.sh`。 因此，如果 `script.sh` 更改目录，新的 bash 会话（实例）会更改目录，但是一旦退出并将控制权返回给父 bash 会话，父会话仍然留在先前的位置（不会有目录的更改）。 同样，如果 `script.sh` 定义了要在终端中访问的函数，需要用 `source` 命令在当前 bash 会话中定义这个函数。否则，如果你运行 `./script.sh`，只有新的 bash 会话（进程）才能执行定义的函数，而当前的 shell 不能。

## 应用例子

### 对偶然出错的脚本调试

假设您有一个命令，它很少出错。因此为了在出错时能够对其进行调试，需要花费大量的时间重现错误并捕获输出。 编写一段 bash 脚本，运行如下的脚本直到它出错，将它的标准输出和标准错误流记录到文件，并在最后输出所有内容，以及在失败前共运行了多少次。

```bash
#!/bin/bash

count=1

while true
do
	./run.sh >> run.log 2>&1
	if [[ $? -ne 0 ]]; then
		cat get42.log
		echo "fail after $count times"
		break
	fi
	((count++))

done
```

### 查找文件并压缩

编写一个命令，它可以递归地查找文件夹中所有的 HTML 文件，并将它们压缩成 zip 文件。注意，即使文件名中包含空格，您的命令也应该能够正确执行（提示：查看  xargs 的参数-d，译注：MacOS 上的  xargs 没有-d，查看这个[sharkdp/fd: A simple, fast and user-friendly alternative to 'find'](https://github.com/sharkdp/fd)）

```bash
# generate html files
mkdir a b c
touch {a,b,c}/{a..d}.{tmp,html} {a,b,c}/"x Y".html x.html y.html z.tmp

# action
find . -name '*.html' -print0 | xargs -0 tar vcf html.zip
```

### 最近使用的文件

编写一个命令或脚本递归的查找文件夹中最近使用的文件，按照最近的使用时间列出。

```bash
find . -type f -print0 | xargs -0 ls -lt | head -5

# 当文件数量较多时，上面的解答会得出错误结果，解决办法是增加 -mmin 条件
find . -type f -mmin -60 -print0 | xargs -0 ls -lt | head -5
```

### 简易数据库

```shell
#!/bin/bash
db_set () {
  echo "$1,$2" >> database
}

db_get () {
  grep "^$1," database | sed -e "s/^$1,//" | tail -n 1
}
```

## More

### TODO

- 系统学习 Shell 语言：[set 命令，shopt 命令 - Bash 脚本教程 - 网道](https://wangdoc.com/bash/set)
- 思考 Shell 使用场景，把自己高频需求用新掌握的工具自动化
- 掌握脚本使用最佳实践

### Ref

- [Top (Bash Reference Manual)](https://www.gnu.org/software/bash/manual/html_node/index.html)

