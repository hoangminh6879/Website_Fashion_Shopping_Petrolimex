import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'client/src/pages/AdminDashboard.jsx',
  'client/src/pages/SellerDashboard.jsx',
  'client/src/pages/Profile.jsx'
];

const basePath = "c:/Users/Admin/Desktop/Helo/Website_Fashion_Shopping_Petrolimex";

const classMap = {
  'bg-white': 'bg-slate-900',
  'bg-gray-50': 'bg-slate-950',
  'bg-amber-500': 'bg-amber-500', // Keep amber
  'text-gray-900': 'text-slate-100',
  'text-gray-800': 'text-slate-200',
  'text-gray-600': 'text-slate-300',
  'text-gray-500': 'text-slate-400',
  'text-gray-400': 'text-slate-500',
  'border-gray-100': 'border-slate-800',
  'border-gray-200': 'border-slate-700',
  'divide-gray-100': 'divide-slate-800',
  'divide-gray-50': 'divide-slate-800',
  'bg-gray-100': 'bg-slate-800',
  'hover:bg-gray-100': 'hover:bg-slate-800',
  'hover:bg-gray-50': 'hover:bg-slate-800/50',
  'bg-gray-200': 'bg-slate-700',
  'shadow-gray-200/50': 'shadow-slate-900/50',
  'bg-amber-50/50': 'bg-amber-900/20'
};

filesToUpdate.forEach(relativePath => {
  const absolutePath = path.join(basePath, relativePath);
  if (fs.existsSync(absolutePath)) {
    let content = fs.readFileSync(absolutePath, 'utf8');
    
    // Replace exact matches of classes
    for (const [oldClass, newClass] of Object.entries(classMap)) {
      // Need a flexible regex to replace class names inside strings/jsx
      // \b is tricky with hyphens, so we use (?<=[\s"'\`]) and (?=[\s"'\`])
      const regex = new RegExp(`(?<=[\\s"'\\\`])${oldClass}(?=[\\s"'\\\`])`, 'g');
      content = content.replace(regex, newClass);
    }

    fs.writeFileSync(absolutePath, content, 'utf8');
    console.log(`✅ Updated classes in ${relativePath}`);
  } else {
    console.log(`❌ File not found: ${absolutePath}`);
  }
});
