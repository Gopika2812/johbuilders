import sys
import re

try:
    with open('client/src/pages/ExportReports.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    in_download = False
    filename_expr = ''
    
    for line in lines:
        if 'const blob = new Blob' in line:
            in_download = True
            continue
            
        if in_download:
            if 'a.download =' in line:
                filename_expr = line.split('=', 1)[1].strip().strip(';')
            if 'URL.revokeObjectURL(url);' in line:
                in_download = False
                new_lines.append(f'      setPreviewData({{ html, filename: {filename_expr} }});')
            continue
            
        new_lines.append(line)

    final_content = '\n'.join(new_lines)
    
    if 'const [previewData, setPreviewData] = useState(null);' not in final_content:
        final_content = final_content.replace(
            'const [loading, setLoading] = useState(false);',
            'const [loading, setLoading] = useState(false);\n  const [previewData, setPreviewData] = useState(null);'
        )

    # Check imports
    if 'Download' not in final_content:
        final_content = final_content.replace('import { \n', 'import { \n  Download,\n  X,\n')
    elif 'X,' not in final_content:
         final_content = final_content.replace('Download,', 'Download,\n  X,')

    trigger_fn = '''
  const triggerDownload = (htmlStr, filename) => {
    const blob = new Blob([htmlStr], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPreviewData(null);
  };
'''
    if 'const triggerDownload =' not in final_content:
        final_content = final_content.replace('const getSourcesData =', trigger_fn + '\n  const getSourcesData =')

    modal_jsx = '''
      {/* 🟢 Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-[#0e623a] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg tracking-wider">REPORT PREVIEW</h3>
                <p className="text-emerald-100 text-[10px] font-bold">Review report data before downloading.</p>
              </div>
              <button onClick={() => setPreviewData(null)} className="text-white hover:text-red-200 transition bg-black/10 rounded-full p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-50 p-6 overflow-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full h-full overflow-hidden">
                <iframe srcDoc={previewData.html} className="w-full h-full" title="Report Preview" />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
              <button onClick={() => setPreviewData(null)} className="px-6 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => triggerDownload(previewData.html, previewData.filename)} className="px-6 py-2.5 bg-[#0e623a] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#0b4d2d] transition shadow-md">
                <Download className="w-4 h-4" /> 
                Download Excel File
              </button>
            </div>
          </div>
        </div>
      )}
'''
    if '{previewData &&' not in final_content:
        final_content = final_content.replace('</div>\n  );\n};\n\nexport default ExportReports;', modal_jsx + '\n    </div>\n  );\n};\n\nexport default ExportReports;')

    card_content = '''
          <div className="absolute top-4 right-4 p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-[#0e623a] group-hover:text-white transition shadow-sm border border-gray-100">
            <Download className="w-4 h-4" />
          </div>
'''
    final_content = re.sub(
        r'(className="bg-[a-z]+-50 border border-[a-z]+-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200)"',
        r'\1 relative group"',
        final_content
    )
    
    final_content = re.sub(
        r'(<div className="p-4 bg-[a-z]+-100 text-[a-z]+-600 rounded-2xl">)',
        card_content + r'\n          \1',
        final_content
    )

    with open('client/src/pages/ExportReports.jsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print('Successfully updated ExportReports.jsx')
    
except Exception as e:
    print('Error:', str(e))
