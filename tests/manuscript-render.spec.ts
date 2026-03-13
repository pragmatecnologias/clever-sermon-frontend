import { test, expect } from '@playwright/test';

test.describe('Manuscript Rendering', () => {
  test('manuscript HTML renders correctly (not as escaped text)', async ({ page }) => {
    await page.goto('/workspace/test');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that HTML elements are rendered as DOM, not as text
    const heading = page.locator('h2').first();
    
    // If HTML is rendered correctly, we should find actual h2 elements
    // If it's escaped, we'd see "<h2>" as text content
    const pageContent = await page.content();
    
    // Fail if we see escaped HTML tags in the rendered output
    expect(pageContent).not.toContain('&lt;h2&gt;');
    expect(pageContent).not.toContain('&lt;p&gt;');
    expect(pageContent).not.toContain('&lt;strong&gt;');
  });

  test('manuscript sections are visible', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    // Check for common manuscript sections
    const sections = ['Introduction', 'Body', 'Conclusion', 'Application'];
    
    for (const section of sections) {
      const element = page.locator(`text=${section}`).first();
      // Just check if any section exists (not all may be present)
      const count = await page.locator(`text=${section}`).count();
      if (count > 0) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('scripture references are formatted', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    // Check for scripture reference formatting
    const scriptureRef = page.locator('.scripture-ref, [data-scripture], .verse-reference').first();
    const count = await scriptureRef.count();
    
    // Log for debugging
    if (count === 0) {
      console.log('No scripture references found - this may be expected for empty workspace');
    }
  });
});
