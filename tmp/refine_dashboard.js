import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/SellerDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Reduce general padding inside the card
content = content.replace('className="p-5"', 'className="p-3"');

// 2. Reduce gap between product box and content
content = content.replace('flex flex-col md:flex-row gap-5', 'flex flex-col md:flex-row gap-3');

// 3. Make product box width even more precise
content = content.replace('md:w-40', 'md:w-32');

// 4. Compact the user info header
content = content.replace('space-y-4', 'space-y-2');
content = content.replace('mb-4', 'mb-2');

fs.writeFileSync(filePath, content);
console.log('SellerDashboard.jsx review panel further refined.');
