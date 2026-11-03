import os
import sys
import math
import struct
import wave
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CHAPTERS_DIR = os.path.join(ROOT_DIR, "chapters")
OUTPUT_MP4 = os.path.join(ROOT_DIR, "medi_pos_tutorial.mp4")
WORKSPACE_MP4 = os.path.join(os.path.dirname(os.path.dirname(ROOT_DIR)), "medi_pos_tutorial.mp4")

CHAPTERS = [
    "ch1_login",
    "ch2_dashboard",
    "ch3_inventory_filters",
    "ch4_add_medicine",
    "ch5_rapid_billing",
    "ch6_bills_history",
    "ch7_super_admin"
]

def transcode_to_mp4(input_webm, output_mp4):
    cmd = [
        "ffmpeg", "-y",
        "-i", input_webm,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "19",
        "-r", "30",
        "-pix_fmt", "yuv420p",
        "-an",
        output_mp4
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

def get_duration(file_path):
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
        return 0.0

def generate_upbeat_lofi_music(total_seconds, output_wav):
    print(f"🎵 Synthesizing modern tech chillhop soundtrack ({total_seconds:.1f}s)...")
    sample_rate = 44100
    total_samples = int(sample_rate * total_seconds)
    bpm = 100
    beat_dur = 60.0 / bpm # 0.6s per beat
    bar_dur = beat_dur * 4 # 2.4s per bar

    # Chords (Hz): Dm9 -> G13 -> Cmaj9 -> Am9
    progression = [
        [146.83, 174.61, 220.00, 261.63, 293.66], # Dm9
        [98.00, 146.83, 196.00, 246.94, 329.63],  # G13
        [130.81, 164.81, 196.00, 246.94, 293.66], # Cmaj9
        [110.00, 130.81, 164.81, 196.00, 246.94]  # Am9
    ]
    bass_notes = [73.42, 49.00, 65.41, 55.00] # Sub-bass roots

    with wave.open(output_wav, 'w') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)

        frames = bytearray()
        for i in range(total_samples):
            t = i / sample_rate
            bar_idx = int(t / bar_dur)
            chord_idx = bar_idx % len(progression)
            chord = progression[chord_idx]
            root_bass = bass_notes[chord_idx]

            beat_in_bar = (t % bar_dur) / beat_dur
            beat_pos = t % beat_dur

            # 1. Electric Piano / Rhodes Chords (Soft warm tone with vibrato)
            chord_env = math.exp(-1.4 * (t % bar_dur)) * (0.8 + 0.2 * math.sin(2 * math.pi * 3 * t))
            piano_l = 0.0
            piano_r = 0.0
            for ni, freq in enumerate(chord):
                pan = 0.25 + 0.5 * (ni / len(chord))
                # Add gentle tremolo
                vibrato = 1.0 + 0.003 * math.sin(2 * math.pi * 5 * t)
                wave_val = math.sin(2 * math.pi * freq * vibrato * t) * 0.7 + math.sin(4 * math.pi * freq * vibrato * t) * 0.3
                amp = (0.07 / len(chord)) * chord_env
                piano_l += wave_val * amp * (1.0 - pan)
                piano_r += wave_val * amp * pan

            # 2. Sub Bass (Warm sine with soft saturation)
            bass_env = math.exp(-2.0 * (beat_pos % beat_dur)) * 0.12
            bass_wave = math.sin(2 * math.pi * root_bass * t)
            bass = math.tanh(bass_wave * 1.5) * bass_env

            # 3. Lo-Fi Drums (Kick on 1 & 2.5, Snare on 2 & 4, Hi-Hats on 8ths)
            drum_l = 0.0
            drum_r = 0.0

            # Kick (deep punch)
            is_kick = (beat_in_bar < 0.25) or (beat_in_bar >= 1.5 and beat_in_bar < 1.75)
            if is_kick:
                kt = t % (beat_dur if beat_in_bar < 1.5 else beat_dur / 2)
                k_env = math.exp(-15.0 * kt)
                k_freq = 60.0 + 120.0 * math.exp(-35.0 * kt)
                kick = math.sin(2 * math.pi * k_freq * kt) * k_env * 0.18
                drum_l += kick
                drum_r += kick

            # Snare / Rimshot (on beats 2 and 4)
            is_snare = (beat_in_bar >= 1.0 and beat_in_bar < 1.3) or (beat_in_bar >= 3.0 and beat_in_bar < 3.3)
            if is_snare:
                st = (t - beat_dur) % (beat_dur * 2)
                if st > 0:
                    s_env = math.exp(-18.0 * st)
                    # Noise burst + tone
                    noise = (hash(int(t * 100000)) % 1000 / 500.0 - 1.0)
                    snare = (noise * 0.6 + math.sin(2 * math.pi * 180 * st) * 0.4) * s_env * 0.09
                    drum_l += snare
                    drum_r += snare

            # Hi-hat (8th notes)
            hh_pos = (t % (beat_dur / 2))
            hh_env = math.exp(-40.0 * hh_pos)
            hh_noise = (hash(int(t * 200000)) % 1000 / 500.0 - 1.0)
            hh = hh_noise * hh_env * 0.025
            drum_l += hh * 0.6
            drum_r += hh * 0.4

            # 4. Melodic Arp sparkle
            arp_note = chord[int(t * 3.5) % len(chord)] * 2
            arp_t = t % (1.0 / 3.5)
            arp_env = math.exp(-8.0 * arp_t) * 0.02
            arp = math.sin(2 * math.pi * arp_note * t) * arp_env

            sample_l = piano_l + bass * 0.7 + drum_l + arp * 0.6
            sample_r = piano_r + bass * 0.7 + drum_r + arp * 0.4

            # Global Fade in & fade out
            if t < 1.5:
                fade = t / 1.5
            elif t > total_seconds - 2.5:
                fade = max(0.0, (total_seconds - t) / 2.5)
            else:
                fade = 1.0

            l_int = max(-32767, min(32767, int(sample_l * fade * 32767)))
            r_int = max(-32767, min(32767, int(sample_r * fade * 32767)))
            frames.extend(struct.pack('<hh', l_int, r_int))

        wav.writeframes(frames)
    print(f"  ✓ Music synthesized: {output_wav}")

