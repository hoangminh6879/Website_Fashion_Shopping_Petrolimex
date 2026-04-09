import React from 'react';
import VirtualTryOn from '../components/VirtualTryOn';
import Navbar from '../components/Navbar';

const TryOnDemo = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4AF37] selection:text-black">
            <Navbar />
            
            <div className="relative pt-32 pb-12 overflow-hidden min-h-screen flex flex-col">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                     <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/10 blur-[120px] mix-blend-screen"></div>
                     <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/20 blur-[150px] mix-blend-screen"></div>
                     <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 animate-[spin_60s_linear_infinite]"></div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10 flex-1">
                    <div className="text-center mb-16 animate-fadeInUp">
                        <span className="text-[#D4AF37] font-black tracking-[0.4em] text-[10px] md:text-xs uppercase mb-4 block inline-block border border-[#D4AF37]/30 px-4 py-1.5 rounded-full bg-[#D4AF37]/5">Petrolimex Fashion Technology</span>
                        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6 drop-shadow-2xl">
                            AI Virtual <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-white">Studio</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-gray-400 text-sm md:text-base font-medium leading-relaxed">
                            Trải nghiệm công nghệ thử đồ ảo đỉnh cao. Đưa sản phẩm thời trang lên cơ thể bạn một cách chân thực nhờ trí tuệ nhân tạo MediaPipe. Thiết lập chuẩn mực mua sắm mới.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-gray-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <h3 className="font-black text-lg mb-8 text-white uppercase tracking-wider relative z-10 border-b border-white/10 pb-4">Hướng dẫn</h3>
                                <ul className="text-[13px] text-gray-300 space-y-6 relative z-10">
                                    <li className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] flex items-center justify-center font-black flex-shrink-0 shadow-inner">1</div>
                                        <p className="mt-1 leading-tight text-gray-400">Tải lên ảnh <strong className="text-white">chân dung</strong> rõ nét của bạn.</p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] flex items-center justify-center font-black flex-shrink-0 shadow-inner">2</div>
                                        <p className="mt-1 leading-tight text-gray-400">Tải lên ảnh <strong className="text-white">trang phục/phụ kiện</strong> cần mặc thử.</p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] flex items-center justify-center font-black flex-shrink-0 shadow-inner">3</div>
                                        <p className="mt-1 leading-tight text-gray-400">AI tự động đo đạc khuôn mặt và ướm trang phục.</p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] flex items-center justify-center font-black flex-shrink-0 shadow-inner">4</div>
                                        <p className="mt-1 leading-tight text-gray-400">Tinh chỉnh thông số thủ công cho bức ảnh hoàn hảo nhất.</p>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-[#D4AF37] to-[#8B7355] p-8 rounded-[2rem] shadow-2xl shadow-[#D4AF37]/20 flex flex-col items-center justify-center text-center relative overflow-hidden transform hover:scale-[1.02] transition-transform">
                                <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl transform rotate-12">✨</div>
                                <h3 className="font-black text-black text-lg uppercase tracking-tight mb-2 relative z-10">Độ chính xác cao</h3>
                                <p className="text-black/70 text-[9px] font-bold uppercase tracking-widest relative z-10">Powered by MediaPipe</p>
                            </div>
                        </div>

                        {/* Component Thử đồ */}
                        <div className="lg:col-span-3">
                            <VirtualTryOn />
                        </div>
                    </div>
                </div>
            </div>
            
            <footer className="border-t border-white/10 py-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] bg-black">
                <p>© 2026 Petrolimex Fashion. AI Studio.</p>
            </footer>
        </div>
    );
};

export default TryOnDemo;
