import os
import sys
import math
import struct
import wave
import asyncio
import edge_tts
import subprocess
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


output_dir = os.path.dirname(os.path.abspath(__file__))

scenes = [
    {
        "id": "scene1",
        "image": "scene1_landing.png",
        "title": "WELCOME TO MEDIPOS",
        "subtitle": "Complete Medical Store POS & Franchise System",
        "script": "Welcome to MediPOS, the complete medical store management and point of sale platform. Whether you are opening a new pharmacy or expanding to multiple franchise locations, MediPOS gives you real-time inventory tracking, rapid POS billing, smart expiry alerts, and powerful revenue analytics. Let's begin by logging in to your store.",
        "boxes": [
            {"coords": [1695, 12, 1875, 58], "label": "STORE LOGIN BUTTON", "desc": "Click here to access your pharmacy"},
            {"coords": [1565, 12, 1690, 58], "label": "SUPER ADMIN PORTAL", "desc": "Master franchise control center"}
        ]
    },
    {
        "id": "scene2",
        "image": "scene2_login_modal.png",
        "title": "STORE AUTHENTICATION",
        "subtitle": "Secure Pharmacist & Staff Login",
        "script": "To access your store, click Store Login in the top navigation. Enter your registered email address and secure password. MediPOS automatically validates your store's active subscription status in real-time, ensuring safe and isolated access to your pharmacy's database.",
        "boxes": [
            {"coords": [740, 395, 1180, 600], "label": "STORE CREDENTIALS", "desc": "Enter registered email and password"},
            {"coords": [965, 695, 1180, 755], "label": "REAL-TIME VALIDATION", "desc": "Validates active subscription & permissions"}
        ]
    },
    {
        "id": "scene3",
        "image": "scene3_dashboard.png",
        "title": "STORE DASHBOARD OVERVIEW",
        "subtitle": "Daily Revenue, Sales Metrics & Instant Bill Action",
        "script": "Once logged in, you arrive at your Store Dashboard. Right at the top, a prominent Create New Bill button lets you launch the billing terminal in one click. Below, monitor your total revenue, bill counts, and critical operational alerts like Low Stock items and Expiring Soon medicines. Clicking on these warning cards takes you directly to the filtered inventory for instant restocking.",
        "boxes": [
            {"coords": [1640, 120, 1865, 185], "label": "QUICK ACTION: CREATE NEW BILL", "desc": "One-click jump directly to POS terminal"},
            {"coords": [1085, 225, 1475, 345], "label": "LOW STOCK ALERT CARD", "desc": "Click to view medicines with < 10 units"},
            {"coords": [1490, 225, 1880, 345], "label": "EXPIRING SOON CARD", "desc": "Click to view medicines expiring within 30 days"}
        ]
    },
    {
        "id": "scene4",
        "image": "scene4_medicines_all.png",
        "title": "INVENTORY MANAGEMENT",
        "subtitle": "Smart Filters, Low Stock Warnings & Category Sorting",
        "script": "In the Medicines section, manage your complete pharmaceutical catalog with ease. Use the smart filter tabs to view All Medicines, isolate Low Stock items with under ten units, or check products expiring within thirty days. You can also filter by category or search instantly by name.",
        "boxes": [
            {"coords": [275, 135, 1020, 205], "label": "SMART FILTER PILLS", "desc": "Filter by All, Low Stock (<10), or Expiring Soon"},
            {"coords": [1670, 145, 1880, 195], "label": "CATEGORY FILTER", "desc": "Sort by Tablet, Syrup, Capsule, etc."},
            {"coords": [1715, 85, 1885, 140], "label": "ADD MEDICINE", "desc": "Register new pharmaceutical stock"}
        ]
    },
    {
        "id": "scene5",
        "image": "scene5_medicines_low_stock.png",
        "title": "LOW STOCK MONITORING",
        "subtitle": "Automated Stock Depletion Alerts",
        "script": "The Low Stock filter instantly isolates medicines that have fallen below ten units. Red warning badges clearly flag items in urgent need of reordering from distributors, ensuring your pharmacy never runs out of essential prescription medications.",
        "boxes": [
            {"coords": [425, 150, 595, 200], "label": "ACTIVE FILTER: LOW STOCK", "desc": "Displays only medicines below threshold"},
            {"coords": [280, 275, 790, 580], "label": "CRITICAL INVENTORY ALERT", "desc": "Stock counter highlighted in bold red"}
        ]
    },
    {
        "id": "scene6",
        "image": "scene6_add_medicine_modal.png",
        "title": "ADDING MEDICINES & DYNAMIC CATEGORIES",
        "subtitle": "Custom Categories on the Fly & Expiry Tracking",
        "script": "Adding new inventory is effortless. Click Add Medicine to open the registration form. Select your medicine category from the dropdown, or choose Add New Category to create custom categories on the fly. Enter your pricing, available stock quantity, batch expiry date, and optional clinical notes.",
        "boxes": [
            {"coords": [975, 245, 1265, 310], "label": "DYNAMIC CATEGORY SELECTOR", "desc": "Includes '+ Add New Category' option"},
            {"coords": [655, 335, 1265, 405], "label": "PRICE & STOCK", "desc": "Define retail pricing and initial units"},
            {"coords": [655, 425, 945, 495], "label": "EXPIRY DATE", "desc": "Tracks expiry for automated warnings"}
        ]
    },
    {
        "id": "scene7",
        "image": "scene7_billing_terminal.png",
        "title": "RAPID POS BILLING TERMINAL",
        "subtitle": "Optional Customer Info & 1-Click Medicine Cart",
        "script": "The New Bill terminal is designed for maximum speed during busy dispensary hours. Search medicines and click the plus button to add items to the cart, with built-in stock limits preventing overselling. Customer name and phone number are completely optional, allowing lightning-fast walk-in checkout. Adjust quantities, choose Cash, Card, or UPI payment, and click Create and Print Bill.",
        "boxes": [
            {"coords": [275, 95, 1065, 980], "label": "MEDICINE SELECTION PANEL", "desc": "1-click '+' addition with stock verification"},
            {"coords": [1095, 185, 1865, 335], "label": "OPTIONAL CUSTOMER DETAILS", "desc": "Name & phone are 100% optional for walk-ins"},
            {"coords": [1095, 425, 1865, 845], "label": "INTERACTIVE CART", "desc": "Real-time quantity, price and total calculation"},
            {"coords": [1095, 855, 1865, 925], "label": "CREATE & PRINT BILL", "desc": "Decrements stock and prints invoice"}
        ]
    },
    {
        "id": "scene8",
        "image": "scene8_bills_history.png",
        "title": "BILL HISTORY & AUDIT LOGS",
        "subtitle": "Complete Transaction History & Instant Receipt Reprint",
        "script": "Access complete historical transaction records in the Bill History tab. Search past receipts by customer name, phone number, or bill ID. Click the eye icon to view itemized breakdowns, or click the download button to reprint any customer receipt whenever needed.",
        "boxes": [
            {"coords": [275, 95, 1885, 185], "label": "SEARCH TRANSACTIONS", "desc": "Filter by customer, phone, or bill ID"},
            {"coords": [1735, 355, 1865, 415], "label": "VIEW & REPRINT", "desc": "Inspect line items or print receipt again"}
        ]
    },
    {
        "id": "scene9",
        "image": "scene9_bill_modal.png",
        "title": "DETAILED INVOICE BREAKDOWN",
        "subtitle": "Clean Itemized Receipts & Printable Format",
        "script": "Clicking any bill opens a comprehensive modal displaying the exact medicine names, unit prices, quantities, and totals. A single click on Print Bill generates a formatted medical receipt ready for thermal or A4 printing.",
        "boxes": [
            {"coords": [595, 345, 1325, 655], "label": "LINE ITEMS BREAKDOWN", "desc": "Detailed item list, quantities, and subtotals"},
            {"coords": [975, 795, 1325, 855], "label": "PRINT INVOICE", "desc": "Launches print dialogue instantly"}
        ]
    },
    {
        "id": "scene10",
        "image": "scene10_admin_dashboard.png",
        "title": "SUPER ADMIN PORTAL",
        "subtitle": "Franchise Oversight, Subscriptions & Renewal Tracking",
        "script": "For franchise owners and system administrators, the Super Admin portal provides total control over all medical stores. Track subscription expiry dates with visual countdown badges. When a store's subscription expires, their account is automatically marked inactive, blocking unauthorized login until renewed. Admins can update store passwords, adjust monthly renewal amounts, and extend subscriptions with one-click thirty day, three month, or one year renewal buttons.",
        "boxes": [
            {"coords": [275, 95, 1885, 225], "label": "ADMIN KPI SUMMARY", "desc": "Total Stores, Active, Expiring Soon, Expired"},
            {"coords": [935, 415, 1220, 520], "label": "SUBSCRIPTION EXPIRY TRACKER", "desc": "Automated status switch & countdown pill"},
            {"coords": [1225, 415, 1435, 520], "label": "MONTHLY RENEWAL FEE", "desc": "Monitors franchise renewal revenue"}
        ]
    },
    {
        "id": "scene11",
        "image": "scene11_admin_edit_modal.png",
        "title": "ADMINISTRATIVE STORE CONTROLS",
        "subtitle": "Password Resets, Quick Extensions & Account States",
        "script": "Inside the Edit Store modal, administrators have complete authority. Easily change store passwords, toggle access statuses between Active, Inactive, or Pending, and use the quick extension buttons to add thirty days, three months, or a full year of subscription with zero hassle.",
        "boxes": [
            {"coords": [975, 265, 1265, 325], "label": "PASSWORD MANAGEMENT", "desc": "Reset or inspect store login passwords"},
            {"coords": [655, 345, 945, 405], "label": "ACCOUNT STATUS TOGGLE", "desc": "Active, Inactive (Access Blocked), or Pending"},
            {"coords": [655, 435, 1265, 575], "label": "QUICK SUBSCRIPTION RENEWAL", "desc": "+30 Days, +3 Months, +1 Year buttons"}
        ]
    }
]

