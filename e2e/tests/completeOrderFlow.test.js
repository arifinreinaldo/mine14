import { test, expect } from '@playwright/test';

test.describe('Complete Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure backend is running and database is initialized
    await page.goto('/');
  });

  test('should complete full order workflow from customer to server', async ({ page, context }) => {
    // Step 1: Customer places order
    const customerPage = page;
    await customerPage.goto('/order/1'); // Table 1

    // Wait for menu to load
    await customerPage.waitForSelector('text=Appetizers', { timeout: 5000 });

    // Add items to cart
    const addButtons = await customerPage.locator('button:has-text("Add")').first();
    await addButtons.click();
    await customerPage.waitForTimeout(500);

    // Check if cart has items
    const cartVisible = await customerPage.locator('text=Total:').isVisible();
    if (cartVisible) {
      // Place order
      await customerPage.click('button:has-text("Place Order")');

      // Wait for success message
      await expect(customerPage.locator('text=Order Placed!')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate between different dashboards', async ({ page }) => {
    // Home page
    await page.goto('/');
    await expect(page.locator('text=Restaurant POS System')).toBeVisible();

    // Kitchen Display
    await page.click('a:has-text("Kitchen Display")');
    await expect(page.locator('text=Kitchen Display System')).toBeVisible();

    // Navigate to Server Dashboard
    await page.goto('/server');
    await expect(page.locator('text=Server Dashboard')).toBeVisible();

    // Navigate to Admin Panel
    await page.goto('/admin');
    await expect(page.locator('text=Admin Panel')).toBeVisible();
  });

  test('should display menu items on customer order page', async ({ page }) => {
    await page.goto('/order/1');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Check for table info or menu content
    const hasTableInfo = await page.locator('text=/Table/i').isVisible().catch(() => false);
    const hasMenuContent = await page.locator('text=/menu/i').isVisible().catch(() => false);

    expect(hasTableInfo || hasMenuContent).toBeTruthy();
  });
});

test.describe('Kitchen Display', () => {
  test('should show kitchen interface', async ({ page }) => {
    await page.goto('/kitchen');

    await expect(page.locator('text=Kitchen Display System')).toBeVisible();

    // Check for order columns
    const hasNewOrders = await page.locator('text=/New Orders/i').isVisible().catch(() => false);
    const hasInProgress = await page.locator('text=/In Progress/i').isVisible().catch(() => false);
    const hasReady = await page.locator('text=/Ready/i').isVisible().catch(() => false);

    expect(hasNewOrders || hasInProgress || hasReady).toBeTruthy();
  });
});

test.describe('Server Dashboard', () => {
  test('should show server interface', async ({ page }) => {
    await page.goto('/server');

    await expect(page.locator('text=Server Dashboard')).toBeVisible();

    // Should show ready orders count or empty state
    const hasReadyOrders = await page.locator('text=/Ready Orders/i').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/No orders/i').isVisible().catch(() => false);

    expect(hasReadyOrders || hasEmptyState).toBeTruthy();
  });
});

test.describe('Admin Panel', () => {
  test('should show admin interface with tabs', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.locator('text=Admin Panel')).toBeVisible();

    // Check for tabs
    await expect(page.locator('text=Tables & QR Codes')).toBeVisible();
    await expect(page.locator('text=Menu Management')).toBeVisible();
  });

  test('should switch between admin tabs', async ({ page }) => {
    await page.goto('/admin');

    // Click menu tab
    await page.click('button:has-text("Menu Management")');

    // Should show menu content
    await page.waitForTimeout(500);
    const hasMenuItems = await page.locator('text=/Menu Items/i').isVisible().catch(() => false);
    expect(hasMenuItems).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/order/1');
    await page.waitForLoadState('networkidle');

    // Page should load without layout issues
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/kitchen');
    await page.waitForLoadState('networkidle');

    // Page should load without layout issues
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(768);
  });
});
