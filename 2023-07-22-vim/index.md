# Vim 学习指南


> Vim 是一个能跟上你思维速度的编辑器。

Vim 编辑器学习的步骤为：

1. 理解编辑器的设计理念和基本原理；
2. 学习命令，浏览教程，完成 `vimtutor`；
3. 情景练习；
4. 将编辑器替换成 Vim，持续使用；
5. 优化使用，自定义，安装扩展插件。

## 概况

### Vim 的哲学

> 在编程的时候，你会把大量时间花在阅读/编辑而不是在写代码上。所以，Vim 是一个多模态编辑 器：它对于插入文字和操纵文字有不同的模式。Vim 是可编程的（可以使用 Vimscript 或者像 Python 一样的其他程序语言），Vim 的接口本身也是一个程序语言：键入操作（以及其助记名） 是命令，这些命令也是可组合的。Vim 避免了使用鼠标，因为那样太慢了；Vim 甚至避免用 上下左右键因为那样需要太多的手指移动。

### 编辑模式

Vim 的设计以大多数时间都花在阅读、浏览和进行少量编辑改动为基础，因此它具有多种操作模式：

- 正常模式：在文件中四处移动光标进行修改
- 插入模式：插入文本
- 替换模式：替换文本
- 可视化模式（一般，行，块）：选中文本块
- 命令模式：用于执行命令

在正常模式，键入 `i` 进入插入模式，`R` 进入替换模式，`v` 进入可视（一般）模式，`V` 进入可视（行）模式，`<C-v>` （`Ctrl-V`, 有时也写作 `^V`）进入可视（块）模式，`:` 进入命令模式。

### 缓存， 标签页， 窗口

> Vim 会维护一系列打开的文件，称为“缓存”。一个 Vim 会话包含一系列标签页，每个标签页包含 一系列窗口（分隔面板）。每个窗口显示一个缓存。缓存和窗口不是一一对应的关系，窗口只是视角，一个缓存可以在多个窗口打开，比如在查看同一个文件的不同部分的时候。

> Vim 默认打开一个标签页，这个标签也包含一个窗口。

## Vim 的接口其实是一种编程语言

> Vim 最重要的设计思想是 Vim 的界面本身是一个程序语言。键入操作（以及他们的助记名） 本身是命令，这些命令可以组合使用。这使得移动和编辑更加高效，特别是一旦形成肌肉记忆。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/vi-vim-cheat-sheet-sch.gif)

### 移动

多数时候你会在正常模式下，使用移动命令在缓存中导航。在 Vim 里面移动也被称为 “名词”， 因为它们指向文字块。

- 基本移动: `hjkl` （左， 下， 上， 右）
- 词： `w` （下一个词）， `b` （词初）， `e` （词尾）
- 行： `0` （行初）， `^` （第一个非空格字符）， `$` （行尾）
- 屏幕： `H` （屏幕首行）， `M` （屏幕中间）， `L` （屏幕底部）
- 翻页： `Ctrl-u` （上翻）， `Ctrl-d` （下翻）
- 文件： `gg` （文件头）， `G` （文件尾）
- 行数： `:{行数}<CR>` 或者 `{行数}G` ({行数}为行数)
- 括号匹配： `%` （找到配对，比如括号或者 /\* \*/ 之类的注释对）
- 查找： `f{字符}`， `t{字符}`， `F{字符}`， `T{字符}`
  - 查找/到 向前/向后 在本行的{字符}
  - `,` / `;` 用于导航匹配
- 搜索: `/{正则表达式}`, `n` / `N` 用于导航匹配

### 选择

可视化模式:

- 可视化：`v`
- 可视化行： `V`
- 可视化块：`Ctrl+v`

可以用移动命令来选中。

### 编辑

所有你需要用鼠标做的事， 你现在都可以用键盘：采用编辑命令和移动命令的组合来完成。 这就是 Vim 的界面开始看起来像一个程序语言的时候。Vim 的编辑命令也被称为 “动词”， 因为动词可以施动于名词。

- `i` 进入插入模式
  - 但是对于操纵/编辑文本，不单想用退格键完成
