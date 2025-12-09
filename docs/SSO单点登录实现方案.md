# 基于Cookie的SSO单点登录系统设计与实现

## 前言

在现代Web应用生态中，用户往往需要在多个相关应用间切换使用。传统的独立登录方式不仅用户体验差，也增加了密码管理的复杂性。单点登录（Single Sign-On，SSO）技术应运而生，让用户只需登录一次即可访问所有相关应用。

本文将深入探讨基于Cookie的SSO实现方案，从技术原理到具体实现，为你提供一套完整的解决方案。

## 什么是SSO单点登录

### 核心概念

单点登录（SSO）是一种身份验证服务，允许用户使用一组登录凭据访问多个相关但独立的软件系统。用户只需要登录一次，就可以访问所有相互信任的应用系统，无需重复输入用户名和密码。

### 业务价值

**对用户而言**：

*   减少密码记忆负担
*   提升使用体验
*   降低密码泄露风险

**对企业而言**：

*   统一身份管理
*   降低运维成本
*   提高安全性
*   改善用户留存

## 技术架构设计

### 整体架构

```bash
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   应用A         │    │   应用B         │    │   应用C         │
│  app-a.com      │    │  app-b.com      │    │  app-c.com      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │     SSO认证中心         │
                    │    sso.example.com     │
                    │  Cookie域: .example.com │
                    └─────────────────────────┘
```

### 核心组件

1.  **SSO认证中心**：负责用户身份验证和Token颁发
2.  **业务应用**：各个需要登录的应用系统
3.  **共享Cookie**：在同根域名下共享登录状态
4.  **前端SDK**：封装SSO逻辑的JavaScript库

### Cookie共享机制

基于Cookie的SSO方案利用浏览器的同源策略特性：

*   **认证中心域名**：`sso.example.com`
*   **Cookie域设置**：`.example.com`
*   **应用域名**：`app-a.example.com`、`app-b.example.com`
*   **共享原理**：设置Cookie的domain为`.example.com`，所有子域名都可以访问

### SSO工作流程

1\. 用户访问应用A (app-a.example.com)
2\. 应用A检查Cookie中是否有有效Token
3\. 如无Token，重定向到SSO认证中心 (sso.example.com)
4\. 用户在认证中心完成登录
5\. 认证中心验证用户身份，生成Token
6\. 认证中心设置跨域Cookie (domain=.example.com)
7\. 重定向回应用A，携带Token参数
8\. 应用A获取Token，完成登录
9\. 用户访问应用B时，直接从Cookie读取Token，无需重新登录

## 核心实现

### 1. SSO认证中心实现

在介绍客户端实现之前，我们先了解SSO认证中心的核心功能和实现：

#### 认证中心核心接口

```typescript
// SSO认证中心的主要接口定义
interface SSOServerAPI {
  // 登录页面
  GET /login: (app_id: string, redirect_uri: string, state?: string) => LoginPage;

  // 处理登录请求
  POST /login: (username: string, password: string, app_id: string) => LoginResult;

  // 注册页面
  GET /register: (app_id: string, redirect_uri: string) => RegisterPage;

  // 处理注册请求
  POST /register: (userInfo: RegisterInfo, app_id: string) => RegisterResult;

  // 检查登录状态（用于iframe方式）
  GET /check-status: (app_id: string) => StatusResult;

  // 退出登录
  GET /logout: (app_id: string, redirect_uri?: string) => LogoutResult;

  // Token验证接口
  POST /verify-token: (token: string) => TokenVerifyResult;
}
```

#### 认证中心后端实现示例（Node.js + Express）

