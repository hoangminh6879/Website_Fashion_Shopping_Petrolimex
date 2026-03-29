import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/SellerDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Shrink Product Info Box width and padding
content = content.replace('md:w-1/5 flex flex-col items-center text-center p-3 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0', 
                          'md:w-40 flex flex-col items-center text-center p-2 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0');

// 2. Shrink Product image size a bit more or keep it at 16 but remove margin
content = content.replace('w-16 h-16 rounded-xl object-cover mb-2 shadow-sm border-2 border-white', 
                          'w-14 h-14 rounded-lg object-cover mb-1 shadow-sm border border-white');

// 3. Compact text inside product box
content = content.replace('font-black text-[9px] text-gray-900 uppercase tracking-tighter line-clamp-1 leading-tight mb-1', 
                          'font-black text-[8px] text-gray-900 uppercase tracking-tighter line-clamp-2 leading-[1.1] mb-1');

fs.writeFileSync(filePath, content);
console.log('SellerDashboard.jsx product box compacted further.');
