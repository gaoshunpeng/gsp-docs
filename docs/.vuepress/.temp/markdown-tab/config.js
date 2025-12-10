import { CodeTabs } from "D:/learn-project/gsp-docs/node_modules/.pnpm/@vuepress+plugin-markdown-t_1e692810263e8182af520a0de6690bc2/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "D:/learn-project/gsp-docs/node_modules/.pnpm/@vuepress+plugin-markdown-t_1e692810263e8182af520a0de6690bc2/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "D:/learn-project/gsp-docs/node_modules/.pnpm/@vuepress+plugin-markdown-t_1e692810263e8182af520a0de6690bc2/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
