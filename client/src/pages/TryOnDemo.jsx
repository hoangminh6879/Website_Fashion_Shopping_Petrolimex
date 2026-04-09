import React from 'react';
import VirtualTryOn from '../components/VirtualTryOn';

const TryOnDemo = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-4">
                        Trải Nghiệm <span className="text-blue-600">Thử Đồ Ảo</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-500">
                        Sử dụng công nghệ AI để ướm thử các sản phẩm thời trang lên chính hình ảnh của bạn một cách nhanh chóng và chính xác.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Danh sách sản phẩm mẫu */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg mb-4">Cách thức hoạt động</h3>
                            <div className="flex items-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <div className="text-2xl mr-4">✨</div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">Tự động hóa hoàn toàn</p>
                                    <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider">Powered by MediaPipe AI</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg mb-2">Hướng dẫn</h3>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li>• Bước 1: Chọn ảnh chân dung rõ mặt.</li>
                                <li>• Bước 2: Đợi AI nhận diện các đường nét.</li>
                                <li>• Bước 3: Sản phẩm sẽ tự động khớp vào vị trí.</li>
                                <li>• Bước 4: Bạn có thể lưu lại ảnh để tham khảo.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Component Thử đồ */}
                    <div className="lg:col-span-2">
                        <VirtualTryOn />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TryOnDemo;
