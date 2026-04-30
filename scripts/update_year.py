import glob

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('2024-2026', '2018-<span id="current-year"></span>')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print('Updated HTML footers.')
