# Git 使用指南


> Git 是目前世界上最先进的分布式文本文件版本控制系统

## Git 快速上手

Cheat Sheet：[workspace :: Git Cheatsheet](http://ndpsoftware.com/git-cheatsheet.html#loc=workspace;) 、[常用 Git 命令清单 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2015/12/git-cheat-sheet.html)

Git 使用流程：[Git 使用规范流程 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2015/08/git-use-process.html)

### Git 基本概念

- 工作区（Working Directory），即电脑里能看到的目录
- 版本库/本地仓库（Repository），即工作区的隐藏目录 `.git` ，包含暂存区、分支、HEAD 等
- 暂存区（stage/index），存在于版本库之中
- 分支（branch），Git 创建版本库时，会自动创建第一个分支 `master` ，以及指向 `master` 的一个指针 `HEAD`
- 远程仓库（remote repository）

![](http://gityuan.com/images/git/1.png)

上图来自：[Git 常用命令 - Gityuan 博客 \| 袁辉辉的 Android 博客](http://gityuan.com/2015/06/27/git-notes/)

### 安装 Git

#### Linux

可以用 `git` 在终端测试系统是否安装了 Git，安装方法是 `sudo apt-get install git`

#### macOS

一是安装 homebrew，然后通过 homebrew 安装 Git，具体方法请参考 homebrew 的文档：[The missing package manager for macOS (or Linux)](https://brew.sh/)。

二是直接从 AppStore 安装 Xcode，更简单，也更推荐。Xcode 集成了 Git，不过默认没有安装，你需要运行 Xcode，选择菜单 `Xcode->Preferences` ，在弹出窗口中找到 `Downloads` ，选择 `Command Line Tools`，点 `Install`就可以完成安装了。

### 全局配置

安装完成后，还需要最后一步设置，在命令行输入：

```shell
$ git config --global user.name "Your Name"
$ git config --global user.email "email@example.com"
```

因为 Git 是分布式版本控制系统，所以要表明各自的身份。

### 创建版本库(repository，仓库)和提交修改

版本库可以简单理解成一个目录，这个目录里面的所有文件都可以被 Git 管理起来，每个文件的修改、删除，Git 都能跟踪，以便任何时刻都可以追踪历史，或者在将来某个时刻可以还原。

#### 创建版本库

进入到一个目录，通过 `git init` 命令把这个目录变成 Git 可以管理的仓库，此时输入 `ls -ah` 命令，发现当前目录下多了一个 `.git` 的目录

#### 把工作区（目录）的修改添加到暂存区

若新建了 `README.md` ，用命令 `git add README.md` 把文件添加到仓库暂存区，`git add .` 可将所有的修改添加到暂存区

#### 查看仓库当前状态

用命令 `git status` 可以查看仓库当前状态

```
On branch master

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)

	new file:   README.md
```

#### 提交到当前分支

用命令 `git commit -m "commit message"` 把本次修改提交到当前分支，此时工作区变为 `nothing to commit, working tree clean`

#### 一步将工作区的修改提交到分支

用命令 `git commit -am "commit message"` 可以提交工作区所有 tracked 的修改到当前分支。

### 撤销修改和版本回滚

万事都有失，Git 挽回失误的操作有撤销「添加到暂存区」、撤销「本次提交到当前分支」、回滚到「之前的某一次提交」。

#### 查看工作区的修改

`git diff` 查看上次对工作区的修改，显示工作区与暂存区的比较（优先）或工作区与当前分支比较，显示的格式正是 Unix 通用的 diff 格式。

#### 撤销工作区修改

用 `git status` 查看当前仓库状态时，`Changes not staged for commit:` 下面会提示如何撤销工作区修改， `use "git checkout -- <file>..." to discard changes in working directory` ，即用 `git checkout -- <file>` 将文件在工作区的修改恢复到上一次添加到暂存区后的状态（优先）或当前分支的状态。

#### 撤销添加到暂存区

用 `git status` 查看当前仓库状态时，`Changes to be committed:` 下面会提示如何撤销暂存区的修改， `use "git reset HEAD <file>..." to unstage` ，即用 `git reset HEAD <file>` 把暂存区的修改撤销掉，重新放回工作区。若再用 `git checkout -- <file>` 可以把文件恢复与版本库中当前版本一致。

#### 版本回退

用 `git log` 命令查看提交日志（从最近到最远），加上 `--pretty=oneline` 参数，仅显示版本号（commit id）、commit message 和 HEAD 指针的指向当前版本。

使用 `git reset` 命令可退回以前版本，原理是改变 HEAD 指针的指向，其间提交的版本不可在 `git log` 命令下显示。

- 使用 `git reset --hard HEAD^` 命令退回到上一个版本
- 或用 `git reset --hard HEAD~n` 往前退回 n 版本
- 或用 `git reset -- hard <前五位 commit id>` 回退到一特定版本

Git 提供了一个命令 `git reflog` 来记录每一次提交，包括 HEAD 指针之后的版本，用 `git reset -- hard <前五位 commit id>` 依旧可以回退到一特定版本。

#### 删除文件

从版本库中删除文件可用命令 `git rm <file>` ，参数 ` —cached` 保存工作区的文件， ` -f` 删除工作区和版本库的文件。

### 远程仓库

远程仓库以 GitHub 为例。

#### 建立本地 SSH Key 密钥对

本地 Git 仓库和 GitHub 仓库之间的传输是通过 SSH 加密的，需要创建 SSH Key。

在用户主目录下，看看有没有 `.ssh/ ` 目录，若有，再看看这个目录下有没有 `id_rsa` 和 `id_rsa.pub` 文件，若有，可直接跳过这一步。若没有，打开 Shell 创建 SSH Key ，`ssh-keygen -t rsa -C "youremail@example.com"` ，为了方便无需设置密码。

一路回车后，在用户主目录里找到 `.ssh` 目录，里面有 `id_rsa` 和 `id_rsa.pub` 两个文件，即 SSH Key 的密钥对， `id_rsa` 是私钥，不能泄露出去， `id_rsa.pub` 是公钥。

#### 把公钥给 GitHub

登陆 GitHub，打开 `Account settings` ，进入 `SSH Keys` 页面，点 `Add SSH Key` ，填上任意 Title ，在 Key 文本框里粘贴 `id_rsa.pub` 文件的内容。

#### 关联远程仓库

在 GitHub 新建一个空仓库，根据 GitHub 提示，在本地仓库下运行 `git remote add origin git@github.com:<GitHub Username>/<repository name>.git` 命令。 `origin` 就是远程仓库的名字，是 Git 的默认叫法。

下一步把本地库的所有内容推送到远程库上，运行 `git push -u origin master` 可以把当前分支 `master` 推送到 `origin` 。参数 `-u` 会把本地的 `master` 分支与远程的 `master` 分支关联，以后推送或拉取时就可以简化为 `git push` 和 `git pull` 。

#### 从远程库克隆

运行 `git clone git@github.com:<GitHub Username>/<repository name>.git` 可以将远程仓库克隆到本地，会在当前目录下生成一个 `repository name` 文件。

Git 支持多种协议，包括 `https `，但通过 `ssh` 支持的原生 `git` 协议速度最快。

#### SSH 警告

第一次使用 Git 的 `clone` 或者 `push` 命令连接 GitHub 时，会得到一个警告：

```
The authenticity of host 'github.com (xx.xx.xx.xx)' can't be established.
RSA key fingerprint is xx.xx.xx.xx.xx.
Are you sure you want to continue connecting (yes/no)?
```

这是因为 Git 使用 SSH 连接，而 SSH 连接在第一次验证 GitHub 服务器的 Key 时，需要你确认 GitHub 的 Key 的指纹信息是否真的来自 GitHub 的服务器，输入`yes` 回车即可。此时 `~/.ssh/konwn_host` 文件里会多一个 github.com host.

#### 忽略特殊文件

在 Git 工作区的根目录下创建一个特殊的 `.gitignore` 文件，然后把要忽略的文件名填进去，Git 就会自动忽略这些文件。GitHub 已经为我们准备了各种配置文件：[github/gitignore: A collection of useful .gitignore templates](https://github.com/github/gitignore) ，再把 `.gitignore` 也提交到 Git。

忽略文件的原则是：

1. 忽略操作系统自动生成的文件，比如缩略图等；
2. 忽略编译生成的中间文件、可执行文件等，也就是若一个文件是通过另一个文件自动生成的，那自动生成的文件就没必要放进版本库，比如 Python 编译产生的 `.pyc` 文件、 `.pyo` 文件和 `dist` 目录；
3. 忽略你自己的带有敏感信息的配置文件，比如存放口令的配置文件。

若确实想添加被忽略的文件，可以用 `-f` 强制添加到 Git，`git add -f test.pyc` 。

`git check-ignore `命令检查被忽略的文件来自哪条规则

```shell
$ git check-ignore -v test.pyc
.gitignore:2:__pycache__/    test.pyc
```

`.gitignore `的第 2 行规则忽略了该文件。

## 分支管理

分支管理可以让开发者从容地写一个新功能，而不用担心代码无处提交。

### 创建与合并分支

截止到目前，在 Git 里只有一个分支，叫主分支，即`master`分支。`master` 指向提交，`HEAD `指向当前分支，每次提交，`master `分支都会向前移动一步。

#### 创建分支

运行 `git checkout -b dev` 创建新的分支，并切换到 `dev` 分支。 `git checkout` 加上 `-b`参数表示创建并切换，相当于创建新的分支 `git branch dev` 加上切换分支 `git checkout dev` .

创建新的分支时，例如 `dev` ，Git 会新建了一个指针叫 `dev` ，指向 `master` 相同的提交，再把 `HEAD` 指向 `dev` ，就表示当前分支在 `dev` 上。现在开始，对工作区的修改和提交就是针对 `dev` 分支，比如新提交一次后，`dev `指针往前移动一步，而 `master` 指针不变。

```
          master
            ↓
○---○---○---○---○
                ↑
               dev ← HEAD
```

#### 合并分支

假如在 `dev` 上的工作完成了，就可以把 `dev` 合并到 `master` 上，最简单的方法，就是直接把 `master` 指向 `dev` 的当前提交。

命令是运行 `git checkout master` 把 HEAD 指针指向 `master` 分支，然后运行 `git merge dev` 把 `dev` 分支的工作成果合并到 `master` 分支上。终端返回 `Fast-forward` 信息表示这次合并是「快进模式」，即直接把 `master` 指向 `dev` 的当前提交。

```
             master ← HEAD
                ↓
○---○---○---○---○
                ↑
               dev
```

但不是每次合并都能 `Fast-forward` ，后面会讲其他方式的合并。

合并完分支后，可以删除 `dev` 分支， `git branch -d dev` ，即删除`dev` 指针。删除后，查看 `branch` ， `git branch` ，只剩下 `master` 分支。

#### 解决分支合并冲突

若在新建的分支 `dev` 修改了 `README.md` 并提交，又切换回 `master` 分支，修改了 `README.md` 并提交，则此时的 `master` 和 `dev` 处在不同的提交时间轴上。

```
             master ← HEAD
                ↓
○---○---○---○---○
             \---○
                 ↑
                dev
```

此时运行 `git merge dev` ，会报错（ `git status` 也会提示冲突的文件）

```
Auto-merging README.md
CONFLICT (content): Merge conflict in README.md
Automatic merge failed; fix conflicts and then commit the result.
```

`README.md` 文件存在冲突，必须手动解决冲突后再提交。查看 `README.md`

```shell
<<<<<<< HEAD
Creating a new branch is quick & simple.
=======
Creating a new branch is quick AND simple.
>>>>>>> dev
```

Git 用 `<<<<<<<` ， `======= `， `>>>>>>>` 标记出不同分支的内容，假如修改 `README.md` 为

```
Creating a new branch is quick and simple.
```

再提交

```shell
git add README.md
git commit -m "conflict fixed"
```

现在 `master` 分支和 `dev` 成了下图所示

```
                 master ← HEAD
										↓
○---○---○---○---○---○
             \--○--/
                ↑
               dev
```

`git log --graph --pretty=oneline --abbrev-commit` 可以看到分支的合并情况。 ` —graph` 参数可查看分支合并图，`--abbrev-commit` 参数可缩写 commit 信息。

```
*   b75b466 (HEAD -> master) conflict fixed
|\
| * 3d0eb40 (feature1) using And
* | 42c89d0 using &
|/
* 01c11b4 branch test
...
```

删除 `dev` 分支。

### 分支管理策略

通常，合并分支时，若可能，Git 会用 `Fast forward` 模式，但这种模式下，删除分支后会丢掉分支信息。

若要强制禁用 `Fast forward `模式，Git 就会在 merge 时生成一个新的 commit ，这样，从分支历史上就可以看出分支信息。可以在 merge 时添加 `--no-ff` 参数在分支历史上呈现合并分支信息，`--no-ff` 参数表示禁用 `Fast forward` 。

仍然创建并切换 `dev` 分支，修改 `README.md` 文件，并提交一个新的 commit ，再切换回 `master` 。此时运行 `git merge --no-ff -m "merge with no-ff" dev` ，终端返回

```
Merge made by the 'recursive' strategy.
 README.md | 1 +
 1 file changed, 1 insertion(+)
```

合并后，用 `git log` 查看分支历史

```shell
$ git log --graph --pretty=oneline --abbrev-commit
*   3481f74 (HEAD -> master) merge with no-ff
|\
| * 3a86b6c (dev) add merge
|/
*   b75b466 conflict fixed
...
```

在实际开发中，应该按照几个基本原则进行分支管理：

1. `master `分支应该非常稳定，仅用来发布新版本，平时不能在上面干活；
2. 干活都在 `dev` 分支上，版本发布时，再把 `dev` 分支合并到 `master` 上，在 `master` 分支发布版本；
3. 团队合作时，每个人都在 `dev` 分支上干活，每个人都有自己的分支，时不时地往 `dev` 分支上合并。

#### Bug 分支

每个 bug 都可以通过一个新的临时分支来修复，修复后合并分支，然后将临时分支删除。

Git 提供了一个 `stash` 功能，可以把当前工作现场「储藏」起来，等以后恢复现场后继续工作。

在 `dev` 分支修改 `README.md` 后，

```shell
$ git stash
Saved working directory and index state WIP on dev: 3a86b6c test hard merge
```

现在用 `git status` 查看工作区，是干净的，因此可以放心地创建分支来修复 bug 。

若需要在 `master `分支上修复 bug ，则从 `master` 创建临时分支。

```shell
$ git checkout master
$ git checkout -b issue-101
```

修改 bug ，这里修改了 `README.md` ，然后提交

```shell
$ git commit -am "fix bug 101"
[issue-101 4d97816] fix bug 101
 1 file changed, 1 insertion(+), 1 deletion(-)
```

修复完成后，切换到 `master` 分支，并完成合并，最后删除 `issue-101` 分支

```shell
$ git checkout master
$ git merge --no-ff -m "merged bug fix 101" issue-101
Merge made by the 'recursive' strategy.
 readme.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git branch -d issue-101
```

重新回到 `dev` 分支干活

```shell
$ git checkout dev
$ git status
On branch dev
nothing to commit, working tree clean
```

工作区是干净的，用 `git stash list` 命令工作现场

```shell
$ git stash list
stash@{0}: WIP on dev: 3a86b6c add merge
```

恢复工作现场有两个办法

- 用 `git stash apply` 恢复，但是恢复后，stash 内容并不删除，需要用 `git stash drop` 来删除
- 用 `git stash pop` ，恢复的同时把 stash 内容也删了

```shell
$ git stash pop
On branch dev
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   README.md

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (e8f4328c3334144570f3c6d38641fc971aa460a2)
```

此外，还可以多次 stash，恢复的时候，先用 `git stash list` 查看，然后恢复指定的 stash，用命令 `git stash apply stash@{0}` 。

#### Feature 分支

软件开发中，总有无穷无尽的新的功能要不断添加进来。每添加一个新功能，最好在新建分支 `feature` 上面开发（以免污染 `dev` ），完成后合并删除 `feature` 分支。

若新功能突然不需要了，`git branch -d feature-name` 命令会报错

```
error: The branch 'feature-name' is not fully merged.
If you are sure you want to delete it, run 'git branch -D feature-name'.
```

可以运行 `git branch -D feature-name` 强行删除。

#### Git 工作流程

[Git 工作流程 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2015/12/git-workflow.html)

[Git 分支管理策略 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2012/07/git.html)

### 多人协作开发

要查看远程库的信息，用 `git remote` ，或者用 `git remote -v` 显示更详细的信息

```shell
$ git remote -v
origin  git@github.com:michaelliao/learngit.git (fetch)
origin  git@github.com:michaelliao/learngit.git (push)
```

上面显示了可以抓取和推送的 `origin` 的地址，若没有推送权限，就看不到 push 的地址。

#### 推送分支

推送分支，就是把该分支上的所有本地提交推送到远程库。推送时，要指定本地分支，这样 Git 就会把该分支推送到远程库对应的远程分支上，例如 `git push origin dev` 。

有些本地分支不需要往远程推送，有些本地分支需要往远程推送

- `master ` 分支是主分支，要时刻与远程同步；
- `dev` 分支是开发分支，团队所有成员都需要在上面工作，所以也需要与远程同步；
- bug 分支只用于在本地修复 bug，就没必要推到远程了；
- feature 分支是否推到远程，取决于是否和小伙伴合作在上面开发。

#### 抓取分支

多人协作时，大家都会往 `master` 和 `dev` 分支上推送各自的修改。

假设有小伙伴要在 `dev` 分支上开发，就必须创建远程 `origin` 的 `dev` 分支到本地，于是他用命令 `git checkout -b dev origin/dev` 创建本地 `dev` 分支。接着他修改了 `README.md` ，并提交到本地仓库的 `dev` 分支，然后 `git push origin dev` 推送到远程仓库。

碰巧你也修改了 `README.md` ，并提交到本地仓库的 `dev` 分支。

```shell
$ git push origin dev
To github.com:<github username>/<repository>.git
 ! [rejected]        dev -> dev (non-fast-forward)
error: failed to push some refs to 'git@github.com:<github username>/<repository>.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

因为有小伙伴的最新提交和你试图推送的提交有冲突，所以推送失败。解决办法 Git 已经提示我们，先用 `git pull` 把最新的提交从 `origin/dev` 抓下来，然后在本地合并，解决冲突，再推送。

```shell
$ git pull
There is no tracking information for the current branch.
Please specify which branch you want to merge with.
See git-pull(1) for details.

    git pull <remote> <branch>

If you wish to set tracking information for this branch you can do so with:

    git branch --set-upstream-to=origin/<branch> dev
```

`git pull `也失败了，原因是没有指定本地 `dev` 分支与远程 `origin/dev` 分支的链接，根据提示设置 `dev` 和 `origin/dev` 的链接，再 pull

```shell
$ git branch --set-upstream-to=origin/dev dev
Branch 'dev' set up to track remote branch 'dev' from 'origin'.
$ git pull
Auto-merging README.md
CONFLICT (add/add): Merge conflict in README.md
Automatic merge failed; fix conflicts and then commit the result.
```

`git pull ` 成功，但是合并有冲突，需要手动解决，见前文「解决分支合并冲突」，再 `git push origin dev` 。

#### Rebase

多人在同一个分支上协作时，很容易出现冲突。即使没有冲突，后 push 的小伙伴也不得不先 pull，在本地合并，然后才能 push 成功。

每次合并再 push 后，分支变成了这样

```shell
$ git log --graph --pretty=oneline --abbrev-commit
* d1be385 (HEAD -> master, origin/master) init hello
*   e5e69f1 Merge branch 'dev'
|\
| *   57c53ab (origin/dev, dev) fix env conflict
| |\
| | * 7a5e5dd add env
| * | 7bd91f1 add new env
| |/
* |   12a631b merged bug fix 101
|\ \
| * | 4c805e2 fix bug 101
|/ /
* |   e1e9c68 merge with no-ff
|\ \
| |/
| * f52c633 add merge
|/
*   cf810e4 conflict fixed
...
```

Git 有一种称为 rebase(变基) 的操作，能把分叉的提交变成直线，使查看历史提交的变化更容易。

在和远程分支同步后，对 `hello.py` 做了两次提交。用 `git log` 命令查看

```shell
$ git log --graph --pretty=oneline --abbrev-commit
* 582d922 (HEAD -> master) add author
* 8875536 add comment
* d1be385 (origin/master) init hello
*   e5e69f1 Merge branch 'dev'
|\
| *   57c53ab (origin/dev, dev) fix env conflict
| |\
| | * 7a5e5dd add env
| * | 7bd91f1 add new env
...
```

注意到 Git 用 `(HEAD -> master)` 和 `(origin/master)` 标识出当前分支的 HEAD 和远程 origin 的位置分别是 `582d922 add author` 和 `d1be385 init hello` ，本地分支比远程分支快两个提交。

现在尝试推送本地分支

```shell
$ git push origin master
To github.com:<github username>/<repository>.git
 ! [rejected]        master -> master (fetch first)
error: failed to push some refs to 'git@github.com:<github username>/<repository>.git'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally. This is usually caused by another repository pushing
hint: to the same ref. You may want to first integrate the remote changes
hint: (e.g., 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

说明有小伙伴抢先推送了远程分支，按照提示先 pull

```shell
$ git pull
remote: Counting objects: 3, done.
remote: Compressing objects: 100% (1/1), done.
remote: Total 3 (delta 1), reused 3 (delta 1), pack-reused 0
Unpacking objects: 100% (3/3), done.
From github.com:<github username>/<repository>
   d1be385..f005ed4  master     -> origin/master
 * [new tag]         v1.0       -> v1.0
Auto-merging hello.py
Merge made by the 'recursive' strategy.
 hello.py | 1 +
 1 file changed, 1 insertion(+)
```

再用 `git status` 查看状态

```shell
$ git status
On branch master
Your branch is ahead of 'origin/master' by 3 commits.
  (use "git push" to publish your local commits)

nothing to commit, working tree clean
```

加上刚才合并的提交，现在本地分支比远程分支超前 3 个提交，用 `git log` 查看

```shell
$ git log --graph --pretty=oneline --abbrev-commit
*   e0ea545 (HEAD -> master) Merge branch 'master' of github.com:<github username>/<repository>
|\
| * f005ed4 (origin/master) set exit=1
* | 582d922 add author
* | 8875536 add comment
|/
* d1be385 init hello
...
```

不好看！此时，rebase 派上了用场，把本地前几次推送的版本，从前往后与小伙伴已经推送的版本合并

```shell
$ git rebase
First, rewinding head to replay your work on top of it...
Applying: add comment
Using index info to reconstruct a base tree...
M    hello.py
Falling back to patching base and 3-way merge...
Auto-merging hello.py
Applying: add author
Using index info to reconstruct a base tree...
M    hello.py
Falling back to patching base and 3-way merge...
Auto-merging hello.py
```

再用 `git log` 看看

```shell
$ git log --graph --pretty=oneline --abbrev-commit
* 7e61ed4 (HEAD -> master) add author
* 3611cfe add comment
* f005ed4 (origin/master) set exit=1
* d1be385 init hello
...
```

### Git 远程操作

#### git remote

不带选项的时候， `git remote `命令列出所有远程主机

```shell
$ git remote
origin
```

使用`-v`选项，可以参看远程主机的网址。

克隆版本库的时候，所使用的远程主机自动被 Git 命名为 `origin` 。若想用其他的主机名，需要用 `git clone `命令的 `-o` 选项指定

```shel
$ git clone -o jQuery https://github.com/jquery/jquery.git
$ git remote
jQuery
```

查看该主机的详细信息

```shell
$ git remote show <主机名>
```

添加远程主机

```shell
$ git remote add <主机名> <网址/SSH>
```

删除远程主机

```shell
$ git remote rm <主机名>
```

远程主机改名

```shell
$ git remote rename <原主机名> <新主机名>
```

#### git fetch

默认情况下， `git fetch `取回所有分支（branch）的更新。若只想取回特定分支的更新，可以指定分支名。

```shell
$ git fetch <远程主机名> <分支名>
```

`git branch `命令的 `-r` 选项，可以用来查看远程分支， `-a` 选项查看所有分支。

所取回的更新，在本地主机上要用「远程主机名/分支名」的形式读取。取回远程主机的更新以后，可以在它的基础上，使用 `git checkout` 命令创建一个新的分支。

```shell
$ git checkout -b newBrach origin/master
```

此外，也可以使用 `git merge` 命令或者 `git rebase` 命令，在本地分支上合并远程分支。

```shell
$ git merge origin/master
# 或者
$ git rebase origin/master
```

#### git pull

`git pull `命令的作用是，取回远程主机某个分支的更新，再与本地的指定分支合并。

```shell
$ git pull <远程主机名> <远程分支名>:<本地分支名>
# 同于
$ git fetch <远程主机名>
$ git merge <远程主机名>/<远程分支名>
```

如果远程分支是与当前分支合并，则冒号后面的部分可以省略。

如果合并需要采用 rebase 模式，可以使用 `--rebase` 选项。

```shell
$ git pull --rebase <远程主机名> <远程分支名>:<本地分支名>
```

如果远程主机删除了某个分支，默认情况下，`git pull` 不会在拉取远程分支的时候删除对应的本地分支。这是为了防止，由于其他人操作了远程主机，导致 `git pull` 不知不觉删除了本地分支。加上参数 `-p` 就会在本地删除远程已经删除的分支。

```shell
$ git pull -p
# 等同于
$ git fetch --prune origin
$ git fetch -p
```

#### git push

`git push` 命令用于将本地分支的更新，推送到远程主机。它的格式与 `git pull` 命令相仿。

```shell
$ git push <远程主机名> <本地分支名>:<远程分支名>
```

`git push <远程主机名> <本地分支名>` ，将 `<本地分支名>` 本地分支推送到 `<远程主机名>` 主机的 `<本地分支名>` 分支。如果后者不存在，则会被新建。

如果省略本地分支名，则表示删除指定的远程分支，因为这等同于推送一个空的本地分支到远程分支。

```shell
$ git push origin :master
# 等同于
$ git push origin --delete master
```

不带任何参数的 `git push` ，默认只推送当前分支，这叫做 simple 方式。此外，还有一种 matching 方式，会推送所有有对应的远程分支的本地分支。如果要修改这个设置，可以采用`git config`命令。

```shell
$ git config --global push.default matching
```

还有一种情况，就是不管是否存在对应的远程分支，将本地的所有分支都推送到远程主机，这时需要使用 `--all` 选项。

```shell
$ git push --all origin
```

上面命令表示，将所有本地分支都推送到 `origin` 主机。

如果远程主机的版本比本地版本更新，推送时 Git 会报错，要求先在本地做 `git pull` 合并差异，然后再推送到远程主机。这时，如果你一定要推送，可以使用 `--force` 选项。

```javascript
$ git push --force origin
```

上面命令使用 `--force` 选项，结果导致远程主机上更新的版本被覆盖。除非你很确定要这样做，否则应该尽量避免使用 `--force` 选项。

## 标签管理

发布一个版本时，通常先在版本库中打一个标签（tag）（指向某个 commit 的指针），这样就唯一确定了打标签时刻的版本，即标签是版本库的一个快照。

### 创建标签

切换到需要打标签的分支上，再打标签

```shell
$ git tag v1.0
```

默认标签是打在最新提交的 commit 上，但有时也会忘记，方法是找到历史提交的 commit id ，然后打上标签

```shell
$ git tag v0.9 f1e08
```

再用命令 `git tag` 查看标签，标签按字母排序

```shell
$ git tag
v0.9
v1.0
```

可以用 `git show <tagname>` 查看标签信息

```shell
$ git show v0.9
commit f1e08437318d1e871680120c95bdcecb05a56b68 (tag: v0.9)
Author: <user.name> <<user.emali>>
Date:   Sat Apr 6 16:14:10 2019 +0800

    add merge

diff --git a/README.md b/README.md
...
```

还可以创建带有说明的标签，用 `-a` 指定标签名， `-m` 指定说明文字

```shell
git tag -a v0.1 -m "version 0.1 released" 45f6a
```

标签总是和某个 commit 挂钩。若这个 commit 既出现在 master 分支，又出现在 dev 分支，那么在这两个分支上都会看到这个标签。

### 操作标签

若标签打错了，也可以删除

```shell
$ git tag -d v0.1
Deleted tag 'v0.1' (was 45f6ab3)
```

若要推送某个标签到远程，使用命令 `git push origin <tagname>`

```shell
$ git push origin v1.0
Total 0 (delta 0), reused 0 (delta 0)
To github.com:<github username>/<repository>.git
 * [new tag]         v1.0 -> v1.0
```

也可以一次性推送全部尚未推送到远程的本地标签， `git push origin --tags`

若标签已经推送到远程，要删除远程标签就要删除， `git tag -d v0.9` ，再从远程删除， `git push origin :refs/tags/v0.9` 。

## 其他 Git 技巧

### 配置别名

若用 `st` 表示 `status` ，可以为 `status` 配置别名， `git config --global alias.st status` 。

`git config --global alias.unstage 'reset HEAD'` ，自定义撤销暂存区的修改操作。

更有甚者，`git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"` 。

每个仓库的 Git 配置文件都放在 `.git/config` 文件中，当前用户的 Git 配置文件放在用户主目录下 `.gitconfig` 文件中，删除配置别名可以直接删除在 Git 配置文件对应的行

```
[alias]
    st = status
    unstage = reset HEAD
```

此外

```bash
# 显示当前的Git配置
$ git config --list

# 编辑Git配置文件
$ git config -e [--global]
```

### 搭建 Git 服务器

远程仓库实际上和本地仓库没啥不同，只是一直保持开机并供小伙伴交换修改。

搭建 Git 服务器需要准备一台运行 Linux 的机器，强烈推荐用 Ubuntu 或 Debian ，这样通过几条简单的 `apt` 命令就可以完成安装。

1. 安装 `git` ： `sudo apt-get install git`

2. 创建一个 `git` 用户，用来运行 `git` 服务： `sudo adduser git`

3. 创建证书登录：收集所有需要登录的用户的公钥，即 `id_rsa.pub` 文件，把所有公钥导入到 `/home/git/.ssh/authorized_keys` 文件里，一行一个

4. 初始化 Git 仓库：先选定一个目录作为 Git 仓库（服务器上的 Git 仓 库通常都以 `.git` 结尾），输入 `sudo git init --bare sample.git` ，Git 会创建一个裸仓库，没有工作区

5. 把 owner 改为 `git` ： `sudo chown -R git:git sample.git`

6. 禁用 shell 登录：出于安全考虑，第二步创建的 `git` 用户不允许登录 shell，可以通过编辑 `/etc/passwd` 文件完成，找到类似下面的一行：

   ```
   git:x:1001:1001:,,,:/home/git:/bin/bash
   ```

   改为

   ```
   git:x:1001:1001:,,,:/home/git:/usr/bin/git-shell
   ```

   这样，git 用户可以正常通过 ssh 使用 git，但无法登录 shell，因为 git 用户指定的 git-shell 每次一登录就自动退出。

7. 克隆远程仓库：现在可以通过 `git clone` 命令克隆远程仓库， `git clone git@server:.../sample.git`

另：

- 要管理公钥，用 [Gitosis](https://github.com/sitaramc/gitolite)
- 要控制权限，用 [Gitolite](https://github.com/sitaramc/gitolite)

## Ref

- [Git](https://git-scm.com/)
- [Git 教程 - 廖雪峰的官方网站](https://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000)
- [Git 远程操作详解 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2014/06/git_remote.html)
- [Git 常用命令 - Gityuan 博客 | 袁辉辉的 Android 博客](http://gityuan.com/2015/06/27/git-notes/)

## ChangeLog

- 2019.04.07 贴上阮一峰关于 Git 博客链接，供下次学习
- 2019.04.06 学习廖雪峰 Git 教程的笔记

