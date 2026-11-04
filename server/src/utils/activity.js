import crypto from 'crypto';
import { pool, isConnectedToMySQL, memoryDb } from '../db.js';

const geoCache = new Map();

export function parseUserAgent(ua = '') {
  let device = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  if (!ua) {
    return { device: 'Desktop (Web Client)', browser: 'Standard Browser' };
  }

  // Device & OS detection
  if (/ipad|tablet/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobile|iphone|android|phone/i.test(ua)) {
    device = 'Mobile';
  } else {
    device = 'Desktop';
  }

  if (/windows nt 10/i.test(ua) || /windows nt 11/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/iphone/i.test(ua)) {
    os = 'iOS (iPhone)';
  } else if (/ipad/i.test(ua)) {
    os = 'iPadOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser detection
  if (/edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else {
    browser = 'Web Browser';
  }

  return {
    device: `${device} • ${os}`,
    browser,
  };
}

export async function getLocationFromIp(ip = '') {
  const cleanIp = (ip || '').replace(/^.*:/, '').trim();

  if (
    !cleanIp ||
    cleanIp === '127.0.0.1' ||
    cleanIp === 'localhost' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('172.16.')
  ) {
    return 'Local Network / Dev';
  }

  if (geoCache.has(cleanIp)) {
    return geoCache.get(cleanIp);
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,city,regionName,country,countryCode`, {
      signal: AbortSignal.timeout(1200),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success') {
        const loc = `${data.city || data.regionName || 'City'}, ${data.countryCode || data.country || 'Region'}`;
        geoCache.set(cleanIp, loc);
        return loc;
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }

  const fallback = `IP: ${cleanIp}`;
  geoCache.set(cleanIp, fallback);
  return fallback;
}

export async function recordStoreActivity({
  storeId,
  storeName,
  action = 'LOGIN',
  ip = '127.0.0.1',
  location = 'Local Network',
  device = 'Desktop',
  browser = 'Browser',
  status = 'success',
}) {
  const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const record = {
    id,
    store_id: storeId,
    store_name: storeName,
    action,
    ip_address: ip,
    location,
    device,
    browser,
    status,
    created_at: new Date().toISOString(),
  };

  try {
    if (isConnectedToMySQL && pool) {
      await pool.query(
        `INSERT INTO store_activity_logs (id, store_id, store_name, action, ip_address, location, device, browser, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, storeId, storeName, action, ip, location, device, browser, status]
      );
    }
  } catch (err) {
    console.warn('Could not insert activity log to MySQL:', err.message);
  }

  // Always keep in memoryDb as well
  if (!memoryDb.activityLogs) memoryDb.activityLogs = [];
  memoryDb.activityLogs.unshift(record);
  if (memoryDb.activityLogs.length > 200) {
    memoryDb.activityLogs.pop();
  }

  return record;
}
