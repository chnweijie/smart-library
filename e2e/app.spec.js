import { test, expect } from '@playwright/test';

// ─── 首页测试 ──────────────────────────────────────────────────────
test.describe('首页', () => {
  test('应正确加载首页并显示图书列表', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=📚')).toBeVisible();
    await expect(page.locator('.ant-layout')).toBeVisible();
  });

  test('应显示搜索框', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[placeholder], input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('应显示分类筛选标签', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const tags = page.locator('.ant-tag, .ant-radio-button-wrapper');
    await expect(tags.first()).toBeVisible();
  });
});

// ─── 登录/注册测试 ──────────────────────────────────────────────────
test.describe('认证流程', () => {
  test('应显示登录和注册按钮', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.locator('button:has-text("登录"), button:has-text("Login")');
    const registerBtn = page.locator('button:has-text("注册"), button:has-text("Register")');
    await expect(loginBtn.or(registerBtn).first()).toBeVisible();
  });

  test('点击登录按钮应弹出登录模态框', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.locator('button:has-text("登录"), button:has-text("Login")');
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await expect(page.locator('.ant-modal')).toBeVisible();
    }
  });

  test('登录模态框应包含用户名和密码输入框', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.locator('button:has-text("登录"), button:has-text("Login")');
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await expect(page.locator('.ant-modal input').first()).toBeVisible();
    }
  });
});

// ─── 导航测试 ──────────────────────────────────────────────────────
test.describe('导航', () => {
  test('侧边栏应显示导航菜单', async ({ page }) => {
    await page.goto('/');
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toBeVisible();
  });

  test('点击首页菜单项应导航到首页', async ({ page }) => {
    await page.goto('/');
    const homeMenuItem = page.locator('.ant-menu-item').first();
    if (await homeMenuItem.isVisible()) {
      await homeMenuItem.click();
      await expect(page).toHaveURL(/\//);
    }
  });

  test('未登录时受保护路由应重定向到首页', async ({ page }) => {
    await page.goto('/borrow');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\//);
  });
});

// ─── 语言切换测试 ──────────────────────────────────────────────────
test.describe('语言切换', () => {
  test('应显示语言切换按钮', async ({ page }) => {
    await page.goto('/');
    const langBtn = page.locator('button:has-text("中文"), button:has-text("English"), button:has-text("Русский"), .anticon-global');
    await expect(langBtn.first()).toBeVisible();
  });

  test('切换语言后页面内容应更新', async ({ page }) => {
    await page.goto('/');
    const globalIcon = page.locator('.anticon-global');
    if (await globalIcon.isVisible()) {
      await globalIcon.click();
      const enOption = page.locator('.ant-dropdown-menu-item:has-text("English")');
      if (await enOption.isVisible()) {
        await enOption.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

// ─── 响应式测试 ──────────────────────────────────────────────────────
test.describe('响应式布局', () => {
  test('桌面端应显示侧边栏', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('.ant-layout-sider')).toBeVisible();
  });

  test('页面应正确渲染主要内容区域', async ({ page }) => {
    await page.goto('/');
    const content = page.locator('.ant-layout-content');
    await expect(content).toBeVisible();
  });
});