# 1. Generate Voiceovers
async def generate_voiceovers():
    print("🎙️ Generating studio voiceover narrations with edge-tts...")
    voice = "en-US-ChristopherNeural"
    for i, s in enumerate(scenes):
        audio_path = os.path.join(output_dir, f"{s['id']}_voice.mp3")
        comm = edge_tts.Communicate(s['script'], voice, rate="+2%", pitch="-1Hz")
        await comm.save(audio_path)
        print(f"  ✓ Voiceover {i+1}/{len(scenes)}: {s['id']}_voice.mp3")

# 2. Generate Background Music (Lofi Acoustic Soft Ambient Track)
def generate_background_music(duration_sec, output_path):
    print(f"🎵 Generating soft background music track ({duration_sec:.1f}s)...")
    sample_rate = 44100
    total_samples = int(sample_rate * duration_sec)
    
    # Chord frequencies (Hz) for a warm, soothing ambient corporate progression
    # Cmaj9 (C3, E3, G3, B3, D4), Am9 (A2, C3, E3, G3, B3), Fmaj9 (F2, A2, C3, E3, G3), Gsus4 (G2, C3, D3, G3)
    chord_progression = [
        [130.81, 164.81, 196.00, 246.94, 293.66],  # Cmaj9
        [110.00, 130.81, 164.81, 196.00, 246.94],  # Am9
        [87.31, 110.00, 130.81, 164.81, 196.00],   # Fmaj9
        [98.00, 130.81, 146.83, 196.00, 293.66]    # Gsus4
    ]
    chord_duration = 4.0 # seconds per chord
    
    with wave.open(output_path, 'w') as wav:
        wav.setnchannels(2) # Stereo
        wav.setsampwidth(2) # 16-bit
        wav.setframerate(sample_rate)
        
        frames = bytearray()
        for i in range(total_samples):
            t = i / sample_rate
            chord_idx = int((t / chord_duration) % len(chord_progression))
            chord = chord_progression[chord_idx]
            
            # Envelope within chord (soft attack and gentle decay)
            chord_t = t % chord_duration
            env = math.sin(math.pi * min(1.0, chord_t / 0.5)) * (0.8 + 0.2 * math.cos(math.pi * chord_t / chord_duration))
            
            # Add harmonics
            sample_val_l = 0.0
            sample_val_r = 0.0
            for note_idx, freq in enumerate(chord):
                pan = 0.3 + 0.4 * (note_idx / len(chord)) # stereo spread
                # Pure tone + warm 2nd harmonic
                tone = math.sin(2 * math.pi * freq * t) * 0.7 + math.sin(4 * math.pi * freq * t) * 0.3
                amp = (0.07 / len(chord)) * env
                sample_val_l += tone * amp * (1.0 - pan)
                sample_val_r += tone * amp * pan
                
            # Add subtle arpeggio sparkle
            arp_note = chord[int(t * 3) % len(chord)] * 2
            arp_env = math.exp(-6.0 * (t % (1/3))) * 0.02
            arp_tone = math.sin(2 * math.pi * arp_note * t) * arp_env
            sample_val_l += arp_tone * 0.6
            sample_val_r += arp_tone * 0.4
            
            # Global fade in / fade out
            if t < 2.0:
                fade = t / 2.0
            elif t > duration_sec - 3.0:
                fade = max(0.0, (duration_sec - t) / 3.0)
            else:
                fade = 1.0
                
            l_int = max(-32767, min(32767, int(sample_val_l * fade * 32767)))
            r_int = max(-32767, min(32767, int(sample_val_r * fade * 32767)))
            frames.extend(struct.pack('<hh', l_int, r_int))
            
        wav.writeframes(frames)
    print(f"  ✓ Background music generated: {output_path}")

async def main():
    await generate_voiceovers()
    
    # Save scene manifest
    manifest_path = os.path.join(output_dir, "scenes_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(scenes, f, indent=2)
    print(f"✅ Scene manifest saved: {manifest_path}")

if __name__ == "__main__":
    asyncio.run(main())
