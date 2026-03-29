import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/OrderHistory.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
if (!content.includes("import ShopReviewModal from '../components/ShopReviewModal';")) {
  content = content.replace("import ReviewModal from '../components/ReviewModal';", 
                             "import ReviewModal from '../components/ReviewModal';\nimport ShopReviewModal from '../components/ShopReviewModal';");
}

// 2. Add props to OrderModal
content = content.replace("function OrderModal({ order, onClose, handleCancelOrder, handleConfirmReceipt, onReviewItem }) {",
                          "function OrderModal({ order, onClose, handleCancelOrder, handleConfirmReceipt, onReviewItem, onReviewShop }) {");

// 3. Add Shop Review Button to footer
const footerInsert = `                    {/* Nút đánh giá shop: Chỉ khi hoàn thành */}
                    {order.status === 'completed' && order.items?.[0]?.product?.shop && (
                        <button
                            onClick={() => onReviewShop(order.items[0].product.shop)}
                            className="px-12 py-4 bg-amber-500 text-gray-900 font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-amber-600 transition-all text-[10px] shadow-xl shadow-amber-200"
                        >
                            ⭐ Đánh giá Shop
                        </button>
                    )}
                </div>`;

content = content.replace(/}([^}]*?)<\/div>([^}]*?)<\/div>([^}]*?)<\/div>([^}]*?);([^}]*?)}/m, footerInsert);
// Re-read footer to be sure I hit the right spot
const footerSearch = `                            </button>
                        )}
                </div>`;
const footerNew = `                            </button>
                        )}
                    
                    {/* Nút đánh giá shop: Chỉ khi hoàn thành */}
                    {order.status === 'completed' && order.items?.[0]?.product?.shop && (
                        <button
                            onClick={() => onReviewShop(order.items[0].product.shop)}
                            className="px-12 py-4 bg-amber-500 text-gray-900 font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-amber-600 transition-all text-[10px] shadow-xl shadow-amber-200"
                        >
                            ⭐ Đánh giá Shop
                        </button>
                    )}
                </div>`;

content = content.replace(footerSearch, footerNew);

// 4. Add state to main Component
if (!content.includes('const [reviewingShop, setReviewingShop] = useState(null);')) {
  content = content.replace('const [reviewingItem, setReviewingItem] = useState(null);',
                             'const [reviewingItem, setReviewingItem] = useState(null);\n    const [reviewingShop, setReviewingShop] = useState(null);');
}

// 5. Add pass down props to <OrderModal />
content = content.replace('onReviewItem={(item) => setReviewingItem(item)}',
                          'onReviewItem={(item) => setReviewingItem(item)}\n                onReviewShop={(shop) => setReviewingShop(shop)}');

// 6. Render the modal
const shopReviewRender = `{reviewingShop && (
                <ShopReviewModal 
                    shop={reviewingShop} 
                    onClose={() => setReviewingShop(null)} 
                    onSuccess={() => {
                        fetchOrders();
                        setReviewingShop(null);
                    }}
                />
            )}`;

if (!content.includes('ShopReviewModal')) {
    // try to find where ReviewModal is
    content = content.replace('/>\n            )}', '/>\n            )}\n\n            ' + shopReviewRender);
}

fs.writeFileSync(filePath, content);
console.log('OrderHistory.jsx reconstructed for Shop Review.');
