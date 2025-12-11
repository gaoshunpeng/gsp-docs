export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/get-started.html", { loader: () => import(/* webpackChunkName: "get-started.html" */"D:/learn-project/gsp-docs/docs/.vuepress/.temp/pages/get-started.html.js"), meta: {"title":"快速开始"} }],
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"D:/learn-project/gsp-docs/docs/.vuepress/.temp/pages/index.html.js"), meta: {"title":"首页"} }],
  ["/SSO%E5%8D%95%E7%82%B9%E7%99%BB%E5%BD%95%E5%AE%9E%E7%8E%B0%E6%96%B9%E6%A1%88.html", { loader: () => import(/* webpackChunkName: "SSO单点登录实现方案.html" */"D:/learn-project/gsp-docs/docs/.vuepress/.temp/pages/SSO单点登录实现方案.html.js"), meta: {"title":"基于Cookie的SSO单点登录系统设计与实现"} }],
  ["/%E4%BB%8E%E2%80%9C%E7%89%88%E6%9C%AC%E5%8F%B7%E6%89%93%E6%9E%B6%E2%80%9D%E5%88%B0%2030%20%E7%A7%92%E5%86%85%E6%8F%90%E9%86%92%E7%94%A8%E6%88%B7%E5%88%B7%E6%96%B0%EF%BC%9A%E4%B8%80%E4%B8%AA%E5%BE%AE%E5%89%8D%E7%AB%AF%E5%9B%A2%E9%98%9F%E7%9A%84%E5%AE%9E%E8%B7%B5.html", { loader: () => import(/* webpackChunkName: "从“版本号打架”到 30 秒内提醒用户刷新：一个微前端团队的实践.html" */"D:/learn-project/gsp-docs/docs/.vuepress/.temp/pages/从“版本号打架”到 30 秒内提醒用户刷新：一个微前端团队的实践.html.js"), meta: {"title":"从\"版本号打架\"到 30 秒内提醒用户刷新：一个微前端团队的实践"} }],
  ["/%E5%A4%9A%E6%A0%87%E7%AD%BE%E9%A1%B5%E7%99%BB%E5%BD%95%E7%8A%B6%E6%80%81%E5%90%8C%E6%AD%A5%EF%BC%9A%E4%B8%80%E4%B8%AA%E7%AE%80%E5%8D%95%E8%80%8C%E6%9C%89%E6%95%88%E7%9A%84%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88.html", { loader: () => import(/* webpackChunkName: "多标签页登录状态同步：一个简单而有效的解决方案.html" */"D:/learn-project/gsp-docs/docs/.vuepress/.temp/pages/多标签页登录状态同步：一个简单而有效的解决方案.html.js"), meta: {"title":"多标签页登录状态同步：一个简单而有效的解决方案"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"D:/learn-project/gsp-docs/docs/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);
