---
layout: post
title: Django REST framework 搭建后端 API 接口记录
date: 2019-04-11
categories: [tech]
tags: [技术，Python]
expirydate: 2024-10-01
---

REST framework 仓库：[encode/django-rest-framework: Web APIs for Django. ⚡️](https://github.com/encode/django-rest-framework)

REST framework 文档：[Django REST framework 中文文档](https://q1mi.github.io/Django-REST-framework-documentation/)

引入 REST framework：`pip install djangorestframework`

## 序列化

开始之前，添加 `rest_framework` 到`settings.py` 的 `INSTALLED——APPS`

以 `stanineapi` 作为 app 为例，在 `models.py` 创建一个 model，根据 model 序列化。

### 创建一个序列化类

在 `stanineapi` 目录下创建 `serializers.py` ，并添加内容

```python
from rest_framework import serializers
from stanineapi.models import Category

class CategorySerializer(serializers.Serializer):
  # 序列化器类的第一部分定义了序列化/反序列化的字段
  id = serializers.IntegerField(read_only=True)
  enname = serializers.CharField(max_length=100)
  zhname = serializers.CharField(max_length=100)

  # create() 和 update() 定义了在调用 serializer.save() 时如何创建和修改完整的实例
  def create(self, validated_data):
    # 根据提供的验证过的数据创建并返回一个新的`Category`实例
    return Category.objects.create(**validated_data)

  def update(self, instance, validated_data):
    # 根据提供的验证过的数据更新和返回一个已经存在的`Category`实例
    instance.enname = validated_data.get('enname', instance.enname)
    instance.zhname = validated_data.get('zhname', instance.zhname)
    instance.save()
    return instance
```

### 使用序列化类

`python manage.py shell` 进入 Django shell

```python
from stanineapi.models import Category
from stanineapi.serializers import CategorySerializer
c = Category.objects.get(zhname='行动与哲学')
CategorySerializer(c).data
# '{'id': 1, 'enname': 'Action & Philosophy', 'zhname': '行动与哲学'}'
```

### 使用 ModelSerializers

使用 `ModelSerializer ` 类重构序列化类，将 `stanineapi/serializers.py` 替换为

```python
from rest_framework import serializers
from stanineapi.models import Category

# ModelSerializer 类只是创建序列化器类的快捷方式：一组自动确定的字段；默认简单实现的 create() 和 update() 方法。
class CategorySerializer(serializers.ModelSerializer):
  class Meta:
    model = Category
    fields = ('id', 'enname', 'zhname')
```

## 使用序列化（Serializer）编写常规的 Django 视图 views

编辑 `stanineapi/views.py` ，将视图标记为 `csrf_exempt` 能够使不具有 CSRF 令牌的客户端对此视图进行 POST

```python
# from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from stanineapi.models import Category
from stanineapi.serializers import CategorySerializer
class JSONResponse(HttpResponse):
  # An HttpResponse that renders its content into JSON.
  def __init__(self, data, **kwargs):
    content = JSONRenderer().render(data)
    kwargs['content_type'] = 'application/json'
    super(JSONResponse, self).__init__(content, **kwargs)

@csrf_exempt
def category_list(request):
  # 列出所有的 code category，或创建一个新的 category。
  if request.method == 'GET':
    category = Category.objects.all()
    serializer = CategorySerializer(category, many=True)
    return JSONResponse(serializer.data)

  elif request.method == 'POST':
    data = JSONParser().parse(request)
    serializer = CategorySerializer(data=data)
    if serializer.is_valid():
      serializer.save()
      return JSONResponse(serializer.data, status=201)
    return JSONResponse(serializer.errors, status=400)

@csrf_exempt
def category_detail(request, pk=None):
    # 获取，更新或删除一个 code category。
    try:
        category = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return HttpResponse(status=404)

    if request.method == 'GET':
        serializer = CategorySerializer(category)
        return JSONResponse(serializer.data)

    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        serializer = CategorySerializer(category, data=data)
        if serializer.is_valid():
            serializer.save()
            return JSONResponse(serializer.data)
        return JSONResponse(serializer.errors, status=400)

    elif request.method == 'DELETE':
        category.delete()
        return HttpResponse(status=204)
```

将视图与 URL 连起来，创建 `stanineapi/urls.py` ，写入

```python
from django.conf.urls import url
from . import views

urlpatterns = [
  url(r'^stanineapi/$', views.category_list),
  url(r'^stanineapi/(?P<pk>[0-9]+)/$',views.category_detail),
]
```

在根 URL 配置 `stanine/urls.py`文件中，添加 stanineapi 应用的 URL

```python
from django.contrib import admin
from django.conf.urls import url, include
urlpatterns = [
    url(r'admin/', admin.site.urls),
    url(r'', include('stanineapi.urls')),
]
```

## 包装（wrapping）API 视图

REST 框架提供了两个可用于编写 API 视图的包装器（wrappers）。

1. 用于基于函数视图的 `@api_view` 装饰器。
2. 用于基于类视图的 `APIView` 类。

这些包装器提供了一些功能，例如确保你在视图中接收到 `Request` 实例，并将上下文添加到 `Response` ，以便可以执行内容协商。

包装器还提供了诸如在适当时候返回 `405 Method Not Allowed` 响应，并处理在使用格式错误的输入来访问 `request.data` 时发生的任何 `ParseError` 异常。

### 重构视图

在 `views.py` 中重构视图

```python
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from stanineapi.models import Category
from stanineapi.serializers import CategorySerializer

@api_view(['GET', 'POST'])
def category_list(request):
  # 列出所有的 categories，或者创建一个新的 category
  if request.method == 'GET':
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

  elif request.method == 'POST':
    # request.data 可以处理传入的 json 请求，也可以处理其他格式
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def category_detail(request, pk):
    # 获取，更新或删除一个 category 实例
  try:
    category = Category.objects.get(pk=pk)
  except Category.DoesNotExist:
    return Response(status=status.HTTP_404_NOT_FOUND)

  if request.method == 'GET':
    serializer = CategorySerializer(category)
    return Response(serializer.data)

  elif request.method == 'PUT':
    serializer = CategorySerializer(category, data=request.data)
    if serializer.is_valid():
      serializer.save()
      return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

  elif request.method == 'DELETE':
    category.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
```

- 请求对象（Request objects）

  REST 框架引入了一个扩展了常规 `HttpRequest` 的 `Request` 对象，并提供了更灵活的请求解析。`Request` 对象的核心功能是 `request.data` 属性，它与 `request.POST` 类似，但对于使用 Web API 更为有用。

  ````python
  request.POST  # 只处理表单数据  只适用于'POST'方法
  request.data  # 处理任意数据  适用于'POST'，'PUT'和'PATCH'方法```
  ````

- 响应对象（Response objects）

  REST 框架还引入了一个 `Response` 对象，这是一种获取未渲染（unrendered）内容的 `TemplateResponse` 类型，并使用内容协商来确定返回给客户端的正确内容类型。

  ```
  return Response(data)  # 渲染成客户端请求的内容类型。
  ```

- 状态码（Status codes）

  在你的视图（views）中使用纯数字的 HTTP 状态码并不总是那么容易被理解。而且如果错误代码出错，很容易被忽略。REST 框架为 `status` 模块中的每个状态代码（如`HTTP_400_BAD_REQUEST`）提供更明确的标识符，使用它们来代替纯数字的 HTTP 状态码是个很好的主意。

### 给网址添加可选的格式后缀

为了充分利用响应不再与单一内容类型连接，可以为 API 路径添加对格式后缀的支持，这意味着 API 将能够处理诸如<http://example.com/stanineapi/category/1.json>之类的 URL。

像下面这样在这两个视图中添加一个`format`关键字参数

```python
def category_list(request, format=None):
#
def category_detail(request, pk, format=None):
```

更新 `urls.py` 文件，给现有的 URL 后面添加一组 `format_suffix_patterns`

```python
from rest_framework.urlpatterns import format_suffix_patterns
urlpatterns = format_suffix_patterns(urlpatterns)
```

## 基于类的视图 (CBV)

用基于类的视图编写 API 视图有助于保持代码 DRY

### 重构视图

对 `views.py` 文件的重构

```python
from rest_framework import status
from rest_framework.response import Response
from django.http import Http404
from rest_framework.views import APIView
from stanineapi.models import Category
from stanineapi.serializers import CategorySerializer

class CategoryList(APIView):
  # 列出所有的 categories 或者创建一个新的 category
  def get(self, request, format=None):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

  def post(self, request, format=None):
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
      serializer.save()
      return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoryDetail(APIView):
  # 检索，更新或删除一个 categpry 实例
  def get_object(self, pk):
    try:
      return Category.objects.get(pk=pk)
    except Category.DoesNotExist:
      raise Http404

  def get(self, request, pk, format=None):
    category = self.get_object(pk)
    serializer = CategorySerializer(category)
    return Response(serializer.data)

  def put(self, request, pk, format=None):
    category = self.get_object(pk)
    serializer = CategorySerializer(category, data=request.data)
    if serializer.is_valid():
      serializer.save()
      return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

  def delete(self, request, pk, format=None):
    category = self.get_object(pk)
    category.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
```

### 重构视图与 URL 的链接

重构 `urls.py`

```python
from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

urlpatterns = [
  url(r'^category/$', views.CategoryList.as_view()),
  url(r'^category/(?P<pk>[0-9]+)/$',views.CategoryDetail.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
```

### 使用混合（mixins）

使用基于类视图的最大优势之一是它可以轻松地创建可复用的行为。重写 `views.py` 模块，

```python
from stanineapi.models import Category
from stanineapi.serializers import CategorySerializer
from rest_framework import mixins
from rest_framework import generics

# 用 GenericAPIView 构建了我们的视图，并且用上了 ListModelMixin 和 CreateModelMixin
class CategoryList(mixins.ListModelMixin,
                  mixins.CreateModelMixin,
                  generics.GenericAPIView):
  queryset = Category.objects.all()
  serializer_class = CategorySerializer

  def get(self, request, *args, **kwargs):
    return self.list(request, *args, **kwargs)

  def post(self, request, *args, **kwargs):
    return self.create(request, *args, **kwargs)

class CategoryDetail(mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin,
                    mixins.DestroyModelMixin,
                    generics.GenericAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)
```

### 使用通用的基于类的视图

REST 框架提供了一组已经混合好（mixed-in）的通用视图，我们可以使用它来简化我们的 `views.py` 模块。

```python
from stanineapi.models import Category
from stanineapi.serializers import CategorySerializer
from rest_framework import generics

class CategoryList(generics.ListCreateAPIView):
  queryset = Category.objects.all()
  serializer_class = CategorySerializer

class CategoryDetail(generics.RetrieveUpdateDestroyAPIView):
  queryset = Category.objects.all()
  serializer_class = CategorySerializer
```

## 认证和权限

目前，我们的 API 对编辑或删除代码段没有任何限制。我们希望有更高级的行为，以确保：

- 代码片段始终与创建者相关联。
- 只有通过身份验证的用户可以创建片段。
- 只有代码片段的创建者可以更新或删除它。
- 未经身份验证的请求应具有完全只读访问权限。

### 在模型（model）中添加信息

将以下字段添加到 `models.py` 文件中的 ` Category`模型中，并更新数据库表，重新创建用户

```python
owner = models.ForeignKey(User, related_name='stanineapi', on_delete=models.CASCADE)
```

### 为用户模型添加路径

在 `serializers.py` 文件中添加

```python
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
  # 因为'category' 在用户模型中是一个反向关联关系。在使用 ModelSerializer 类时它默认不会被包含，所以我们需要为它添加一个显式字段。
  category = serializers.PrimaryKeyRelatedField(many=True, queryset=Category.objects.all())

  class Meta:
    model = User
    fields = ('id', 'username', 'category')
```

在 `views.py` 中添加几个视图

```python
from stanineapi.serializers import UserSerializer
from django.contrib.auth.models import User

class UserList(generics.ListAPIView):
  queryset = User.objects.all()
  serializer_class = UserSerializer

class UserDetail(generics.RetrieveAPIView):
  queryset = User.objects.all()
  serializer_class = UserSerializer
```

这些视图需要添加到 API 中，将以下内容添加到 `urls.py` 文件的 urlpatterns 中

```python
url(r'^users/$', views.UserList.as_view()),
url(r'^users/(?P<pk>[0-9]+)/$', views.UserDetail.as_view()),
```

### 将 Category 和用户关联

如果创建了一个代码片段，并不能将创建该代码片段的用户与代码段实例相关联。user 不在传过来的数据中，而是通过 request.user 获得。

处理的方式是在代码片段视图中重写一个 `.perform_create()` 方法，如此便可以修改实例保存的方法，并处理传入请求或请求 URL 中隐含的任何信息。

在 `CategoryList` 视图类中，添加以下方法

```python
def perform_create(self, serializer):
  serializer.save(owner=self.request.user)
  # 序列化器的 create() 方法现在将被传递一个附加的'owner'字段以及来自请求的验证数据
```

更新 `CategorySerializer` 来体现这个关联关系，将以下字段添加到 `serializers.py` 中的序列化器定义

```python
owner = serializers.ReadOnlyField(source='owner.username')
# 将'owner',添加到内部 Meta 类的字段列表中
```

### 添加视图所需的权限

现在确保只有经过身份验证的用户才能创建，更新和删除代码片段

### 给 Browsable API 添加登陆

通过编辑项目级别的 `urls.py` 文件来添加可浏览的 API 使用的登录视图

```python
from django.conf.urls import include
# 在 urlpatterns 之后
urlpatterns += [
  url(r'^api-auth/', include('rest_framework.urls',
  namespace='rest_framework')),
]
```

### 对象级别的权限

为使 API 可以被任何人看到，同时也要确保只有创建代码片段的用户才能更新或删除它，需要创建一个自定义权限。

在 `stanineapi` 中创建一个新文件 `permissions.py`

```python
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
  # 自定义权限只允许对象的所有者编辑它

  def has_object_permission(self, request, view, obj):
    # 读取权限允许任何请求，
    # 所以我们总是允许 GET，HEAD 或 OPTIONS 请求。
    if request.method in permissions.SAFE_METHODS:
      return True

    # 只有该 api 的所有者才允许写权限。
    return obj.owner == request.user
```

通过在 `CategorytDetail` 视图类中编辑 `permission_classes` 属性将该自定义权限添加到实例路径，并导入`IsOwnerOrReadOnly`类

```python
permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly,)
```

### 使用 API 进行身份验证

现在在 API 上有一组权限，如果要编辑 API，需要验证请求。目前还没有设置任何[身份验证类](https://q1mi.github.io/Django-REST-framework-documentation/api-guide/authentication_zh/)，应用的是默认的 `SessionAuthentication` 和 `BasicAuthentication` 。

当我们通过 Web 浏览器与 API 进行交互时，我们需要在每次请求上显式提供身份验证凭据，然后浏览器会话将为请求提供所需的身份验证。可以通过加上之前创建的用户的用户名和密码来成功创建

```python
# 先要 pip install httpie
http -a user:password POST http://127.0.0.1:8000/category/ enname="Innovation & Design" zhname="创新与设计"
```

现在已经在 Web API 上获得了相当精细的一组权限控制，并为用户创建的 API 提供了 API 路径。

## 关系和超链接 API

目前 API 中的关系是用主键表示的，下面通过使用超链接来提高 API 的内部联系。

### 为 API 创建一个根路径

目前 API 没有一个入口点，下面将使用一个常规的基于函数的视图和前面介绍的 `@api_view`装 饰器创建一个。在 `stanine/views.py` 中添加

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse

@api_view(['GET'])
def api_root(request, format=None):
  return Response({
    # 使用 REST 框架的 reverse 功能来返回完全限定的 URL，URL 模式是通过方便的名称来标识
    'users': reverse('user-list', request=request, format=format),
    'category': reverse('category-list', request=request, format=format)
  })
```

在 `stanineapi/urls.py` 中为新 API 根路径添加一个 url 模式

```python
url(r'^$', views.api_root),
```

### 超链接 API

处理好实体之间的关系是 Web API 设计中更具挑战性的方面，可以选择几种不同的方式来代表一种关系：

- 使用主键。
- 在实体之间使用超链接。
- 在相关实体上使用唯一的标识字段。
- 使用相关实体的默认字符串表示形式。
- 将相关实体嵌套在父表示中。
- 一些其他自定义表示。

REST 框架支持所有这些方式，并且可以将它们应用于正向或反向关系，也可以在诸如通用外键之类的自定义管理器上应用。

在这种情况下，我们希望在实体之间使用超链接方式。这样的话，需要修改我们的序列化程序来扩展 `HyperlinkedModelSerializer` 而不是现有的 `ModelSerializer` 。

`HyperlinkedModelSerializer` 与 `ModelSerializer` 有以下区别：

- 默认情况下不包括 `id` 字段。
- 它包含一个 `url` 字段，使用 `HyperlinkedIdentityField` 。
- 关联关系使用`HyperlinkedRelatedField`，而不是`PrimaryKeyRelatedField`。

现在重写现有的序列化程序以使用超链接，修改 `stanineapi/serializers.py`

```python
from rest_framework import serializers
from stanineapi.models import Category

# ModelSerializer 类只是创建序列化器类的快捷方式：一组自动确定的字段；默认简单实现的 create() 和 update() 方法。
from django.contrib.auth.models import User

class UserSerializer(serializers.HyperlinkedModelSerializer):
  # 因为'category' 在用户模型中是一个反向关联关系。在使用 ModelSerializer 类时它默认不会被包含，所以我们需要为它添加一个显式字段。
  category = serializers.HyperlinkedRelatedField(many=True, view_name='category-detail', read_only=True)

  class Meta:
    model = User
    fields = ('id', 'username', 'category')

class CategorySerializer(serializers.HyperlinkedModelSerializer):
  # source 参数控制属性用于填充字段，并且可以指向序列化实例上的任何属性
  # 无类型的 ReadOnlyField 始终是只读的，只能用于序列化表示，不能用于在反序列化时更新模型实例
  owner = serializers.ReadOnlyField(source='owner.username')
  class Meta:
    model = Category
    fields = ('id', 'enname', 'zhname', 'owner')
```

### 确保 URL 模式被命名

如果要使用超链接的 API，那么需要确保为 URL 模式命名，最终 `stanineapi/urls.py` 文件应该如下

```python
from django.conf.urls import url, include
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

urlpatterns = [
  url(r'^$', views.api_root),
  url(r'^users/$', views.UserList.as_view(), name='user-list'),
  url(r'^users/(?P<pk>[0-9]+)/$', views.UserDetail.as_view(), name='user-detail'),
  url(r'^category/$', views.CategoryList.as_view(), name='category-list'),
  url(r'^category/(?P<pk>[0-9]+)/$',views.CategoryDetail.as_view(),  name='category-detail'),
]

urlpatterns = format_suffix_patterns(urlpatterns)

# 模式的 r'^api-auth/'部分实际上可以是你要使用的任何 URL，唯一的限制是包含的 URL 必须使用'rest_framework'命名空间。
urlpatterns += [
  url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
```

### 添加分页

API 列表视图可能会返回相当多的实例，因此需要确保对结果分页，并允许 API 客户端依次获取每个单独的页面。由此可以通过修改的 `stanine/settings.py` 文件来更改默认列表展示样式来使用分页，添加以下设置

```python
REST_FRAMEWORK = {
    'PAGE_SIZE': 10
}
```

如果打开浏览器并浏览 API，那么可以通过页面上的超链接来了解 API。

## 视图集和路由器

使用 ViewSets 和 Routers 来减少构建 API 所需的代码量。

REST 框架包括一个用于处理 `ViewSets` 的抽象，它允许开发人员集中精力对 API 的状态和交互进行建模，并根据常规约定自动处理 URL 构造。

`ViewSet` 类与 `View` 类几乎相同，不同之处在于它们提供诸如 `read` 或 `update` 之类的操作，而不是 `get` 或 `put` 等方法处理程序。

最后一个 `ViewSet` 类只绑定到一组方法处理程序，当它被实例化成一组视图的时候，通常通过使用一个 `Router` 类来处理自己定义 URL conf 的复杂性。

### 使用 ViewSets 重构

将 `UserList` 和 `UserDetail` 视图重构为一个 `UserViewSet` ，同时将 `CategoryList` 和 `CategoryDetail` 视图重构为一个 `CategoryViewSet`

```python
from stanineapi.models import Category
from stanineapi.serializers import CategorySerializer
from stanineapi.serializers import UserSerializer
from django.contrib.auth.models import User
from stanineapi.permissions import IsOwnerOrReadOnly
from rest_framework import permissions

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse

from rest_framework import viewsets
@api_view(['GET'])
def api_root(request, format=None):
  return Response({
    # 使用 REST 框架的 reverse 功能来返回完全限定的 URL，URL 模式是通过方便的名称来标识
    'users': reverse('user-list', request=request, format=format),
    'category': reverse('category-list', request=request, format=format)
  })

# 使用 ReadOnlyModelViewSet 类来自动提供默认的“只读”操作
# 此视图自动提供`list`和`detail`操作
class UserViewSet(viewsets.ReadOnlyModelViewSet):
  # 仍然像使用常规视图那样设置 queryset 和 serializer_class 属性，但我们不再需要向两个不同的类提供相同的信息
  queryset = User.objects.all()
  serializer_class = UserSerializer

# 使用了 ModelViewSet 类来获取完整的默认读写操作
class CategoryViewSet(viewsets.ModelViewSet):
  # 此视图自动提供`list`，`create`，`retrieve`，`update`和`destroy`操作
  queryset = Category.objects.all()
  serializer_class = CategorySerializer
  permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly,)

  def perform_create(self, serializer):
    serializer.save(owner=self.request.user)
```

### 明确地将 ViewSets 绑定到 URL

在 `urls.py` 文件中，将 `ViewSet` 类绑定到一组具体视图中

```python
from stanineapi.views import CategoryViewSet, UserViewSet, api_root

# 从每个 ViewSet 类创建多个视图
user_list = UserViewSet.as_view({
  'get': 'list'
})
user_detail = UserViewSet.as_view({
  'get': 'retrieve'
})
category_list = CategoryViewSet.as_view({
  'get': 'list',
  'post': 'create'
})
category_detail = CategoryViewSet.as_view({
  'get': 'retrieve',
  'put': 'update',
  'patch': 'partial_update',
  'delete': 'destroy'
})
```

现在将资源绑定到具体的视图中

```python
urlpatterns = [
  url(r'^stanineapi/$', views.api_root),
  url(r'^stanineapi/users/$', user_list, name='user-list'),
  url(r'^stanineapi/users/(?P<pk>[0-9]+)/$', user_detail, name='user-detail'),
  url(r'^stanineapi/category/$', category_list, name='category-list'),
  url(r'^stanineapi/category/(?P<pk>[0-9]+)/$', category_detail,  name='category-detail'),
]
```

### 使用路由器

重构后使用的是 `ViewSet` 类而不是 `View` 类，因此不需要自己设计 URL。将资源连接到视图和 url 的约定可以使用 `Router` 类自动处理。需要做的就是使用路由器注册相应的视图集，然后让它执行其余操作。

这是重写的 `urls.py` 文件

```python
from django.conf.urls import url, include
from . import views
from rest_framework.routers import DefaultRouter

# 创建路由器并注册我们的视图
# DefaultRouter 类会自动为我们创建 API 根视图
router = DefaultRouter()
router.register(r'category', views.CategoryViewSet)
router.register(r'users', views.UserViewSet)

# API URL 现在由路由器自动确定，另外还要包含可浏览的 API 的登录 URL
urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]
```

### 视图（views）与视图集（viewsets）之间的权衡

视图集可以是一个非常有用的抽象，它有助于确保 URL 约定在 API 中 保持一致，最大限度地减少编写所需的代码量，让你能够专注于 API 提供的交互和表示，而不是 URLconf 的细节。这并不意味着采用视图集总是正确的方法，在使用基于类的视图而不是基于函数的视图时，有一个类似的权衡要考虑，即使用视图集不像单独构建视图那样明确。

## 概要和客户端库

概要是一种机器可读文档，用于描述可用的 API 路径，其 URLS 以及它们支持的操作。概要可以是自动生成文档的有用工具，也可以用于驱动可以与 API 进行交互的动态客户端库。

### Core API

为了使概要支持 REST 框架，使用 [Core API](http://www.coreapi.org/)。

Core API 是用于描述 API 的文档规范，它用于提供可用路径的内部表示形式和 API 公开的可能的交互，可以用于服务器端或客户端。

当使用服务器端时，coreAPI 允许 API 支持呈现范围广泛的概要或超媒体格式。

当使用客户端时，核心 API 允许动态驱动的客户端库，它可以与任何公开受支持的概要或超媒体格式的 API 交互。

### 添加概要

REST 框架支持明确定义的概要视图或自动生成的概要。由于项目使用的是视图集和路由器，所有可以简单地使用自动概要生成。

需要安装 `coreapi` python 包才能包含 API 概要，`$pip install coreapi`

现在通过在 URL 配置中包含一个自动生成的概要视图来为 API 添加概要

```python
from rest_framework.schemas import get_schema_view

schema_view = get_schema_view(title='Stanine API')

urlpatterns = [
    url('^schema/$', schema_view),
    ...
]
```

此外还要参考 [pyyaml required for openapi-json schemas · Issue #6366 · encode/django-rest-framework](https://github.com/encode/django-rest-framework/issues/6366) ，`python manage.py generateschema --format=openapi-json` ， `pip install pyyaml`

此时在浏览器中访问 <http://127.0.0.1:8000/stanineapi/schema/> ，可以看到可用选项中有 `corejson` 和 `openapi` 表示形式。

也可以通过在 `Accept` 标头中指定所需的内容类型从命令行请求概要，`http http://127.0.0.1:8000/stanineapi/schema/ Accept:application/coreapi+json`

### 使用命令行客户端

现在 API 暴露了一个概要路径，可以使用一个动态的客户端库与 API 进行交互。

命令行客户端作为一个 `coreapi-cli` 包提供，`pip install coreapi-cli `

检查 `coreapi-cli` 在命令行上是否可用，`coreapi`

使用命令行客户端加载 API 概要，`coreapi get http://127.0.0.1:8000/stanineapi/schema/`

```json
// 返回
<Stanine API "http://127.0.0.1:8000/stanineapi/schema/">
    category: {
        list()
        read(id)
    }
    users: {
        list()
        read(id)
    }
```

使用命令行客户端，列出 category，`coreapi action category list`

### 验证我们的客户端

如果想要创建、编辑和删除代码片段，需要进行有效性用户身份验证。在这种情况下，只需使用基本的 auth，`coreapi credentials add 127.0.0.1 <username>:<password> --auth basic`

现在再次提取概要，`coreapi reload`，能够看到一组可用的交互

```json
<Stanine API "http://127.0.0.1:8000/stanineapi/schema/">
    category: {
        list()
        create(enname, zhname)
        read(id)
        update(id, enname, zhname)
        partial_update(id, [enname], [zhname])
        delete(id)
    }
    users: {
        list()
        read(id)
    }
```

现在能够与这些路径行交互

- 要创建一个新的 category，`coreapi action category create --param enname="Math & Physics" --param zhname="数学与物理"`
- 删除一个 category，`coreapi action category delete --param id=2`

## 参考

- [Django REST framework 中文文档](https://q1mi.github.io/Django-REST-framework-documentation/)

## ChangeLog

- 2019-04-11 初稿
