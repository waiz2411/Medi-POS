import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const videoDir = path.resolve('tutorial_video/screen_studio/raw_videos');
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Inject animated glowing cursor
  await page.addInitScript(() => {
    const cursor = document.createElement('div');
    cursor.id = '__studio_cursor__';
    cursor.style.cssText = `
      position: fixed;
      top: -100px;
      left: -100px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.75);
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 14px rgba(37, 99, 235, 0.8), 0 0 2px rgba(0,0,0,0.5);
      pointer-events: none;
      z-index: 9999999;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease-out, background 0.15s ease;
    `;
    document.documentElement.appendChild(cursor);

    window.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    window.addEventListener('mousedown', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
      cursor.style.background = 'rgba(239, 68, 68, 0.9)';
    });
    window.addEventListener('mouseup', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.background = 'rgba(37, 99, 235, 0.75)';
    });
  });

  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Smooth mouse move to Store Login
  const loginBtn = page.getByRole('button', { name: 'Store Login' });
  const box = await loginBtn.boundingBox();
  if (box) {
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;
    await page.mouse.move(960, 540);
    await page.waitForTimeout(300);
    await page.mouse.move(targetX, targetY, { steps: 30 });
    await page.waitForTimeout(300);
    await loginBtn.click();
  }

  await page.waitForTimeout(1500);

  // Close context to save video
  await page.close();
  await context.close();
  await browser.close();

  console.log("Test video recorded successfully in:", videoDir);
}

main().catch(console.error);
