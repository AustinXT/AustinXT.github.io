---
layout: post
title: 阿里云从零部署 Django
date: 2019-04-06
categories: [实操记录]
tags: [服务器, Python]
---

## 阿里云快捷登录

在阿里云的控制台中复制服务器的公网 IP，我的是 47.102.121.213

### 免密登录

在本地执行命令（按提示输入密码），向服务器发送自己的公钥文件

```
ssh-copy-id -i 公钥文件 root@服务器ip
```

此时阿里云上的 `~/.ssh/authorized_keys` 与本地 `~/.ssh/id_rsa.pub` 一致，即可免密登录阿里云

```
ssh root@服务器ip
```

若重新格式化磁盘，则需要在目录 `~/.ssh` 下的 `known_hosts` 中的 `47.102.121.213` ，才能登录阿里云。

此外，也可将自己的私钥加入 ssh-agent，ssh 代理，它会帮你自动输入密码短语 passphrase

```shell
# 加入代理，输入你的密码短语
ssh-add ~/.ssh/id_rsa
# 查看ssh代理的内容
ssh-add -l
```

### 配置服务器 Host

在本地 `~/.ssh` 目录下新建 `config` ，输入以下内容

```
Host aliyun
HostName 47.102.121.213
User root
IdentitiesOnly yes
```

保存退出后即可用 `ssh aliyun` 登录。

### 修改 hostname

登录服务器后会发现，服务器实例名称是一串冗长的字母和数字，可在阿里云服务器上修改 `etc/hostname` ，例如 `aliyun` ，并 `reboot` 使之生效。此时终端命令行的开头变成 `root@aliyun:` ，更美观。

## 安装相关软件

服务器系统是 Ubuntu 16.04.6 LTS

部署 Django 需要用到 Git、Pytohn3、pip3、virtualenv、Nginx

### 安装 Git

```
apt-get update
apt-get upgrade
apt-get install git
```

生成公钥、密钥，并且在 github 上配置

```
ssh-keygen -t rsa -C "your email"
cat ~/.ssh/id_rsa.pub
```

将输出的公钥添加到 GitHub，settings -> SSH and GPG keys -> New SSH key

### 安装 Pytohn3、pip3、virtualenv

```shell
apt-get install python3 python3-pip
pip3 install virtualenv
```

安装 virtualenv 时，报错

```
Traceback (most recent call last):
  File "/usr/bin/pip3", line 11, in <module>
    sys.exit(main())
  File "/usr/lib/python3/dist-packages/pip/__init__.py", line 215, in main
    locale.setlocale(locale.LC_ALL, '')
  File "/usr/lib/python3.5/locale.py", line 594, in setlocale
    return _setlocale(category, locale)
locale.Error: unsupported locale setting
```

终端执行 `export LC_ALL=C` 可暂时解决该问题。

可在 `.bashrc` 中添加

```
# locale
export LC_ALL=C
```

并运行 `source .bashrc`

重新安装 virtualenv

```
pip3 install virtualenv
```

切入到目录 `/root/sites/stanine.top/` ，输入一下命令建立虚拟环境，取名为 `env`

```
virtualenv --python=python3 env
```

这里使用 --python=python3 来指定克隆 Python3 的环境，如果不特别指定的话 Virtualenv 默认克隆的是 Python2 的环境。

使用虚拟环境，在终端输入`source env/bin/activate` ，退出虚拟环境，输入`deactivate` 。如果项目开发完成后想删除虚拟环境，直接删除虚拟环境目录即可。

### 安装 Nginx

```
apt-get install nginx
```

ubantu 安装完 Nginx 后，文件结构大致为：

```
所有的配置文件都在 /etc/nginx下；
启动程序文件在 /usr/sbin/nginx下；
日志文件在 /var/log/nginx/下，分别是access.log和error.log；
并且在 /etc/init.d下创建了启动脚本nginx。
```

在阿里云 -> ECS -> 安全组 -> 配置规则，添加 `80` 端口以通过 HTTP 服务访问网站，通过 `netstat -ant |grep 80`  可查看 80 端口的监听状况。

### 启动 Ngnix 服务

Nginx 是用来处理静态文件请求的，比如当我们访问一个博客文章详情页面时，服务器会接收到下面两种请求：

