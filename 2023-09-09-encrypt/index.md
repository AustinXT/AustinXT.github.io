# 密码学入门


## 散列函数

[密码散列函数](https://en.wikipedia.org/wiki/Cryptographic_hash_function) (Cryptographic hash function) 可以将任意大小的数据映射为一个固定大小的输出。除此之外，还有一些其他特性。 一个散列函数的大概规范如下：

```
hash(value: array<byte>) -> vector<byte, N>  (N对于该函数固定) 
```

下面我们用`sha3sum`命令来测试SHA1对几个字符串的输出：

```bash
echo 'xianxian' | sha3sum
e6d649cf2c1ff81dbfd2650af677ee0acf9bb716fb8b3b1405260e42  -
```

抽象地讲，散列函数可以被认为是一个不可逆，且看上去随机（但具确定性）的函数 （这就是[散列函数的理想模型](https://en.wikipedia.org/wiki/Random_oracle)）。 一个散列函数拥有以下特性：

- 确定性：对于不变的输入永远有相同的输出。
- 不可逆性：对于`hash(m) = h`，难以通过已知的输出`h`来计算出原始输入`m`。
- 目标碰撞抵抗性/弱无碰撞：对于一个给定输入`m_1`，难以找到`m_2 != m_1`且`hash(m_1) = hash(m_2)`。
- 碰撞抵抗性/强无碰撞：难以找到一组满足`hash(m_1) = hash(m_2)`的输入`m_1, m_2`（该性质严格强于目标碰撞抵抗性）。

[密码散列函数的生命周期](https://valerieaurora.org/hash.html)列举了一些散列函数是何时被发现弱点及破解的。 

### 密码散列函数的应用

- Git中的内容寻址存储(Content addressed storage)

#### 文件的信息摘要(Message digest)

像Linux ISO这样的软件可以从非官方的（有时不太可信的）镜像站下载，所以需要设法确认下载的软件和官方一致。 官方网站一般会在（指向镜像站的）下载链接旁边备注安装文件的哈希值。 用户从镜像站下载安装文件后可以对照公布的哈希值来确定安装文件没有被篡改。

例如验证 ubuntu 镜像，[HowToSHA256SUM - Community Help Wiki](https://help.ubuntu.com/community/HowToSHA256SUM)

```bash
# 获取本地镜像的哈希值
$ shasum -a 256 ~/Downloads/ubuntu-22.04.1-live-server-arm64.iso
bc5a8015651c6f8699ab262d333375d3930b824f03d14ae51e551d89d9bb571c  /Users/nv/Downloads/ubuntu-22.04.1-live-server-arm64.iso
# 下载远程官方公布的哈希值
$ curl http://cdimage.ubuntu.com/releases/22.04/release/SHA256SUMS --output ~/Downloads/SHA256SUMS
# 比较两者
$ diff ~/Downloads/SHA256SUMS <(shasum -a 256 ~/Downloads/ubuntu-22.04.1-live-server-arm64.iso)
```

#### 承诺机制

- [承诺机制](https://en.wikipedia.org/wiki/Commitment_scheme)(Commitment scheme)： 假设我希望承诺一个值，但之后再透露它—— 比如在没有一个可信的、双方可见的硬币的情况下在我的脑海中公平的“扔一次硬币”。 我可以选择一个值`r = random()`，并和你分享它的哈希值`h = sha256(r)`。 这时你可以开始猜硬币的正反：我们一致同意偶数`r`代表正面，奇数`r`代表反面。 你猜完了以后，我告诉你值`r`的内容，得出胜负。同时你可以使用`sha256(r)`来检查我分享的哈希值`h`以确认我没有作弊。

## 密钥生成函数

[密钥生成函数](https://en.wikipedia.org/wiki/Key_derivation_function) (Key Derivation Functions) 作为密码散列函数的相关概念，被应用于包括生成固定长度，可以使用在其他密码算法中的密钥等方面。 为了对抗穷举法攻击，密钥生成函数通常较慢。

### 密钥生成函数的应用

- 从密码生成可以在其他加密算法中使用的密钥，比如对称加密算法。
- 存储登录凭证时不可直接存储明文密码。
    正确的方法是针对每个用户随机生成一个[盐](https://en.wikipedia.org/wiki/Salt_%28cryptography%29) `salt = random()`， 并存储盐，以及密钥生成函数对连接了盐的明文密码生成的哈希值`KDF(password + salt)`。
    在验证登录请求时，使用输入的密码连接存储的盐重新计算哈希值`KDF(input + salt)`，并与存储的哈希值对比。
	
例如，使用 [OpenSSL](https://www.openssl.org/)的AES模式加密一个文件

```bash
$ echo "hello world" > afile #创建一个文件
$ openssl aes-256-cbc -salt -in afile -out secfile #加密文件
enter aes-256-cbc encryption password:***
Verifying - enter aes-256-cbc encryption password:***

#解密
$ openssl aes-256-cbc -d -in secfile -out notsafefile
```

## 对称加密

说到加密，可能你会首先想到隐藏明文信息。对称加密使用以下几个方法来实现这个功能：

``` 
keygen() -> key  (这是一个随机方法)

encrypt(plaintext: array<byte>, key) -> array<byte>  (输出密文)
decrypt(ciphertext: array<byte>, key) -> array<byte>  (输出明文) 
```

加密方法`encrypt()`输出的密文`ciphertext`很难在不知道`key`的情况下得出明文`plaintext`。

解密方法`decrypt()`有明显的正确性。因为功能要求给定密文及其密钥，解密方法必须输出明文：`decrypt(encrypt(m, k), k) = m`。

[AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) 是现在常用的一种对称加密系统。

### 对称加密的应用

#### 加密云服务上存储的文件

加密不信任的云服务上存储的文件。对称加密和密钥生成函数配合起来，就可以使用密码加密文件： 将密码输入密钥生成函数生成密钥 `key = KDF(passphrase)`，然后存储`encrypt(file, key)`。

## 非对称加密

非对称加密的“非对称”代表在其环境中，使用两个具有不同功能的密钥： 一个是私钥(private key)，不向外公布；另一个是公钥(public key)，公布公钥不像公布对称加密的共享密钥那样可能影响加密体系的安全性。
非对称加密使用以下几个方法来实现加密/解密(encrypt/decrypt)，以及签名/验证(sign/verify)：

```
keygen() -> (public key, private key)  (这是一个随机方法)

encrypt(plaintext: array<byte>, public key) -> array<byte>  (输出密文)
decrypt(ciphertext: array<byte>, private key) -> array<byte>  (输出明文)

sign(message: array<byte>, private key) -> array<byte>  (生成签名)
verify(message: array<byte>, signature: array<byte>, public key) -> bool  (验证签名是否是由和这个公钥相关的私钥生成的) 
```

信息在非对称加密中使用 *公钥* 加密， 且输出的密文很难在不知道 *私钥* 的情况下得出明文。

解密方法`decrypt()`有明显的正确性。 给定密文及私钥，解密方法一定会输出明文： `decrypt(encrypt(m, public key), private key) = m`。

签名/验证方法具有和书面签名类似的特征。

在不知道 *私钥* 的情况下，不管需要签名的信息为何，很难计算出一个可以使 `verify(message, signature, public key)` 返回为真的签名。

对于使用私钥签名的信息，验证方法验证和私钥相对应的公钥时一定返回为真： `verify(message, sign(message, private key), public key) = true`。

例如，使用[ED25519算法](https://wiki.archlinux.org/index.php/SSH_keys#Ed25519)生成一组[SSH 密钥对](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys--2)。为了确保私钥不使用时的安全，一定使用密码加密你的私钥。

```bash
$ ssh-keygen -t ed25519
Generating public/private ed25519 key pair.
Enter file in which to save the key (/Users/nv/.ssh/id_ed25519): ./key
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in ./key
Your public key has been saved in ./key.pub
```

### 非对称加密的应用

#### 电子邮件加密

[PGP电子邮件加密](https://en.wikipedia.org/wiki/Pretty_Good_Privacy)：用户可以将所使用的公钥在线发布，比如：PGP密钥服务器或 [Keybase](https://keybase.io/)。任何人都可以向他们发送加密的电子邮件。

#### 聊天加密

像 [Signal](https://signal.org/) 和 [Keybase](https://keybase.io/) 使用非对称密钥来建立私密聊天。

#### 软件签名

Git 支持用户对提交(commit)和标签(tag)进行 GPG(GNU Privacy Guard) 签名。任何人都可以使用软件开发者公布的签名公钥验证下载的已签名软件。

Linux 配置 GPG 可参考[配置 GPG 可参考](https://www.digitalocean.com/community/tutorials/how-to-use-gpg-to-encrypt-and-sign-messages)，下面是 Mac 下的操作

```bash
$ gpg --gen-key
# 导入 [anish](https://keybase.io/anish) pgp 共钥
$ curl https://keybase.io/anish/pgp_keys.asc | gpg --import
# 加密文件
$ gpg --encrypt --sign --armor -r me@anishathalye.com hi
```

使用`git commit -S`命令签名一个Git提交，并使用`git show --show-signature`命令验证这个提交的签名。或者，使用`git tag -s`命令签名一个Git标签，并使用`git tag -v`命令验证标签的签名。

```bash
$ git commit -S -m "sign a commit"
error: gpg failed to sign the data
 fatal: failed to write commit object
```

这个问题网上有一些解决方案可供参考：

* [gnupg - Git error - gpg failed to sign data - Stack Overflow](https://stackoverflow.com/questions/41052538/git-error-gpg-failed-to-sign-data)
* [pstadler/keybase-gpg-github: Step-by-step guide on how to create a GPG key on keybase.io, adding it to a local GPG setup and using it with Git and GitHub.](https://github.com/pstadler/keybase-gpg-github)

```bash
# 如果遇到
$ echo "test" | gpg --clearsign
gpg: [stdin]: clear-sign failed: Inappropriate ioctl for device
# 则执行
$ export GPG_TTY=$(tty)
# 要注意~/.gitconfig里面的 name，email 要和生成秘钥时使用的一样，签名算法也是一样
$ gpg -K --keyid-format SHORT
/Users/nv/.gnupg/pubring.kbx
----------------------------
sec   ed25519/5491C890 2023-02-19 [SC] [expires: 2025-02-18]
      1774700098943C0579420DD2726DAF385491C890
uid         [ultimate] xieting <nightvoyager@qq.com>
ssb   cv25519/77194118 2023-02-19 [E] [expires: 2025-02-18]
$ vim ~/.gitconfig
[user]
    name = xieting
    email = nightvoyager@qq.com
    signingKey = 77194118
$ git commit -S -m "scripts"
[master 0c77ec5] scripts
 12 files changed, 144 insertions(+)
 ...
```

### 密钥分发

非对称加密面对的主要挑战是，如何分发公钥并对应现实世界中存在的人或组织。

Signal的信任模型是，信任用户第一次使用时给出的身份(trust on first use)，同时支持用户线下(out-of-band)、面对面交换公钥（Signal里的safety number）。

PGP使用的是[信任网络](https://en.wikipedia.org/wiki/Web_of_trust)。简单来说，如果我想加入一个信任网络，则必须让已经在信任网络中的成员对我进行线下验证，比如对比证件。验证无误后，信任网络的成员使用私钥对我的公钥进行签名。这样我就成为了信任网络的一部分。只要我使用签名过的公钥所对应的私钥就可以证明“我是我”。

Keybase主要使用[社交网络证明 (social proof)](https://keybase.io/blog/chat-apps-softer-than-tofu)，和一些别的精巧设计。

## 案例分析

### 密码管理器

每个人都应该尝试使用密码管理器，比如[KeePassXC](https://keepassxc.org/)、[pass](https://www.passwordstore.org/) 和 [1Password](https://1password.com))。

密码管理器会帮助你对每个网站生成随机且复杂（表现为高熵）的密码，并使用你指定的主密码配合密钥生成函数来对称加密它们。

你只需要记住一个复杂的主密码，密码管理器就可以生成很多复杂度高且不会重复使用的密码。密码管理器通过这种方式降低密码被猜出的可能，并减少网站信息泄露后对其他网站密码的威胁。

### 两步验证（双因子验证）

[两步验证](https://en.wikipedia.org/wiki/Multi-factor_authentication)(2FA)要求用户同时使用密码（“你知道的信息”）和一个身份验证器（“你拥有的物品”，比如[YubiKey](https://www.yubico.com/)）来消除密码泄露或者[钓鱼攻击](https://en.wikipedia.org/wiki/Phishing)的威胁。

最简单的情形是可以通过接收手机的 SMS 来实现（尽管 SMS 2FA 存在 [已知问题](https://www.kaspersky.com/blog/2fa-practical-guide/24219/)）。我们推荐使用[YubiKey](https://www.yubico.com/)之类的[U2F](https://en.wikipedia.org/wiki/Universal_2nd_Factor)方案。

### 全盘加密

对笔记本电脑的硬盘进行全盘加密是防止因设备丢失而信息泄露的简单且有效方法。 Linux的[cryptsetup + LUKS](https://wiki.archlinux.org/index.php/Dm-crypt/Encrypting_a_non-root_file_system)， Windows的[BitLocker](https://fossbytes.com/enable-full-disk-encryption-windows-10/)，或者macOS的[FileVault](https://support.apple.com/en-us/HT204837)都使用一个由密码保护的对称密钥来加密盘上的所有信息。

### 聊天加密

[Signal](https://signal.org/)和[Keybase](https://keybase.io/)使用非对称加密对用户提供端到端(End-to-end)安全性。

获取联系人的公钥非常关键。为了保证安全性，应使用线下方式验证Signal或者Keybase的用户公钥，或者信任Keybase用户提供的社交网络证明。

### SSH

当你运行`ssh-keygen`命令，它会生成一个非对称密钥对：公钥和私钥`(public_key, private_key)`。 生成过程中使用的随机数由系统提供的熵决定。这些熵可以来源于硬件事件(hardware events)等。 公钥最终会被分发，它可以直接明文存储。 但是为了防止泄露，私钥必须加密存储。`ssh-keygen`命令会提示用户输入一个密码，并将它输入密钥生成函数 产生一个密钥。最终，`ssh-keygen`使用对称加密算法和这个密钥加密私钥。

在实际运用中，当服务器已知用户的公钥（存储在`.ssh/authorized_keys`文件中，一般在用户HOME目录下），尝试连接的客户端可以使用非对称签名来证明用户的身份——这便是[挑战应答方式](https://en.wikipedia.org/wiki/Challenge%E2%80%93response_authentication)。 简单来说，服务器选择一个随机数字发送给客户端。客户端使用用户私钥对这个数字信息签名后返回服务器。 服务器随后使用`.ssh/authorized_keys`文件中存储的用户公钥来验证返回的信息是否由所对应的私钥所签名。这种验证方式可以有效证明试图登录的用户持有所需的私钥。

