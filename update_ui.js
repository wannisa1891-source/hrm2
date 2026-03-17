const fs = require('fs');

try {
  let fileContent = fs.readFileSync('src/app/employees/page.tsx', 'utf-8');

  // Insert constants before 'return ('
  if (!fileContent.includes('const inputStyle =')) {
    fileContent = fileContent.replace(
      '  return (\\r\\n    <AppLayout>',
      \`  const inputStyle = { width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '14px' };\\n  const addrInputStyle = { width: '100%', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '13px' };\\n\\n  return (\\n    <AppLayout>\`
    );
    // fallback if no carriage return
    fileContent = fileContent.replace(
      '  return (\\n    <AppLayout>',
      \`  const inputStyle = { width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '14px' };\\n  const addrInputStyle = { width: '100%', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '13px' };\\n\\n  return (\\n    <AppLayout>\`
    );
  }

  const lines = fileContent.split(/\\r?\\n/);
  const startIdx = lines.findIndex(l => l.includes('{/* Full Edit/Add Modal */}'));
  // Find the exact line index instead of string matching
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('</AppLayout>'));

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const top = lines.slice(0, startIdx).join('\\n');
    const bottom = lines.slice(endIdx).join('\\n');
    
    // Read the chunk from the file
    const newUI = fs.readFileSync('ui_chunk.txt', 'utf-8');
    
    fs.writeFileSync('src/app/employees/page.tsx', top + '\\n' + newUI + '\\n' + bottom);
    console.log('UI updated successfully!');
  } else {
    console.error('Could not find boundaries.', startIdx, endIdx);
  }

} catch (err) {
  console.error('Error:', err);
}
