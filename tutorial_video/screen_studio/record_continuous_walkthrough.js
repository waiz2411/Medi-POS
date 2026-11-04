import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const ROOT_DIR = path.resolve('tutorial_video/screen_studio');
const RAW_DIR = path.join(ROOT_DIR, 'raw_videos');
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function setStudioBadge(page, title, oneLiner) {
  await page.evaluate(
    ({ title, oneLiner }) => {
      if (!document.getElementById('__studio_style__')) {
        const style = document.createElement('style');
        style.id = '__studio_style__';
        style.innerHTML = `
          @keyframes studioPopIn {
            0% { opacity: 0; transform: translate(-50%, -16px) scale(0.96); }
            100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          }
          @keyframes studioSlideUp {
            0% { opacity: 0; transform: translate(-50%, 18px) scale(0.96); }
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
            border: 1px solid rgba(56, 189, 248, 0.4);
            border-radius: 9999px;
            padding: 8px 24px;
            display: flex;
            align-items: center;
            gap: 14px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
            z-index: 9999999;
            animation: studioPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
            border: 1px solid rgba(56, 189, 248, 0.45);
            border-radius: 9999px;
            padding: 10px 28px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4);
            z-index: 9999999;
            animation: studioSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
    },
    { title, oneLiner }
  );
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
    console.warn('getBox skip for:', typeof target === 'string' ? target : 'locator');
  }
  return null;
}

async function smoothClick(page, target) {
  const box = await getBox(page, target);
  if (box && Number.isFinite(box.x) && Number.isFinite(box.y)) {
    const tx = box.x + box.width / 2;
    const ty = box.y + box.height / 2;
    await page.mouse.move(tx, ty, { steps: 20 });
    await page.waitForTimeout(140);
    await page.mouse.down();
    await page.waitForTimeout(90);
    await page.mouse.up();
    await page.waitForTimeout(220);
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
    await page.mouse.move(tx, ty, { steps: 20 });
    await page.waitForTimeout(holdMs);
  }
}

async function humanType(page, target, text, delayMs = 38) {
  await smoothClick(page, target);
  try {
    const loc = typeof target === 'string' ? page.locator(target).first() : target;
    if (loc && typeof loc.fill === 'function') {
      await loc.fill('');
    }
  } catch (e) {}
  await page.keyboard.type(text, { delay: delayMs });
}

async function main() {
  console.log('🚀 Checking MediPOS server on http://localhost:5000...');
  let serverProcess = null;
  const isUp = await waitForServer('http://localhost:5000/api/health', 1500);
  if (!isUp) {
    console.log('Starting local Express server for tutorial video recording...');
    serverProcess = spawn('node', ['server/src/index.js'], { stdio: 'pipe', shell: true });
    const ready = await waitForServer('http://localhost:5000/api/health', 12000);
    if (!ready) {
      console.error('Failed to start server.');
      process.exit(1);
    }
    console.log('✓ Server is ready on http://localhost:5000');
  } else {
    console.log('✓ Server is already running on http://localhost:5000');
  }

  // Clear previous raw videos
  for (const f of fs.readdirSync(RAW_DIR)) {
    try {
      fs.unlinkSync(path.join(RAW_DIR, f));
    } catch (e) {}
  }

  console.log('📹 Launching continuous full-screen walkthrough recording (1920x1080)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RAW_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    console.log('Dialog opened, accepting:', dialog.message());
    await dialog.accept();
  });
  const timestamps = [];

  const markChapter = (name) => {
    const elapsedSec = (Date.now() - recordingStartTime) / 1000;
    timestamps.push({ chapter: name, time: Math.round(elapsedSec) });
    console.log(`⏱️ [${name}] at ${Math.round(elapsedSec)}s`);
  };

  const recordingStartTime = Date.now();

  try {
    // ==========================================
    // CHAPTER 1: Store Authentication & Onboarding
    // ==========================================
    markChapter('ch1_login');
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });

    await setStudioBadge(
      page,
      'STORE AUTHENTICATION & ONBOARDING',
      'Instant dispensary login & direct WhatsApp account onboarding'
    );
    await page.mouse.move(960, 540);
    await page.waitForTimeout(1000);

    // Smooth hover over the Request Account button
    const reqBtn = page.locator('a:has-text("Request Account")').first();
    if (await reqBtn.isVisible()) {
      await smoothHover(page, reqBtn, 1200);
    }

    // Click Store Login button
    await smoothClick(page, 'button:has-text("Store Login")');
    await page.waitForSelector('text=Store Terminal Login');
    await page.waitForTimeout(700);

    // Type credentials
    await humanType(page, 'input[type="email"]', 'store@medipos.com', 40);
    await page.waitForTimeout(300);

    await humanType(page, 'input[type="password"]', 'password123', 40);
    await page.waitForTimeout(400);

    // Hover over Request an Account link in modal
    const modalReqBtn = page.locator('div:has-text("Request an Account") a').first();
    if (await modalReqBtn.isVisible()) {
      await smoothHover(page, modalReqBtn, 800);
    }

    // Click Sign In to Store
    await smoothClick(page, 'button[type="submit"]:has-text("Sign In to Store")');
    await page.waitForSelector('text=City Care Pharmacy');
    await page.waitForTimeout(1200);

    // ==========================================
    // CHAPTER 2: Store Dashboard & Revenue Radar
    // ==========================================
    markChapter('ch2_dashboard');
    await setStudioBadge(
      page,
      'STORE DASHBOARD & REVENUE RADAR',
      'Real-time daily revenue, active inventory alerts, and sticky sidebar navigation'
    );
    await page.mouse.move(960, 350);
    await page.waitForTimeout(1000);

    // Hover over metric cards
    await smoothHover(page, 'text=Total Revenue', 900);
    await smoothHover(page, 'text=Low Stock Items', 1100);
    await smoothHover(page, 'text=Expiring Soon', 1100);

    // Hover over the left sticky sidebar to showcase pinned Logout button
    await smoothHover(page, 'aside button:has-text("Logout")', 1000);

    // 1-Click quick bill launcher from top banner
    await smoothClick(page, 'button:has-text("Create New Bill")');
    await page.waitForSelector('text=Select Medicines');
    await page.waitForTimeout(1200);

    // ==========================================
    // CHAPTER 3: Medicine Inventory & Smart Filters
    // ==========================================
    markChapter('ch3_inventory_filters');
    await smoothClick(page, 'aside button:has-text("Medicines")');
    await page.waitForSelector('text=Medicine Inventory');
    await setStudioBadge(
      page,
      'MEDICINE INVENTORY & SMART FILTERS',
      'Instantly isolate medicines below 10 units or expiring within 30 days'
    );
    await page.waitForTimeout(1000);

    // Click Low Stock filter pill
    await smoothClick(page, 'button:has-text("Low Stock")');
    await page.waitForTimeout(1400);

    // Click Expiring Soon filter pill
    await smoothClick(page, 'button:has-text("Expiring Soon")');
    await page.waitForTimeout(1400);

    // Restore All Medicines
    await smoothClick(page, 'button:has-text("All Medicines")');
    await page.waitForTimeout(1000);

    // ==========================================
    // CHAPTER 4: Adding Medicine & Dynamic Categories
    // ==========================================
    markChapter('ch4_add_medicine');
    await setStudioBadge(
      page,
      'ADD MEDICINES & DYNAMIC CATEGORIES',
      'Create on-the-fly custom categories with automatic batch expiry tracking'
    );
    await page.waitForTimeout(700);

    await smoothClick(page, 'button:has-text("Add Medicine")');
    await page.waitForSelector('text=Add New Medicine');
    await page.waitForTimeout(700);

    // Medicine name
    await humanType(page, 'input[placeholder*="Paracetamol"]', 'Ciprofloxacin Eye Drops 5ml', 35);

    // Category dropdown: select "+ Add New Category..."
    const catSelect = page.locator('form select').first();
    await smoothClick(page, catSelect);
    await catSelect.selectOption('__ADD_NEW__');
    await page.waitForTimeout(500);

    // Type custom category name
    const newCatInput = page.locator('input[placeholder*="New category name"]');
    if (await newCatInput.isVisible()) {
      await humanType(page, newCatInput, 'Ophthalmic', 35);
      await smoothClick(page, 'form button:has(svg.lucide-check)');
      await page.waitForTimeout(500);
    }

    // Price & Stock
    const priceInput = page.locator('input[type="number"]').first();
    await humanType(page, priceInput, '45.00', 35);

    const stockInput = page.locator('input[type="number"]').nth(1);
    await humanType(page, stockInput, '100', 35);

    // Expiry Date
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2027-12-31');
    await page.waitForTimeout(400);

    // Optional description
    const descInput = page.locator('input[placeholder*="Optional description"]');
    if (await descInput.isVisible()) {
      await humanType(page, descInput, 'Broad-spectrum antibacterial eye drops', 30);
    }

    // Submit
    await smoothClick(page, 'button[type="submit"]:has-text("Add Medicine")');
    await page.waitForTimeout(1800);

    // ==========================================
    // CHAPTER 5: Rapid POS Billing (Optional Walk-In Info)
    // ==========================================
    markChapter('ch5_rapid_billing');
    await smoothClick(page, 'aside button:has-text("New Bill")');
    await page.waitForSelector('text=Select Medicines');
    await setStudioBadge(
      page,
      'RAPID POS BILLING TERMINAL',
      'Fast walk-in checkout — customer name and phone are completely optional'
    );
    await page.waitForTimeout(1000);

    // Highlight that walk-in fields are optional
    await smoothHover(page, 'input[placeholder*="Walk-in"]', 900);

    // Add first medicine
    const addBtns = page.locator('button[title="Add to bill"]');
    await smoothClick(page, addBtns.first());
    await page.waitForTimeout(800);

    // Add second medicine
    await smoothClick(page, addBtns.nth(1));
    await page.waitForTimeout(800);

    // Update quantity
    const qtyInput = page.locator('input[type="number"][min="1"]').first();
    if (await qtyInput.isVisible()) {
      await humanType(page, qtyInput, '2', 40);
      await page.waitForTimeout(700);
    }

    // Create & Print Bill
    await smoothClick(page, 'button:has-text("Create & Print Bill")');
    await page.waitForTimeout(2000);

    // ==========================================
    // CHAPTER 6: Transaction History & Receipt Details
    // ==========================================
    markChapter('ch6_bills_history');
    await smoothClick(page, 'aside button:has-text("Bill History")');
    await page.waitForSelector('h2:has-text("Bill History")');
    await setStudioBadge(
      page,
      'TRANSACTION HISTORY & AUDIT LOGS',
      'Search past transactions and inspect itemized receipt breakdowns'
    );
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Search bills"]');
    if (await searchInput.isVisible()) {
      await humanType(page, searchInput, 'Walk-in', 40);
      await page.waitForTimeout(900);
    }

    const viewBtn = page.locator('button[title*="View details"]').first();
    if (await viewBtn.isVisible()) {
      await smoothClick(page, viewBtn);
      await page.waitForSelector('text=Bill Details');
      await page.waitForTimeout(1500);

      await smoothHover(page, 'button:has-text("Print Bill")', 800);
      await smoothClick(page, 'button:has-text("Close")');
      await page.waitForTimeout(800);
    }

    // ==========================================
    // CHAPTER 7: Super Admin Franchise & Live Audit Tracking
    // ==========================================
    markChapter('ch7_super_admin');
    await setStudioBadge(
      page,
      'SUPER ADMIN FRANCHISE PORTAL',
      'Franchise license oversight, automated expiry lock, and 1-click renewals'
    );

    // Use sticky logout at bottom of sidebar
    await smoothClick(page, 'aside button:has-text("Logout")');
    await page.waitForSelector('text=Modern POS & Inventory OS');
    await page.waitForTimeout(800);

    // Open Admin Portal from footer
    const adminBtn = page.locator('footer button:has-text("Admin Portal")');
    await adminBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await smoothClick(page, adminBtn);

    // Verify admin modal opened, fallback to hotkey if needed
    try {
      await page.waitForSelector('h2:has-text("Super Admin Portal")', { timeout: 3000 });
    } catch (e) {
      await page.keyboard.press('Control+Shift+KeyA');
      await page.waitForSelector('h2:has-text("Super Admin Portal")', { timeout: 5000 });
    }
    await page.waitForTimeout(600);

    // Enter admin master password
    await humanType(page, 'input[type="password"]', 'admin', 45);
    await page.waitForTimeout(400);

    await smoothClick(page, 'button[type="submit"]:has-text("Sign In as Admin")');
    await page.waitForSelector('text=Manage Medical Stores');
    await page.waitForTimeout(1200);

    // Extend subscription of Apollo MedPlus
    try {
      const editBtn = page.locator('button[title*="Edit store"]').first();
      if (await editBtn.isVisible()) {
        await smoothClick(page, editBtn);
        await page.waitForSelector('text=Edit Store & Subscription', { timeout: 4000 });
        await page.waitForTimeout(800);

        const extBtn = page.locator('button:has-text("+30 Days")');
        if (await extBtn.isVisible()) {
          await smoothClick(page, extBtn);
          await page.waitForTimeout(800);
        }

        await smoothClick(page, 'button:has-text("Save Store Changes")');
        await page.waitForTimeout(1200);
      }
    } catch (e) {
      console.warn('Edit store step note:', e.message);
    }

    // NEW AUDIT FEATURE: Switch to Store Activity & Device Logs
    await setStudioBadge(
      page,
      'LIVE STORE ACTIVITY & DEVICE AUDIT',
      'Real-time IP tracking, geographical locations, hardware devices, and security audits'
    );
    await smoothClick(page, 'button:has-text("Store Activity & Device Logs")');
    await page.waitForSelector('h2:has-text("Store Activity & Device Audit")');
    await page.waitForTimeout(1200);

    // Hover over KPI stats
    await smoothHover(page, 'text=Total Login Events', 900);
    await smoothHover(page, 'text=Authorized Sessions', 900);

    // Hover over recent IP chip and click Copy
    const copyBtn = page.locator('button[title="Copy IP address"]').first();
    if (await copyBtn.isVisible()) {
      await smoothClick(page, copyBtn);
      await page.waitForTimeout(1000);
    }

    // Hover over location and device badges
    await smoothHover(page, 'text=New York, US, text=Frankfurt, DE, text=Local Network', 1200);

    // Final hold
    await page.waitForTimeout(2500);

    console.log('✓ Continuous Walkthrough recording completed successfully!');
  } catch (err) {
    console.error('Walkthrough error:', err);
  } finally {
    await page.waitForTimeout(1000);
    await page.close();
    await context.close();
    await browser.close();

    if (serverProcess) {
      serverProcess.kill();
    }
  }

  // Find the recorded webm file in RAW_DIR
  const files = fs.readdirSync(RAW_DIR);
  const webm = files.find((f) => f.endsWith('.webm'));
  if (webm) {
    const rawWebmPath = path.join(RAW_DIR, webm);
    const targetWebm = path.join(ROOT_DIR, 'continuous_walkthrough.webm');
    if (fs.existsSync(targetWebm)) fs.unlinkSync(targetWebm);
    fs.renameSync(rawWebmPath, targetWebm);
    console.log(`\n🎉 Recorded raw continuous video: ${targetWebm}`);

    fs.writeFileSync(
      path.join(ROOT_DIR, 'chapter_timestamps.json'),
      JSON.stringify(timestamps, null, 2),
      'utf-8'
    );
    console.log('Saved chapter timestamps:', timestamps);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
