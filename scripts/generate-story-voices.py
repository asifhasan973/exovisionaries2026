"""Build-time neural voice assets. No speech service or API key is used by players.
Requires edge-tts in a Python virtual environment. Existing files are reusable.
"""
import asyncio
import json
import pathlib
import subprocess
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/story/audio'
VOICES = {'chief': 'en-US-GuyNeural', 'commander': 'en-GB-SoniaNeural', 'commander-male': 'en-US-AndrewNeural'}

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalogue = json.loads(subprocess.check_output([
        'node', '--experimental-strip-types', '--input-type=module', '-e',
        "import {VOICE_CLIPS} from './src/game/story/voiceClips.ts'; console.log(JSON.stringify(VOICE_CLIPS));"
    ], cwd=ROOT, text=True))
    lines = [(key, clip['text'], clip['character']) for key, clip in catalogue.items()]
    lines += [('male-' + key, clip['text'], 'commander-male') for key, clip in catalogue.items() if clip['character'] == 'commander']
    semaphore = asyncio.Semaphore(1)
    async def build(item):
        key, text, character = item
        path = OUT / (key + '.mp3')
        if path.exists() and path.stat().st_size > 1000:
            return
        async with semaphore:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, VOICES[character], rate='-3%', pitch='+0Hz').save(str(path))
                    break
                except edge_tts.exceptions.NoAudioReceived:
                    path.unlink(missing_ok=True)  # Do not cache a partial failed clip.
                    if attempt == 3:
                        raise
                    await asyncio.sleep(2 * (attempt + 1))
            print('Recorded', key, flush=True)
    await asyncio.gather(*(build(item) for item in lines))
    (OUT / 'credits.json').write_text(json.dumps({'voices': VOICES, 'format': 'MP3', 'purpose': 'Synthetic character narration', 'lines': [{'id': key, 'character': actor, 'text': text} for key, text, actor in lines]}, indent=2))

asyncio.run(main())
