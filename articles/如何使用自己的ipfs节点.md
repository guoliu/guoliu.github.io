---
title: "如何使用自己的IPFS节点"
date: "2019-05-18T03:42:49.748Z"
syndicated:
  - "https://matters.town/@guo/如何使用自己的ipfs节点-sm1qn36teac7"
---

在Matters推出自己的桌面版本之前，用户也可以下载IPFS生态中的工具，通过自己的节点浏览IPFS上的内容。尽管使用起来还很麻烦，还是推荐给有兴趣的朋友玩玩看。

## 下载本地节点


1. 在[这里](https://github.com/ipfs-shipyard/ipfs-desktop#install)下载自己操作系统对应版本的ipfs-desktop，一个封装了IPFS节点的简单桌面UI。另一个选择是[Siderus Orion](https://orion.siderus.io/#/download)，和ipfs-desktop类似、都可用于文件分享，少了工具栏菜单，但是多了些文件管理的界面。
2. 安装并启动程序。可以看到自己与多少临近节点相连，也可以用于传输文件。启动后，IPFS节点将会在本地8080端口打开一个http gateway。

## 安装浏览器插件

节点UI只是用于控制文件传输，但是无法浏览html文档，所以我们还需要一个浏览器插件，让浏览器渲染IPFS传输的html数据，从[这里下载](https://github.com/ipfs-shipyard/ipfs-companion#install)，支持chrome与firefox。

安装浏览器插件后，在IPFS节点运行状态下，插件会将所有包含 */ipfs/ *的链接跳转到本地8080端口，通过本地IPFS节点获取数据。这样打开Matters的公共节点文章url都会转到本地节点，也可以通过 [http://127.0.0.1:8080/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/](http://127.0.0.1:8080/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/) 访问英文版维基百科。

