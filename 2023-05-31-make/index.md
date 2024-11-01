# make 构建工具介绍


构建工具通常需要定义*依赖*、*目标*和*规则*。

`make` 是最常用的构建系统之一，您会发现它通常被安装到了几乎所有基于 UNIX 的系统中。`make`并不完美，但是对于中小型项目来说，它已经足够好了。当您执行 `make` 时，它会去参考当前目录下名为 `Makefile` 的文件。所有构建目标、相关依赖和规则都需要在该文件中定义，它看上去是这样的：

```make
paper.pdf: paper.tex plot-data.png
	pdflatex paper.tex

plot-%.png: %.dat plot.py
	./plot.py -i $*.dat -o $@

.PHONY: clean
clean:
	rm *.pdf *.aux *.log *.png
	#git ls-files -o | xargs rm -f
```

这个文件中的指令，即如何使用右侧文件构建左侧文件的规则。或者，换句话说，冒号左侧的是构建目标，冒号右侧的是构建它所需的依赖。缩进的部分是从依赖构建目标时需要用到的一段程序。在 `make` 中，第一条指令还指明了构建的目的，如果您使用不带参数的 `make`，这便是我们最终的构建结果。或者，您可以使用这样的命令来构建其他目标：`make plot-data.png`。

规则中的 `%` 是一种模式，它会匹配其左右两侧相同的字符串。例如，如果目标是 `plot-foo.png`， `make` 会去寻找 `foo.dat` 和 `plot.py` 作为依赖。现在，让我们看看如果在一个空的源码目录中执行`make` 会发生什么？

```bash
$make
make: *** No rule to make target 'paper.tex', needed by 'paper.pdf'.  Stop.
```

`make` 会告诉我们，为了构建出`paper.pdf`，它需要 `paper.tex`，但是并没有一条规则能够告诉它如何构建该文件。让我们构建它吧！

```bash
$touch paper.tex
$make
make: *** No rule to make target 'plot-data.png', needed by 'paper.pdf'.  Stop.
```

哟，有意思，我们是**有**构建 `plot-data.png` 的规则的，但是这是一条模式规则。因为源文件`data.dat` 并不存在，因此 `make` 就会告诉您它不能构建 `plot-data.png`，让我们创建这些文件：

```bash
$cat paper.tex
\documentclass{article}
\usepackage{graphicx}
\begin{document}
\includegraphics[scale=0.65]{plot-data.png}
\end{document}

$cat plot.py
#!/usr/bin/env python
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('-i', type=argparse.FileType('r'))
parser.add_argument('-o')
args = parser.parse_args()

data = np.loadtxt(args.i)
plt.plot(data[:, 0], data[:, 1])
plt.savefig(args.o)

$cat data.dat
1 1
2 2
3 3
4 4
5 8
```

当我们执行 `make` 时会发生什么？

```bash
$make
./plot.py -i data.dat -o plot-data.png
pdflatex paper.tex
... lots of output ...
```

看！PDF ！

如果再次执行 `make` 会怎样？

```bash
$make
make: 'paper.pdf' is up to date.
```

什么事情都没做！为什么？好吧，因为它什么都不需要做。**make 回去检查之前的构建是因其依赖改变而需要被更新。**让我们试试修改 `paper.tex` 在重新执行 `make`：

```bash
$vim paper.tex # edit
$make
pdflatex paper.tex ...
```

注意 `make` 并**没有**重新构建 `plot.py`，因为没必要；`plot-data.png` 的所有依赖都没有发生改变。

更多用 make 构建目标参考 [Standard Targets (GNU make)](https://www.gnu.org/software/make/manual/html_node/Standard-Targets.html#Standard-Targets)。

1.  大多数的 makefiles 都提供了 一个名为 `clean` 的构建目标，这并不是说我们会生成一个名为`clean`的文件，而是我们可以使用它清理文件，让 make 重新构建。您可以理解为它的作用是“撤销”所有构建步骤。在上面的 makefile 中为`paper.pdf`实现一个`clean` 目标。您需要将构建目标设置为[phony](https://www.gnu.org/software/make/manual/html_node/Phony-Targets.html)。您也许会发现 [`git ls-files`](https://git-scm.com/docs/git-ls-files) 子命令很有用。其他一些有用的 make 构建目标可以在[这里](https://www.gnu.org/software/make/manual/html_node/Standard-Targets.html#Standard-Targets)找到；
2.  指定版本要求的方法很多，让我们学习一下 [Rust 的构建系统](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html)的依赖管理。大多数的包管理仓库都支持类似的语法。对于每种语法(尖号、波浪号、通配符、比较、乘积)，构建一种场景使其具有实际意义；
3.  Git 可以作为一个简单的 CI 系统来使用，在任何 git 仓库中的 `.git/hooks` 目录中，您可以找到一些文件（当前处于未激活状态），它们的作用和脚本一样，当某些事件发生时便可以自动执行。请编写一个[`pre-commit`](https://git-scm.com/docs/githooks#_pre_commit) 钩子，它会在提交前执行 `make paper.pdf`并在出现构建失败的情况拒绝您的提交。这样做可以避免产生包含不可构建版本的提交信息；
4.  基于 [GitHub Pages](https://pages.github.com/) 创建任意一个可以自动发布的页面。添加一个[GitHub Action](https://github.com/features/actions) 到该仓库，对仓库中的所有 shell 文件执行 `shellcheck`([方法之一](https://github.com/marketplace/actions/shellcheck))；
5.  [构建属于您的](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/building-actions) GitHub action，对仓库中所有的`.md`文件执行[`proselint`](http://proselint.com/) 或 [`write-good`](https://github.com/btford/write-good)，在您的仓库中开启这一功能，提交一个包含错误的文件看看该功能是否生效。

