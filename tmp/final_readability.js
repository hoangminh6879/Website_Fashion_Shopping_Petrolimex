import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/SellerDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Ensure Review comment and reply text is readable (14px)
content = content.replace('text-gray-700 text-sm leading-tight', 'text-gray-700 text-[14px] leading-snug');
content = content.replace('text-[11px] font-medium leading-tight', 'text-[13px] font-medium leading-snug');

// Ensure User name is readable (13px)
content = content.replace('italic leading-none">{review.user?.name}', 'italic leading-none text-[13px]">{review.user?.name}');

// Shrink the total frame even more
content = content.replace('p-2.5', 'p-2');
content = content.replace('gap-2.5', 'gap-2');
content = content.replace('md:w-28', 'md:w-24');

// Make product image a bit bigger to fill the smaller box
content = content.replace('w-14 h-14', 'w-16 h-16');

fs.writeFileSync(filePath, content);
console.log('SellerDashboard.jsx font increased and frame shrinked.');
