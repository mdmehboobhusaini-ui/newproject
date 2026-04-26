import os
import glob

emoji_map = [
    '🏠 ', '📊 ', 'ℹ️ ', '📧 ', '🔒 ', '📜 ', '📁 ', '📅 ', '🏆 ', '⏳ ', '🎯 ', '⚡ ', '🏗️ ', '📈 ', '🤝 ', '📝 ', '🔔 ', '❓ ', '🌐', '⏰', '📭', '⚠️', '🏢', '💼', '📌', '🗓️', '📅', '🕒', '🏠', '📊', '🔗', 'ℹ️', '📧', '🔒', '📜', '🏆',
]

def remove_emojis(ext):
    files = glob.glob(f'*.{ext}') + glob.glob(f'js/*.{ext}')
    for f in files:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        for emoji in emoji_map:
            content = content.replace(emoji, '')
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"Cleaned {f}")           

remove_emojis('html')
remove_emojis('js')
print("Done removing emojis.")