```typescript
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const COOKIE_DOMAIN = ".example.com";

// 用户数据存储（实际项目中应使用数据库）
const users = new Map();
const registeredApps = new Map([
	[
		"app-001",
		{ name: "Application A", redirectUris: ["https://app-a.example.com"] }
	],
	[
		"app-002",
		{ name: "Application B", redirectUris: ["https://app-b.example.com"] }
	]
]);

// 登录页面
app.get("/login", (req, res) => {
	const { app_id, redirect_uri, state } = req.query;

	// 验证应用ID和回调地址
	if (!validateApp(app_id as string, redirect_uri as string)) {
		return res.status(400).json({ error: "Invalid app_id or redirect_uri" });
	}

	// 检查是否已登录
	const existingToken = req.cookies.access_token;
	if (existingToken && verifyToken(existingToken)) {
		// 已登录，直接重定向
		return redirectWithToken(
			res,
			redirect_uri as string,
			existingToken,
			state as string
		);
	}

	// 渲染登录页面
	res.send(
		generateLoginPage(app_id as string, redirect_uri as string, state as string)
	);
});

// 处理登录请求
app.post("/login", async (req, res) => {
	const { username, password, app_id, redirect_uri, state } = req.body;

	try {
		// 验证用户凭据
		const user = await authenticateUser(username, password);
		if (!user) {
			return res.status(401).json({ error: "用户名或密码错误" });
		}

		// 生成JWT Token
		const token = jwt.sign(
			{
				userId: user.id,
				username: user.username,
				email: user.email,
				exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24小时过期
			},
			JWT_SECRET
		);

		// 设置跨域Cookie
		res.cookie("access_token", token, {
			domain: COOKIE_DOMAIN,
			httpOnly: false, // 允许客户端JavaScript访问
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 24 * 60 * 60 * 1000 // 24小时
		});

		// 重定向回应用
		redirectWithToken(res, redirect_uri, token, state);
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "登录失败" });
	}
});

// 检查登录状态（用于iframe方式）
app.get("/check-status", (req, res) => {
	const { app_id } = req.query;
	const token = req.cookies.access_token;

	if (token && verifyToken(token)) {
		// 通过postMessage发送Token给父窗口
		res.send(`
      <script>
        window.parent.postMessage({
          token: '${token}',
          status: 'authenticated'
        }, '*');
      </script>
    `);
	} else {
		res.send(`
      <script>
        window.parent.postMessage({
          status: 'unauthenticated'
        }, '*');
      </script>
    `);
	}
});

// 退出登录
app.get("/logout", (req, res) => {
	const { redirect_uri } = req.query;

	// 清除Cookie
	res.clearCookie("access_token", {
		domain: COOKIE_DOMAIN,
		path: "/"
	});

	// 重定向到指定页面或默认页面
	const redirectUrl = redirect_uri || "https://sso.example.com/logged-out";
	res.redirect(redirectUrl);
});

// Token验证接口
app.post("/verify-token", (req, res) => {
	const { token } = req.body;

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		res.json({ valid: true, user: decoded });
	} catch (error) {
		res.json({ valid: false, error: "Invalid token" });
	}
});

// 工具函数
function validateApp(appId: string, redirectUri: string): boolean {
	const app = registeredApps.get(appId);
	if (!app) return false;

	return app.redirectUris.some((uri) => redirectUri.startsWith(uri));
}

function verifyToken(token: string): boolean {
	try {
		jwt.verify(token, JWT_SECRET);
		return true;
	} catch {
		return false;
	}
}

async function authenticateUser(username: string, password: string) {
	const user = users.get(username);
	if (!user) return null;

	const isValid = await bcrypt.compare(password, user.passwordHash);
	return isValid ? user : null;
}

function redirectWithToken(
	res: express.Response,
	redirectUri: string,
	token: string,
	state?: string
) {
	const url = new URL(redirectUri);
	url.searchParams.set("token", token);
	if (state) url.searchParams.set("state", state);

	res.redirect(url.toString());
}

function generateLoginPage(
	appId: string,
	redirectUri: string,
	state: string
): string {
	return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SSO登录</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .error { color: red; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h2>用户登录</h2>
      <form id="loginForm" method="POST" action="/login">
        <input type="hidden" name="app_id" value="${appId}">
        <input type="hidden" name="redirect_uri" value="${redirectUri}">
        <input type="hidden" name="state" value="${state}">

        <div class="form-group">
          <label for="username">用户名:</label>
          <input type="text" id="username" name="username" required>
        </div>

        <div class="form-group">
          <label for="password">密码:</label>
          <input type="password" id="password" name="password" required>
        </div>

        <button type="submit">登录</button>
        <div id="error" class="error"></div>
      </form>

      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          try {
            const response = await fetch('/login', {
              method: 'POST',
              body: formData
            });

            if (response.redirected) {
              window.location.href = response.url;
            } else {
              const result = await response.json();
              if (result.error) {
                document.getElementById('error').textContent = result.error;
              }
            }
          } catch (error) {
            document.getElementById('error').textContent = '登录失败，请重试';
          }
        });
      </script>
    </body>
    </html>
  `;
}

