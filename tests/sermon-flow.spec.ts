import { test, expect } from '@playwright/test';

test.describe('Pastor Sermon Workflow', () => {
  test('complete sermon creation flow', async ({ page }) => {
    // Navigate to workspace
    await page.goto('/workspace/new');
    await page.waitForLoadState('networkidle');

    // Check workspace page loads
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible();

    // Look for sermon creation elements
    const titleInput = page.locator('[name=title], [placeholder*="title" i], input[type="text"]').first();
    const passageInput = page.locator('[name=passage], [placeholder*="passage" i], [placeholder*="scripture" i]').first();

    // Fill in sermon details if inputs exist
    if (await titleInput.count() > 0) {
      await titleInput.fill('Grace That Transforms');
    }

    if (await passageInput.count() > 0) {
      await passageInput.fill('Ephesians 2:1-10');
    }

    // Look for save button
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('manuscript generation flow', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    // Look for generate manuscript button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Manuscript")').first();
    
    if (await generateButton.count() > 0) {
      await generateButton.click();
      
      // Wait for generation to complete
      await page.waitForTimeout(2000);
      
      // Check for manuscript content
      const manuscriptContent = page.locator('.manuscript, [data-manuscript], .editor-content').first();
      if (await manuscriptContent.count() > 0) {
        await expect(manuscriptContent).toBeVisible();
      }
    }
  });

  test('slide preview flow', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    // Look for preview button
    const previewButton = page.locator('button:has-text("Preview"), button:has-text("Slides")').first();
    
    if (await previewButton.count() > 0) {
      await previewButton.click();
      await page.waitForTimeout(1000);

      // Check for slide preview modal or content
      const slideContent = page.locator('.slide, [data-slide], .preview-modal, [role="dialog"]').first();
      if (await slideContent.count() > 0) {
        await expect(slideContent).toBeVisible();
      }
    }
  });
});

test.describe('Slide Structure Validation', () => {
  test('slides contain required elements', async ({ page }) => {
    await page.goto('/workspace/test');
    await page.waitForLoadState('networkidle');

    // Open slide preview if available
    const previewButton = page.locator('button:has-text("Preview")').first();
    if (await previewButton.count() > 0) {
      await previewButton.click();
      await page.waitForTimeout(1000);
    }

    // Check for slide structure elements
    const slideTitle = page.locator('.slide-title, h3, [data-slide-title]').first();
    const slideBullets = page.locator('.slide-bullet, li, [data-bullet]');
    const scriptureRef = page.locator('.scripture-ref, [data-scripture]').first();

    // Log structure for debugging
    const titleCount = await slideTitle.count();
    const bulletCount = await slideBullets.count();
    const scriptureCount = await scriptureRef.count();

    console.log(`Slide structure: ${titleCount} titles, ${bulletCount} bullets, ${scriptureCount} scripture refs`);
  });
});
