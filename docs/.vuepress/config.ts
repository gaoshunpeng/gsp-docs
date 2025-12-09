import { defaultTheme } from "@vuepress/theme-default";
import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";

export default defineUserConfig({
  lang: "zh-CN",

  title: "VuePress",
  description: "My first VuePress Site",

  theme: defaultTheme({
    logo: "https://vuejs.press/images/hero.png",

    navbar: [
      "/",
      "/get-started",
      "SSO单点登录实现方案",
      "多标签页登录状态同步：一个简单而有效的解决方案",
      "从“版本号打架”到 30 秒内提醒用户刷新：一个微前端团队的实践",
    ],
  }),

  bundler: viteBundler(),
});
