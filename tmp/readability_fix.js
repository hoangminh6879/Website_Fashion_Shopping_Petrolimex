import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/SellerDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Larger Fonts (going from mini fonts to readable but compact)
content = content.replace('text-[11px] uppercase tracking-tighter italic leading-none', 'text-sm font-black uppercase tracking-tighter italic');
content = content.replace('text-[9px] font-bold text-amber-600', 'text-[11px] font-bold text-amber-600');
content = content.replace('text-[11px] leading-tight', 'text-sm leading-tight'); // Comment and reply content
content = content.replace('text-[8px] font-black uppercase tracking-[0.2em]', 'text-[10px] font-black uppercase tracking-widest');
content = content.replace('text-[7px] font-bold text-gray-500', 'text-[9px] font-bold text-gray-500');
content = content.replace('text-[8px] text-gray-900', 'text-[10px] text-gray-900'); // Product name

// 2. Smaller Frame (minimal padding and reduced width)
content = content.replace('md:w-32', 'md:w-28');
content = content.replace('className="p-3"', 'className="p-2.5"');
content = content.replace('gap-3', 'gap-2.5');

// 3. Keep image sizes stable (or slightly bigger to "fill" the smaller frame)
// Already w-14 and w-8, I'll keep them as is or slightly adjust.

fs.writeFileSync(filePath, content);
console.log('SellerDashboard.jsx font sizes increased and frame compacted further.');
