"use strict";
var MattersPlugin = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/converter.ts
  var converter_exports = {};
  __export(converter_exports, {
    extractMarkdownLinks: () => extractMarkdownLinks,
    extractRemoteImageUrls: () => extractRemoteImageUrls,
    generateFrontmatter: () => generateFrontmatter,
    htmlToMarkdown: () => htmlToMarkdown,
    parseFrontmatter: () => parseFrontmatter,
    regenerateFrontmatter: () => regenerateFrontmatter
  });
  function htmlToMarkdown(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return processNode(doc.body);
  }
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }
    const element = node;
    const tagName = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes).map(processNode).join("");
    switch (tagName) {
      case "h1":
        return `# ${children.trim()}

`;
      case "h2":
        return `## ${children.trim()}

`;
      case "h3":
        return `### ${children.trim()}

`;
      case "h4":
        return `#### ${children.trim()}

`;
      case "h5":
        return `##### ${children.trim()}

`;
      case "h6":
        return `###### ${children.trim()}

`;
      case "p":
        return `${children.trim()}

`;
      case "br":
        return "\\\n";
      case "hr":
        return "\n---\n\n";
      case "strong":
      case "b":
        return children.trim() ? `**${children}**` : "";
      case "em":
      case "i":
        return `*${children}*`;
      case "code":
        if (element.parentElement?.tagName.toLowerCase() === "pre") {
          return children;
        }
        return `\`${children}\``;
      case "pre": {
        const codeElement = element.querySelector("code");
        const codeContent = codeElement ? codeElement.textContent : children;
        const lang = codeElement?.className?.match(/language-(\w+)/)?.[1] || "";
        return `
\`\`\`${lang}
${codeContent?.trim()}
\`\`\`

`;
      }
      case "a": {
        const href = element.getAttribute("href") || "";
        return `[${children}](${href})`;
      }
      case "img": {
        const src = element.getAttribute("src") || "";
        const alt = element.getAttribute("alt") || "";
        return `![${alt}](${src})`;
      }
      case "ul":
        return "\n" + children + "\n";
      case "ol":
        return "\n" + children + "\n";
      case "li": {
        const parent = element.parentElement;
        if (parent?.tagName.toLowerCase() === "ol") {
          const index = Array.from(parent.children).indexOf(element) + 1;
          return `${index}. ${children.trim()}
`;
        }
        return `- ${children.trim()}
`;
      }
      case "blockquote": {
        const lines = children.trim().split("\n");
        return lines.map((line) => `> ${line}`).join("\n") + "\n\n";
      }
      case "figure":
        return children.trimEnd() + "\n\n";
      case "figcaption":
        return children.trim() ? `*${children.trim()}*

` : "\n\n";
      case "div":
      case "span":
      case "section":
      case "article":
        return children;
      default:
        return children;
    }
  }
  function escapeYaml(str) {
    return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function generateFrontmatter(data) {
    const lines = ["---"];
    lines.push(`title: "${escapeYaml(data.title)}"`);
    if (data.description) {
      lines.push(`description: "${escapeYaml(data.description)}"`);
    }
    if (data.date) {
      lines.push(`date: "${data.date}"`);
    }
    if (data.updated) {
      lines.push(`updated: "${data.updated}"`);
    }
    if (data.tags && data.tags.length > 0) {
      lines.push("tags:");
      for (const tag of data.tags) {
        lines.push(`  - "${escapeYaml(tag)}"`);
      }
    }
    if (data.cover) {
      lines.push(`cover: "${data.cover}"`);
    }
    if (data.syndicated && data.syndicated.length > 0) {
      lines.push("syndicated:");
      for (const url of data.syndicated) {
        lines.push(`  - "${url}"`);
      }
    }
    if (data.collections) {
      if (Array.isArray(data.collections)) {
        if (data.collections.length > 0) {
          lines.push("collections:");
          for (const slug of data.collections) {
            lines.push(`  - "${slug}"`);
          }
        }
      } else if (Object.keys(data.collections).length > 0) {
        lines.push("collections:");
        for (const [slug, order] of Object.entries(data.collections)) {
          lines.push(`  ${slug}: ${order}`);
        }
      }
    }
    if (data.order && data.order.length > 0) {
      lines.push("order:");
      for (const filename of data.order) {
        lines.push(`  - "${filename}"`);
      }
    }
    lines.push("---");
    return lines.join("\n");
  }
  function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return null;
    }
    const frontmatterStr = match[1];
    const body = match[2];
    const frontmatter = {};
    const lines = frontmatterStr.split("\n");
    let currentKey = "";
    let currentArray = [];
    for (const line of lines) {
      if (line.startsWith("  - ")) {
        const value = line.substring(4).replace(/^"(.*)"$/, "$1");
        currentArray.push(value);
      } else if (line.includes(":")) {
        if (currentKey && currentArray.length > 0) {
          frontmatter[currentKey] = currentArray;
          currentArray = [];
        }
        const colonIndex = line.indexOf(":");
        const key = line.substring(0, colonIndex);
        const rest = line.substring(colonIndex + 1).trim();
        if (rest === "") {
          currentKey = key;
          currentArray = [];
        } else {
          currentKey = "";
          frontmatter[key] = rest.replace(/^"(.*)"$/, "$1");
        }
      }
    }
    if (currentKey && currentArray.length > 0) {
      frontmatter[currentKey] = currentArray;
    }
    return { frontmatter, body };
  }
  function regenerateFrontmatter(frontmatter) {
    const lines = ["---"];
    const formatValue = (value) => {
      if (typeof value === "string") {
        if (value.includes(":") || value.includes("#") || value.includes('"') || value.startsWith(" ")) {
          return `"${escapeYaml(value)}"`;
        }
        return `"${value}"`;
      }
      return String(value);
    };
    const fieldOrder = ["title", "description", "date", "updated", "tags", "cover", "syndicated", "collections", "order"];
    for (const key of fieldOrder) {
      if (!(key in frontmatter)) continue;
      const value = frontmatter[key];
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${formatValue(item)}`);
        }
      } else if (typeof value === "object" && value !== null) {
        lines.push(`${key}:`);
        for (const [subKey, subValue] of Object.entries(value)) {
          lines.push(`  ${subKey}: ${subValue}`);
        }
      } else if (typeof value === "boolean") {
        lines.push(`${key}: ${value}`);
      } else {
        lines.push(`${key}: ${formatValue(value)}`);
      }
    }
    for (const [key, value] of Object.entries(frontmatter)) {
      if (fieldOrder.includes(key)) continue;
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${formatValue(item)}`);
        }
      } else if (typeof value === "object" && value !== null) {
        lines.push(`${key}:`);
        for (const [subKey, subValue] of Object.entries(value)) {
          lines.push(`  ${subKey}: ${subValue}`);
        }
      } else if (typeof value === "boolean") {
        lines.push(`${key}: ${value}`);
      } else {
        lines.push(`${key}: ${formatValue(value)}`);
      }
    }
    lines.push("---");
    return lines.join("\n");
  }
  function extractMarkdownLinks(content) {
    const results = [];
    const linkPattern = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      results.push({
        fullMatch: match[0],
        url: match[2].trim()
      });
    }
    return results;
  }
  function extractRemoteImageUrls(content) {
    const results = [];
    const seen = /* @__PURE__ */ new Set();
    const imagePattern = /!\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = imagePattern.exec(content)) !== null) {
      const url = match[1].trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        continue;
      }
      if (seen.has(url)) {
        continue;
      }
      seen.add(url);
      const localFilename = generateLocalFilenameFromUrl(url);
      if (localFilename) {
        results.push({ url, localFilename });
      }
    }
    return results;
  }
  function generateLocalFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const cleanPath = pathname.replace(/\/public$/, "");
      const segments = cleanPath.split("/").filter((s) => s.length > 0);
      for (let i = segments.length - 1; i >= 0; i--) {
        const segment = segments[i];
        const extMatch = segment.match(/\.(\w+)$/);
        if (extMatch) {
          const ext = extMatch[1].toLowerCase();
          if (i > 0 && /^[a-f0-9-]{36}$/i.test(segments[i - 1])) {
            return `${segments[i - 1]}.${ext}`;
          }
          return segment;
        }
      }
      for (const segment of segments) {
        if (/^[a-f0-9-]{36}$/i.test(segment)) {
          return segment;
        }
      }
      let hash = 0;
      for (let i = 0; i < url.length; i++) {
        hash = (hash << 5) - hash + url.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    } catch {
      return null;
    }
  }
  var init_converter = __esm({
    "src/converter.ts"() {
      "use strict";
    }
  });

  // src/main.ts
  var main_exports = {};
  __export(main_exports, {
    addCanonicalLinkToContent: () => addCanonicalLinkToContent,
    getArticleContent: () => getArticleContent,
    getDraftId: () => getDraftId,
    getDraftMap: () => getDraftMap,
    isArticleLive: () => isArticleLive,
    normalizeHtmlForMatters: () => normalizeHtmlForMatters,
    process: () => process2,
    removeDraftId: () => removeDraftId,
    saveDraftId: () => saveDraftId,
    saveDraftMap: () => saveDraftMap,
    syndicate: () => syndicate,
    syndicateArticle: () => syndicateArticle,
    uploadAndReplaceLocalImages: () => uploadAndReplaceLocalImages
  });

  // ../../packages/moss-api/dist/index.mjs
  function getTauriCore() {
    const w = window;
    if (!w.__TAURI__?.core) throw new Error("Tauri core not available");
    return w.__TAURI__.core;
  }
  function isTauriAvailable() {
    return !!window.__TAURI__?.core;
  }
  function getTauriEvent$1() {
    const w = window;
    if (!w.__TAURI__?.event) throw new Error("Tauri event API not available");
    return w.__TAURI__.event;
  }
  function isEventApiAvailable() {
    return !!window.__TAURI__?.event;
  }
  async function emitEvent(event, payload) {
    await getTauriEvent$1().emit(event, payload);
  }
  var currentPluginName = "";
  var currentHookName = "";
  function setMessageContext(pluginName, hookName) {
    currentPluginName = pluginName;
    currentHookName = hookName;
  }
  async function sendMessage(message) {
    if (message.type === "log" || message.type === "progress") {
      if (!isEventApiAvailable()) return;
      try {
        await emitEvent("plugin-message", {
          pluginName: currentPluginName,
          hookName: currentHookName,
          message
        });
      } catch {
      }
      return;
    }
    if (!isTauriAvailable()) return;
    try {
      await getTauriCore().invoke("plugin_message", {
        pluginName: currentPluginName,
        hookName: currentHookName,
        message
      });
    } catch (error) {
      console.error("\u274C [SDK] Failed to send message:", message.type, "\u2013", error);
    }
  }
  async function reportProgress(phase, current, total, message) {
    await sendMessage({
      type: "progress",
      phase,
      current,
      total,
      message
    });
  }
  async function reportError(error, context, fatal = false) {
    await sendMessage({
      type: "error",
      error,
      context,
      fatal
    });
  }
  function getTauriEvent() {
    const w = window;
    if (!w.__TAURI__?.event?.listen) throw new Error("Tauri event API not available");
    return w.__TAURI__.event;
  }
  async function openBrowser(url) {
    await getTauriCore().invoke("open_action_panel", {
      url,
      belowTitlebar: true
    });
    const closed = new Promise((resolve) => {
      const { listen } = getTauriEvent();
      listen("browser-closed", (event) => {
        const payload = event.payload;
        resolve(payload.reason);
      }).then((unlisten) => {
        closed.then(() => unlisten());
      });
    });
    return { closed };
  }
  async function closeBrowser() {
    await getTauriCore().invoke("close_action_panel", {});
  }
  function getInternalContext() {
    const context = window.__MOSS_INTERNAL_CONTEXT__;
    if (!context) throw new Error("This function must be called from within a plugin hook. Ensure you're calling this from process(), generate(), deploy(), or syndicate().");
    return context;
  }
  function hasContext() {
    return window.__MOSS_INTERNAL_CONTEXT__ !== void 0;
  }
  async function readFile(relativePath) {
    const ctx = getInternalContext();
    return getTauriCore().invoke("read_project_file", {
      projectPath: ctx.project_path,
      relativePath
    });
  }
  async function writeFile(relativePath, content) {
    const ctx = getInternalContext();
    await getTauriCore().invoke("write_project_file", {
      projectPath: ctx.project_path,
      relativePath,
      data: content
    });
  }
  async function listFiles() {
    const ctx = getInternalContext();
    return getTauriCore().invoke("list_project_files", { projectPath: ctx.project_path });
  }
  async function listProjectTree() {
    return getTauriCore().invoke("list_project_tree", {});
  }
  async function readPluginFile(relativePath) {
    const ctx = getInternalContext();
    return getTauriCore().invoke("read_plugin_file", {
      pluginName: ctx.plugin_name,
      projectPath: ctx.project_path,
      relativePath
    });
  }
  async function writePluginFile(relativePath, content) {
    const ctx = getInternalContext();
    await getTauriCore().invoke("write_plugin_file", {
      pluginName: ctx.plugin_name,
      projectPath: ctx.project_path,
      relativePath,
      content
    });
  }
  async function pluginFileExists(relativePath) {
    const ctx = getInternalContext();
    return getTauriCore().invoke("plugin_file_exists", {
      pluginName: ctx.plugin_name,
      projectPath: ctx.project_path,
      relativePath
    });
  }
  async function httpPost(url, body, options = {}) {
    const { timeoutMs = 3e4, headers = {} } = options;
    const result = await getTauriCore().invoke("http_post", {
      url,
      body: JSON.stringify(body),
      headers,
      timeoutMs
    });
    const binaryString = atob(result.body_base64);
    const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    return {
      status: result.status,
      ok: result.ok,
      contentType: result.content_type,
      body: bytes,
      text() {
        return new TextDecoder().decode(bytes);
      }
    };
  }
  async function downloadAsset(url, targetDir, options = {}) {
    const ctx = getInternalContext();
    const { timeoutMs = 3e4 } = options;
    const result = await getTauriCore().invoke("download_asset", {
      url,
      projectPath: ctx.project_path,
      targetDir,
      timeoutMs
    });
    return {
      status: result.status,
      ok: result.ok,
      contentType: result.content_type,
      bytesWritten: result.bytes_written,
      actualPath: result.actual_path
    };
  }
  async function getPluginCookie() {
    if (!hasContext()) return null;
    const ctx = getInternalContext();
    return getTauriCore().invoke("get_plugin_cookie", {
      pluginName: ctx.plugin_name,
      projectPath: ctx.project_path
    });
  }
  var TOAST_EVENT = "show-toast";
  async function showToast(options) {
    await emitEvent(TOAST_EVENT, typeof options === "string" ? { message: options } : options);
  }

  // src/utils.ts
  var PLUGIN_NAME = "matters";
  setMessageContext(PLUGIN_NAME, "");
  function setCurrentHookName(name) {
    setMessageContext(PLUGIN_NAME, name);
  }
  function reportProgress2(phase, current, total, message) {
    reportProgress(phase, current, total, message).catch(() => {
    });
  }
  async function reportError2(error, context, fatal = false) {
    await reportError(error, context, fatal);
  }
  function slugify(text) {
    return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // src/api.ts
  function getEnv(key) {
    if (typeof process !== "undefined" && process.env) {
      return process.env[key];
    }
    return void 0;
  }
  var apiConfig = {
    /** GraphQL endpoint URL */
    endpoint: getEnv("MATTERS_API_ENDPOINT") || "https://server.matters.town/graphql",
    /** Query mode: "viewer" (requires auth) or "user" (public, for testing) */
    queryMode: getEnv("MATTERS_QUERY_MODE") || "viewer",
    /** Username for user queries in test mode */
    testUserName: getEnv("MATTERS_TEST_USER") || "Matty"
  };
  var ARTICLES_QUERY = `
query MePublishedArticles($after: String) {
  viewer {
    id
    userName
    articles(input: { first: 50, after: $after, filter: { state: active } }) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          title
          slug
          shortHash
          content
          summary
          createdAt
          revisedAt
          tags {
            id
            content
          }
          cover
        }
      }
    }
  }
}
`;
  var DRAFTS_QUERY = `
query MeDrafts($after: String) {
  viewer {
    id
    drafts(input: { first: 50, after: $after }) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          title
          content
          summary
          createdAt
          updatedAt
          tags
          cover
        }
      }
    }
  }
}
`;
  var COLLECTIONS_QUERY = `
query MeCollections($after: String) {
  viewer {
    id
    collections(input: { first: 50, after: $after }) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          title
          description
          cover
          articles(input: { first: 100 }) {
            edges {
              node {
                id
                shortHash
                title
                slug
              }
            }
          }
        }
      }
    }
  }
}
`;
  var PROFILE_QUERY = `
query MeProfile {
  viewer {
    id
    userName
    displayName
    info {
      description
      profileCover
    }
    avatar
    settings {
      language
    }
    pinnedWorks {
      id
      pinned
      title
      cover
      __typename
      ... on Article {
        slug
        shortHash
      }
    }
  }
}
`;
  var USER_ARTICLES_QUERY = `
query UserArticles($userName: String!, $after: String) {
  user(input: { userName: $userName }) {
    id
    userName
    articles(input: { first: 50, after: $after, filter: { state: active } }) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          title
          slug
          shortHash
          content
          summary
          createdAt
          revisedAt
          tags {
            id
            content
          }
          cover
        }
      }
    }
  }
}
`;
  var USER_COLLECTIONS_QUERY = `
query UserCollections($userName: String!, $after: String) {
  user(input: { userName: $userName }) {
    id
    collections(input: { first: 50, after: $after }) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          title
          description
          cover
          articles(input: { first: 100 }) {
            edges {
              node {
                id
                shortHash
                title
                slug
              }
            }
          }
        }
      }
    }
  }
}
`;
  var USER_PROFILE_QUERY = `
query UserProfile($userName: String!) {
  user(input: { userName: $userName }) {
    id
    userName
    displayName
    info {
      description
      profileCover
    }
    avatar
    pinnedWorks {
      id
      pinned
      title
      cover
      __typename
      ... on Article {
        slug
        shortHash
      }
    }
  }
}
`;
  var ARTICLE_COMMENTS_QUERY = `
query ArticleComments($shortHash: String!, $after: String) {
  article(input: { shortHash: $shortHash }) {
    id
    shortHash
    comments(input: { first: 50, after: $after, sort: newest }) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          content
          createdAt
          state
          upvotes
          author {
            id
            userName
            displayName
            avatar
          }
          replyTo {
            id
            author {
              userName
            }
          }
        }
      }
    }
  }
}
`;
  var PUT_DRAFT_MUTATION = `
mutation PutDraft($input: PutDraftInput!) {
  putDraft(input: $input) {
    id
    title
    content
    summary
    createdAt
    updatedAt
    tags
    cover
    publishState
    article {
      id
      shortHash
      slug
    }
  }
}
`;
  var GET_DRAFT_QUERY = `
query GetDraft($id: ID!) {
  node(input: { id: $id }) {
    ... on Draft {
      id
      title
      publishState
      article {
        id
        shortHash
        slug
      }
    }
  }
}
`;
  var AUTH_FILE = "auth.json";
  var cachedAccessToken = null;
  function clearTokenCache() {
    cachedAccessToken = null;
  }
  async function loadStoredToken() {
    try {
      const exists = await pluginFileExists(AUTH_FILE);
      if (!exists) return null;
      const content = await readPluginFile(AUTH_FILE);
      const data = JSON.parse(content);
      return typeof data.accessToken === "string" ? data.accessToken : null;
    } catch {
      return null;
    }
  }
  async function saveStoredToken(token) {
    const data = { accessToken: token, savedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await writePluginFile(AUTH_FILE, JSON.stringify(data, null, 2));
    console.log("\u{1F4BE} Access token saved to project storage");
  }
  async function getAccessToken(fromCookie = false) {
    if (cachedAccessToken !== null) {
      return cachedAccessToken;
    }
    try {
      const storedToken = await loadStoredToken();
      if (storedToken) {
        console.log("\u{1F511} Using stored access token from project storage");
        cachedAccessToken = storedToken;
        return cachedAccessToken;
      }
    } catch {
    }
    if (!fromCookie) {
      return null;
    }
    try {
      console.log("\u{1F36A} Checking cookies for access token (login flow)...");
      const cookies = await getPluginCookie();
      if (cookies === null) {
        console.log("\u26A0\uFE0F No plugin context - cannot get cookies");
        return void 0;
      }
      const tokenCookie = cookies.find((c) => c.name === "__access_token");
      if (tokenCookie) {
        console.log(`Found __access_token cookie (length: ${tokenCookie.value?.length ?? 0})`);
        cachedAccessToken = tokenCookie.value;
        try {
          await saveStoredToken(tokenCookie.value);
        } catch (e) {
          console.warn(`Failed to persist token to storage: ${e}`);
        }
      } else {
        console.warn("__access_token cookie NOT found");
      }
      return cachedAccessToken;
    } catch (error) {
      console.error(`\u274C Failed to get access token: ${error}`);
      return null;
    }
  }
  async function graphqlQuery(query, variables) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("No access token available. Please login first.");
    }
    const response = await httpPost(
      apiConfig.endpoint,
      { query, variables },
      {
        headers: {
          "x-access-token": token
        },
        timeoutMs: 3e4
      }
    );
    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }
    const result = JSON.parse(response.text());
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }
    return result.data;
  }
  async function graphqlQueryPublic(query, variables) {
    console.log(`[matters] graphqlQueryPublic: fetching with vars:`, JSON.stringify(variables));
    const response = await httpPost(
      apiConfig.endpoint,
      { query, variables },
      {
        headers: {
          "User-Agent": "MattersPlugin/1.0",
          Accept: "application/json"
        },
        timeoutMs: 3e4
      }
    );
    console.log(`[matters] graphqlQueryPublic: response status ${response.status}`);
    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }
    const result = JSON.parse(response.text());
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }
    return result.data;
  }
  async function fetchAllArticles() {
    if (apiConfig.queryMode === "user") {
      return fetchUserArticles(apiConfig.testUserName);
    }
    return fetchViewerArticles();
  }
  async function fetchViewerArticles() {
    const allArticles = [];
    let cursor;
    let userName = "";
    console.log("\u{1F4E1} Fetching published articles from Matters (viewer mode)...");
    do {
      const data = await graphqlQuery(ARTICLES_QUERY, {
        after: cursor
      });
      if (!data.viewer) {
        throw new Error("Failed to fetch viewer data");
      }
      userName = data.viewer.userName;
      const { edges, pageInfo } = data.viewer.articles;
      for (const edge of edges) {
        allArticles.push(edge.node);
      }
      console.log(`   Fetched ${allArticles.length}/${data.viewer.articles.totalCount} articles...`);
      cursor = pageInfo.hasNextPage ? pageInfo.endCursor : void 0;
    } while (cursor);
    return { articles: allArticles, userName };
  }
  async function fetchUserArticles(userName) {
    const allArticles = [];
    let cursor;
    console.log(`\u{1F4E1} Fetching published articles from Matters (user mode: @${userName})...`);
    do {
      const data = await graphqlQueryPublic(USER_ARTICLES_QUERY, {
        userName,
        after: cursor
      });
      if (!data.user) {
        throw new Error(`Failed to fetch user data for @${userName}`);
      }
      const { edges, pageInfo } = data.user.articles;
      if (edges) {
        for (const edge of edges) {
          allArticles.push({
            id: edge.node.id,
            title: edge.node.title,
            slug: edge.node.slug,
            shortHash: edge.node.shortHash,
            content: edge.node.content,
            summary: edge.node.summary,
            createdAt: edge.node.createdAt,
            revisedAt: edge.node.revisedAt ?? void 0,
            cover: edge.node.cover ?? void 0,
            tags: edge.node.tags?.map((t) => ({ id: t.id, content: t.content })) ?? []
          });
        }
      }
      console.log(`   Fetched ${allArticles.length}/${data.user.articles.totalCount} articles...`);
      cursor = pageInfo.hasNextPage ? pageInfo.endCursor ?? void 0 : void 0;
    } while (cursor);
    return { articles: allArticles, userName };
  }
  async function fetchAllDrafts() {
    if (apiConfig.queryMode === "user") {
      console.log("\u{1F4E1} Skipping drafts (not available in user mode)...");
      return [];
    }
    const allDrafts = [];
    let cursor;
    console.log("\u{1F4E1} Fetching drafts from Matters (viewer mode)...");
    do {
      const data = await graphqlQuery(DRAFTS_QUERY, {
        after: cursor
      });
      if (!data.viewer) {
        throw new Error("Failed to fetch viewer data");
      }
      const { edges, pageInfo } = data.viewer.drafts;
      for (const edge of edges) {
        allDrafts.push(edge.node);
      }
      console.log(`   Fetched ${allDrafts.length} drafts...`);
      cursor = pageInfo.hasNextPage ? pageInfo.endCursor : void 0;
    } while (cursor);
    return allDrafts;
  }
  async function fetchAllDraftsSince(since) {
    const drafts = await fetchAllDrafts();
    if (!since) {
      console.log(`   \u{1F4C5} No lastSyncedAt, returning all ${drafts.length} drafts`);
      return drafts;
    }
    const sinceDate = new Date(since);
    const filteredDrafts = drafts.filter((draft) => {
      const draftDate = new Date(draft.createdAt);
      return draftDate > sinceDate;
    });
    console.log(`   \u{1F4C5} Filtered to ${filteredDrafts.length} new drafts since ${since}`);
    return filteredDrafts;
  }
  async function fetchAllCollections() {
    if (apiConfig.queryMode === "user") {
      return fetchUserCollections(apiConfig.testUserName);
    }
    return fetchViewerCollections();
  }
  async function fetchViewerCollections() {
    const allCollections = [];
    let cursor;
    console.log("\u{1F4E1} Fetching collections from Matters (viewer mode)...");
    do {
      const data = await graphqlQuery(COLLECTIONS_QUERY, {
        after: cursor
      });
      if (!data.viewer) {
        throw new Error("Failed to fetch viewer data");
      }
      const { edges, pageInfo } = data.viewer.collections;
      for (const edge of edges) {
        const collection = {
          id: edge.node.id,
          title: edge.node.title,
          description: edge.node.description,
          cover: edge.node.cover,
          articles: edge.node.articles.edges.map((e) => e.node)
        };
        allCollections.push(collection);
      }
      console.log(`   Fetched ${allCollections.length}/${data.viewer.collections.totalCount} collections...`);
      cursor = pageInfo.hasNextPage ? pageInfo.endCursor : void 0;
    } while (cursor);
    return allCollections;
  }
  async function fetchUserCollections(userName) {
    const allCollections = [];
    let cursor;
    console.log(`\u{1F4E1} Fetching collections from Matters (user mode: @${userName})...`);
    do {
      const data = await graphqlQueryPublic(USER_COLLECTIONS_QUERY, {
        userName,
        after: cursor
      });
      if (!data.user) {
        throw new Error(`Failed to fetch user data for @${userName}`);
      }
      const { edges, pageInfo } = data.user.collections;
      if (edges) {
        for (const edge of edges) {
          const collection = {
            id: edge.node.id,
            title: edge.node.title,
            description: edge.node.description ?? void 0,
            cover: edge.node.cover ?? void 0,
            articles: edge.node.articles.edges?.map((e) => e.node) ?? []
          };
          allCollections.push(collection);
        }
      }
      console.log(`   Fetched ${allCollections.length}/${data.user.collections.totalCount} collections...`);
      cursor = pageInfo.hasNextPage ? pageInfo.endCursor ?? void 0 : void 0;
    } while (cursor);
    return allCollections;
  }
  async function fetchUserProfile() {
    if (apiConfig.queryMode === "user") {
      return fetchUserProfilePublic(apiConfig.testUserName);
    }
    return fetchViewerProfile();
  }
  async function fetchViewerProfile() {
    console.log("\u{1F4E1} Fetching user profile from Matters (viewer mode)...");
    const data = await graphqlQuery(PROFILE_QUERY);
    if (!data.viewer) {
      throw new Error("Failed to fetch user profile");
    }
    const profile = {
      userName: data.viewer.userName,
      displayName: data.viewer.displayName,
      description: data.viewer.info?.description,
      avatar: data.viewer.avatar,
      profileCover: data.viewer.info?.profileCover,
      language: data.viewer.settings?.language,
      pinnedWorks: (data.viewer.pinnedWorks || []).map((work) => ({
        id: work.id,
        type: work.__typename === "Article" ? "article" : "collection",
        title: work.title,
        slug: work.__typename === "Article" ? work.slug : void 0,
        shortHash: work.__typename === "Article" ? work.shortHash : void 0,
        cover: work.cover
      }))
    };
    console.log(`   Profile: ${profile.displayName} (@${profile.userName})`);
    console.log(`   Language: ${profile.language || "not set"}`);
    return profile;
  }
  async function fetchUserProfilePublic(userName) {
    console.log(`\u{1F4E1} Fetching user profile from Matters (user mode: @${userName})...`);
    const data = await graphqlQueryPublic(USER_PROFILE_QUERY, {
      userName
    });
    if (!data.user) {
      throw new Error(`Failed to fetch user profile for @${userName}`);
    }
    const userData = data.user;
    const profile = {
      userName: userData.userName ?? userName,
      displayName: userData.displayName ?? userName,
      description: userData.info?.description ?? void 0,
      avatar: userData.avatar ?? void 0,
      profileCover: userData.info?.profileCover ?? void 0,
      language: userData.settings?.language,
      pinnedWorks: (userData.pinnedWorks || []).map((work) => ({
        id: work.id,
        type: work.__typename === "Article" ? "article" : "collection",
        title: work.title,
        slug: work.__typename === "Article" ? work.slug : void 0,
        shortHash: work.__typename === "Article" ? work.shortHash : void 0,
        cover: work.cover
      }))
    };
    console.log(`   Profile: ${profile.displayName} (@${profile.userName})`);
    console.log(`   Language: ${profile.language || "not set"}`);
    return profile;
  }
  async function fetchArticleComments(shortHash, knownIds, sinceTimestamp) {
    const allComments = [];
    let cursor;
    console.log(`   \u{1F4DD} Fetching comments for article ${shortHash}...`);
    do {
      const data = await graphqlQueryPublic(
        ARTICLE_COMMENTS_QUERY,
        { shortHash, after: cursor }
      );
      if (!data.article) {
        console.warn(`   \u26A0\uFE0F Article ${shortHash} not found`);
        return [];
      }
      const { edges, pageInfo } = data.article.comments;
      for (const edge of edges) {
        const node = edge.node;
        allComments.push({
          id: node.id,
          content: node.content,
          createdAt: node.createdAt,
          state: node.state,
          upvotes: node.upvotes,
          author: {
            id: node.author.id,
            userName: node.author.userName,
            displayName: node.author.displayName,
            avatar: node.author.avatar
          },
          replyToId: node.replyTo?.id,
          replyToAuthor: node.replyTo?.author?.userName
        });
      }
      if (knownIds && knownIds.size > 0 && edges.length > 0) {
        const allKnown = edges.every((edge) => knownIds.has(edge.node.id));
        if (allKnown) {
          console.log(`   \u{1F4DD} All comments on this page already known, stopping early`);
          break;
        }
      }
      if (sinceTimestamp && edges.length > 0) {
        const oldestOnPage = edges[edges.length - 1].node.createdAt;
        if (oldestOnPage <= sinceTimestamp) {
          break;
        }
      }
      cursor = pageInfo.hasNextPage ? pageInfo.endCursor : void 0;
    } while (cursor);
    if (sinceTimestamp) {
      const filtered = allComments.filter((c) => c.createdAt > sinceTimestamp);
      console.log(`   \u{1F4DD} Found ${filtered.length} new comments (${allComments.length - filtered.length} older than last sync, skipped)`);
      return filtered;
    }
    console.log(`   \u{1F4DD} Found ${allComments.length} comments`);
    return allComments;
  }
  async function fetchAllArticlesSince(since) {
    const { articles, userName } = await fetchAllArticles();
    if (!since) {
      console.log(`   \u{1F4C5} No lastSyncedAt, returning all ${articles.length} articles`);
      return { articles, userName };
    }
    const sinceDate = new Date(since);
    const filteredArticles = articles.filter((article) => {
      const articleDate = new Date(article.createdAt);
      return articleDate > sinceDate;
    });
    console.log(`   \u{1F4C5} Filtered to ${filteredArticles.length} new articles since ${since}`);
    return { articles: filteredArticles, userName };
  }
  var SINGLE_FILE_UPLOAD_MUTATION = `
mutation SingleFileUpload($input: SingleFileUploadInput!) {
  singleFileUpload(input: $input) {
    id
    path
  }
}
`;
  async function uploadCoverByUrl(url, entityId) {
    const data = await graphqlQuery(SINGLE_FILE_UPLOAD_MUTATION, {
      input: {
        url,
        type: "cover",
        entityType: "draft",
        entityId
      }
    });
    return data.singleFileUpload.id;
  }
  async function uploadEmbedByUrl(url) {
    const data = await graphqlQuery(SINGLE_FILE_UPLOAD_MUTATION, {
      input: {
        url,
        type: "embed",
        entityType: "draft"
      }
    });
    return data.singleFileUpload.path;
  }
  async function createDraft(input) {
    console.log(`   \u{1F4DD} Creating draft: ${input.title}`);
    const data = await graphqlQuery(PUT_DRAFT_MUTATION, {
      input
    });
    console.log(`   \u2705 Draft created with ID: ${data.putDraft.id}`);
    return data.putDraft;
  }
  async function fetchDraft(draftId) {
    const data = await graphqlQuery(GET_DRAFT_QUERY, {
      id: draftId
    });
    return data.node;
  }

  // src/progress.ts
  var PHASE_WEIGHTS = [
    { name: "authentication", weight: 5 },
    { name: "fetching_articles", weight: 5 },
    { name: "fetching_drafts", weight: 3 },
    { name: "fetching_collections", weight: 2 },
    { name: "fetching_profile", weight: 2 },
    { name: "syncing", weight: 13 },
    { name: "downloading_media", weight: 35 },
    { name: "rewriting_links", weight: 5 },
    { name: "fetching_social", weight: 25 },
    { name: "complete", weight: 2 }
  ];
  var TOTAL_WEIGHT = PHASE_WEIGHTS.reduce((s, p) => s + p.weight, 0);
  var SUB_PHASE_MAP = {
    syncing_homepage: "syncing",
    syncing_collections: "syncing",
    syncing_articles: "syncing",
    syncing_drafts: "syncing"
  };
  function overallProgress(phase, current, total) {
    const resolvedPhase = SUB_PHASE_MAP[phase] ?? phase;
    let done = 0;
    let found = false;
    for (const p of PHASE_WEIGHTS) {
      if (p.name === resolvedPhase) {
        done += p.weight * (total > 0 ? Math.min(current / total, 1) : 0);
        found = true;
        break;
      }
      done += p.weight;
    }
    if (!found) {
      return 0;
    }
    return Math.round(done / TOTAL_WEIGHT * 100);
  }

  // src/sync.ts
  init_converter();

  // src/config.ts
  async function getConfig() {
    try {
      const exists = await pluginFileExists("config.json");
      if (!exists) {
        return {};
      }
      const content = await readPluginFile("config.json");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  async function saveConfig(config) {
    const content = JSON.stringify(config, null, 2);
    await writePluginFile("config.json", content);
  }

  // src/domain.ts
  var DEFAULT_DOMAIN = "matters.town";
  var currentDomain = DEFAULT_DOMAIN;
  async function initializeDomain() {
    const config = await getConfig();
    currentDomain = config.domain || DEFAULT_DOMAIN;
    apiConfig.endpoint = `https://server.${currentDomain}/graphql`;
    try {
      const manifestContent = await readPluginFile("manifest.json");
      const manifest = JSON.parse(manifestContent);
      if (manifest.domain !== currentDomain) {
        manifest.domain = currentDomain;
        await writePluginFile("manifest.json", JSON.stringify(manifest, null, 2));
        console.log(
          `\u{1F4CD} Updated manifest domain to ${currentDomain}`
        );
      }
    } catch {
      console.warn(
        `\u26A0\uFE0F Could not update manifest domain to ${currentDomain}`
      );
    }
    console.log(`\u{1F4CD} Matters domain: ${currentDomain}`);
    return currentDomain;
  }
  function loginUrl() {
    return `https://${currentDomain}/login`;
  }
  function draftUrl(draftId) {
    return `https://${currentDomain}/me/drafts/${draftId}`;
  }
  function articleUrl(userName, slug, shortHash) {
    return `https://${currentDomain}/@${userName}/${slug}-${shortHash}`;
  }
  function isMattersUrl(url) {
    return url.includes(currentDomain);
  }
  function isInternalMattersLink(url, userName) {
    const escapedDomain = currentDomain.replace(/\\/g, "\\\\").replace(/\./g, "\\.");
    const pattern = new RegExp(
      `^https?://${escapedDomain}/@${userName}/`
    );
    return pattern.test(url);
  }

  // src/sync.ts
  function getDefaultFolderNames() {
    return { article: "articles", drafts: "_drafts" };
  }
  function shouldSyncDrafts(config) {
    return config.sync_drafts ?? false;
  }
  async function scanForMattersContent() {
    try {
      const allFiles = await listFiles();
      const mdFiles = allFiles.filter((f) => f.endsWith(".md"));
      for (const filePath of mdFiles) {
        const segments = filePath.split("/");
        if (segments.length < 2) continue;
        const topFolder = segments[0];
        if (topFolder.startsWith(".") || topFolder.startsWith("_")) continue;
        try {
          const content = await readFile(filePath);
          const parsed = parseFrontmatter(content);
          if (parsed?.frontmatter?.syndicated && Array.isArray(parsed.frontmatter.syndicated)) {
            const mattersUrl = parsed.frontmatter.syndicated.find(
              (url) => isMattersUrl(url)
            );
            if (mattersUrl) {
              const match = mattersUrl.match(/\/@([^/]+)\//);
              const userName = match ? match[1] : null;
              return { folder: topFolder, userName };
            }
          }
        } catch {
          continue;
        }
      }
      return { folder: null, userName: null };
    } catch {
      return { folder: null, userName: null };
    }
  }
  async function detectArticleFolder() {
    const { folder } = await scanForMattersContent();
    return folder;
  }
  async function detectBoundUser() {
    const { userName } = await scanForMattersContent();
    return userName;
  }
  async function getArticleFolderName(config) {
    if (config.articleFolder) {
      return config.articleFolder;
    }
    const detected = await detectArticleFolder();
    if (detected) {
      return detected;
    }
    return "articles";
  }
  function hasMultiCollectionArticles(collections) {
    const articleCollectionCount = /* @__PURE__ */ new Map();
    for (const collection of collections) {
      for (const article of collection.articles) {
        const count = articleCollectionCount.get(article.shortHash) || 0;
        articleCollectionCount.set(article.shortHash, count + 1);
      }
    }
    for (const count of articleCollectionCount.values()) {
      if (count > 1) return true;
    }
    return false;
  }
  function extractShortHash(mattersUrl) {
    try {
      const url = new URL(mattersUrl);
      const path = url.pathname;
      const lastSegment = path.split("/").pop();
      if (!lastSegment) return null;
      const parts = lastSegment.split("-");
      if (parts.length < 2) return null;
      return parts[parts.length - 1];
    } catch {
      return null;
    }
  }
  async function scanLocalArticles() {
    const articles = [];
    try {
      const allFiles = await listFiles();
      const files = allFiles.filter((f) => f.endsWith(".md"));
      for (const file of files) {
        if (file.startsWith("node_modules/") || file.startsWith(".moss/") || file.startsWith("_drafts/") || file.startsWith(".") || file === "index.md" || file === "README.md") {
          continue;
        }
        try {
          const content = await readFile(file);
          const parsed = parseFrontmatter(content);
          if (parsed?.frontmatter?.syndicated && Array.isArray(parsed.frontmatter.syndicated)) {
            const mattersUrl = parsed.frontmatter.syndicated.find(
              (url) => typeof url === "string" && isMattersUrl(url)
            );
            if (mattersUrl) {
              const shortHash = extractShortHash(mattersUrl);
              if (shortHash) {
                const uid = typeof parsed.frontmatter.uid === "string" ? parsed.frontmatter.uid : null;
                articles.push({
                  shortHash,
                  path: file,
                  title: parsed.frontmatter.title || file,
                  uid
                });
              }
            }
          }
        } catch {
        }
      }
    } catch (error) {
      console.warn(`Failed to scan local articles: ${error}`);
    }
    return articles;
  }
  async function findAvailableFilename(basePath, slug) {
    let filename = `${basePath}/${slug}.md`;
    let counter = 1;
    while (true) {
      try {
        await readFile(filename);
        counter++;
        filename = `${basePath}/${slug}-${counter}.md`;
      } catch {
        return filename;
      }
    }
  }
  async function syncToLocalFiles(articles, drafts, collections, userName, config, profile, homepageFile) {
    const result = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };
    const articlePathMap = /* @__PURE__ */ new Map();
    const articleFolder = await getArticleFolderName(config);
    const folders = {
      article: articleFolder,
      drafts: getDefaultFolderNames().drafts
    };
    const localArticles = await scanLocalArticles();
    const knownShortHashes = /* @__PURE__ */ new Map();
    for (const local of localArticles) {
      knownShortHashes.set(local.shortHash, local.path);
    }
    const totalItems = articles.length + drafts.length + collections.length + 1;
    let processedItems = 0;
    const useFileMode = hasMultiCollectionArticles(collections);
    console.log(
      `\u{1F4C1} Syncing ${articles.length} articles, ${drafts.length} drafts, and ${collections.length} collections...`
    );
    console.log(`   Collection mode: ${useFileMode ? "file-based (multi-collection articles detected)" : "folder-based"}`);
    console.log(`   Content folder: ${folders.article}/`);
    console.log(`   Drafts folder: ${folders.drafts}/`);
    const articleCollections = /* @__PURE__ */ new Map();
    const articleFirstCollection = /* @__PURE__ */ new Map();
    for (const collection of collections) {
      const collectionSlug = slugify(collection.title);
      for (let i = 0; i < collection.articles.length; i++) {
        const article = collection.articles[i];
        const articleKey = article.shortHash;
        if (!articleCollections.has(articleKey)) {
          articleCollections.set(articleKey, {});
        }
        articleCollections.get(articleKey)[collectionSlug] = i;
        if (!articleFirstCollection.has(articleKey)) {
          articleFirstCollection.set(articleKey, collectionSlug);
        }
      }
    }
    const articleSlugMap = /* @__PURE__ */ new Map();
    for (const article of articles) {
      const slug = article.slug || slugify(article.title);
      articleSlugMap.set(article.shortHash, slug);
    }
    processedItems++;
    await reportProgress2("syncing_homepage", overallProgress("syncing_homepage", processedItems, totalItems), 100, "Creating homepage...");
    if (homepageFile) {
      console.log(`   \u23ED\uFE0F  Skipping homepage (moss detected home file: ${homepageFile})`);
      result.skipped++;
    } else {
      try {
        const homepageFrontmatter = generateFrontmatter({
          title: profile.displayName
        });
        let homepageBody = profile.description || "";
        if (profile.pinnedWorks && profile.pinnedWorks.length > 0) {
          const gridItems = profile.pinnedWorks.map((work) => {
            if (work.type === "collection") {
              const slug = slugify(work.title);
              const collectionPath = useFileMode ? `/${folders.article}/${slug}` : `/${folders.article}/${slug}/`;
              return `[${work.title}](${collectionPath})`;
            } else {
              const slug = work.slug || slugify(work.title);
              const shortHash = work.shortHash ?? "";
              const collectionSlug = articleFirstCollection.get(shortHash);
              const path = collectionSlug ? `/${folders.article}/${collectionSlug}/${slug}/` : `/${folders.article}/${slug}/`;
              return `[${work.title}](${path})`;
            }
          });
          homepageBody += "\n\n:::grid 3\n" + gridItems.join("\n:::\n") + "\n:::\n";
        }
        const homepageContent = homepageFrontmatter + "\n\n" + homepageBody;
        let existingHomepage = null;
        try {
          existingHomepage = await readFile("index.md");
        } catch {
        }
        if (existingHomepage) {
          console.log(`   \u23ED\uFE0F  Skipping homepage (already exists): index.md`);
          result.skipped++;
        } else {
          await writeFile("index.md", homepageContent);
          console.log(`   \u2705 Created homepage: index.md`);
          result.created++;
        }
      } catch (error) {
        const errorMsg = `Failed to create homepage: ${error}`;
        await reportError2(errorMsg, "syncing_homepage", false);
        console.error(`   \u274C ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
    const projectTree = await listProjectTree();
    for (const collection of collections) {
      processedItems++;
      await reportProgress2(
        "syncing_collections",
        overallProgress("syncing_collections", processedItems, totalItems),
        100,
        `Syncing collection: ${collection.title}`
      );
      try {
        const collectionSlug = slugify(collection.title);
        const collectionPath = useFileMode ? `${folders.article}/${collectionSlug}.md` : `${folders.article}/${collectionSlug}/index.md`;
        if (!useFileMode) {
          const folderPrefix = `${folders.article}/${collectionSlug}/`;
          const homeInFolder = projectTree.find(
            (f) => f.path.startsWith(folderPrefix) && f.is_home
          );
          if (homeInFolder) {
            console.log(`   \u23ED\uFE0F  Skipping collection index (folder has home file: ${homeInFolder.path})`);
            result.skipped++;
            continue;
          }
        }
        let existingContent = null;
        try {
          existingContent = await readFile(collectionPath);
        } catch {
        }
        let orderField;
        if (collection.articles.length > 0) {
          if (useFileMode) {
            orderField = collection.articles.map((a) => {
              const slug = articleSlugMap.get(a.shortHash);
              return slug ? `${folders.article}/${slug}` : null;
            }).filter((s) => s !== null);
          } else {
            orderField = collection.articles.map((a) => articleSlugMap.get(a.shortHash) ?? null).filter((s) => s !== null);
          }
        }
        const frontmatter = generateFrontmatter({
          title: collection.title,
          description: collection.description,
          cover: collection.cover,
          // Keep remote URL, will be downloaded in phase 2
          order: orderField
        });
        const fullContent = `${frontmatter}

${collection.description || ""}`;
        if (existingContent) {
          console.log(`   \u23ED\uFE0F  Skipping collection (already exists): ${collectionPath}`);
          result.skipped++;
          continue;
        }
        await writeFile(collectionPath, fullContent);
        console.log(`   \u2705 Created collection: ${collectionPath}`);
        result.created++;
      } catch (error) {
        const errorMsg = `Failed to sync collection "${collection.title}": ${error}`;
        await reportError2(errorMsg, "syncing_collections", false);
        console.error(`   \u274C ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
    for (const article of articles) {
      processedItems++;
      await reportProgress2(
        "syncing_articles",
        overallProgress("syncing_articles", processedItems, totalItems),
        100,
        `Syncing article: ${article.title}`
      );
      try {
        const articleSlug = article.slug || slugify(article.title);
        const mattersUrl = articleUrl(userName, article.slug, article.shortHash);
        let filename;
        if (useFileMode) {
          filename = `${folders.article}/${articleSlug}.md`;
        } else {
          const firstCollectionSlug = articleFirstCollection.get(article.shortHash);
          if (firstCollectionSlug) {
            filename = `${folders.article}/${firstCollectionSlug}/${articleSlug}.md`;
          } else {
            filename = `${folders.article}/${articleSlug}.md`;
          }
        }
        const existingLocalPath = knownShortHashes.get(article.shortHash);
        if (existingLocalPath) {
          articlePathMap.set(mattersUrl, existingLocalPath);
          articlePathMap.set(article.shortHash, existingLocalPath);
          console.log(`   \u23ED\uFE0F  Skipping (already synced): ${existingLocalPath}`);
          result.skipped++;
          continue;
        }
        articlePathMap.set(mattersUrl, filename);
        articlePathMap.set(article.shortHash, filename);
        const allCollections = articleCollections.get(article.shortHash) || {};
        let collectionsField;
        if (useFileMode) {
          if (Object.keys(allCollections).length > 0) {
            collectionsField = allCollections;
          }
        } else {
          const firstCollectionSlug = articleFirstCollection.get(article.shortHash);
          const additionalCollections = {};
          for (const [slug, order] of Object.entries(allCollections)) {
            if (slug !== firstCollectionSlug) {
              additionalCollections[slug] = order;
            }
          }
          if (Object.keys(additionalCollections).length > 0) {
            collectionsField = additionalCollections;
          }
        }
        let fileExists = false;
        try {
          await readFile(filename);
          fileExists = true;
        } catch {
        }
        if (fileExists) {
          console.log(`   \u23ED\uFE0F  Skipping (file exists): ${filename}`);
          result.skipped++;
          continue;
        }
        const markdownContent = htmlToMarkdown(article.content);
        const frontmatter = generateFrontmatter({
          title: article.title,
          description: article.summary,
          date: article.createdAt,
          updated: article.revisedAt,
          tags: article.tags.map((t) => t.content),
          cover: article.cover,
          // Keep remote URL, will be downloaded in phase 2
          syndicated: [mattersUrl],
          collections: collectionsField
        });
        const fullContent = `${frontmatter}

${markdownContent}`;
        await writeFile(filename, fullContent);
        console.log(`   \u2705 Created: ${filename}`);
        result.created++;
      } catch (error) {
        const errorMsg = `Failed to sync article "${article.title}": ${error}`;
        await reportError2(errorMsg, "syncing_articles", false);
        console.error(`   \u274C ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
    if (shouldSyncDrafts(config)) {
      for (const draft of drafts) {
        processedItems++;
        const draftTitle = draft.title || "Untitled";
        await reportProgress2(
          "syncing_drafts",
          overallProgress("syncing_drafts", processedItems, totalItems),
          100,
          `Syncing draft: ${draftTitle}`
        );
        try {
          const slug = slugify(draft.title || "untitled");
          const filename = await findAvailableFilename(folders.drafts, slug);
          let fileExists = false;
          try {
            await readFile(filename);
            fileExists = true;
          } catch {
          }
          if (fileExists) {
            console.log(`   \u23ED\uFE0F  Skipping draft (file exists): ${filename}`);
            result.skipped++;
            continue;
          }
          const markdownContent = htmlToMarkdown(draft.content);
          const frontmatter = generateFrontmatter({
            title: draft.title || "Untitled Draft",
            date: draft.createdAt,
            updated: draft.updatedAt,
            tags: draft.tags || [],
            cover: draft.cover,
            // Keep remote URL, will be downloaded in phase 2
            syndicated: []
          });
          const fullContent = `${frontmatter}

${markdownContent}`;
          await writeFile(filename, fullContent);
          console.log(`   \u2705 Created draft: ${filename}`);
          result.created++;
        } catch (error) {
          const errorMsg = `Failed to sync draft "${draftTitle}": ${error}`;
          await reportError2(errorMsg, "syncing_drafts", false);
          console.error(`   \u274C ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
    }
    return { result, articlePathMap };
  }

  // src/downloader.ts
  init_converter();
  var MAX_RETRIES = 3;
  function extractAssetUuid(url) {
    const match = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    return match ? match[1] : null;
  }
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function buildAssetUrlPattern(assetId) {
    return new RegExp(
      `https?://[^)\\s"]*${escapeRegex(assetId)}[^)\\s"]*`,
      "g"
    );
  }
  function replaceAssetUrls(content, assetId, localPath) {
    const pattern = buildAssetUrlPattern(assetId);
    const hasMatch = pattern.test(content);
    if (!hasMatch) {
      return { content, replaced: false };
    }
    pattern.lastIndex = 0;
    const newContent = content.replace(pattern, localPath);
    return { content: newContent, replaced: true };
  }
  function getFibonacciDelay(attempt) {
    if (attempt <= 2) return 1e3;
    let a = 1, b = 1;
    for (let i = 2; i < attempt; i++) {
      [a, b] = [b, a + b];
    }
    return b * 1e3;
  }
  function isRetryableHttpStatus(status) {
    return status === 408 || status === 429 || status >= 500 && status < 600;
  }
  var DownloadError = class extends Error {
    constructor(message, httpStatus) {
      super(message);
      this.httpStatus = httpStatus;
      this.name = "DownloadError";
    }
    /** Check if this error is retryable (transient) */
    isRetryable() {
      if (this.httpStatus === void 0) return true;
      return isRetryableHttpStatus(this.httpStatus);
    }
  };
  async function downloadAssetWithRetry(url) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`   [\u2193] Attempt ${attempt}/${MAX_RETRIES}: ${url}`);
        const result = await downloadAsset(url, "assets");
        if (!result.ok) {
          const err = new DownloadError(`HTTP ${result.status}`, result.status);
          console.warn(`   [!] HTTP ${result.status} for ${url}`);
          if (!err.isRetryable() || attempt === MAX_RETRIES) {
            console.error(`   [\u2717] FAILED after ${attempt} attempts: ${url} - HTTP ${result.status}`);
            return { actualPath: "", success: false, error: `HTTP ${result.status}` };
          }
          const delay = getFibonacciDelay(attempt);
          console.warn(`   [\u21BB] Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }
        console.log(`   [\u2713] Downloaded: ${result.actualPath}`);
        return { actualPath: result.actualPath, success: true };
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const isTimeout = message.toLowerCase().includes("timeout");
        if (isTimeout) {
          console.error(`   [\u2717] TIMEOUT: ${url} - ${message}`);
        } else {
          console.error(`   [\u2717] ERROR: ${url} - ${message}`);
        }
        if (attempt === MAX_RETRIES) {
          console.error(`   [\u2717] FAILED after ${MAX_RETRIES} attempts: ${url}`);
          return { actualPath: "", success: false, error: message };
        }
        const delay = getFibonacciDelay(attempt);
        console.warn(`   [\u21BB] Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
      }
    }
    console.error(`   [\u2717] FAILED after ${MAX_RETRIES} attempts: ${url}`);
    return { actualPath: "", success: false, error: "Max retries exceeded" };
  }
  async function downloadMediaAndUpdate() {
    const result = {
      filesProcessed: 0,
      imagesDownloaded: 0,
      imagesSkipped: 0,
      errors: []
    };
    console.log("\u{1F4F8} Downloading media assets and updating references...");
    let allProjectFiles;
    try {
      allProjectFiles = await listFiles();
    } catch (err) {
      console.error(`Failed to list project files: ${err}`);
      result.errors.push(`Failed to list files: ${err}`);
      return result;
    }
    const allMdFiles = allProjectFiles.filter((f) => f.endsWith(".md"));
    console.log(`   Found ${allMdFiles.length} markdown files`);
    const existingAssetsByUuid = /* @__PURE__ */ new Map();
    for (const assetPath of allProjectFiles.filter((f) => f.startsWith("assets/"))) {
      const uuid = extractAssetUuid(assetPath);
      if (uuid) {
        existingAssetsByUuid.set(uuid, assetPath);
      }
    }
    console.log(`   Found ${existingAssetsByUuid.size} existing assets`);
    const { parseFrontmatter: parseFrontmatter2, regenerateFrontmatter: regenerateFrontmatter2 } = await Promise.resolve().then(() => (init_converter(), converter_exports));
    const filesToProcess = [];
    for (const filePath of allMdFiles) {
      try {
        const content = await readFile(filePath);
        const parsed = parseFrontmatter2(content);
        if (!parsed) continue;
        const mediaUrls = [];
        const bodyMedia = extractRemoteImageUrls(parsed.body);
        for (const media of bodyMedia) {
          mediaUrls.push({
            url: media.url,
            uuid: extractAssetUuid(media.url),
            inBody: true,
            inCover: false
          });
        }
        const cover = parsed.frontmatter.cover;
        if (typeof cover === "string" && (cover.startsWith("http://") || cover.startsWith("https://"))) {
          mediaUrls.push({
            url: cover,
            uuid: extractAssetUuid(cover),
            inBody: false,
            inCover: true
          });
        }
        if (mediaUrls.length === 0) continue;
        filesToProcess.push({
          path: filePath,
          frontmatter: parsed.frontmatter,
          body: parsed.body,
          mediaUrls
        });
      } catch {
      }
    }
    console.log(`   Found ${filesToProcess.length} files with remote media`);
    if (filesToProcess.length === 0) {
      return result;
    }
    const allUuids = /* @__PURE__ */ new Set();
    let totalUrls = 0;
    for (const file of filesToProcess) {
      for (const media of file.mediaUrls) {
        if (media.uuid) {
          if (!allUuids.has(media.uuid)) {
            allUuids.add(media.uuid);
            totalUrls++;
          }
        } else {
          totalUrls++;
        }
      }
    }
    console.log(`   Total unique media URLs: ${totalUrls}`);
    const mediaToDownload = [];
    const seenUuids = /* @__PURE__ */ new Set();
    for (const file of filesToProcess) {
      for (const media of file.mediaUrls) {
        if (media.uuid && seenUuids.has(media.uuid)) continue;
        if (media.uuid && existingAssetsByUuid.has(media.uuid)) {
          result.imagesSkipped++;
          continue;
        }
        mediaToDownload.push({ url: media.url, uuid: media.uuid });
        if (media.uuid) seenUuids.add(media.uuid);
      }
    }
    console.log(`   Downloading ${mediaToDownload.length} media files (${result.imagesSkipped} skipped)...`);
    const downloadPromises = mediaToDownload.map(async (media, index) => {
      const downloadResult = await downloadAssetWithRetry(media.url);
      reportProgress2(
        "downloading_media",
        overallProgress("downloading_media", index + 1, mediaToDownload.length),
        100,
        `Downloading ${index + 1}/${mediaToDownload.length}...`
      );
      return { media, downloadResult };
    });
    const downloadResults = await Promise.allSettled(downloadPromises);
    const downloadedUuids = /* @__PURE__ */ new Map();
    for (const settled of downloadResults) {
      if (settled.status === "fulfilled") {
        const { media, downloadResult } = settled.value;
        if (downloadResult.success) {
          result.imagesDownloaded++;
          if (media.uuid) {
            downloadedUuids.set(media.uuid, downloadResult.actualPath);
            existingAssetsByUuid.set(media.uuid, downloadResult.actualPath);
          }
        } else {
          result.errors.push(`${media.url}: ${downloadResult.error}`);
        }
      } else {
        result.errors.push(`Download failed: ${settled.reason}`);
      }
    }
    console.log(`   Downloaded ${result.imagesDownloaded}/${mediaToDownload.length} media files`);
    for (let fileIndex = 0; fileIndex < filesToProcess.length; fileIndex++) {
      const file = filesToProcess[fileIndex];
      let modified = false;
      let { frontmatter, body } = file;
      const mediaByKey = /* @__PURE__ */ new Map();
      for (const media of file.mediaUrls) {
        const key = media.uuid || media.url;
        const existing = mediaByKey.get(key);
        if (existing) {
          existing.inBody = existing.inBody || media.inBody;
          existing.inCover = existing.inCover || media.inCover;
        } else {
          mediaByKey.set(key, { ...media });
        }
      }
      const uniqueMedia = Array.from(mediaByKey.values());
      for (const media of uniqueMedia) {
        if (!media.uuid) continue;
        const localPath = downloadedUuids.get(media.uuid) || existingAssetsByUuid.get(media.uuid);
        if (!localPath) continue;
        const relativePath = calculateRelativePath(file.path, localPath);
        if (media.inBody) {
          const { content: newBody, replaced } = replaceAssetUrls(body, media.uuid, relativePath);
          if (replaced) {
            body = newBody;
            modified = true;
          }
        }
        if (media.inCover) {
          const coverStr = String(frontmatter.cover || "");
          if (coverStr.includes(media.uuid)) {
            frontmatter = { ...frontmatter, cover: relativePath };
            modified = true;
          }
        }
      }
      if (modified) {
        try {
          const newContent = regenerateFrontmatter2(frontmatter) + "\n" + body;
          await writeFile(file.path, newContent);
          result.filesProcessed++;
          console.log(`   [\u{1F4DD}] Wrote: ${file.path}`);
        } catch (err) {
          result.errors.push(`Failed to write ${file.path}: ${err}`);
          console.error(`   [\u2717] Failed to write: ${file.path} - ${err}`);
        }
      }
    }
    reportProgress2(
      "downloading_media",
      overallProgress("downloading_media", totalUrls, totalUrls),
      100,
      `Downloaded ${result.imagesDownloaded} media, updated ${result.filesProcessed} files`
    );
    console.log(`   \u2705 Downloaded ${result.imagesDownloaded}, skipped ${result.imagesSkipped}, updated ${result.filesProcessed} files`);
    return result;
  }
  function isInternalMattersLink2(url, userName) {
    return isInternalMattersLink(url, userName);
  }
  function extractShortHash2(url) {
    const match = url.match(/\/([^/]+)$/);
    if (!match) return null;
    const slugWithHash = match[1];
    const lastHyphen = slugWithHash.lastIndexOf("-");
    if (lastHyphen === -1) return null;
    return slugWithHash.substring(lastHyphen + 1);
  }
  function rewriteLinksInContent(content, articlePathMap, userName, currentFilePath) {
    const links = extractMarkdownLinks(content);
    let modifiedContent = content;
    let linksRewritten = 0;
    for (const { url, fullMatch } of links) {
      if (!isInternalMattersLink2(url, userName)) continue;
      let localPath = articlePathMap.get(url);
      if (!localPath) {
        const shortHash = extractShortHash2(url);
        if (shortHash) {
          localPath = articlePathMap.get(shortHash);
        }
      }
      if (localPath) {
        const relativePath = calculateRelativePath(currentFilePath, localPath);
        const newLink = fullMatch.replace(url, relativePath);
        modifiedContent = modifiedContent.replace(fullMatch, newLink);
        linksRewritten++;
      }
    }
    return { content: modifiedContent, linksRewritten };
  }
  function calculateRelativePath(fromPath, toPath) {
    const fromParts = fromPath.split("/").slice(0, -1);
    const toParts = toPath.split("/");
    let commonLength = 0;
    while (commonLength < fromParts.length && commonLength < toParts.length - 1 && fromParts[commonLength] === toParts[commonLength]) {
      commonLength++;
    }
    const upCount = fromParts.length - commonLength;
    const upPath = "../".repeat(upCount);
    const downPath = toParts.slice(commonLength).join("/");
    return upPath + downPath || toPath;
  }
  async function rewriteAllInternalLinks(articlePathMap, userName) {
    const result = {
      filesProcessed: 0,
      linksRewritten: 0,
      errors: []
    };
    if (articlePathMap.size === 0) {
      console.log("\u{1F517} No articles to rewrite links for");
      return result;
    }
    console.log("\u{1F517} Rewriting internal Matters links...");
    let allFiles;
    try {
      const allProjectFiles = await listFiles();
      allFiles = allProjectFiles.filter((f) => f.endsWith(".md"));
    } catch (err) {
      console.error(`Failed to list project files: ${err}`);
      result.errors.push(`Failed to list files: ${err}`);
      return result;
    }
    console.log(`   Scanning ${allFiles.length} markdown files for internal links...`);
    const { parseFrontmatter: parseFrontmatter2, regenerateFrontmatter: regenerateFrontmatter2 } = await Promise.resolve().then(() => (init_converter(), converter_exports));
    for (const file of allFiles) {
      try {
        const content = await readFile(file);
        const parsed = parseFrontmatter2(content);
        if (!parsed) continue;
        const { content: modifiedBody, linksRewritten } = rewriteLinksInContent(
          parsed.body,
          articlePathMap,
          userName,
          file
        );
        if (linksRewritten > 0) {
          const newContent = regenerateFrontmatter2(parsed.frontmatter) + "\n" + modifiedBody;
          await writeFile(file, newContent);
          result.filesProcessed++;
          result.linksRewritten += linksRewritten;
        }
      } catch (err) {
        result.errors.push(`Failed to process ${file}: ${err}`);
      }
    }
    console.log(`   Rewrote ${result.linksRewritten} links in ${result.filesProcessed} files`);
    return result;
  }

  // src/social.ts
  var SOCIAL_FILE_PATH = ".moss/social/matters.json";
  var SCHEMA_VERSION = "1.0.0";
  function createEmptySocialData() {
    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      articles: {}
    };
  }
  function createEmptyArticleSocialData() {
    return {
      comments: [],
      donations: [],
      appreciations: []
    };
  }
  async function loadSocialData() {
    try {
      const content = await readFile(SOCIAL_FILE_PATH);
      const data = JSON.parse(content);
      if (!data.schemaVersion || !data.articles) {
        console.warn("Invalid social data file, creating new one");
        return createEmptySocialData();
      }
      return data;
    } catch {
      return createEmptySocialData();
    }
  }
  async function saveSocialData(data) {
    data.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const content = JSON.stringify(data, null, 2);
    console.log(`[matters] saveSocialData: Writing ${content.length} bytes to ${SOCIAL_FILE_PATH}`);
    console.log(`[matters] saveSocialData: ${Object.keys(data.articles).length} articles in data`);
    try {
      const result = await writeFile(SOCIAL_FILE_PATH, content);
      console.log(`[matters] saveSocialData: writeFile returned:`, result);
    } catch (error) {
      console.error(`[matters] saveSocialData: FAILED to write to ${SOCIAL_FILE_PATH}:`, error);
      throw error;
    }
  }
  function mergeComments(existing, incoming) {
    const commentMap = /* @__PURE__ */ new Map();
    for (const comment of existing) {
      commentMap.set(comment.id, comment);
    }
    for (const comment of incoming) {
      commentMap.set(comment.id, comment);
    }
    return Array.from(commentMap.values());
  }
  function mergeDonations(existing, incoming) {
    const donationMap = /* @__PURE__ */ new Map();
    for (const donation of existing) {
      donationMap.set(donation.id, donation);
    }
    for (const donation of incoming) {
      donationMap.set(donation.id, donation);
    }
    return Array.from(donationMap.values());
  }
  function mergeAppreciations(existing, incoming) {
    const appreciationMap = /* @__PURE__ */ new Map();
    const getKey = (a) => `${a.sender.id}_${a.createdAt}`;
    for (const appreciation of existing) {
      appreciationMap.set(getKey(appreciation), appreciation);
    }
    for (const appreciation of incoming) {
      appreciationMap.set(getKey(appreciation), appreciation);
    }
    return Array.from(appreciationMap.values());
  }
  function mergeSocialData(data, articleKey, comments, donations, appreciations) {
    const existing = data.articles[articleKey] || createEmptyArticleSocialData();
    data.articles[articleKey] = {
      comments: mergeComments(existing.comments, comments),
      donations: mergeDonations(existing.donations, donations),
      appreciations: mergeAppreciations(existing.appreciations, appreciations)
    };
    return data;
  }

  // src/main.ts
  init_converter();
  var DRAFTS_FILE = "drafts.json";
  async function getDraftMap() {
    try {
      const exists = await pluginFileExists(DRAFTS_FILE);
      if (!exists) return {};
      const content = await readPluginFile(DRAFTS_FILE);
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  async function saveDraftMap(map) {
    const content = JSON.stringify(map, null, 2);
    await writePluginFile(DRAFTS_FILE, content);
  }
  async function getDraftId(sourcePath) {
    const map = await getDraftMap();
    return map[sourcePath]?.draftId;
  }
  async function saveDraftId(sourcePath, draftId) {
    const map = await getDraftMap();
    map[sourcePath] = {
      draftId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await saveDraftMap(map);
  }
  async function removeDraftId(sourcePath) {
    const map = await getDraftMap();
    delete map[sourcePath];
    await saveDraftMap(map);
  }
  async function checkAuthentication() {
    console.log("\u{1F50D} Checking Matters.town authentication...");
    try {
      const token = await getAccessToken();
      const isAuthenticated = typeof token === "string";
      console.log(
        `Authentication check result: ${isAuthenticated ? "AUTHENTICATED" : "NOT AUTHENTICATED"}`
      );
      return isAuthenticated;
    } catch (error) {
      console.error(`Failed to check authentication: ${error}`);
      return false;
    }
  }
  async function waitForToken(browserHandle, initialDelayMs = 2e4, pollIntervalMs = 2e3, maxWaitMs = 3e5) {
    console.log(`\u23F3 Waiting ${initialDelayMs / 1e3}s before checking for token...`);
    await sleep(initialDelayMs);
    const startTime = Date.now();
    let windowClosed = false;
    browserHandle.closed.then(() => {
      windowClosed = true;
    });
    while (Date.now() - startTime < maxWaitMs - initialDelayMs) {
      if (windowClosed) {
        console.log("\u{1F6AA} Browser window closed by user");
        return false;
      }
      clearTokenCache();
      const token = await getAccessToken(true);
      if (token === void 0) {
        console.log("\u26A0\uFE0F Plugin context lost, stopping auth check");
        return false;
      }
      if (token) {
        console.log("\u{1F511} Token found!");
        return true;
      }
      await sleep(pollIntervalMs);
    }
    return false;
  }
  async function promptLogin() {
    console.log("\u{1F510} Opening Matters.town login page...");
    try {
      const browser = await openBrowser(loginUrl());
      console.log("\u{1F310} Browser opened. Please log in to Matters.town.");
      console.log("\u23F3 Will check for authentication after 20 seconds...");
      const authenticated = await waitForToken(browser, 2e4, 2e3, 3e5);
      if (authenticated) {
        console.log("\u2705 Login successful, closing browser...");
        try {
          await closeBrowser();
        } catch {
        }
        return true;
      } else {
        console.warn("\u23F1\uFE0F  Login timeout or window closed. Closing browser...");
        try {
          await closeBrowser();
        } catch {
        }
        return false;
      }
    } catch (error) {
      console.error(`\u274C Login flow failed: ${error}`);
      try {
        await closeBrowser();
      } catch {
      }
      return false;
    }
  }
  async function process2(context) {
    setCurrentHookName("process");
    clearTokenCache();
    await initializeDomain();
    console.log("\u{1F510} Matters: process hook started");
    try {
      {
        const bindingConfig = await getConfig();
        if (!bindingConfig.boundUserName) {
          const detectedUser = await detectBoundUser();
          if (detectedUser) {
            await saveConfig({ ...bindingConfig, boundUserName: detectedUser, userName: detectedUser });
            console.log(`\u{1F517} Auto-bound to @${detectedUser} from existing articles`);
          } else {
            const loginSuccess = await promptLogin();
            if (!loginSuccess) {
              return {
                success: true,
                message: "No Matters account bound. Skipping sync."
              };
            }
            const profile2 = await fetchUserProfile();
            await saveConfig({
              ...bindingConfig,
              boundUserName: profile2.userName,
              userName: profile2.userName
            });
            console.log(`\u{1F517} Bound to @${profile2.userName} via login`);
          }
        }
      }
      await reportProgress2("authentication", overallProgress("authentication", 0, 1), 100, "Checking authentication...");
      let isAuthenticated = await checkAuthentication();
      let usingUnauthenticatedMode = false;
      if (!isAuthenticated) {
        const config = await getConfig();
        if (config.userName) {
          console.log(`\u{1F513} Not authenticated, using saved username: @${config.userName}`);
          console.log("   Note: Drafts will not be available in unauthenticated mode");
          apiConfig.queryMode = "user";
          apiConfig.testUserName = config.userName;
          usingUnauthenticatedMode = true;
          await reportProgress2("authentication", overallProgress("authentication", 1, 1), 100, `Using saved user: @${config.userName}`);
          console.log(`\u2705 Matters: Using unauthenticated mode for @${config.userName}`);
        } else {
          console.warn("\u{1F513} Not authenticated, will prompt login...");
          await reportProgress2("authentication", overallProgress("authentication", 0, 1), 100, "Waiting for login...");
          const loginSuccess = await promptLogin();
          if (!loginSuccess) {
            await reportError2("Login failed or timeout", "authentication", true);
            return {
              success: false,
              message: "Login failed or timeout. Please try again."
            };
          }
          isAuthenticated = true;
          await reportProgress2("authentication", overallProgress("authentication", 1, 1), 100, "Authenticated");
          console.log("\u2705 Matters: Authenticated");
        }
      } else {
        console.log("\u2705 Already authenticated, skipping browser");
        await reportProgress2("authentication", overallProgress("authentication", 1, 1), 100, "Authenticated");
        console.log("\u2705 Matters: Authenticated");
      }
      const syncOnBuild = context.config?.sync_on_build ?? true;
      if (!syncOnBuild) {
        console.log("\u2139\uFE0F  Sync on build is disabled, skipping...");
        return {
          success: true,
          message: "Authenticated (sync disabled)"
        };
      }
      const pluginConfig = await getConfig();
      const lastSyncedAt = pluginConfig.lastSyncedAt;
      if (lastSyncedAt) {
        console.log(`\u{1F4C5} Last synced at: ${lastSyncedAt}`);
      } else {
        console.log("\u{1F4C5} No previous sync - will fetch all articles");
      }
      await reportProgress2("fetching_articles", overallProgress("fetching_articles", 0, 1), 100, "Fetching articles from Matters.town...");
      const { articles, userName } = await fetchAllArticlesSince(lastSyncedAt);
      await reportProgress2("fetching_articles", overallProgress("fetching_articles", 1, 1), 100, `Found ${articles.length} article(s) to sync`);
      console.log(`   Found ${articles.length} article(s) to sync`);
      await reportProgress2("fetching_drafts", overallProgress("fetching_drafts", 0, 1), 100, "Fetching drafts from Matters.town...");
      const drafts = await fetchAllDraftsSince(lastSyncedAt);
      await reportProgress2("fetching_drafts", overallProgress("fetching_drafts", 1, 1), 100, `Found ${drafts.length} draft(s)`);
      console.log(`   Found ${drafts.length} draft(s)`);
      await reportProgress2("fetching_collections", overallProgress("fetching_collections", 0, 1), 100, "Fetching collections from Matters.town...");
      const allCollections = await fetchAllCollections();
      const knownCollectionIds = new Set(pluginConfig.knownCollectionIds || []);
      const newCollections = allCollections.filter((c) => !knownCollectionIds.has(c.id));
      const allCollectionIds = allCollections.map((c) => c.id);
      await reportProgress2("fetching_collections", overallProgress("fetching_collections", 1, 1), 100, `Found ${newCollections.length} new collection(s) (${allCollections.length} total)`);
      console.log(`   Found ${newCollections.length} new collection(s) (${allCollections.length} total)`);
      await reportProgress2("fetching_profile", overallProgress("fetching_profile", 0, 1), 100, "Fetching user profile...");
      const profile = await fetchUserProfile();
      await reportProgress2("fetching_profile", overallProgress("fetching_profile", 1, 1), 100, `Profile: ${profile.displayName}`);
      console.log(`   Profile: ${profile.displayName} (language: ${profile.language || "default"})`);
      if (isAuthenticated && !usingUnauthenticatedMode) {
        try {
          const existingConfig = await getConfig();
          if (existingConfig.userName !== profile.userName || existingConfig.language !== profile.language) {
            await saveConfig({
              ...existingConfig,
              userName: profile.userName,
              language: profile.language
            });
            console.log(`   Saved username @${profile.userName} to config for future unauthenticated access`);
          }
        } catch (error) {
          console.warn(`   Failed to save config: ${error}`);
        }
      }
      const syncTotal = articles.length + drafts.length + allCollections.length + 1;
      await reportProgress2("syncing", overallProgress("syncing", 0, syncTotal), 100, "Starting sync...");
      const { result: syncResult, articlePathMap } = await syncToLocalFiles(
        articles,
        drafts,
        allCollections,
        userName,
        context.config || {},
        profile,
        context.project_info.homepage_file
      );
      const parts = [];
      if (syncResult.created > 0) parts.push(`${syncResult.created} created`);
      if (syncResult.updated > 0) parts.push(`${syncResult.updated} updated`);
      if (syncResult.skipped > 0) parts.push(`${syncResult.skipped} unchanged`);
      if (syncResult.errors.length > 0) parts.push(`${syncResult.errors.length} errors`);
      const summary = parts.length > 0 ? parts.join(", ") : "no changes";
      await reportProgress2("syncing", overallProgress("syncing", syncTotal, syncTotal), 100, `Sync complete: ${summary}`);
      console.log(`\u2705 Sync complete: ${summary}`);
      const mediaResult = await downloadMediaAndUpdate();
      await reportProgress2("rewriting_links", overallProgress("rewriting_links", 0, 1), 100, "Rewriting internal links...");
      const linkResult = await rewriteAllInternalLinks(articlePathMap, userName);
      await reportProgress2("rewriting_links", overallProgress("rewriting_links", 1, 1), 100, `Rewrote ${linkResult.linksRewritten} internal links`);
      const mediaParts = [];
      if (mediaResult.imagesDownloaded > 0) {
        mediaParts.push(`${mediaResult.imagesDownloaded} downloaded`);
      }
      if (mediaResult.imagesSkipped > 0) {
        mediaParts.push(`${mediaResult.imagesSkipped} skipped`);
      }
      if (mediaResult.errors.length > 0) {
        mediaParts.push(`${mediaResult.errors.length} failed`);
      }
      const mediaSummary = mediaParts.length > 0 ? `, images: ${mediaParts.join(", ")}` : "";
      const linkSummary = linkResult.linksRewritten > 0 ? `, ${linkResult.linksRewritten} internal links rewritten` : "";
      let socialSummary = "";
      const articlesForSocialFetch = await scanLocalArticles();
      console.log(`\u{1F4CA} Fetching social data for all ${articlesForSocialFetch.length} local articles`);
      if (articlesForSocialFetch.length > 0) {
        await reportProgress2("fetching_social", overallProgress("fetching_social", 0, articlesForSocialFetch.length), 100, "Fetching social data...");
        const socialData = await loadSocialData();
        let totalComments = 0;
        for (let i = 0; i < articlesForSocialFetch.length; i++) {
          const article = articlesForSocialFetch[i];
          await reportProgress2(
            "fetching_social",
            overallProgress("fetching_social", i + 1, articlesForSocialFetch.length),
            100,
            `Social data: ${article.title}`
          );
          try {
            const socialKey = article.uid || article.path;
            if (!article.uid) {
              console.warn(`   Article "${article.title}" has no uid, falling back to path as social data key`);
            }
            const existingComments = socialData.articles[socialKey]?.comments || [];
            const knownIds = new Set(existingComments.map((c) => c.id));
            const comments = await fetchArticleComments(article.shortHash, knownIds, lastSyncedAt);
            mergeSocialData(socialData, socialKey, comments, [], []);
            totalComments += comments.length;
            await saveSocialData(socialData);
          } catch (error) {
            console.warn(`   Failed to fetch social data for ${article.title}: ${error}`);
          }
        }
        socialSummary = `, ${totalComments} comments`;
        console.log(`\u2705 Social data saved: ${totalComments} comments`);
      }
      const syncEndTime = (/* @__PURE__ */ new Date()).toISOString();
      try {
        const currentConfig = await getConfig();
        await saveConfig({
          ...currentConfig,
          lastSyncedAt: syncEndTime,
          knownCollectionIds: allCollectionIds
        });
        console.log(`\u{1F4C5} Updated lastSyncedAt to ${syncEndTime}`);
      } catch (error) {
        console.warn(`Failed to save lastSyncedAt: ${error}`);
      }
      await reportProgress2("complete", overallProgress("complete", 1, 1), 100, `Complete: ${summary}${mediaSummary}${linkSummary}${socialSummary}`);
      const criticalErrors = syncResult.errors;
      return {
        success: criticalErrors.length === 0,
        message: `Synced from Matters: ${summary}${mediaSummary}${linkSummary}${socialSummary}`
      };
    } catch (error) {
      await reportError2(`Sync failed: ${error}`, "process", true);
      console.error(`\u274C Matters: Sync failed: ${error}`);
      return {
        success: false,
        message: `Sync failed: ${error}`
      };
    }
  }
  async function syndicate(context) {
    setCurrentHookName("syndicate");
    clearTokenCache();
    await initializeDomain();
    console.log("\u{1F4E1} Matters: Starting syndication...");
    try {
      if (!context.deployment) {
        return {
          success: false,
          message: "No deployment information available"
        };
      }
      const { url: siteUrl, deployed_at } = context.deployment;
      const { articles } = context;
      const articlesToSyndicate = articles.filter((article) => {
        const syndicated = article.frontmatter.syndicated || [];
        return !syndicated.some((url) => isMattersUrl(url));
      });
      if (articlesToSyndicate.length === 0) {
        console.log("\u2139\uFE0F  No new articles to syndicate (all already syndicated to Matters)");
        return {
          success: true,
          message: "No new articles to syndicate"
        };
      }
      console.log(`\u{1F4E1} Syndicating ${articlesToSyndicate.length} article(s) to Matters.town`);
      console.log(`\u{1F310} Deployed site: ${siteUrl}`);
      console.log(`\u{1F4C5} Deployed at: ${deployed_at}`);
      await showToast({ message: "Starting Matters syndication...", variant: "info", duration: 3e3 });
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        console.log("\u{1F510} Not authenticated, prompting login...");
        await showToast({ message: "Matters login required", variant: "info", duration: 5e3 });
        const loginSuccess = await promptLogin();
        if (!loginSuccess) {
          await showToast({ message: "Login cancelled", variant: "warning", duration: 3e3 });
          return {
            success: false,
            message: "Login required for syndication"
          };
        }
      }
      const pluginConfig = await getConfig();
      let userName = pluginConfig.userName;
      if (!userName) {
        const profile = await fetchUserProfile();
        userName = profile.userName;
      }
      const config = context.config || {};
      const addCanonicalLink = config.add_canonical_link ?? true;
      const lang = context.project_info.lang ?? "en";
      let published = 0;
      let draftsCreated = 0;
      const errors = [];
      for (const article of articlesToSyndicate) {
        try {
          const live = await isArticleLive(siteUrl, article.url_path);
          if (!live) {
            console.log(`    \u23ED Skipping ${article.title} \u2014 not yet live at ${siteUrl}/${article.url_path}`);
            continue;
          }
          const result = await syndicateArticle(article, siteUrl, userName, {
            addCanonicalLink,
            lang
          });
          if (result.publishedUrl) {
            published++;
          } else {
            draftsCreated++;
          }
        } catch (error) {
          console.error(`    \u2717 Failed to syndicate ${article.title}:`, error);
          errors.push(`${article.title}: ${error}`);
        }
      }
      const parts = [];
      if (published > 0) parts.push(`${published} published`);
      if (draftsCreated > 0) parts.push(`${draftsCreated} drafts created`);
      if (errors.length > 0) parts.push(`${errors.length} failed`);
      const summary = parts.join(", ");
      if (errors.length > 0) {
        console.warn(`\u26A0\uFE0F  Syndication complete: ${summary}`);
        return {
          success: true,
          message: `Syndication: ${summary}`
        };
      }
      console.log(`\u2705 Syndication complete: ${summary}`);
      return {
        success: true,
        message: `Syndication: ${summary}`
      };
    } catch (error) {
      console.error("\u274C Matters: Syndication failed:", error);
      return {
        success: false,
        message: `Syndication failed: ${error}`
      };
    }
  }
  async function isArticleLive(siteUrl, articleUrlPath) {
    const base = siteUrl.replace(/\/$/, "");
    const path = articleUrlPath.replace(/^\//, "");
    const fullUrl = `${base}/${path}`;
    try {
      const response = await fetch(fullUrl, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }
  async function syndicateArticle(article, siteUrl, userName, options) {
    console.log(`  \u2192 Syndicating: ${article.title}`);
    await showToast({ message: `Creating draft: ${article.title}`, variant: "info", duration: 5e3 });
    const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/${article.url_path.replace(/^\//, "")}`;
    const { content: articleContent, isHtml } = getArticleContent(article);
    let content = articleContent;
    if (isHtml) {
      content = normalizeHtmlForMatters(content);
    }
    if (options.addCanonicalLink) {
      content = addCanonicalLinkToContent(content, canonicalUrl, isHtml, options.lang);
    }
    if (isHtml) {
      content = await uploadAndReplaceLocalImages(content, siteUrl);
    }
    const existingDraftId = article.source_path ? await getDraftId(article.source_path) : void 0;
    if (existingDraftId) {
      console.log(`    \u{1F4CB} Found existing draft ID: ${existingDraftId}`);
    }
    const summary = article.frontmatter.description;
    const draftInput = {
      title: article.title,
      content,
      tags: article.tags,
      ...existingDraftId ? { id: existingDraftId } : {},
      ...summary ? { summary } : {}
    };
    let draft;
    try {
      draft = await createDraft(draftInput);
    } catch (error) {
      if (existingDraftId) {
        console.warn(`    \u26A0\uFE0F Existing draft ${existingDraftId} failed, creating new draft: ${error}`);
        const { id: _removed, ...inputWithoutId } = draftInput;
        draft = await createDraft(inputWithoutId);
      } else {
        throw error;
      }
    }
    console.log(`    \u{1F4DD} Draft ${existingDraftId ? "updated" : "created"} with ID: ${draft.id}`);
    const coverPath = article.frontmatter.cover;
    if (coverPath) {
      const coverUrl = new URL(coverPath.replace(/^\//, ""), siteUrl.replace(/\/$/, "") + "/").href;
      try {
        const coverAssetId = await uploadCoverByUrl(coverUrl, draft.id);
        console.log(`    \u{1F5BC}\uFE0F Cover uploaded: ${coverAssetId}`);
        await createDraft({ id: draft.id, title: draft.title, cover: coverAssetId });
        console.log(`    \u{1F5BC}\uFE0F Draft updated with cover`);
      } catch (error) {
        console.warn(`    \u26A0\uFE0F Cover upload failed, continuing without cover: ${error}`);
      }
    }
    await showToast({ message: "Draft created! Opening for review...", variant: "success", duration: 3e3 });
    const draftPageUrl = draftUrl(draft.id);
    console.log(`    \u{1F310} Opening draft for review: ${draftPageUrl}`);
    const browserHandle = await openBrowser(draftPageUrl);
    const publishedArticle = await waitForPublishOrClose(draft.id, 6e5, browserHandle);
    if (publishedArticle) {
      const publishedUrl = articleUrl(userName, publishedArticle.slug, publishedArticle.shortHash);
      console.log(`    \u2705 Published: ${publishedUrl}`);
      await showToast({ message: "Published to Matters!", variant: "success", duration: 5e3 });
      if (article.source_path) {
        await updateFrontmatterSyndicated(article.source_path, publishedUrl);
        console.log(`    \u{1F4DD} Updated frontmatter with syndicated URL`);
      }
      if (article.source_path) {
        try {
          await removeDraftId(article.source_path);
        } catch (err) {
          console.warn(`    \u26A0\uFE0F Failed to remove draft tracking: ${err}`);
        }
      }
      return { draftId: draft.id, publishedUrl };
    }
    if (article.source_path) {
      try {
        await saveDraftId(article.source_path, draft.id);
        console.log(`    \u{1F4BE} Draft ID saved for reuse`);
      } catch (err) {
        console.warn(`    \u26A0\uFE0F Failed to save draft tracking: ${err}`);
      }
    }
    console.log(`    \u23F1\uFE0F Publish timeout - draft saved for later`);
    await showToast({ message: "Draft saved - publish when ready", variant: "info", duration: 5e3 });
    return { draftId: draft.id };
  }
  async function waitForPublishOrClose(draftId, timeoutMs, browserHandle) {
    const startTime = Date.now();
    const pollInterval = 5e3;
    let browserClosed = false;
    if (browserHandle) {
      browserHandle.closed.then(() => {
        browserClosed = true;
      });
    }
    console.log(`    \u23F3 Waiting for publish (timeout: ${timeoutMs / 1e3}s)...`);
    while (Date.now() - startTime < timeoutMs) {
      await sleep(pollInterval);
      if (browserClosed) {
        console.log(`    \u{1F6AA} Browser closed by user`);
        return null;
      }
      try {
        const draft = await fetchDraft(draftId);
        if (draft?.article) {
          console.log(`    \u{1F389} Publish detected!`);
          try {
            await closeBrowser();
          } catch {
          }
          return {
            shortHash: draft.article.shortHash,
            slug: draft.article.slug
          };
        }
      } catch (error) {
        console.warn(`    \u26A0\uFE0F Error checking draft status: ${error}`);
      }
    }
    console.log(`    \u23F1\uFE0F Timeout reached, closing browser...`);
    try {
      await closeBrowser();
    } catch {
    }
    return null;
  }
  async function updateFrontmatterSyndicated(filePath, publishedUrl) {
    try {
      const content = await readFile(filePath);
      const parsed = parseFrontmatter(content);
      if (!parsed) {
        console.warn(`    \u26A0\uFE0F Could not parse frontmatter for ${filePath}`);
        return;
      }
      const syndicated = parsed.frontmatter.syndicated || [];
      if (!syndicated.includes(publishedUrl)) {
        syndicated.push(publishedUrl);
        parsed.frontmatter.syndicated = syndicated;
      }
      const newContent = regenerateFrontmatter(parsed.frontmatter) + "\n\n" + parsed.body;
      await writeFile(filePath, newContent);
    } catch (error) {
      console.warn(`    \u26A0\uFE0F Failed to update frontmatter: ${error}`);
    }
  }
  function getArticleContent(article) {
    if (article.html_content) {
      return { content: article.html_content, isHtml: true };
    }
    return { content: article.content, isHtml: false };
  }
  function normalizeHtmlForMatters(html) {
    let result = html;
    result = result.replace(/<(\/?)h[456](\s[^>]*)?>/gi, (_match, slash, attrs) => {
      return `<${slash}h3${attrs || ""}>`;
    });
    result = result.replace(/<(\/?)h1(\s[^>]*)?>/gi, (_match, slash, attrs) => {
      return `<${slash}h2${attrs || ""}>`;
    });
    result = result.replace(/<img\s[^>]*>/gi, (imgTag, offset) => {
      const preceding = result.substring(Math.max(0, offset - 200), offset);
      const lastFigureOpen = preceding.lastIndexOf("<figure");
      const lastFigureClose = preceding.lastIndexOf("</figure");
      if (lastFigureOpen > lastFigureClose) {
        return imgTag;
      }
      return `<figure class="image">${imgTag}<figcaption></figcaption></figure>`;
    });
    return result;
  }
  function addCanonicalLinkToContent(content, canonicalUrl, isHtml = false, lang) {
    const isZh = lang?.startsWith("zh") ?? false;
    const linkText = isZh ? "\u539F\u6587\u94FE\u63A5" : "Original link";
    if (isHtml) {
      return content + `<hr><p><a href="${canonicalUrl}">${linkText}</a></p>`;
    }
    const canonicalNotice = `

---

[${linkText}](${canonicalUrl})
`;
    return content + canonicalNotice;
  }
  async function uploadAndReplaceLocalImages(content, siteUrl) {
    const imgSrcRegex = /<img\s[^>]*src="([^"]+)"[^>]*>/gi;
    const localSrcs = /* @__PURE__ */ new Set();
    let match;
    while ((match = imgSrcRegex.exec(content)) !== null) {
      const src = match[1];
      if (/^https?:\/\//i.test(src) || /^data:/i.test(src)) {
        continue;
      }
      localSrcs.add(src);
    }
    if (localSrcs.size === 0) {
      return content;
    }
    const replacements = /* @__PURE__ */ new Map();
    for (const src of localSrcs) {
      const absoluteUrl = new URL(src.replace(/^\//, ""), siteUrl.replace(/\/$/, "") + "/").href;
      try {
        const cdnUrl = await uploadEmbedByUrl(absoluteUrl);
        replacements.set(src, cdnUrl);
        console.log(`    \u{1F5BC}\uFE0F Image uploaded: ${src} \u2192 ${cdnUrl}`);
      } catch (error) {
        console.warn(`    \u26A0\uFE0F Image upload failed for ${src}, leaving unchanged: ${error}`);
      }
    }
    let result = content;
    for (const [originalSrc, cdnUrl] of replacements) {
      const escaped = originalSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(`src="${escaped}"`, "g"), `src="${cdnUrl}"`);
    }
    return result;
  }
  return __toCommonJS(main_exports);
})();