def main():
    print("🎬 Assembling Screen Studio Professional Tutorial Video...")
    mp4_clips = []
    total_duration = 0.0

    for ch_name in CHAPTERS:
        webm_path = os.path.join(CHAPTERS_DIR, f"{ch_name}.webm")
        if not os.path.exists(webm_path):
            print(f"Warning: {webm_path} does not exist yet!")
            continue

        mp4_path = os.path.join(CHAPTERS_DIR, f"{ch_name}.mp4")
        print(f"Transcoding {ch_name} to 1080p MP4...")
        transcode_to_mp4(webm_path, mp4_path)
        dur = get_duration(mp4_path)
        print(f"  ✓ {ch_name}.mp4 ({dur:.1f}s)")
        mp4_clips.append(mp4_path)
        total_duration += dur

    if not mp4_clips:
        print("Error: No chapter clips found!")
        return

    print(f"\nTotal Video Duration: {total_duration:.1f}s ({total_duration/60:.2f} mins)")

    # Concat demuxer
    concat_txt = os.path.join(ROOT_DIR, "chapters_concat.txt")
    with open(concat_txt, "w", encoding="utf-8") as f:
        for c in mp4_clips:
            esc = c.replace("\\", "/")
            f.write(f"file '{esc}'\n")

    video_only_mp4 = os.path.join(ROOT_DIR, "video_merged.mp4")
    print("\nMerging all chapters...")
    cmd_cat = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_txt,
        "-c", "copy",
        video_only_mp4
    ]
    subprocess.run(cmd_cat, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    # Generate music
    music_wav = os.path.join(ROOT_DIR, "lofi_bg_music.wav")
    generate_upbeat_lofi_music(total_duration, music_wav)

    # Master final mux
    print(f"\nMastering final video with modern soundtrack -> {OUTPUT_MP4}...")
    cmd_mux = [
        "ffmpeg", "-y",
        "-i", video_only_mp4,
        "-i", music_wav,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "256k",
        "-shortest",
        OUTPUT_MP4
    ]
    subprocess.run(cmd_mux, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    # Copy to workspace root
    try:
        import shutil
        shutil.copyfile(OUTPUT_MP4, WORKSPACE_MP4)
        print(f"  ✓ Copied to workspace root: {WORKSPACE_MP4}")
    except Exception as e:
        print(f"Copy note: {e}")

    print("\n🎉 MASTER TUTORIAL VIDEO CREATED!")

if __name__ == "__main__":
    main()
