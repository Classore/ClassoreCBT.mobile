import os
import re

files_to_update = [
    r'src/app/(tabs)/practice/index.tsx',
    r'src/app/(tabs)/practice/practice-setup.tsx',
    r'src/app/(tabs)/practice/standard-setup.tsx',
    r'src/app/(exam)/instructions.tsx',
    r'src/app/(exam)/test-result.tsx',
    r'src/app/topic-performance.tsx',
    r'src/app/wallet.tsx'
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Inject useAuth if not present
    if 'useAuth' not in content:
        # Simple injection near the top
        content = content.replace("import React", "import { useAuth } from '@/context/AuthContext';\nimport React")
        # Also need to add const { user } = useAuth(); inside the component.
        # Find the main export default function
        content = re.sub(r'(export default function [^\(]+\(\) \{)', r'\1\n  const { user } = useAuth();', content)
        
    # Also if useAuth is imported but user is not destructured
    elif 'const { user' not in content and 'const {user' not in content:
        content = re.sub(r'(export default function [^\(]+\(\) \{)', r'\1\n  const { user } = useAuth();', content)

    # Replace <AppText style={styles.fireText}>120</AppText>
    # or <Text style={styles.fireText}>120</Text>
    content = re.sub(r'>120</Text>', '>{user?.streak || 0}</Text>', content)
    content = re.sub(r'>120</AppText>', '>{user?.streak || 0}</AppText>', content)

    if file_path.endswith('wallet.tsx'):
        content = content.replace('CT-983726', '{CT-}')
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Replaced streaks and wallet IDs.")