app.listen(3000, () => {
	console.log("SSO Server running on port 3000");
});
```

#### 认证中心数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'locked') DEFAULT 'active'
);

-- 应用注册表
CREATE TABLE registered_apps (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  app_id VARCHAR(50) UNIQUE NOT NULL,
  app_name VARCHAR(100) NOT NULL,
  app_secret VARCHAR(255) NOT NULL,
  redirect_uris JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive') DEFAULT 'active'
);

-- 登录会话表
CREATE TABLE user_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  app_id VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (app_id) REFERENCES registered_apps(app_id),
  INDEX idx_session_token (session_token),
  INDEX idx_user_app (user_id, app_id)
);

-- 登录日志表
CREATE TABLE login_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  app_id VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_result ENUM('success', 'failed') NOT NULL,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_time (user_id, created_at),
  INDEX idx_app_time (app_id, created_at)
);
```

### 2. SSO客户端SDK

首先，我们需要实现一个SSO客户端SDK来处理登录流程：

```typescript
interface SSOConfig {
	ssoHost: string; // SSO认证中心地址
	cookieName: string; // Token存储的Cookie名称
	cookieDomain: string; // Cookie域名
	appId: string; // 应用标识
	redirectUri?: string; // 登录成功后的回调地址
}

interface SSOCallbacks {
	onSuccess?: (token: string) => void;
	onError?: (error: Error) => void;
	onLogout?: () => void;
}

class SSOClient {
	private config: SSOConfig;
	private callbacks: SSOCallbacks;

	constructor(config: SSOConfig, callbacks: SSOCallbacks = {}) {
		this.config = config;
		this.callbacks = callbacks;
	}

	/**
	 * 检查是否已登录
	 */
	isAuthenticated(): boolean {
		const token = this.getToken();
		return token !== null && this.isTokenValid(token);
	}

	/**
	 * 获取当前Token
	 */
	getToken(): string | null {
		return this.getCookie(this.config.cookieName);
	}

	/**
	 * 跳转到登录页面
	 */
	login(): void {
		const loginUrl = this.buildLoginUrl();
		window.location.href = loginUrl;
	}

	/**
	 * 跳转到注册页面
	 */
	register(): void {
		const registerUrl = this.buildRegisterUrl();
		window.location.href = registerUrl;
	}

	/**
	 * 退出登录
	 */
	logout(): void {
		// 清除本地Token
		this.clearToken();

		// 跳转到SSO退出页面，清除认证中心的登录状态
		const logoutUrl = this.buildLogoutUrl();
		window.location.href = logoutUrl;
	}

	/**
	 * 处理SSO回调
	 */
	handleCallback(): void {
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get("token");
		const error = urlParams.get("error");

		if (error) {
			this.callbacks.onError?.(new Error(error));
			return;
		}

		if (token && token !== "null") {
			this.setToken(token);
			this.callbacks.onSuccess?.(token);

			// 清理URL参数
			this.cleanUrl();
		} else {
			this.callbacks.onError?.(new Error("未获取到有效Token"));
		}
	}

	/**
	 * 初始化SSO检查
	 */
	async init(): Promise<void> {
		// 首先检查URL中是否有回调参数
		if (this.hasCallbackParams()) {
			this.handleCallback();
			return;
		}

		// 检查本地是否有有效Token
		if (this.isAuthenticated()) {
			const token = this.getToken()!;
			this.callbacks.onSuccess?.(token);
			return;
		}

		// 尝试从SSO认证中心获取Token
		try {
			await this.checkSSOStatus();
		} catch (error) {
			this.callbacks.onError?.(error as Error);
		}
	}

	// 私有方法实现
	private buildLoginUrl(): string {
		const params = new URLSearchParams({
			app_id: this.config.appId,
			redirect_uri: this.config.redirectUri || window.location.href,
			response_type: "token"
		});

		return `${this.config.ssoHost}/login?${params.toString()}`;
	}

	private buildRegisterUrl(): string {
		const params = new URLSearchParams({
			app_id: this.config.appId,
			redirect_uri: this.config.redirectUri || window.location.href
		});

		return `${this.config.ssoHost}/register?${params.toString()}`;
	}

	private buildLogoutUrl(): string {
		const params = new URLSearchParams({
			app_id: this.config.appId,
			redirect_uri: window.location.origin
		});

		return `${this.config.ssoHost}/logout?${params.toString()}`;
	}

	private async checkSSOStatus(): Promise<void> {
		// 通过iframe方式检查SSO状态，避免页面跳转
		return new Promise((resolve, reject) => {
			const iframe = document.createElement("iframe");
			iframe.style.display = "none";
			iframe.src = `${this.config.ssoHost}/check-status?app_id=${this.config.appId}`;

			const messageHandler = (event: MessageEvent) => {
				if (event.origin !== new URL(this.config.ssoHost).origin) {
					return;
				}

				window.removeEventListener("message", messageHandler);
				document.body.removeChild(iframe);

				if (event.data.token) {
					this.setToken(event.data.token);
					this.callbacks.onSuccess?.(event.data.token);
					resolve();
				} else {
					reject(new Error("未登录"));
				}
			};

			window.addEventListener("message", messageHandler);
			document.body.appendChild(iframe);

			// 超时处理
			setTimeout(() => {
				window.removeEventListener("message", messageHandler);
				if (document.body.contains(iframe)) {
					document.body.removeChild(iframe);
				}
				reject(new Error("SSO检查超时"));
			}, 5000);
		});
	}

	private setToken(token: string): void {
		this.setCookie(this.config.cookieName, token, {
			domain: this.config.cookieDomain,
			path: "/",
			secure: location.protocol === "https:",
			sameSite: "lax"
		});
	}

	private clearToken(): void {
		this.setCookie(this.config.cookieName, "", {
			domain: this.config.cookieDomain,
			path: "/",
			expires: new Date(0)
		});
	}

	private isTokenValid(token: string): boolean {
		try {
			// 简单的JWT格式检查
			const parts = token.split(".");
			if (parts.length !== 3) return false;

			// 检查是否过期（需要解析JWT payload）
			const payload = JSON.parse(atob(parts[1]));
			const now = Math.floor(Date.now() / 1000);

			return payload.exp > now;
		} catch {
			return false;
		}
	}

	private hasCallbackParams(): boolean {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.has("token") || urlParams.has("error");
	}

	private cleanUrl(): void {
		const url = new URL(window.location.href);
		url.searchParams.delete("token");
		url.searchParams.delete("error");
		window.history.replaceState({}, document.title, url.toString());
	}

	// Cookie操作工具方法
	private getCookie(name: string): string | null {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) {
			return parts.pop()?.split(";").shift() || null;
		}
		return null;
	}

	private setCookie(name: string, value: string, options: any = {}): void {
		let cookieString = `${name}=${value}`;

		if (options.domain) cookieString += `; domain=${options.domain}`;
		if (options.path) cookieString += `; path=${options.path}`;
		if (options.expires)
			cookieString += `; expires=${options.expires.toUTCString()}`;
		if (options.secure) cookieString += `; secure`;
		if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;

		document.cookie = cookieString;
	}
}
```

