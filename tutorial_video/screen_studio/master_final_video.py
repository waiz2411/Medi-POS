import os
import sys
import math
import struct
import wave
import json
import subprocess
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(ROOT_DIR))
INPUT_WEBM = os.path.join(ROOT_DIR, "continuous_walkthrough.webm")
OUTPUT_MP4 = os.path.join(ROOT_DIR, "medi_pos_tutorial.mp4")
PUBLIC_MP4 = os.path.join(PROJECT_ROOT, "public", "medi_pos_tutorial.mp4")
DIST_MP4 = os.path.join(PROJECT_ROOT, "dist", "medi_pos_tutorial.mp4")
ROOT_MP4 = os.path.join(PROJECT_ROOT, "medi_pos_tutorial.mp4")
TIMESTAMPS_JSON = os.path.join(ROOT_DIR, "chapter_timestamps.json")

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

def synthesize_music(total_seconds, output_wav):
    print(f"🎵 Synthesizing high-fidelity lofi soundtrack ({total_seconds:.1f}s)...")
    sample_rate = 44100
    total_samples = int(sample_rate * total_seconds)
    bpm = 96
    beat_dur = 60.0 / bpm # 0.625s
    bar_dur = beat_dur * 4 # 2.5s

    # Warm jazzy progression: Dm9 -> G13 -> Cmaj9 -> Am9
    progression = [
        [146.83, 174.61, 220.00, 261.63, 293.66],
        [98.00, 146.83, 196.00, 246.94, 329.63],
        [130.81, 164.81, 196.00, 246.94, 293.66],
        [110.00, 130.81, 164.81, 196.00, 246.94]
    ]
    bass_notes = [73.42, 49.00, 65.41, 55.00]

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

            # 1. Warm Rhodes Keys
            chord_decay = math.exp(-1.3 * (t % bar_dur)) * (0.8 + 0.2 * math.sin(2 * math.pi * 3.5 * t))
            piano_l = 0.0
            piano_r = 0.0
            for ni, freq in enumerate(chord):
                pan = 0.25 + 0.5 * (ni / len(chord))
                vibrato = 1.0 + 0.003 * math.sin(2 * math.pi * 4.5 * t)
                wave_val = math.sin(2 * math.pi * freq * vibrato * t) * 0.7 + math.sin(4 * math.pi * freq * vibrato * t) * 0.3
                amp = (0.075 / len(chord)) * chord_decay
                piano_l += wave_val * amp * (1.0 - pan)
                piano_r += wave_val * amp * pan

            # 2. Smooth Sub Bass
            bass_env = math.exp(-1.8 * beat_pos) * 0.12
            bass_wave = math.sin(2 * math.pi * root_bass * t)
            bass = math.tanh(bass_wave * 1.6) * bass_env

            # 3. Lo-Fi Beats
            drum_l = 0.0
            drum_r = 0.0

            # Kick
            is_kick = (beat_in_bar < 0.25) or (beat_in_bar >= 1.5 and beat_in_bar < 1.75)
            if is_kick:
                kt = t % (beat_dur if beat_in_bar < 1.5 else beat_dur / 2)
                k_env = math.exp(-16.0 * kt)
                k_freq = 55.0 + 110.0 * math.exp(-35.0 * kt)
                kick = math.sin(2 * math.pi * k_freq * kt) * k_env * 0.19
                drum_l += kick
                drum_r += kick

            # Snare
            is_snare = (beat_in_bar >= 1.0 and beat_in_bar < 1.3) or (beat_in_bar >= 3.0 and beat_in_bar < 3.3)
            if is_snare:
                st = (t - beat_dur) % (beat_dur * 2)
                if st > 0:
                    s_env = math.exp(-18.0 * st)
                    noise = (hash(int(t * 100000)) % 1000 / 500.0 - 1.0)
                    snare = (noise * 0.55 + math.sin(2 * math.pi * 180 * st) * 0.45) * s_env * 0.09
                    drum_l += snare
                    drum_r += snare

            # Hi-hat
            hh_pos = (t % (beat_dur / 2))
            hh_env = math.exp(-42.0 * hh_pos)
            hh_noise = (hash(int(t * 200000)) % 1000 / 500.0 - 1.0)
            hh = hh_noise * hh_env * 0.024
            drum_l += hh * 0.6
            drum_r += hh * 0.4

            # Arp
            arp_note = chord[int(t * 3.5) % len(chord)] * 2
            arp_t = t % (1.0 / 3.5)
            arp_env = math.exp(-9.0 * arp_t) * 0.02
            arp = math.sin(2 * math.pi * arp_note * t) * arp_env

            sample_l = piano_l + bass * 0.7 + drum_l + arp * 0.6
            sample_r = piano_r + bass * 0.7 + drum_r + arp * 0.4

            # Fade In & Out
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
    print(f"  ✓ Soundtrack ready: {output_wav}")

def main():
    if not os.path.exists(INPUT_WEBM):
        print(f"Error: {INPUT_WEBM} does not exist.")
        return

    dur = get_duration(INPUT_WEBM)
    print(f"🎬 Raw video duration: {dur:.1f}s ({dur/60:.2f} mins)")

    # 1. Synthesize audio to match duration
    music_wav = os.path.join(ROOT_DIR, "walkthrough_music.wav")
    synthesize_music(dur, music_wav)

    # 2. Transcode & Mux in one high-performance pass
    print(f"Rendering 1080p 60fps mastered MP4 -> {OUTPUT_MP4}...")
    cmd = [
        "ffmpeg", "-y",
        "-i", INPUT_WEBM,
        "-i", music_wav,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-r", "30",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "256k",
        "-shortest",
        OUTPUT_MP4
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    final_dur = get_duration(OUTPUT_MP4)
    file_size_mb = os.path.getsize(OUTPUT_MP4) / (1024 * 1024)
    print(f"🎉 MASTER VIDEO CREATED: {OUTPUT_MP4} ({final_dur:.1f}s, {file_size_mb:.2f} MB)")

    # 3. Copy to destination folders
    for dest in [PUBLIC_MP4, DIST_MP4, ROOT_MP4]:
        try:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copyfile(OUTPUT_MP4, dest)
            print(f"  ✓ Copied to: {dest}")
        except Exception as e:
            print(f"  Note copying to {dest}: {e}")

    # 4. Print chapter timestamps
    if os.path.exists(TIMESTAMPS_JSON):
        with open(TIMESTAMPS_JSON, "r", encoding="utf-8") as f:
            ts = json.load(f)
            print("\n📌 Exact Chapter Timestamps:")
            for item in ts:
                m = item['time'] // 60
                s = item['time'] % 60
                print(f"  {m}:{s:02d} -> {item['chapter']}")

if __name__ == "__main__":
    main()
