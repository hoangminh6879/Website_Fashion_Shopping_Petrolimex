import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/SellerDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Compact Card & Product Info
content = content.replace('bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl', 
                          'bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg');
content = content.replace('className="p-8"', 'className="p-5"');
content = content.replace('md:w-1/4 flex flex-col items-center text-center p-4 bg-gray-50 rounded-3xl', 
                          'md:w-1/5 flex flex-col items-center text-center p-3 bg-gray-50 rounded-2xl flex-shrink-0');
content = content.replace('w-24 h-24 rounded-2xl object-cover mb-3', 'w-16 h-16 rounded-xl object-cover mb-2');

// Compact User Info
content = content.replace('gap-3', 'gap-2');
content = content.replace('w-10 h-10 rounded-full', 'w-8 h-8 rounded-full');
content = content.replace('text-sm uppercase tracking-tighter italic', 'text-[11px] uppercase tracking-tighter italic leading-none');
content = content.replace('text-[10px]', 'text-[9px]');

// Compact Comment
content = content.replace('bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50 italic font-medium text-gray-700 text-sm', 
                          'bg-amber-50/20 p-3 rounded-xl border border-amber-100/50 italic font-medium text-gray-700 text-[11px] leading-tight');

// Compact Images
content = content.replace('w-16 h-16 rounded-xl object-cover border-2', 'w-12 h-12 rounded-lg object-cover border');

// Compact Reply
content = content.replace('bg-gray-900 text-white p-6 rounded-3xl relative animate-fadeIn', 
                          'bg-gray-900 text-white p-4 rounded-2xl relative animate-fadeIn');
content = content.replace('text-sm font-medium leading-relaxed italic opacity-90', 'text-[11px] font-medium leading-tight italic opacity-90');

fs.writeFileSync(filePath, content);
console.log('SellerDashboard.jsx compacted.');
