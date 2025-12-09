# 快速开始

这是一个普通页面，包含了 VuePress 的基础内容。

## 页面

你可以在 vuepress 目录中添加 markdown 文件，每个 markdown 文件都会被转换成你网站中的一个页面。

查看 [路由][routing] 了解更多详情。

## 内容

每个 markdown 文件 [都会被渲染成 HTML，然后转换成 Vue 单文件组件][content]。

VuePress 支持基础的 markdown 语法和 [一些扩展][synatex-extensions]，你也可以 [在其中使用 Vue 特性][vue-feature]。

## 配置

VuePress 使用 `.vuepress/config.js`（或 .ts）文件作为 [站点配置][config]，你可以用它来配置你的站点。

对于 [客户端配置][client-config]，你可以创建 `.vuepress/client.js`（或 .ts）。

同时，你也可以通过 [frontmatter][] 为每个页面添加配置。

## 布局和自定义

以下是控制 `@vuepress/theme-default` 布局的常用配置：

- [导航栏][navbar]
- [侧边栏][sidebar]

查看 [默认主题文档][default-theme] 获取完整参考。

你可以通过 `.vuepress/styles/index.scss` 文件 [添加额外样式][style]。

[routing]: https://vuejs.press/zh/guide/page.html#路由
[content]: https://vuejs.press/zh/guide/page.html#内容
[synatex-extensions]: https://vuejs.press/zh/guide/markdown.html#语法扩展
[vue-feature]: https://vuejs.press/zh/guide/markdown.html#在-markdown-中使用-vue
[config]: https://vuejs.press/zh/guide/configuration.html#配置文件
[client-config]: https://vuejs.press/zh/guide/configuration.html#客户端配置文件
[frontmatter]: https://vuejs.press/zh/guide/page.html#frontmatter
[navbar]: https://vuejs.press/zh/reference/default-theme/config.html#navbar
[sidebar]: https://vuejs.press/zh/reference/default-theme/config.html#sidebar
[default-theme]: https://vuejs.press/zh/reference/default-theme/
[style]: https://vuejs.press/zh/reference/default-theme/styles.html#style-文件
