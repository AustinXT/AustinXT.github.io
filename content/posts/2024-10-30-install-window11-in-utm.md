---
layout: post
title: 在 Mac（M2）上，使用 UTM 安装 Windows11 虚拟机
date: 2024-10-30
categories: [实操记录]
tags: [虚拟机]
---

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Snipaste_2024-10-31_22-34_44.png)

在 Mac（M2） 上，使用 UTM 安装 Windows11 虚拟机，大致步骤还是按照[Windows 11 | UTM Documentation](https://docs.getutm.app/guides/windows/)走，中间会遇到一些卡壳的步骤需要克服一下。

## 挂载 IOS 文件，配置 UTM

### CrystalFetch 获取 IOS 文件

在 macOS 上获取 Windows 安装 ISO 的最简单方法是使用 CrystalFetch，这是一款基于 [UUP dump](https://uupdump.net/) 的免费工具。

您可以在 [App Store 下载](https://apps.apple.com/us/app/crystalfetch-iso-downloader/id6454431289?mt=12)，也可以 [Download from GitHub](https://github.com/TuringSoftware/CrystalFetch/releases/latest/download/CrystalFetch.dmg)。

默认情况下，CrystalFetch 会选择与主机架构对应的最新正式版或发布预览版。您可以更改筛选条件，以包括预发布版本以及服务器版本。

### 配置 UTM

1. 打开 UTM，并点击“+”按钮进入虚拟机创建向导。
2. 选择“Virtualize”。
3. 选择“Windows”。
4. 确保“Import VHDX Image”未选中，并勾选“Install Windows 10 or higher”。同时确保“Install drivers and SPICE tools”已勾选。点击“Browse”按钮并选择下载好的 ISO 文件。
5. 选择要分配给虚拟机的 RAM 和 CPU 核心数量。点击“Next”继续。
6. 指定要分配的最大磁盘空间。点击“Next”继续。
7. 如果有要在虚拟机中挂载的目录，可以在此选择。或者可以跳过此步骤，稍后在虚拟机窗口工具栏中选择要共享的目录。在安装 SPICE 工具后（见下文），该共享目录将可用。点击“Next”继续。
8. 点击“Save”保存并创建虚拟机。等待来宾工具下载完成，然后点击“Run”按钮启动虚拟机。

## 装机（Setup）过程

从 ISO 启动后，我们进入 Windows Setup 过程。Setup 过程可能会遇到一些问题，下面是常见问题的解答。

### 进入 EFI Shell 而非 Windows 安装程序

首先，确保在启动时按下了任意键以进入安装程序，并确认生成的 ISO 文件与架构匹配。请注意，arm64 是针对 Apple Silicon 芯片的，而 amd64 是针对 Intel 芯片的。

### 安装程序崩溃并出现蓝屏错误 SYSTEM_THREAD_EXCEPTION_NOT_HANDLED

这是由于 Windows 版本过旧。构建版本号应为 21390 或更高。

### 解决"This PC doesn't currently meet the minimum system requirements to run Windows 11"

如果不是默认 RAM、CPU、磁盘空间等配置，可能会出现上述提示，可以参考[Windows 11 Specs and System Requirements](https://www.microsoft.com/en-us/windows/windows-11-specifications?r=1)调整配置。

### 解决“This PC can’t run Windows 11”

如果出现“This PC can’t run Windows 11”，怎么解决？

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/This-PC-cant-run-Windows-11.png)

解决方案是，绕过“This PC can’t run Windows 11”提示。

要绕过提示，可以在注册表编辑器中添加三个 DWORD 值来跳过检查。以下是分步骤的具体操作方法：

#### 步骤 1：返回 Windows 设置上一步

点击左上角的“上一步”按钮。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/This-PC-cant-run-Windows-11-previous-button.png)

#### 步骤 2：打开命令提示符

按下键盘上的 Shift + F10 打开命令提示符窗口。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Snipaste_2024-10-31_22-21_13.png)

#### 步骤 3：打开注册表编辑器

在命令提示符窗口中输入 regedit，打开注册表编辑器。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/This-PC-cant-run-Windows-11-start-regedit.png)

#### 步骤 4：创建注册表键值

进入 HKEY_LOCAL_MACHINE\SYSTEM\Setup 路径。在该路径下创建一个名为 LabConfig 的新键。然后添加以下五个 DWORD（32 位）值，并将每个值的数据设置为 1.

- BypassCPUCheck
- BypassRAMCheck
- BypassSecureBootCheck
- BypassStorageCheck
- BypassTPMCheck

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/This-PC-cant-run-Windows-11-add-registry-values.png)

#### 步骤 5：关闭窗口

点击关闭按钮关闭注册表编辑器和命令提示符窗口，返回 Windows 设置屏幕，开始安装 Windows 11。

完成以上步骤后，可以继续安装 Windows 11，不会再出现“This PC can’t run Windows 11”的提示。

### SPICE Guest Tools 未自动安装

手动下载 SPICE Guest Tools [IOS](https://github.com/utmapp/qemu/releases/download/v7.0.0-utm/spice-guest-tools-0.164.4.iso)，将其挂在到 USB。

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/Snipaste_2024-10-31_23-28_52.png)

重新启动 Windows11，进入刚刚挂载的 Drive，双击 spice-guest-tools-xxx.exe 文件安装 SPICE Guest Tools。

### 如何配置网络

![](https://xieting-img.oss-cn-hangzhou.aliyuncs.com/w8zwwcrqt4p81.webp)

确保安装了 SPICE Guest Tools，它包含网络驱动程序。

如果由于缺少网络连接，Windows 11 安装程序卡住，请按以下步骤操作：

1. 返回语言选择屏幕（如果已经跳过该屏幕，可能需要重新启动安装程序）。
2. 按 Shift + F10 启动命令提示符。
3. 输入 `OOBE\BYPASSNRO` 并按 Enter。
4. 虚拟机将重新启动，在设置屏幕上应显示“I don’t have internet.”的选项。
5. 完成 Windows 安装后，确保安装 SPICE Guest Tools 以获取网络驱动。

## Ref

- [Windows 11 | UTM Documentation](https://docs.getutm.app/guides/windows/)
- [This PC can't run Windows 11 - Bypass/Fix - ALI TAJRAN](https://www.alitajran.com/this-pc-cant-run-windows-11/)
- [Turn off Windows Defender in Windows 11 permanently - ALI TAJRAN](https://www.alitajran.com/turn-off-windows-defender-windows-11-permanently/)
- [Windows 11 Specs and System Requirements | Microsoft](https://www.microsoft.com/en-us/windows/windows-11-specifications?r=1)
- [Windows | UTM Documentation](https://docs.getutm.app/guest-support/windows/#windows-xp-and-higher)

## ChangeLog

- 2024-10-30 初稿