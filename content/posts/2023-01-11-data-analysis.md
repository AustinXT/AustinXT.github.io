---
layout: post
title: Shell 命令行数据处理
date: 2023-01-11
categories: [知识整理]
tags: [Shell, 数据处理]
---

Shell 命令行数据处理是在 Unix 系统处理大数据绕不过去的技能。

学习需要和场景相结合，在熟悉 awk、paste 等工具的基础上，根据实际需求迭代工具集，并且记录例子。

## 数据整理

### sed

`sed` 的正则表达式有些时候是比较奇怪的，它需要你在这些模式前添加`\`才能使其具有特殊含义。或者，您也可以添加`-E`选项来支持这些匹配。

查找碰撞服务器的用户

```bash
ssh myserver journalctl
 | grep sshd
 | grep "Disconnected from"
 | sed -E 's/.*Disconnected from (invalid |authenticating )?user (.*) [^ ]+ port [0-9]+( \[preauth\])?$/\2/'
 | sort | uniq -c
 | sort -nk1,1 | tail -n10
 | awk '{print $2}' | paste -sd,
```

- `sort` 会对其输入数据进行排序，默认情况下是按照字典序排序
- `uniq -c` 会把连续出现的行折叠为一行并使用出现次数作为前缀
- `sort -k1,1` 则表示“仅基于以空格分割的第一列进行排序”。`,n` 部分表示“仅排序到第 n 个部分”，默认情况是到行尾
- `awk '{print $2}'` 对于每一行文本，打印其第二个部分，也就是用户名
- `paste`命令来合并行(`-s`)，并指定一个分隔符进行分割 (`-d`)

### awk

`awk` 其实是一种编程语言，只不过它碰巧非常善于处理文本。

`awk` 程序接受一个模式串（可选），以及一个代码块，指定当模式匹配时应该做何种操作。默认当模式串即匹配所有行（上面命令中当用法）。 在代码块中，`$0` 表示整行的内容，`$1` 到 `$n` 为一行中的 n 个区域，区域的分割基于 `awk` 的域分隔符（默认是空格，可以通过`-F`来修改）。

既然 `awk` 是一种编程语言，那么则可以这样：

```
BEGIN { rows = 0 }
$1 == 1 && $2 ~ /^c[^

 ]*e$/ { rows += $1 }
END { print rows }
```

`BEGIN` 也是一种模式，它会匹配输入的开头（ `END` 则匹配结尾）。然后，对每一行第一个部分进行累加，最后将结果输出。事实上，我们完全可以抛弃 `grep` 和 `sed` ，因为 `awk` 就可以[解决所有问题](https://backreference.org/2010/02/10/idiomatic-awk)。

## 数据分析

### 计算

`paste` 将每行的数字加起来，`bc -l` 计算公式

```
 | paste -sd+ | bc -l
```

### 统计

R 也是一种编程语言，它非常适合被用来进行数据分析和[绘制图表](https://ggplot2.tidyverse.org/)。这里我们不会讲的特别详细， 您只需要知道`summary` 可以打印某个向量的统计结果。我们将输入的一系列数据存放在一个向量后，利用 R 语言就可以得到我们想要的统计数据。

```
ssh myserver journalctl
 | grep sshd
 | grep "Disconnected from"
 | sed -E 's/.*Disconnected from (invalid |authenticating )?user (.*) [^ ]+ port [0-9]+( \[preauth\])?$/\2/'
 | sort | uniq -c
 | awk '{print $1}' | R --slave -e 'x <- scan(file="stdin", quiet=TRUE); summary(x)'
```

### 绘图

### 整理二进制数据

虽然到目前为止我们的讨论都是基于文本数据，但对于二进制文件其实同样有用。例如我们可以用 ffmpeg 从相机中捕获一张图片，将其转换成灰度图后通过 SSH 将压缩后的文件发送到远端服务器，并在那里解压、存档并显示。

```
ffmpeg -loglevel panic -i /dev/video0 -frames 1 -f image2 -
 | convert - -colorspace gray -
 | gzip
 | ssh mymachine 'gzip -d | tee copy.jpg | env DISPLAY=:0 feh -'
```

### 其他类型文件处理

如果获取的是 HTML 数据，那么[`pup`](https://github.com/EricChiang/pup)可能会有帮助。

对于 JSON 类型的数据，可以试试[`jq`](https://stedolan.github.io/jq/)。

## Tip

### 在远端处理大数据

先在远端机器上过滤文本内容，然后再将结果传输到本机。

```bash
# 分页器
ssh myserver 'journalctl | grep sshd | grep "Disconnected from"' | less
# 重定向
ssh myserver 'journalctl | grep sshd | grep "Disconnected from"' > ssh.log
```

### 利用数据整理来确定参数

有时候您要利用数据整理技术从一长串列表里找出你所需要安装或移除的东西。我们之前讨论的相关技术配合 `xargs` 即可实现：

```
rustup toolchain list | grep nightly | grep -vE "nightly-x86" | sed 's/-x86.*//' | xargs rustup toolchain uninstall
```

### 原地替换

原地替换听上去很有诱惑力，例如： `sed s/REGEX/SUBSTITUTION/ input.txt > input.txt`。但是这并不是一个明智的做法，为什么呢？还是说只有 `sed`是这样的? 查看 `man sed` 来完成这个问题。

```bash
# 表达式中后一个 input.txt会首先被清空，而且是发生在前的。所以前面一个input.txt在还没有被 sed 处理时已经为空了。

# 先备份文件
sed -i.bak s/REGEX/SUBSTITUTION/ input.txt
```

## 例子

### 统计字典

统计 words 文件 (`/usr/share/dict/words`) 中包含至少三个`a` 且不以`'s` 结尾的单词个数。这些单词中，出现频率前三的末尾两个字母是什么？ `sed`的 `y`命令，或者 `tr` 程序也许可以帮你解决大小写的问题。共存在多少种词尾两字母组合？还有一个很 有挑战性的问题：哪个组合从未出现过？

```bash
# 共存在多少种字母组合
cat /usr/share/dict/words | grep -v "'s$" | grep -iE "^([^a]*a){3}.*$" | wc -l
# 哪些组合未出现过
diff <(cat occurance.txt) <(cat all.txt) --unchanged-group-format='' | wc -l
```

## More

### TODO

- 在实际场景中多使用多思考，熟悉并扩充工具
- 记录实践策略

### Ref

- [RegexOne - Learn Regular Expressions - Lesson 1: An Introduction, and the ABCs](https://regexone.com/)
- [**regex101: build, test, and debug regex**](https://regex101.com/r/qqbZqh/2)
- [How to Find or Validate an Email Address](https://www.regular-expressions.info/email.html)
- [In search of the perfect URL validation regex](https://mathiasbynens.be/demo/url-regex)
