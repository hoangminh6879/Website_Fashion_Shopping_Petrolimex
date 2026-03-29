import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/ProductDetail.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the review images loop (re-adding the .map that got lost)
const brokenLoop = `{review.images?.length > 0 && (
                       <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
                            <div 
                              key={idx} 
                              onClick={() => {
                                setSelectedFullImage(\`http://localhost:5000\${img}\`);
                                setIsViewingFullImage(true);
                              }}
                              className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-gray-50 flex-shrink-0 cursor-zoom-in group relative"
                            >
                               <img src={\`http://localhost:5000\${img}\`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                            </div>
                       </div>
                     )}`;

const fixedLoop = `{review.images?.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none mb-6">
                         {review.images.map((img, idx) => (
                           <div 
                             key={idx} 
                             onClick={() => {
                               setSelectedFullImage(\`http://localhost:5000\${img}\`);
                               setIsViewingFullImage(true);
                             }}
                             className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-gray-50 flex-shrink-0 cursor-zoom-in group relative"
                           >
                              <img src={\`http://localhost:5000\${img}\`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                           </div>
                         ))}
                      </div>
                    )}`;

// Helper to escape regex special chars but keep whitespace flexible
const flexibleRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
};

const loopRegex = new RegExp(flexibleRegex(brokenLoop), 'g');
if (content.match(loopRegex)) {
    content = content.replace(loopRegex, fixedLoop);
}

// 2. Fix the state if missing
if (!content.includes('const [selectedFullImage')) {
    content = content.replace('const [reviewImages, setReviewImages] = useState([]);', 
        'const [reviewImages, setReviewImages] = useState([]);\n  const [selectedFullImage, setSelectedFullImage] = useState(null);\n  const [isViewingFullImage, setIsViewingFullImage] = useState(false);');
}

// 3. Fix the closing tags at the very end
// We expect: [Modal UI] </div> ); } 
// But we might have extra divs or missing ones.
// Let's just normalize the end.

const endPattern = flexibleRegex(`{/* Full Image Modal */}
      {isViewingFullImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn"
          style={{ transition: 'all 0.3s ease-out' }}
          onClick={() => setIsViewingFullImage(false)}
        >
          <div className="relative max-w-5xl h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 text-white hover:text-amber-500 transition-all z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-90"
              onClick={() => setIsViewingFullImage(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <img 
              src={selectedFullImage} 
              className="max-h-[90vh] max-w-full object-contain shadow-2xl rounded-2xl animate-zoomIn border-4 border-white/5" 
              alt="Full view" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
</div>
  );
}`);

const fixedEnd = `{/* Full Image Modal */}
      {isViewingFullImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn"
          style={{ transition: 'all 0.3s ease-out' }}
          onClick={() => setIsViewingFullImage(false)}
        >
          <div className="relative max-w-5xl h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 text-white hover:text-amber-500 transition-all z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-90"
              onClick={() => setIsViewingFullImage(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <img 
              src={selectedFullImage} 
              className="max-h-[90vh] max-w-full object-contain shadow-2xl rounded-2xl animate-zoomIn border-4 border-white/5" 
              alt="Full view" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}`;

const endRegex = new RegExp(endPattern, 'g');
if (content.match(endRegex)) {
    content = content.replace(endRegex, fixedEnd);
}

fs.writeFileSync(filePath, content);
console.log('ProductDetail.jsx comprehensively fixed.');
