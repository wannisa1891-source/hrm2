import sys

# Read the entire file
with open('src/app/employees/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Step 1: Insert styles before return (
for i, line in enumerate(lines):
    if '  return (' in line and 'AppLayout' not in line:
        if 'const inputStyle' not in lines[i-1] and 'const inputStyle' not in lines[i-2]:
            lines.insert(i, "  const inputStyle = { width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '14px' };\n")
            lines.insert(i+1, "  const addrInputStyle = { width: '100%', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '13px' };\n\n")
            break

# Read new UI chunk
with open('ui_chunk.txt', 'r', encoding='utf-8') as f:
    new_ui = f.read()

# Step 2: Replace the form string
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '{/* Full Edit/Add Modal */}' in line:
        start_idx = i
    if '</AppLayout>' in line and start_idx != -1:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    del lines[start_idx:end_idx]
    lines.insert(start_idx, new_ui + '\n')
    
    with open('src/app/employees/page.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully updated page.tsx")
else:
    print(f"Could not find boundaries! start={start_idx}, end={end_idx}")
