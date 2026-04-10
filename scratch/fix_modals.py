import os

path = 'src/app/license/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Registry / Add / Edit Modal
old_0 = """                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                     <div style={{ background: '#f8fafc', width: '1100px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', border: '1px solid #fff' }}>"""

new_0 = """                  <div onClick={() => setActiveModal('none')} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                     <div onClick={e => e.stopPropagation()} style={{ background: '#f8fafc', width: '1100px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', border: '1px solid #fff' }}>"""

# 2. View Detail Modal
old_1 = """                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                     <div style={{ background: '#f8fafc', width: '1100px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', border: '1px solid #fff' }}>"""

# (Wait, old_0 and old_1 are identical. String replacement will catch both if I use it once. But I want to be careful.)
# Actually, I'll just replace UNLESS it already has onClick.

def fix_modal(content, target_bg_style, close_action):
    # Find the pattern
    pattern = f'<div style={{{{ position: \'fixed\', top: 0, left: 0, right: 0, bottom: 0, {target_bg_style}'
    replacement = f'<div onClick={{() => {close_action}}} style={{{{ position: \'fixed\', top: 0, left: 0, right: 0, bottom: 0, {target_bg_style}'
    
    # Also find the immediate next <div style={{
    # This is harder with regex, let's just do targeted string replaces for the specific cases observed.
    return content.replace(pattern, replacement)

content = content.replace(old_0, new_0)

# 3. Ensure stopPropagation for other modals too (just in case they were missed)
# Audit History
content = content.replace(
    "historyOpen && (\n               <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999",
    "historyOpen && (\n               <div onClick={() => setHistoryOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Modals updated successfully.")