- 显示文章的详情信息，这些信息通常保存在数据库里，因此需要调用数据库获取数据
- 图片、css、js 等存在服务器某个文件夹下的静态文件

对于前一种请求，博客文章的数据需要借助 Django 从数据库中获取，Nginx 处理不了，它就会把这个请求转发给 Django，让 Django 去处理。而对于后一种静态文件的请求，只需要去这些静态文件所在的文件夹获取，Nginx 就会代为处理，不再麻烦 Django。

用 Django 去获取静态文件是很耗时的，但 Nginx 可以很高效地处理，这就是我们要使用 Nginx 的原因（当然其功能远不止这些）。

Nginx 启动、停止和重启

```shell
/etc/init.d/nginx start    # 启动
/etc/init.d/nginx stop     # 停止
/etc/init.d/nginx restart  # 重启
```

或

```shell
service nginx start
service nginx stop
service nginx restart
```

启动后，在浏览器输入 IP 地址 47.102.121.213，看到如下页面说明 Nginx 启动成功了。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Nginx.png)

## 本地建立 Django 项目

先在本地建立 Django 并测试，在同步到阿里云。

### 建立 Django 项目

建立 Django 项目，`django-admin startproject stanine` ，目录结构为

```
stanine\
    manage.py # Django 为我们生成的管理这个项目的 Python 脚本文件
    stanine\
        __init__.py
        settings.py
        urls.py
        wsgi.py
```

运行 `python manage.py runserver` 命令就可以在本机上开启一个 Web 服务器

修改 `settings.py` 文件

```python
# 把英文改为中文
LANGUAGE_CODE = 'zh-hans'

# 把国际时区改为中国时区
TIME_ZONE = 'Asia/Shanghai'
```

添加 Django APP，`python manage.py startapp stanineapi` ，目录结构为

```
stanineapi\
    __init__.py
    admin.py
    apps.py
    migrations\
        __init__.py
    models.py
    tests.py
    views.py
```

修改 `settings.py` 文件，在 `INSTALLED_APPS` 数组添加 `stanineapi`

### 创建 Django 项目数据库模型

编写博客模型代码，修改 `stanineapi/models.py`

```python
# coding: utf-8
from django.db import models

# Create your models here.
class Category(models.Model):
  # Django 要求模型必须继承 models.Model 类
  zhname = models.CharField(max_length=100)
  enname = models.CharField(max_length=100)

class Tag(models.Model):
  zhname = models.CharField(max_length=100)
  enname = models.CharField(max_length=100)

class Sagebio(models.Model):
  """
  CharField 指定了分类名 name 的数据类型，CharField 是字符型，
  CharField 的 max_length 参数指定其最大长度，超过这个长度的分类名就不能被存入数据库。
  指定 CharField 的 blank=True 参数值后就可以允许空值
  """
  zhname = models.CharField(max_length=100, blank=True)
  enname = models.CharField(max_length=100, blank=True)

  # 文章正文，我们使用了 TextField。
  # 存储比较短的字符串可以使用 CharField，但对于文章的正文来说可能会是一大段文本，因此使用 TextField 来存储大段文本。
  bio = models.CharField()

  # 这两个列分别表示文章的创建时间和最后一次修改时间，存储时间的字段用 DateTimeField 类型。
  created_time = models.DateTimeField()
  modified_time = models.DateTimeField()

  # sage 只属于一个分类，使用的是 ForeignKey，即一对多的关联关系
  # 可以有多个或没有标签，使用的是 ForeignKey，即多对多的关联关系
  category = models.ForeignKey(Category)
  tags = models.ManyToManyField(Tag, blank=True)
```

运行 `python manage.py createsuperuser` 命令并根据提示创建用户。

### 迁移数据库

选择数据库版本，这里选择自带的 `sqlite3`

切换到 `manage.py` 文件所在的目录下，分别运行 `python manage.py makemigrations` 和 `python manage.py migrate` 命令

查看数据库表创建语句，`python manage.py sqlmigrate stanineapi 0001`

### 用 Django 的方式操作数据库

#### 存数据

在 manage.py 所在目录下运行 `python manage.py shell` 命令

```python
from stanineapi.models import Sagebio, Category, Tag
c = Category(enname='action & philosophy')
c.zhname = '行动与哲学'
c.save()
t = Tag(enname='like', zhname='喜欢')
t.save()
```