- `O` / `o` 在之上/之下插入行
- `d{移动命令}` 删除 {移动命令}
  - 例如，`dw` 删除词, `d$` 删除到行尾, `d0` 删除到行头。
- `c{移动命令}` 改变 {移动命令}
  - 例如，`cw` 改变词
  - 比如 `d{移动命令}` 再 `i`
- `x` 删除字符（等同于 `dl`）
- `s` 替换字符（等同于 `xi`）
- 可视化模式 \+ 操作
  - 选中文字, `d` 删除 或者 `c` 改变
- `u` 撤销, `<C-r>` 重做
- `y` 复制 / “yank” （其他一些命令比如 `d` 也会复制）
- `p` 粘贴
- 更多值得学习的: 比如 `~` 改变字符的大小写

### 计数

你可以用一个计数来结合“名词”和“动词”，这会执行指定操作若干次。

- `3w` 向前移动三个词
- `5j` 向下移动 5 行
- `7dw` 删除 7 个词

### 修饰语

你可以用修饰语改变“名词”的意义。修饰语有 `i`，表示“内部”或者“在内“，和 `a`， 表示”周围“。

- `ci(` 改变当前括号内的内容
- `ci[` 改变当前方括号内的内容
- `da'` 删除一个单引号字符串， 包括周围的单引号

### 命令行

- `:q` 退出（关闭窗口）
- `:w` 保存（写）
- `:wq` 保存然后退出
- `:e {文件名}` 打开要编辑的文件
- `:ls` 显示打开的缓存
- `:help {标题}` 打开帮助文档
  - `:help :w` 打开 `:w` 命令的帮助文档
  - `:help w` 打开 `w` 移动的帮助文档

### 搜索和替换

