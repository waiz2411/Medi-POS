import os
import sys
import json
import math
import struct
import wave
import subprocess
from PIL import Image, ImageDraw, ImageFont

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MANIFEST_PATH = os.path.join(ROOT_DIR, "scenes_manifest.json")

def get_font(size, bold=False):
    font_names = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf"
    ]
    for fn in font_names:
        if os.path.exists(fn):
            try:
                return ImageFont.truetype(fn, size)
            except Exception:
                continue
    return ImageFont.load_default()

def wrap_text(text, font, max_width, draw):
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
    if current_line:
        lines.append(' '.join(current_line))
    return lines

def composite_scene_frame(scene, scene_index, total_scenes):
    img_path = os.path.join(ROOT_DIR, scene["image"])
    if not os.path.exists(img_path):
        print(f"Error: image {img_path} not found")
        return None

    base_img = Image.open(img_path).convert("RGBA")
    w, h = base_img.size # 1920x1080

    # Overlay layer for transparency
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 1. TOP HEADER BAR
    top_bar_h = 75
    draw.rectangle([0, 0, w, top_bar_h], fill=(15, 23, 42, 245))
    draw.line([(0, top_bar_h), (w, top_bar_h)], fill=(14, 165, 233, 255), width=3)

    # MediPOS badge
    badge_x = 25
    badge_y = 18
    draw.rounded_rectangle([badge_x, badge_y, badge_x + 130, badge_y + 38], radius=6, fill=(16, 185, 129, 255))
    font_badge = get_font(18, bold=True)
    draw.text((badge_x + 14, badge_y + 8), "+ MEDIPOS", fill=(255, 255, 255, 255), font=font_badge)

    # Step indicator pill
    step_x = badge_x + 145
    step_text = f"STEP {scene_index + 1} OF {total_scenes}"
    draw.rounded_rectangle([step_x, badge_y, step_x + 135, badge_y + 38], radius=6, fill=(30, 41, 59, 255), outline=(56, 189, 248, 255), width=2)
    font_step = get_font(15, bold=True)
    draw.text((step_x + 14, badge_y + 9), step_text, fill=(56, 189, 248, 255), font=font_step)

    # Scene Title & Subtitle
    title_x = step_x + 155
    font_title = get_font(22, bold=True)
    font_sub = get_font(15, bold=False)
    draw.text((title_x, 15), scene["title"], fill=(255, 255, 255, 255), font=font_title)
    draw.text((title_x, 43), scene["subtitle"], fill=(148, 163, 184, 255), font=font_sub)

    # Right branding
    font_right = get_font(14, bold=True)
    guide_text = "OFFICIAL PHARMACY ONBOARDING GUIDE"
    right_bbox = draw.textbbox((0, 0), guide_text, font=font_right)
    right_w = right_bbox[2] - right_bbox[0]
    draw.rounded_rectangle([w - right_w - 45, 20, w - 20, 56], radius=6, fill=(51, 65, 85, 220))
    draw.text((w - right_w - 32, 27), guide_text, fill=(241, 245, 249, 255), font=font_right)

    # 2. RED HIGHLIGHT BOXES & CALLOUT TAGS
    for box_info in scene.get("boxes", []):
        x1, y1, x2, y2 = box_info["coords"]
        label = box_info["label"]
        desc = box_info["desc"]

        # Clamp within screen bounds
        x1 = max(4, min(w - 10, x1))
        y1 = max(top_bar_h + 4, min(h - 10, y1))
        x2 = max(x1 + 20, min(w - 4, x2))
        y2 = max(y1 + 20, min(h - 4, y2))

        # Soft red tint inside the box
        draw.rectangle([x1, y1, x2, y2], fill=(239, 68, 68, 28))

        # Vibrant red border
        border_color = (239, 68, 68, 255) # Red-500
        border_width = 4
        draw.rectangle([x1, y1, x2, y2], outline=border_color, width=border_width)

        # High-tech corner brackets for clear emphasis
        corner_len = 16
        corner_color = (255, 255, 255, 255)
        # Top-left
        draw.line([(x1 - 2, y1 - 2), (x1 + corner_len, y1 - 2)], fill=corner_color, width=4)
        draw.line([(x1 - 2, y1 - 2), (x1 - 2, y1 + corner_len)], fill=corner_color, width=4)
        # Top-right
        draw.line([(x2 + 2, y1 - 2), (x2 - corner_len, y1 - 2)], fill=corner_color, width=4)
        draw.line([(x2 + 2, y1 - 2), (x2 + 2, y1 + corner_len)], fill=corner_color, width=4)
        # Bottom-left
        draw.line([(x1 - 2, y2 + 2), (x1 + corner_len, y2 + 2)], fill=corner_color, width=4)
        draw.line([(x1 - 2, y2 + 2), (x1 - 2, y2 - corner_len)], fill=corner_color, width=4)
        # Bottom-right
        draw.line([(x2 + 2, y2 + 2), (x2 - corner_len, y2 + 2)], fill=corner_color, width=4)
        draw.line([(x2 + 2, y2 + 2), (x2 + 2, y2 - corner_len)], fill=corner_color, width=4)

        # CALLOUT BADGE
        font_lbl = get_font(14, bold=True)
        font_dsc = get_font(12, bold=False)

        lbl_bbox = draw.textbbox((0, 0), label, font=font_lbl)
        dsc_bbox = draw.textbbox((0, 0), desc, font=font_dsc)
        badge_w = max(lbl_bbox[2] - lbl_bbox[0], dsc_bbox[2] - dsc_bbox[0]) + 30
        badge_h = 42

        # Placement logic: above the box if room, else below
        if y1 - badge_h - 10 > top_bar_h:
            bx = max(15, min(w - badge_w - 15, x1))
            by = y1 - badge_h - 6
        elif y2 + badge_h + 10 < 920:
            bx = max(15, min(w - badge_w - 15, x1))
            by = y2 + 8
        else:
            bx = max(15, min(w - badge_w - 15, x1 + 10))
            by = y1 + 10

        # Draw callout badge
        draw.rounded_rectangle([bx, by, bx + badge_w, by + badge_h], radius=7, fill=(220, 38, 38, 250), outline=(254, 202, 202, 255), width=2)
        draw.text((bx + 12, by + 4), f"★ {label}", fill=(255, 255, 255, 255), font=font_lbl)
        draw.text((bx + 12, by + 22), desc, fill=(254, 226, 226, 255), font=font_dsc)

    # 3. BOTTOM CAPTION BAR
    cap_x1 = 140
    cap_x2 = w - 140
    cap_y1 = h - 130
    cap_y2 = h - 25

    draw.rounded_rectangle([cap_x1, cap_y1, cap_x2, cap_y2], radius=14, fill=(15, 23, 42, 245), outline=(56, 189, 248, 200), width=2)

    # Caption Tag
    draw.rounded_rectangle([cap_x1 + 20, cap_y1 + 12, cap_x1 + 195, cap_y1 + 36], radius=5, fill=(14, 165, 233, 255))
    font_cap_tag = get_font(12, bold=True)
    draw.text((cap_x1 + 28, cap_y1 + 16), "VOICEOVER GUIDE", fill=(255, 255, 255, 255), font=font_cap_tag)

    # Caption text wrapped
    font_script = get_font(16, bold=False)
    wrapped_lines = wrap_text(scene["script"], font_script, cap_x2 - cap_x1 - 50, draw)
    # Only display first 3 lines to fit perfectly
    line_y = cap_y1 + 42
    for line in wrapped_lines[:3]:
        draw.text((cap_x1 + 25, line_y), line, fill=(248, 250, 252, 255), font=font_script)
        line_y += 22

    # Merge overlay with base image
    final_img = Image.alpha_composite(base_img, overlay).convert("RGB")
    out_frame_path = os.path.join(ROOT_DIR, f"{scene['id']}_frame.png")
    final_img.save(out_frame_path, "PNG")
    print(f"  ✓ Composited frame saved: {out_frame_path}")
    return out_frame_path