#### 取数据

`objects` 是我们的模型管理器，它为我们提供一系列从数据库中取数据方法。 `all` 方法，表示把对应的数据全部取出来，是一个类似于列表的数据结构（QuerySet）； `get` 返回一条记录数据，如有多条记录或者没有记录，`get` 方法均会抛出相应异常。

```python
from stanineapi.models import Sagebio, Category, Tag

c = Category.objects.get(zhname='行动与哲学')
c # <Category: action & philosophy>
Category.objects.all()
# <QuerySet [<Category: action & philosophy>]>
```

#### 删数据

```python
p = Tag.objects.get(enname='test')
p # <Tag: test>
p.delete()
Tag.objects.all() # <QuerySet []>
```

#### 重置 migration

若不需要原有的数据库数据

1. 删除数据库所有表
2. 删除项目的 migration 模块中的所有文件，除了 `init.py`
3. 执行脚本 `python manage.py makemigrations ` 和 `python manage.py migrate`

若不想删除现有的数据库，只想重新建立 migration 文件

1. 保证目前的 migration 文件与数据库同步，通过执行 `python manage.py makemigrations` ，若提示 `No changes detected` ，则可以继续
2. 通过执行 `python manage.py showmigrations` 查看所有 app 及对应的已生效的 migration 文件
3. 通过执行 `python manage.py migrate --fake stanineapi zero` 删除 stanineapi 这个 app 下的 migrations 模块中除了 `init.py` 的所有文件 (程序会再次生成 `0001_intial.py` 之类的文件）
4. 执行 `python manage.py migrate --fake-initial` ，在数据库中的 migrations 表中记录当前这个 app 执行到 `0001_initial.py`

### 视图

#### 绑定 URL 与视图函数

首先 Django 需要知道当用户访问不同的网址时，应该如何处理这些不同的网址（即所说的路由）。Django 的做法是把不同的网址对应的处理函数写在一个 urls.py 文件里，当用户访问某个网址时，Django 就去会这个文件里找，如果找到这个网址，就会调用和它绑定在一起的处理函数（叫做视图函数）。

在 `stanineapi` 目录下新建 `urls.py` ，写入

```python
from django.conf.urls import url
from . import views

urlpatterns = [
  '''
  网址是用正则表达式写的，Django 会用这个正则表达式去匹配用户实际输入的网址，如果匹配成功，就会调用其后面的视图函数做相应的处理
  比如说我们本地开发服务器的域名是 http://127.0.0.1:8000，那么当用户输入网址 http://127.0.0.1:8000 后，
  Django 首先会把协议 http、域名 127.0.0.1 和端口号 8000 去掉，此时只剩下一个空字符串，而 r'^$' 的模式正是匹配一个空字符串
  于是二者匹配，Django 便会调用其对应的 views.index 函数
   name，这个参数的值将作为处理函数 index 的别名
  '''
  url(r'^$', views.index, name='index'),
]
```

#### 编写视图函数

Web 服务器的作用就是接收来自用户的 HTTP 请求，根据请求内容作出相应的处理，并把处理结果包装成 HTTP 响应返回给用户

修改 `stanineapi/views.py`

```python
from django.http import HttpResponse

def index(request):
  '''
  首先接受了一个名为 request 的参数，这个 request 就是 Django 为我们封装好的 HTTP 请求，
  它是类 HttpRequest 的一个实例。然后我们便直接返回了一个 HTTP 响应给用户，
  这个 HTTP 响应也是 Django 帮我们封装好的，它是类 HttpResponse 的一个实例，只是我们给它传了一个自定义的字符串参数
  '''
  return HttpResponse("欢迎访问我的博客首页！")
```

#### 配置项目 URL

之前绑定了 URL 和视图函数 `index`，但是 Django 并不知道。Django 匹配 URL 模式是在 stanine\ 目录的 urls.py 下的，所以我们要把 stanineapi 应用下的 urls.py 文件包含到 stanine\urls.py 里去。

```python
from django.contrib import admin
from django.urls import path
from django.conf.urls import url, include #+
urlpatterns = [
    path('admin/', admin.site.urls),
    url(r'', include('stanineapi.urls')), #+
]
```

运行 `python manage.py runserver` ，打开浏览器查看效果。

## 部署 Django

### 部署前的项目配置

Django 项目中会有一些 CSS、JavaScript 等静态文件，为了能够方便地让 Nginx 处理这些静态文件的请求，可以把项目中的全部静态文件收集到一个统一的目录下。在 `settings.py`  添加如下配置

```
STATIC_URL = '/static/'
# 加入下面的配置
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
```

`STATIC_ROOT` 指明了静态文件的收集目录，即项目根目录（BASE_DIR）下的 `static` 文件夹。

为了安全起见，在生产环境下需要关闭 `DEBUG` 选项以及设置允许访问的域名。打开 `settings.py` 文件，找到 `DEBUG` 和 `ALLOWED_HOSTS` 这两个选项，将它们设置成如下的值：

```
DEBUG = False
ALLOWED_HOSTS = ['127.0.0.1', 'localhost ', '47.102.121.213']
```

`ALLOWED_HOSTS` 是允许访问的域名列表，127.0.0.1 和 localhost 是本地访问的域名。

项目还会依赖一些第三方 Python 库，为了方便在服务器上一次性安装，将全部依赖写入一个叫 requirements.txt 的文本文件中。激活本地的虚拟环境，并进入项目的根目录，运行 `pip3 freeze > requirements.txt` 命令。这时项目根目录下会生成了一个 `requirements.txt` 的文本文件，其内容记录了项目的全部依赖。

最后，将代码上传到 GitHub 等代码托管平台。

### 拉取代码并安装项目依赖

进入到 `~/sites/stanine.top/` 目录下，激活虚拟环境，接着从代码仓库把项目代码拉取到 `stanine.backend/`  路径下。

进入到项目根目录，即 `requirements.txt` 所在的目录，安装项目的全部依赖

```
pip install -r requirements.txt
```

### 收集静态文件

虚拟环境下继续运行 `python manage.py collectstatic` 命令收集静态文件到 static 目录下

```
python manage.py collectstatic
```

## 配置 Nginx 并启动服务

### 配置 Nginx

先在服务器的 /etc/nginx/sites-available/ 目录下新建一个配置文件，文件名一般就设置为域名，`api.stanine.top`。写上配置内容

```
server {
  charset utf-8;
  listen 80;
  server_name 47.102.121.213; # 服务的域名

  location /static {
  # 所有 URL 带有 /static 的请求均由 Nginx 处理，alias 指明了静态文件的存放目录
  alias /root/sites/stanine.top/stanine-backend/static;
  }

  location / { # 其它请求转发给 Django 处理
  proxy_set_header Host $host;
  proxy_pass          http://127.0.0.1:8000;
  # proxy_pass 后面使用了 unix 套接字，其作用是防止端口冲突
  #proxy_pass http://unix:/tmp/api.stanine.top.socket;
  #index test.html index.htm index.nginx-debian.html;
  }
}
```

在 /etc/nginx/sites-available/ 放置了配置文件，而被启用网站的目录在 /etc/nginx/sites-enabled/，需要建立软链

```
sudo ln -s /etc/nginx/sites-available/api.stanine.top /etc/nginx/sites-enabled/api.stanine.top
```

PS：软链中目标路径必须是绝对路径

### 启动服务

在项目根目录下，运行 `python manage.py runserver` ，打开浏览器查看效果，`47.102.121.213/admin` 可登陆后台。

但是阿里云下线时，服务也会停止。一下命令可在下线情况下，仍然提供服务

```
nohub python manage.py runserver &
```

`nohup` 命令可在注销后运行后台中的程序，`&` 可以把一个程序放在后台运行。

## 参考

- [使用 Nginx 和 Gunicorn 部署 Django 博客\_追梦人物的博客](https://www.zmrenwu.com/courses/django-blog-tutorial/materials/15/)
- [阿里云服务器从零开始部署博客 \| 无趣的小帕](https://www.pandaomeng.com/2018/09-26-aliyun-deploy-from-0/)
- [linux 的 nohup & 和 daemon 总结 (转) - 平和的心 - 博客园](http://www.cnblogs.com/ajianbeyourself/p/3885367.html#t1)

## ChangLog

- 2019-04-06 初稿
