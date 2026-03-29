import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/client/src/pages/SellerDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add metrics state
content = content.replace('const [shopReviews, setShopReviews] = useState([]);', 
                          'const [shopReviews, setShopReviews] = useState([]);\n  const [metrics, setMetrics] = useState(null);');

// 2. Add fetchMetrics function
const metricsFunc = `  const fetchMetrics = async () => {
    try {
      const res = await api.get('/shops/my-metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    }
  };`;

content = content.replace('const fetchData = async () => {', metricsFunc + '\n  const fetchData = async () => {');
content = content.replace('fetchData();', 'fetchData();\n    fetchMetrics();');

// 3. Update Shop Reviews Tab to show extended metrics
const shopTabStart = `          {activeTab === 'shopReviews' && (`;
const shopTabNew = `          {activeTab === 'shopReviews' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="text-[10px] font-black text-amber-600 uppercase mb-1 tracking-widest">Điểm Uy Tín</div>
                   <div className="text-3xl font-black text-gray-900 leading-none italic">{(metrics?.score || 0).toFixed(1)} <span className="text-amber-500 text-xl font-bold">★</span></div>
                   <div className="text-[8px] text-gray-400 mt-2 font-black uppercase">Bayesian Weighted</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Tỉ Lệ Thành Công</div>
                   <div className="text-3xl font-black text-gray-900 leading-none italic">{(metrics?.successRate || 0).toFixed(0)}%</div>
                   <div className="text-[8px] text-gray-400 mt-2 font-black uppercase">{metrics?.completedOrders} / {metrics?.totalOrders} đơn</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="text-[10px] font-black text-red-600 uppercase mb-1 tracking-widest">Tỉ Lệ Hủy Đơn</div>
                   <div className="text-3xl font-black text-gray-900 leading-none italic">{(metrics?.cancelRate || 0).toFixed(0)}%</div>
                   <div className="text-[8px] text-gray-400 mt-2 font-black uppercase">{metrics?.cancelledOrders} đơn đã hủy</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Phản Hồi Chat</div>
                   <div className="text-3xl font-black text-gray-900 leading-none italic">100%</div>
                   <div className="text-[8px] text-gray-400 mt-2 font-black uppercase">Phản hồi siêu tốc</div>
                </div>
              </div>`;

content = content.replace(shopTabStart, shopTabNew);

fs.writeFileSync(filePath, content);
console.log('SellerDashboard.jsx reputation system complete.');