### 3. Vue应用集成

在Vue应用中集成SSO功能：

```typescript
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { SSOClient } from "./utils/sso-client";

const app = createApp(App);

// 配置SSO
const ssoClient = new SSOClient(
	{
		ssoHost: "https://sso.example.com",
		cookieName: "access_token",
		cookieDomain: ".example.com",
		appId: "your-app-id"
	},
	{
		onSuccess: (token) => {
			console.log("SSO登录成功", token);
			// 可以在这里调用用户信息接口
		},
		onError: (error) => {
			console.error("SSO登录失败", error);
		}
	}
);

// 全局挂载
app.config.globalProperties.$sso = ssoClient;
window.__SSO_CLIENT__ = ssoClient;

// 应用启动前初始化SSO
ssoClient.init().finally(() => {
	app.mount("#app");
});
```

```vue
<!-- App.vue -->
<template>
	<div id="app">
		<header>
			<div v-if="isAuthenticated">
				<span>欢迎，{{ userInfo.name }}</span>
				<button @click="logout">退出登录</button>
			</div>
			<div v-else>
				<button @click="login">登录</button>
				<button @click="register">注册</button>
			</div>
		</header>

		<main>
			<router-view />
		</main>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const isAuthenticated = ref(false);
const userInfo = ref({});

onMounted(() => {
	// 检查登录状态
	isAuthenticated.value = window.__SSO_CLIENT__.isAuthenticated();

	if (isAuthenticated.value) {
		// 获取用户信息
		fetchUserInfo();
	}
});

const login = () => {
	window.__SSO_CLIENT__.login();
};

const register = () => {
	window.__SSO_CLIENT__.register();
};

const logout = () => {
	window.__SSO_CLIENT__.logout();
};

const fetchUserInfo = async () => {
	try {
		const token = window.__SSO_CLIENT__.getToken();
		const response = await fetch("/api/user/profile", {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
		userInfo.value = await response.json();
	} catch (error) {
		console.error("获取用户信息失败", error);
	}
};
</script>
```

