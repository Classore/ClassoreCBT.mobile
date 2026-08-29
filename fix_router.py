
import os
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'router.back()' in content:
        # replace any router.back() that is not already part of router.canGoBack()
        # we can just use a simple regex
        import re
        new_content = re.sub(r'(?<!\? )router\.back\(\)', r'(router.canGoBack() ? router.back() : router.replace(\'/\'))', content)
        
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {filepath}')

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            process_file(os.path.join(root, file))

