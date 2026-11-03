import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = __dirname;

async function run() {
  console.log('🚀 Starting browser to capture tutorial scenes...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // 1. Landing Page
  console.log('📸 1. Capturing Landing Page...');
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'scene1_landing.png') });

  // 2. Store Login Modal
  console.log('📸 2. Capturing Store Login Modal...');
  await page.click('button:has-text("Store Login")');
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'store@medipos.com');
  await page.fill('input[type="password"]', 'password123');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outputDir, 'scene2_login_modal.png') });

  // Submit Login
  await page.click('button[type="submit"]:has-text("Login")');
  await page.waitForTimeout(1500);

  // 3. Store Dashboard
  console.log('📸 3. Capturing Store Dashboard...');
  await page.screenshot({ path: path.join(outputDir, 'scene3_dashboard.png') });

  // 4. Medicines View (All)
  console.log('📸 4. Capturing Medicines View (All)...');
  await page.click('button:has-text("Medicines")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'scene4_medicines_all.png') });

  // 5. Medicines View (Low Stock Filtered)
  console.log('📸 5. Capturing Low Stock Filter...');
  await page.click('button:has-text("Low Stock")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'scene5_medicines_low_stock.png') });

  // Switch back to all and open Add Medicine Modal
  await page.click('button:has-text("All Medicines")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Add Medicine")');
  await page.waitForTimeout(600);
  await page.fill('input[placeholder*="Paracetamol"]', 'Azithromycin 500mg');
  await page.screenshot({ path: path.join(outputDir, 'scene6_add_medicine_modal.png') });

  // Close Add modal
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(500);

  // 6. POS Billing Terminal
  console.log('📸 6. Capturing POS Billing Terminal...');
  await page.click('button:has-text("New Bill")');
  await page.waitForTimeout(1000);

  // Add 2 medicines to cart
  const addButtons = await page.$$('button[title="Add to bill"]');
  if (addButtons.length > 0) await addButtons[0].click();
  await page.waitForTimeout(400);
  if (addButtons.length > 1) await addButtons[1].click();
  await page.waitForTimeout(400);

  // Fill optional customer details
  await page.fill('input[placeholder="Walk-in Customer"]', 'John Doe');
  await page.fill('input[placeholder*="555"]', '+1 555-8899');
  await page.screenshot({ path: path.join(outputDir, 'scene7_billing_terminal.png') });

  // 7. Bill History
  console.log('📸 7. Capturing Bill History...');
  await page.click('button:has-text("Bill History")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'scene8_bills_history.png') });

  // Open Bill Details modal
  const eyeButtons = await page.$$('button[title="View details"]');
  if (eyeButtons.length > 0) {
    await eyeButtons[0].click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, 'scene9_bill_modal.png') });
    await page.click('button:has-text("Close")');
    await page.waitForTimeout(500);
  }

  // 8. Super Admin Portal
  console.log('📸 8. Capturing Super Admin Portal...');
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(800);

  // Open Admin Portal
  await page.click('button:has-text("Admin Portal")');
  await page.waitForTimeout(600);
  await page.fill('input[placeholder*="admin"]', 'admin');
  await page.click('button[type="submit"]:has-text("Login")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, 'scene10_admin_dashboard.png') });

  // Open Edit Store modal
  const editButtons = await page.$$('button[title*="Edit store"]');
  if (editButtons.length > 0) {
    await editButtons[0].click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, 'scene11_admin_edit_modal.png') });
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
  }

  await browser.close();
  console.log('✅ All tutorial screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
