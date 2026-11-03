import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function setStudioBadge(page, title, oneLiner) {
  await page.evaluate(({ title, oneLiner }) => {
    if (!document.getElementById('__studio_style__')) {
      const style = document.createElement('style');
      style.id = '__studio_style__';
      style.innerHTML = `
        @keyframes studioPopIn {
          0% { opacity: 0; transform: translate(-50%, -15px) scale(0.96); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes studioSlideUp {
          0% { opacity: 0; transform: translate(-50%, 20px) scale(0.96); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        #__studio_cursor__ {
          position: fixed;
          top: -100px;
          left: -100px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.75);
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 16px rgba(37, 99, 235, 0.8), 0 2px 6px rgba(0,0,0,0.3);
          pointer-events: none;
          z-index: 99999999;
          transform: translate(-50%, -50%);
          transition: transform 0.08s ease-out, background 0.15s ease;
        }
        #__studio_cursor__.clicking {
          transform: translate(-50%, -50%) scale(0.68) !important;
          background: rgba(239, 68, 68, 0.95) !important;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.9) !important;
        }
        #__studio_top_title__ {
          position: fixed;
          top: 22px;
          left: 50%;
          transform: translate(-50%, 0);
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 9999px;
          padding: 8px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          z-index: 9999999;
          animation: studioPopIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #__studio_bottom_pill__ {
          position: fixed;
          bottom: 26px;
          left: 50%;
          transform: translate(-50%, 0);
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 9999px;
          padding: 10px 28px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4);
          z-index: 9999999;
          animation: studioSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `;
      document.head.appendChild(style);

      if (!document.getElementById('__studio_cursor__')) {
        const cursor = document.createElement('div');
        cursor.id = '__studio_cursor__';
        document.documentElement.appendChild(cursor);

        window.addEventListener('mousemove', (e) => {
          cursor.style.left = e.clientX + 'px';
          cursor.style.top = e.clientY + 'px';
        });
        window.addEventListener('mousedown', () => cursor.classList.add('clicking'));
        window.addEventListener('mouseup', () => cursor.classList.remove('clicking'));
      }
    }

    let topEl = document.getElementById('__studio_top_title__');
    if (!topEl) {
      topEl = document.createElement('div');
      topEl.id = '__studio_top_title__';
      document.documentElement.appendChild(topEl);
    }
    topEl.innerHTML = `
      <span style="background:#10b981; color:white; font-size:11px; font-weight:800; padding:3px 10px; border-radius:9999px; letter-spacing:0.04em;">MEDIPOS PRO</span>
      <span style="color:#ffffff; font-size:15px; font-weight:700; letter-spacing:-0.01em;">${title}</span>
    `;

    let botEl = document.getElementById('__studio_bottom_pill__');
    if (!botEl) {
      botEl = document.createElement('div');
      botEl.id = '__studio_bottom_pill__';
      document.documentElement.appendChild(botEl);
    }
    botEl.innerHTML = `
      <span style="color:#38bdf8; font-size:15px;">✦</span>
      <span style="color:#f8fafc; font-size:14.5px; font-weight:500;">${oneLiner}</span>
    `;
  }, { title, oneLiner });
}

async function smoothMoveAndClick(page, selectorOrBox) {
  let box = null;
  if (typeof selectorOrBox === 'string') {
    const loc = page.locator(selectorOrBox).first();
    box = await loc.boundingBox();
  } else {
    box = selectorOrBox;
  }
  if (box) {
    const tx = box.x + box.width / 2;
    const ty = box.y + box.height / 2;
    await page.mouse.move(tx, ty, { steps: 25 });
    await page.waitForTimeout(150);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.up();
    await page.waitForTimeout(200);
  }
}

async function test() {
  const outDir = path.resolve('tutorial_video/screen_studio/test_out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await setStudioBadge(page, "STORE AUTHENTICATION", "Secure store credentials with real-time subscription check");

  await page.waitForTimeout(800);

  // Smooth mouse move to Store Login
  await smoothMoveAndClick(page, 'button:has-text("Store Login")');
  await page.waitForTimeout(800);

  // Type email
  const emailInput = page.locator('input[type="email"]');
  const eBox = await emailInput.boundingBox();
  if (eBox) {
    await smoothMoveAndClick(page, eBox);
    await emailInput.fill('');
    await page.keyboard.type('store@medipos.com', { delay: 45 });
  }
  await page.waitForTimeout(400);

  // Type password
  const passInput = page.locator('input[type="password"]');
  const pBox = await passInput.boundingBox();
  if (pBox) {
    await smoothMoveAndClick(page, pBox);
    await passInput.fill('');
    await page.keyboard.type('password123', { delay: 45 });
  }
  await page.waitForTimeout(500);

  // Click Sign In
  await smoothMoveAndClick(page, 'button:has-text("Sign In")');
  await page.waitForTimeout(1500);

  // Update badge for dashboard view
  await setStudioBadge(page, "STORE DASHBOARD", "Live revenue metrics, stock alerts and rapid billing");
  await page.waitForTimeout(2000);

  await page.close();
  await context.close();
  await browser.close();

  console.log("SUCCESS: Test chapter recorded with badges & smooth interactions!");
}

test().catch(console.error);
