import { GitContributors } from "D:/learn-project/gsp-docs/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-_7304fbbca4c4d4b3bf10b2a062c78f40/node_modules/@vuepress/plugin-git/lib/client/components/GitContributors.js";
import { GitChangelog } from "D:/learn-project/gsp-docs/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-_7304fbbca4c4d4b3bf10b2a062c78f40/node_modules/@vuepress/plugin-git/lib/client/components/GitChangelog.js";

export default {
  enhance: ({ app }) => {
    app.component("GitContributors", GitContributors);
    app.component("GitChangelog", GitChangelog);
  },
};
