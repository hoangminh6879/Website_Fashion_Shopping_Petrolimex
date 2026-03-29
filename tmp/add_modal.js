import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/ProductDetail.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
if (!content.includes('const [selectedFullImage')) {
    content = content.replace('const [reviewImages, setReviewImages] = useState([]);', 
        'const [reviewImages, setReviewImages] = useState([]);\n  const [selectedFullImage, setSelectedFullImage] = useState(null);\n  const [isViewingFullImage, setIsViewingFullImage] = useState(false);');
}

// 2. Add full image modal UI before the last closing tags
const modalUI = `
      {/* Full Image Modal */}
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
`;

if (!content.includes('isViewingFullImage &&')) {
    // Find the last </div> before the final returns
    const parts = content.split('</div>');
    if (parts.length > 1) {
        const lastDivIndex = parts.length - 2; // Second to last part
        parts[lastDivIndex] = parts[lastDivIndex] + modalUI;
        content = parts.join('</div>');
    }
}

// 3. Ensure the onClick handler in the loop is correct
// My previous edit might have already added a partial onClick, let's normalize it
content = content.replace(/setSelectedImage\(/g, 'setSelectedFullImage(');

fs.writeFileSync(filePath, content);
console.log('ProductDetail.jsx updated with modal and states.');
