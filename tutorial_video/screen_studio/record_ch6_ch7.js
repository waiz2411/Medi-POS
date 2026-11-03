import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const CHAPTERS_DIR = path.resolve('tutorial_video/screen_studio/chapters');

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
          top: 20px;
          left: 50%;
          transform: translate(-50%, 0);
          background: rgba(15, 23, 42, 0.94);
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
          bottom: 24px;
          left: 50%;
          transform: translate(-50%, 0);
          background: rgba(15, 23, 42, 0.94);
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

async function getBox(page, target) {
  try {
    if (typeof target === 'string') {
      const loc = page.locator(target).first();
      await loc.waitFor({ state: 'visible', timeout: 5000 });
      return await loc.boundingBox();
    } else if (target && typeof target.boundingBox === 'function') {
      await target.waitFor({ state: 'visible', timeout: 5000 });
      return await target.boundingBox();
    } else if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
      return target;
    }
  } catch (e) {
    console.warn("getBox skip for:", typeof target === 'string' ? target : 'locator');
  }
  return null;
}

async function smoothClick(page, target) {
  const box = await getBox(page, target);
  if (box && Number.isFinite(box.x) && Number.isFinite(box.y)) {
    const tx = box.x + box.width / 2;
    const ty = box.y + box.height / 2;
    await page.mouse.move(tx, ty, { steps: 22 });
    await page.waitForTimeout(140);
    await page.mouse.down();
    await page.waitForTimeout(90);
    await page.mouse.up();
    await page.waitForTimeout(200);
  } else {
    try {
      if (typeof target === 'string') {
        await page.locator(target).first().click();
      } else if (target && typeof target.click === 'function') {
        await target.click();
      }
    } catch (e) {}
  }
}

async function smoothHover(page, target, holdMs = 800) {
  const box = await getBox(page, target);
  if (box && Number.isFinite(box.x) && Number.isFinite(box.y)) {
    const tx = box.x + box.width / 2;
    const ty = box.y + box.height / 2;
    await page.mouse.move(tx, ty, { steps: 22 });
    await page.waitForTimeout(holdMs);
  }
}

async function humanType(page, target, text, delayMs = 40) {
  await smoothClick(page, target);
  try {
    const loc = typeof target === 'string' ? page.locator(target).first() : target;
    if (loc && typeof loc.fill === 'function') {
      await loc.fill('');
    }
  } catch (e) {}
  await page.keyboard.type(text, { delay: delayMs });
}

async function recordChapter(name, actionFn) {
  console.log(`\n▶ Re-recording Chapter: ${name}...`);
  const chapDir = path.join(CHAPTERS_DIR, name);
  if (!fs.existsSync(chapDir)) fs.mkdirSync(chapDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: chapDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();
  try {
    await actionFn(page);
  } catch (err) {
    console.error(`Error in chapter ${name}:`, err);
  }

  await page.waitForTimeout(1500);
  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(chapDir);
  const webm = files.find(f => f.endsWith('.webm') && !f.startsWith('chapter'));
  if (webm) {
    const oldPath = path.join(chapDir, webm);
    const newPath = path.join(CHAPTERS_DIR, `${name}.webm`);
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    fs.renameSync(oldPath, newPath);
    try {
      fs.rmSync(chapDir, { recursive: true, force: true });
    } catch (e) {}
    console.log(`  ✓ Saved: ${newPath}`);
  }
}

async function loginAsStore(page) {
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('button:has-text("Store Login")');
  await page.locator('button:has-text("Store Login")').click();
  await page.waitForSelector('input[type="email"]');
  await page.locator('input[type="email"]').fill('store@medipos.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]:has-text("Login")').click();
  await page.waitForSelector('text=City Care Pharmacy');
}

async function main() {
  // CHAPTER 6: Transaction History & Receipt Details
  await recordChapter('ch6_bills_history', async (page) => {
    await loginAsStore(page);
    await smoothClick(page, 'button:has-text("Bill History")');
    await page.waitForSelector('h2:has-text("Bill History")');
    await setStudioBadge(page, "TRANSACTION HISTORY & AUDIT LOGS", "Search past transactions and reprint itemized invoices in one click");
    await page.waitForTimeout(800);

    const searchInput = page.locator('input[placeholder*="Search bills"]');
    if (await searchInput.isVisible()) {
      await humanType(page, searchInput, 'Walk-in', 40);
      await page.waitForTimeout(800);
    }

    const viewBtn = page.locator('button[title*="View details"]').first();
    if (await viewBtn.isVisible()) {
      await smoothClick(page, viewBtn);
      await page.waitForSelector('text=Bill Details');
      await page.waitForTimeout(1400);

      await smoothHover(page, 'button:has-text("Print Bill")', 800);
      await smoothClick(page, 'button:has-text("Close")');
      await page.waitForTimeout(800);
    }
  });

  // CHAPTER 7: Super Admin Franchise Controls & Subscriptions
  await recordChapter('ch7_super_admin', async (page) => {
    await page.goto('http://localhost:5000/?admin=true', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });
    await setStudioBadge(page, "SUPER ADMIN FRANCHISE PORTAL", "Automated expiry enforcement, monthly renewal tracking & quick renewals");
    await page.waitForSelector('text=Super Admin Login');
    await page.waitForTimeout(600);

    await humanType(page, 'input[type="password"]', 'admin', 45);
    await page.waitForTimeout(400);

    await smoothClick(page, 'button[type="submit"]:has-text("Login")');
    await page.waitForSelector('text=Manage Medical Stores');
    await page.waitForTimeout(1000);

    const expiringStore = page.locator('text=Apollo MedPlus Express');
    if (await expiringStore.isVisible()) {
      await smoothHover(page, expiringStore, 800);
    }

    const editBtn = page.locator('button[title*="Edit store"]').first();
    await smoothClick(page, editBtn);
    await page.waitForSelector('text=Edit Store & Subscription');
    await page.waitForTimeout(800);

    const extBtn = page.locator('button:has-text("+30 Days")');
    if (await extBtn.isVisible()) {
      await smoothClick(page, extBtn);
      await page.waitForTimeout(800);
    }

    await smoothClick(page, 'button:has-text("Save Changes")');
    await page.waitForTimeout(1800);
  });

  console.log("\n🎉 CHAPTERS 6 AND 7 COMPLETED!");
}

main().catch(console.error);
