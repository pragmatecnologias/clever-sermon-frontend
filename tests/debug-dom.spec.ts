import { test } from '@playwright/test';

/**
 * Debug helper tests for AI agents to inspect DOM state
 * These tests dump HTML content for debugging rendering issues
 */

test.describe('DOM Debug Helpers', () => {
  test('dump workspace DOM', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    const html = await page.content();
    console.log('=== WORKSPACE DOM ===');
    console.log(html);
    console.log('=== END DOM ===');
  });

  test('dump manuscript content', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    // Find manuscript container
    const manuscriptSelectors = [
      '.manuscript',
      '[data-manuscript]',
      '.editor-content',
      '.prose',
      'article',
      'main'
    ];

    for (const selector of manuscriptSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        const html = await element.innerHTML();
        console.log(`=== ${selector} CONTENT ===`);
        console.log(html);
        console.log('=== END ===');
        break;
      }
    }
  });

  test('check for escaped HTML', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    const html = await page.content();
    
    // Check for common escaped HTML patterns
    const escapedPatterns = [
      '&lt;h1&gt;',
      '&lt;h2&gt;',
      '&lt;h3&gt;',
      '&lt;p&gt;',
      '&lt;strong&gt;',
      '&lt;em&gt;',
      '&lt;ul&gt;',
      '&lt;li&gt;',
      '&lt;blockquote&gt;'
    ];

    const foundEscaped: string[] = [];
    for (const pattern of escapedPatterns) {
      if (html.includes(pattern)) {
        foundEscaped.push(pattern);
      }
    }

    if (foundEscaped.length > 0) {
      console.log('⚠️ ESCAPED HTML DETECTED:');
      console.log(foundEscaped.join(', '));
      console.log('This indicates HTML is being rendered as text, not as DOM elements');
    } else {
      console.log('✅ No escaped HTML detected');
    }
  });

  test('list all headings', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    
    console.log('=== HEADINGS FOUND ===');
    headings.forEach((h, i) => console.log(`${i + 1}. ${h}`));
    console.log(`Total: ${headings.length} headings`);
  });

  test('inspect API responses', async ({ page }) => {
    const apiCalls: { url: string; method: string; status: number }[] = [];

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          method: response.request().method(),
          status: response.status()
        });
      }
    });

    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('=== API CALLS ===');
    apiCalls.forEach(call => {
      console.log(`${call.method} ${call.url} → ${call.status}`);
    });
  });
});