def get_audio_duration(file_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        return float(res.stdout.strip())
    except Exception:
        return 5.0

def build_scene_clip(scene_id, frame_path, voice_path, out_clip_path):
    duration = get_audio_duration(voice_path) + 0.6 # extra 0.6s breathing room
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", frame_path,
        "-i", voice_path,
        "-c:v", "libx264", "-tune", "stillimage",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-t", str(duration),
        out_clip_path
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return duration

def generate_background_music(total_duration, out_path):
    print(f"🎵 Synthesizing smooth corporate ambient background music ({total_duration:.1f}s)...")
    sample_rate = 44100
    total_samples = int(sample_rate * total_duration)
    
    # Warm chords in Hz: Cmaj9 -> Am9 -> Fmaj9 -> Gsus4
    progression = [
        [130.81, 164.81, 196.00, 246.94, 293.66],  # Cmaj9
        [110.00, 130.81, 164.81, 196.00, 246.94],  # Am9
        [87.31, 110.00, 130.81, 164.81, 196.00],   # Fmaj9
        [98.00, 130.81, 146.83, 196.00, 293.66]    # Gsus4
    ]
    chord_len = 4.0 # 4 seconds per chord
    
    with wave.open(out_path, 'w') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        
        frames = bytearray()
        for i in range(total_samples):
            t = i / sample_rate
            chord_idx = int((t / chord_len) % len(progression))
            chord = progression[chord_idx]
            
            chord_t = t % chord_len
            env = math.sin(math.pi * min(1.0, chord_t / 0.6)) * (0.8 + 0.2 * math.cos(math.pi * chord_t / chord_len))
            
            sample_l = 0.0
            sample_r = 0.0
            for note_i, freq in enumerate(chord):
                pan = 0.25 + 0.5 * (note_i / len(chord))
                tone = math.sin(2 * math.pi * freq * t) * 0.7 + math.sin(4 * math.pi * freq * t) * 0.3
                amp = (0.06 / len(chord)) * env
                sample_l += tone * amp * (1.0 - pan)
                sample_r += tone * amp * pan
                
            # Soft arpeggio note
            arp_note = chord[int(t * 2.5) % len(chord)] * 2
            arp_env = math.exp(-5.0 * (t % 0.4)) * 0.015
            arp_tone = math.sin(2 * math.pi * arp_note * t) * arp_env
            sample_l += arp_tone * 0.6
            sample_r += arp_tone * 0.4
            
            # Global Fade in / fade out
            if t < 2.0:
                fade = t / 2.0
            elif t > total_duration - 3.0:
                fade = max(0.0, (total_duration - t) / 3.0)
            else:
                fade = 1.0
                
            val_l = max(-32767, min(32767, int(sample_l * fade * 32767)))
            val_r = max(-32767, min(32767, int(sample_r * fade * 32767)))
            frames.extend(struct.pack('<hh', val_l, val_r))
            
        wav.writeframes(frames)
    print(f"  ✓ Music file created: {out_path}")

def main():
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found at {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        scenes = json.load(f)

    print(f"🎬 Processing {len(scenes)} scenes...")
    clip_files = []
    total_video_duration = 0.0

    for i, scene in enumerate(scenes):
        print(f"\n--- Scene {i+1}/{len(scenes)}: {scene['title']} ---")
        frame_path = composite_scene_frame(scene, i, len(scenes))
        voice_path = os.path.join(ROOT_DIR, f"{scene['id']}_voice.mp3")
        clip_path = os.path.join(ROOT_DIR, f"{scene['id']}_clip.mp4")

        if not os.path.exists(voice_path):
            print(f"Warning: voice file {voice_path} missing")
            continue

        dur = build_scene_clip(scene['id'], frame_path, voice_path, clip_path)
        print(f"  ✓ Rendered clip: {clip_path} ({dur:.1f}s)")
        clip_files.append(clip_path)
        total_video_duration += dur

    print(f"\nTotal video duration: {total_video_duration:.1f}s ({total_video_duration/60:.2f} mins)")

    # 1. Concat all scene clips
    concat_txt_path = os.path.join(ROOT_DIR, "concat_list.txt")
    with open(concat_txt_path, "w", encoding="utf-8") as f:
        for c in clip_files:
            # ffmpeg concat list needs forward slashes or escaped backslashes
            c_esc = c.replace("\\", "/")
            f.write(f"file '{c_esc}'\n")

    concatenated_raw = os.path.join(ROOT_DIR, "all_scenes_raw.mp4")
    print("\n📦 Concatenating scene clips...")
    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_txt_path,
        "-c", "copy",
        concatenated_raw
    ]
    subprocess.run(cmd_concat, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    print("  ✓ Concat complete!")

    # 2. Generate matching ambient music
    music_wav_path = os.path.join(ROOT_DIR, "ambient_bg_music.wav")
    generate_background_music(total_video_duration, music_wav_path)

    # 3. Final audio mix: Voiceover + Background music (lowered volume)
    final_output_path = os.path.join(ROOT_DIR, "medi_pos_tutorial.mp4")
    root_copy_path = os.path.join(os.path.dirname(ROOT_DIR), "medi_pos_tutorial.mp4")
    print(f"\n🎧 Mixing final audio and producing {final_output_path}...")

    # Filter complex mixes narration (stream 0:a) with bg music (stream 1:a at 0.12 volume)
    cmd_mix = [
        "ffmpeg", "-y",
        "-i", concatenated_raw,
        "-i", music_wav_path,
        "-filter_complex",
        "[1:a]volume=0.12[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[a]",
        "-map", "0:v",
        "-map", "[a]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-c:a", "aac", "-b:a", "256k",
        "-pix_fmt", "yuv420p",
        final_output_path
    ]
    subprocess.run(cmd_mix, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    print(f"\n🎉 TUTORIAL VIDEO GENERATED SUCCESSFULLY!")
    print(f"File: {final_output_path}")

    # Copy to workspace root
    try:
        import shutil
        shutil.copyfile(final_output_path, root_copy_path)
        print(f"  ✓ Copied to workspace root: {root_copy_path}")
    except Exception as e:
        print(f"Copy note: {e}")

if __name__ == "__main__":
    main()
