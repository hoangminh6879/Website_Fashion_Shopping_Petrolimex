import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/ProductDetail.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `{review.images?.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
                         {review.images.map((img, idx) => (
                           <div key={idx} className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-gray-50 flex-shrink-0 cursor-zoom-in group">
                              <img src={\`http://localhost:5000\${img}\`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                           </div>
                         ))}
                      </div>
                    )}`;

const replacement = `{review.images?.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
                         {review.images.map((img, idx) => (
                           <div key={idx} className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-gray-50 flex-shrink-0 cursor-zoom-in group">
                              <img src={\`http://localhost:5000\${img}\`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                           </div>
                         ))}
                      </div>
                    )}

                    {review.reply && (
                      <div className="mt-4 bg-gray-900 text-white p-6 rounded-3xl relative animate-fadeIn shadow-xl">
                        <div className="absolute -top-3 left-8 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-gray-900"></div>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Phản hồi của Shop</span>
                           <span className="text-[9px] font-bold text-gray-500 uppercase">{new Date(review.repliedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed italic opacity-95">"{review.reply}"</p>
                      </div>
                    )}`;

// Use a more fuzzy search if needed by replacing multiple spaces with a regex for any whitespace
const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
const regex = new RegExp(escapedTarget, 'g');

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Success: ProductDetail.jsx updated.');
} else {
    console.error('Error: Target not found in ProductDetail.jsx.');
}