### 4. 路由守卫

实现路由级别的登录检查：

```typescript
// router/index.ts
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			name: "Home",
			component: () => import("@/views/Home.vue")
		},
		{
			path: "/dashboard",
			name: "Dashboard",
			component: () => import("@/views/Dashboard.vue"),
			meta: { requiresAuth: true }
		}
	]
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
	const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

	if (requiresAuth) {
		const ssoClient = window.__SSO_CLIENT__;

		if (ssoClient.isAuthenticated()) {
			next();
		} else {
			// 保存目标路由，登录成功后跳转
			sessionStorage.setItem("redirect_after_login", to.fullPath);
			ssoClient.login();
		}
	} else {
		next();
	}
});

export default router;
```

## 开发环境适配

### 跨域问题解决

在开发环境中，由于域名不同，无法直接使用Cookie共享。提供以下解决方案：

#### 方案1：环境变量Token注入

```typescript
class SSOClient {
	private getToken(): string | null {
		// 开发环境优先使用环境变量Token
		if (import.meta.env.DEV) {
			const devToken = import.meta.env.VITE_DEV_TOKEN;
			if (devToken && devToken !== "undefined") {
				console.log("使用开发环境Token");
				return devToken;
			}
		}

		// 生产环境从Cookie读取
		return this.getCookie(this.config.cookieName);
	}
}
```

环境变量配置：

```bash
# .env.development
VITE_DEV_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 方案2：代理配置

```typescript
// vite.config.ts
export default defineConfig({
	server: {
		proxy: {
			"/sso-api": {
				target: "https://sso.example.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/sso-api/, "")
			}
		}
	}
});
```

#### 方案3：本地域名映射

修改hosts文件：

    127.0.0.1 local.example.com

然后使用 `http://local.example.com:3000` 访问应用。

## 安全考虑

### 1. Token安全

```typescript
// JWT Token验证
private isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    // 检查过期时间
    if (payload.exp <= now) return false;

    // 检查签发者
    if (payload.iss !== 'your-sso-issuer') return false;

    return true;
  } catch {
    return false;
  }
}
```

### 2. CSRF防护