`:s` （替换）命令（[文档](http://vim.wikia.com/wiki/Search_and_replace)）。

- `%s/foo/bar/g`
  - 在整个文件中将 foo 全局替换成 bar
- `%s/\[.*\](https://missing-semester-cn.github.io/2020/editors/\(.*\))/\1/g`
  - 将有命名的 Markdown 链接替换成简单 URLs

### 多窗口

- 用 `:sp` / `:vsp` 来分割窗口
- 同一个缓存可以在多个窗口中显示。

### 宏

- `q{字符}` 来开始在寄存器`{字符}`中录制宏
- `q`停止录制
- `@{字符}` 重放宏
- 宏的执行遇错误会停止
- `{计数}@{字符}`执行一个宏{计数}次
- 宏可以递归
  - 首先用`q{字符}q`清除宏
  - 录制该宏，用 `@{字符}` 来递归调用该宏 （在录制完成之前不会有任何操作）

## 自定义 Vim

Vim 由一个位于 `~/.vimrc` 的文本配置文件（包含 Vim 脚本命令）。你可能会启用很多基本 设置。

我们提供一个文档详细的基本设置，你可以用它当作你的初始设置。我们推荐使用这个设置因为 它修复了一些 Vim 默认设置奇怪行为。 **在[这儿](https://missing-semester-cn.github.io/2020/files/vimrc) 下载我们的设置，然后将它保存成 `~/.vimrc`.**

Vim 能够被重度自定义，花时间探索自定义选项是值得的。你可以参考其他人的在 GitHub 上共享的设置文件，比如，你的授课人的 Vim 设置 ([Anish](https://github.com/anishathalye/dotfiles/blob/master/vimrc), [Jon](https://github.com/jonhoo/configs/blob/master/editor/.config/nvim/init.vim) (uses [neovim](https://neovim.io/)), [Jose](https://github.com/JJGO/dotfiles/blob/master/vim/.vimrc))。 有很多好的博客文章也聊到了这个话题。尽量不要复制粘贴别人的整个设置文件， 而是阅读和理解它，然后采用对你有用的部分。

## 还有更多的 Vim 小窍门吗？

- 插件 \- 花时间去探索插件。有很多不错的插件修复了 vim 的缺陷或者增加了能够与现有 vim 工作流结合的新功能。关于这部分内容，资源是[VimAwesome](https://vimawesome.com/) 和其他程序员的 dotfiles。
- 标记 \- 在 vim 里你可以使用 `m<X>` 为字母 `X` 做标记，之后你可以通过 `'<X>` 回到标记位置。这可以让你快速定位到文件内或文件间的特定位置。
- 导航 \- `Ctrl+O` 和 `Ctrl+I` 命令可以使你在最近访问位置前后移动。
- 撤销树 \- vim 有不错的更改跟踪机制，不同于其他的编辑器，vim 存储变更树，因此即使你撤销后做了一些修改，你仍然可以通过撤销树的导航回到初始状态。一些插件比如 [gundo.vim](https://github.com/sjl/gundo.vim) 和 [undotree](https://github.com/mbbill/undotree) 通过图形化来展示撤销树。
- 时间撤销 \- `:earlier` 和 `:later` 命令使得你可以用时间而非某一时刻的更改来定位文件。
- [持续撤销](https://vim.fandom.com/wiki/Using_undo_branches#Persistent_undo) \- 是一个默认未被开启的 vim 的内置功能，它在 vim 启动之间保存撤销历史，需要配置在 `.vimrc` 目录下的`undofile` 和 `undodir`，vim 会保存每个文件的修改历史。
- 热键（Leader Key） - 热键是一个用于用户自定义配置命令的特殊按键。这种模式通常是按下后释放这个按键（通常是空格键）并与其他的按键组合去实现一个特殊的命令。插件也会用这些按键增加它们的功能，例如，插件 UndoTree 使用 `<Leader> U` 去打开撤销树。
- 高级文本对象 \- 文本对象比如搜索也可以用 vim 命令构成。例如，`d/<pattern>` 会删除下一处匹配 pattern 的字符串，`cgn` 可以用于更改上次搜索的关键字。

## 扩展 Vim

Vim 有很多扩展插件。跟很多互联网上已经过时的建议相反，你*不*需要在 Vim 使用一个插件 管理器（从 Vim 8.0 开始）。你可以使用内置的插件管理系统。只需要创建一个 `~/.vim/pack/vendor/start/` 的文件夹，然后把插件放到这里（比如通过 `git clone`）。

以下是一些推荐的插件：

- [ctrlp.vim](https://github.com/ctrlpvim/ctrlp.vim): 模糊文件查找
- [ack.vim](https://github.com/mileszs/ack.vim): 代码搜索
- [nerdtree](https://github.com/scrooloose/nerdtree): 文件浏览器
- [vim-easymotion](https://github.com/easymotion/vim-easymotion): 魔术操作

我们尽量避免在这里提供一份冗长的插件列表。你可以查看讲师们的开源的配置文件 ([Anish](https://github.com/anishathalye/dotfiles), [Jon](https://github.com/jonhoo/configs), [Jose](https://github.com/JJGO/dotfiles)) 来看看我们使用的其他插件。 浏览 [Vim Awesome](https://vimawesome.com/) 来了解一些很棒的插件。 这个话题也有很多博客文章：搜索 “best Vim plugins”。

## 其他程序的 Vim 模式

很多工具提供了 Vim 模式。这些 Vim 模式的质量参差不齐；取决于具体工具，有的提供了 很多酷炫的 Vim 功能，但是大多数对基本功能支持的很好。

### Shell

如果你是一个 Bash 用户，用 `set -o vi`。如果你用 Zsh：`bindkey -v`，或者用插件[zsh-vi-mode](https://github.com/jeffreytse/zsh-vi-mode)。Fish 用 `fish_vi_key_bindings`。另外，不管利用什么 shell，你可以 `export EDITOR=vim`。 这是一个用来决定当一个程序需要启动编辑时启动哪个的环境变量。 例如，`git` 会使用这个编辑器来编辑 commit 信息。

### Readline

很多程序使用 [GNU Readline](https://tiswww.case.edu/php/chet/readline/rltop.html) 库来作为 它们的命令控制行界面。Readline 也支持基本的 Vim 模式， 可以通过在 `~/.inputrc` 添加如下行开启：

```
set editing-mode vi
```

比如，在这个设置下，Python REPL 会支持 Vim 快捷键。

### 其他

甚至有 Vim 的网页浏览快捷键 [browsers](http://vim.wikia.com/wiki/Vim_key_bindings_for_web_browsers), 受欢迎的有 用于 Google Chrome 的 [Vimium](https://chrome.google.com/webstore/detail/vimium/dbepggeogbaibhgnhhndojpepiihcmeb?hl=en) 和用于 Firefox 的 [Tridactyl](https://github.com/tridactyl/tridactyl)。 你甚至可以在 [Jupyter notebooks](https://github.com/lambdalisue/jupyter-vim-binding) 中用 Vim 快捷键。 [这个列表](https://reversed.top/2016-08-13/big-list-of-vim-like-software) 中列举了支持类 vim 键位绑定的软件。

## 例子

### fizz_buzz

这里是一个有问题的 [fizz buzz](https://en.wikipedia.org/wiki/Fizz_buzz) 实现：

```
def fizz_buzz(limit):
    for i in range(limit):
        if i % 3 == 0:
            print('fizz')
        if i % 5 == 0:
            print('fizz')
        if i % 3 and i % 5:
            print(i)

def main():
    fizz_buzz(10)
```

我们会修复以下问题：

- 主函数没有被调用
- 从 0 而不是 1 开始
- 在 15 的整数倍的时候在不用行打印 “fizz” 和 “buzz”
- 在 5 的整数倍的时候打印 “fizz”
- 采用硬编码的参数 10 而不是从命令控制行读取参数
- 主函数没有被调用
  - `G` 文件尾
  - `o` 向下打开一个新行
  - 输入 “if **name** …”
- 从 0 而不是 1 开始
  - 搜索 `/range`
  - `ww` 向前移动两个词
  - `i` 插入文字， “1, “
  - `ea` 在 limit 后插入， “+1”
- 在新的一行 “fizzbuzz”
  - `jj$i` 插入文字到行尾
  - 加入 “, end=’’”
  - `jj.` 重复第二个打印
  - `jjo` 在 if 打开一行
  - 加入 “else: print()”
- fizz fizz
  - `ci'` 变到 fizz
- 命令控制行参数
  - `ggO` 向上打开
  - “import sys”
  - `/10`
  - `ci(` to “int(sys.argv\[1\])”

### xml 转成 json

将 xml 转成 json ([file](https://missing-semester-cn.github.io/2020/files/example-data.xml))

- 一个有 “name” / “email” 键对象的数组
- 用一个 Python 程序？
- 用 sed / 正则表达式
  - `g/people/d`
  - `%s/<person>/{/g`
  - `%s/<name>\(.*\)<\/name>/"name": "\1",/g`
  - …
- Vim 命令 / 宏
  - `Gdd`, `ggdd` 删除第一行和最后一行
  - 格式化最后一个元素的宏 （寄存器 `e`）
    - 跳转到有 `<name>` 的行
    - `qe^r"f>s": "<ESC>f<C"<ESC>q`
  - 格式化一个的宏
    - 跳转到有 `<person>` 的行
    - `qpS{<ESC>j@eA,<ESC>j@ejS},<ESC>q`
  - 格式化一个标签然后转到另外一个的宏
    - 跳转到有 `<person>` 的行
    - `qq@pjq`
  - 执行宏到文件尾
    - `999@q`
  - 手动移除最后的 `,` 然后加上 `[` 和 `]` 分隔符

## More

### TODO

- 持续使用，遇到麻烦的时候，去探索优化一下。
- 整理技巧、拓展和配置等

### Ref

- `vimtutor` 是一个 Vim 安装时自带的教程，80 列，24 行） 终端窗口看起来效果最好
- [Vim Adventures](https://vim-adventures.com/) 是一个学习使用 Vim 的游戏
- [Vim Tips Wiki](http://vim.wikia.com/wiki/Vim_Tips_Wiki)
- [Vim Advent Calendar](https://vimways.org/2019/) 有很多 Vim 小技巧
- [Vim Golf](http://www.vimgolf.com/) 是用 Vim 的用户界面作为程序语言的 [code golf](https://en.wikipedia.org/wiki/Code_golf)
- [Vi/Vim Stack Exchange](https://vi.stackexchange.com/)
- [Vim Screencasts](http://vimcasts.org/)
- [Practical Vim](https://pragprog.com/titles/dnvim2/)（书籍）
- [welcome home : vim online](https://www.vim.org/)

