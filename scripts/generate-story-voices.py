"""Build-time neural voice assets. No speech service or API key is used by players.
Requires edge-tts in a Python virtual environment. Existing files are reusable.
"""
import asyncio
import json
import pathlib
import re
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/story/audio'
VOICES = {'chief': 'en-US-GuyNeural', 'commander': 'en-GB-SoniaNeural'}

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    script = (ROOT / 'src/game/story/dialogue.ts').read_text()
    dialogue = json.loads(script.split('export const STORY_DIALOGUE = ', 1)[1].split(' as const satisfies', 1)[0].strip())
    lines = [(line['id'], line['text'], line['speaker']['character']) for group in dialogue.values() for line in group]
    source = (ROOT / 'src/game/story/voiceClips.ts').read_text().split('export const ENGINEER_LINES = {', 1)[1].split('} as const', 1)[0]
    lines += [('engineer-' + key, text, 'commander') for key, text in re.findall(r"\s+(\w+): '([^']*)',", source)]
    semaphore = asyncio.Semaphore(3)
    async def build(item):
        key, text, character = item
        path = OUT / (key + '.mp3')
        if path.exists() and path.stat().st_size > 1000:
            return
        async with semaphore:
            await edge_tts.Communicate(text, VOICES[character], rate='-3%', pitch='+0Hz').save(str(path))
            print('Recorded', key, flush=True)
    await asyncio.gather(*(build(item) for item in lines))
    (OUT / 'credits.json').write_text(json.dumps({'voices': VOICES, 'format': 'MP3', 'purpose': 'Synthetic character narration', 'lines': [{'id': key, 'character': actor, 'text': text} for key, text, actor in lines]}, indent=2))

asyncio.run(main())