```typescript
// 添加CSRF Token
private buildLoginUrl(): string {
  const csrfToken = this.generateCSRFToken();
  sessionStorage.setItem('csrf_token', csrfToken);

  const params = new URLSearchParams({
    app_id: this.config.appId,
    redirect_uri: this.config.redirectUri || window.location.href,
    state: csrfToken  // 用于CSRF防护
  });

  return `${this.config.ssoHost}/login?${params.toString()}`;
}

private generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
```

### 3. Cookie安全设置

```typescript
private setToken(token: string): void {
  this.setCookie(this.config.cookieName, token, {
    domain: this.config.cookieDomain,
    path: '/',
    secure: true,        // 仅HTTPS传输
    httpOnly: false,     // 允许JS访问（SSO需要）
    sameSite: 'strict'   // 严格同站策略
  });
}
```

## 最佳实践

### 1. 错误处理

```typescript
class SSOError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SSOError';
  }
}

// 统一错误处理
private handleError(error: any): void {
  let ssoError: SSOError;

  if (error instanceof SSOError) {
    ssoError = error;
  } else {
    ssoError = new SSOError('SSO未知错误', 'UNKNOWN_ERROR', error);
  }

  // 记录错误日志
  console.error('SSO Error:', ssoError);

  // 触发错误回调
  this.callbacks.onError?.(ssoError);
}
```

### 2. 性能优化

```typescript
// Token缓存
private tokenCache: { token: string; timestamp: number } | null = null;
private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟

private getToken(): string | null {
  const now = Date.now();

  // 使用缓存的Token
  if (this.tokenCache && (now - this.tokenCache.timestamp) < this.CACHE_DURATION) {
    return this.tokenCache.token;
  }

  const token = this.getCookie(this.config.cookieName);

  if (token) {
    this.tokenCache = { token, timestamp: now };
  }

  return token;
}
```

### 3. 监控和日志

```typescript
// SSO事件监控
class SSOMonitor {
	private events: Array<{ type: string; timestamp: number; data?: any }> = [];

	logEvent(type: string, data?: any): void {
		this.events.push({
			type,
			timestamp: Date.now(),
			data
		});

		// 发送到监控系统
		this.sendToMonitoring({ type, data });
	}

	private sendToMonitoring(event: any): void {
		// 实现监控数据上报
		if (typeof window !== "undefined" && window.gtag) {
			window.gtag("event", "sso_event", {
				event_category: "SSO",
				event_label: event.type,
				custom_parameter: event.data
			});
		}
	}
}
```

## 部署配置

### Nginx配置示例

```nginx
# SSO认证中心
server {
    listen 443 ssl;
    server_name sso.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://sso-backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 业务应用
server {
    listen 443 ssl;
    server_name app.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://app-backend;
        proxy_set_header Authorization $http_authorization;
    }
}
```

### Docker部署

```dockerfile
# Dockerfile
FROM nginx:alpine

COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  sso-frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SSO_HOST=https://sso.example.com
      - VITE_COOKIE_DOMAIN=.example.com
    networks:
      - sso-network

  app-frontend:
    build: .
    ports:
      - "81:80"
    environment:
      - VITE_SSO_HOST=https://sso.example.com
      - VITE_COOKIE_DOMAIN=.example.com
      - VITE_APP_ID=app-001
    networks:
      - sso-network

networks:
  sso-network:
    driver: bridge
```

## 总结

基于Cookie的SSO方案具有以下特点：

**优势**：

*   ✅ 实现简单，兼容性好
*   ✅ 用户体验流畅
*   ✅ 安全性较高
*   ✅ 支持多种前端框架

**限制**：

*   ❌ 需要同根域名
*   ❌ 受浏览器Cookie策略限制
*   ❌ 跨域场景需要特殊处理

**适用场景**：

*   企业内部多应用系统
*   同一产品的多个子系统
*   需要无缝登录体验的场景

通过本文的详细介绍，你应该能够理解并实现一套完整的基于Cookie的SSO系统。在实际项目中，还需要根据具体需求进行调整和优化，特别是在安全性、性能和用户体验方面。

希望这篇文章对你有所帮助！如果你有任何问题或建议，欢迎在评论区讨论。
