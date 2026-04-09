import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const getFaceMesh = () => {
    return window.FaceMesh || (window.facemesh && window.facemesh.FaceMesh);
};

const VirtualTryOn = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    // BỘ ĐIỀU KHIỂN CHI TIẾT
    const [offsetY, setOffsetY] = useState(-50);
    const [offsetX, setOffsetX] = useState(0);
    const [scale, setScale] = useState(3.0);
    const [rotation, setRotation] = useState(0);
    const [removeBgEnabled, setRemoveBgEnabled] = useState(false);
    const [hasAccessory, setHasAccessory] = useState(false);

    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const faceMeshRef = useRef(null);
    const accessoryRef = useRef(null);
    const processedAccessoryRef = useRef(null);
    const lastResultsRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        const initProductImage = async () => {
            if (location.state?.productImageUrl) {
                try {
                    const url = location.state.productImageUrl.startsWith('http') 
                        ? location.state.productImageUrl 
                        : `http://localhost:5000${location.state.productImageUrl}`;
                    
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        accessoryRef.current = e.target.result;
                        setRemoveBgEnabled(true); // Default enable BG removal for product images from store
                        if (!removeBgEnabled) { 
                             // Wait, processAccessory uses removeBgEnabled state, which might not update immediately.
                             // Let's call processAccessory, but first set the state. In React, state updates are async, 
                             // so processAccessory might read the old state.
                        }
                    };
                    // Instead of relying on processAccessory with stale state, we process directly or let it rely on the current state.
                    // For now, let's keep it simple.
                    reader.onload = (e) => {
                        accessoryRef.current = e.target.result;
                        // Forcing base64 loading
                        setRemoveBgEnabled(false); 
                        processAccessory(e.target.result);
                        setHasAccessory(true);
                    };
                    reader.readAsDataURL(blob);
                } catch (err) {
                    console.error("Lỗi khi process ảnh từ detail:", err);
                }
            }
        };
        
        initProductImage();
    }, [location.state]);

    useEffect(() => {
        const FaceMeshClass = getFaceMesh();
        if (!FaceMeshClass) return;

        const faceMesh = new FaceMeshClass({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
            lastResultsRef.current = results;
            renderCanvas(results);
        });
        faceMeshRef.current = faceMesh;
    }, []);

    useEffect(() => {
        if (lastResultsRef.current) renderCanvas(lastResultsRef.current);
    }, [offsetY, offsetX, scale, rotation, removeBgEnabled]);

    const removeBackground = (imgData) => {
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const isWhiteOrGray = (r > 195 && g > 195 && b > 195);
            if (isWhiteOrGray) data[i + 3] = 0;
        }
        return imgData;
    };

    const processAccessory = (base64) => {
        if (!removeBgEnabled) {
            processedAccessoryRef.current = base64;
            if (selectedImage) processImage();
            return;
        }
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width; tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);
            const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.putImageData(removeBackground(imgData), 0, 0);
            processedAccessoryRef.current = tempCanvas.toDataURL();
            if (selectedImage) processImage();
        };
    };

    const renderCanvas = (results) => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setLoading(false); return;
        }

        const accessorySrc = processedAccessoryRef.current;
        if (accessorySrc) {
            const landmarks = results.multiFaceLandmarks[0];
            const accImg = new Image();
            accImg.src = accessorySrc;
            accImg.onload = () => {
                const midPoint = landmarks[168];
                const leftEye = landmarks[33];
                const rightEye = landmarks[263];

                const x = midPoint.x * canvas.width;
                const y = midPoint.y * canvas.height;
                const eyeDist = Math.sqrt(
                    Math.pow((rightEye.x - leftEye.x) * canvas.width, 2) +
                    Math.pow((rightEye.y - leftEye.y) * canvas.height, 2)
                );
                const aiAngle = Math.atan2(
                    (rightEye.y - leftEye.y) * canvas.height,
                    (rightEye.x - leftEye.x) * canvas.width
                );
                const manualRotation = (rotation * Math.PI) / 180;
                const width = eyeDist * scale;
                const height = width * (accImg.height / accImg.width);
                const appliedX = x + (offsetX * (eyeDist / 50));
                const appliedY = y + (offsetY * (eyeDist / 50));

                ctx.save();
                ctx.translate(appliedX, appliedY);
                ctx.rotate(aiAngle + manualRotation);
                ctx.drawImage(accImg, -width / 2, -height / 2, width, height);
                ctx.restore();
                setLoading(false);
            };
        } else setLoading(false);
    };

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (type === 'user') setSelectedImage(event.target.result);
                else {
                    accessoryRef.current = event.target.result;
                    processAccessory(event.target.result);
                    setHasAccessory(true);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = () => {
        if (faceMeshRef.current && imageRef.current && imageRef.current.complete) {
            setLoading(true);
            faceMeshRef.current.send({ image: imageRef.current }).catch(() => setLoading(false));
        }
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'fashion-try-on.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="flex flex-col w-full font-sans relative">
            <div className="w-full flex justify-between items-center mb-10 border-b border-white/10 pb-6 relative z-10">
                <Link to="/" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#D4AF37] transition-all group">
                    <span className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/50 transition-all">🏠</span>
                    Về Trang Chủ
                </Link>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">System Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full relative z-10">
                
                {/* LEFT CONTROL PANEL */}
                <div className="lg:col-span-4 space-y-6 flex flex-col">
                    {/* Upload Boxes */}
                    <div className="bg-gray-900/40 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/5 flex flex-col gap-5 shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                        <div className="flex flex-col relative z-10">
                            <label className="mb-2 text-[10px] font-black uppercase text-[#D4AF37] tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> Ảnh của bạn
                            </label>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700/50 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-[#D4AF37]/50 transition-all bg-black/20 group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">👤</span>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tải ảnh chân dung</p>
                                </div>
                                <input type="file" onChange={(e) => handleFileUpload(e, 'user')} className="hidden" />
                            </label>
                        </div>
                        
                        <div className="flex flex-col relative z-10">
                            <label className="mb-2 text-[10px] font-black uppercase text-[#D4AF37] tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> Sản phẩm
                            </label>
                            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed ${hasAccessory ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-gray-700/50 bg-black/20'} rounded-2xl cursor-pointer hover:bg-white/5 hover:border-[#D4AF37]/50 transition-all group`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">👕</span>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${hasAccessory ? 'text-[#D4AF37] animate-pulse' : 'text-gray-400'}`}>{hasAccessory ? 'Ảnh Đã Được Nạp' : 'Tải ảnh trang phục'}</p>
                                </div>
                                <input type="file" onChange={(e) => handleFileUpload(e, 'accessory')} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Manual Controls */}
                    {hasAccessory && (
                        <div className="p-6 bg-gray-900/40 backdrop-blur-3xl rounded-[2rem] space-y-6 shadow-2xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl rounded-full"></div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                    <span className="text-[#D4AF37]">⚙️</span> Tinh chỉnh
                                </span>
                                <button onClick={() => { setRemoveBgEnabled(!removeBgEnabled); processAccessory(accessoryRef.current); }} 
                                    className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${removeBgEnabled ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-transparent border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}>
                                    Tách nền AI
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-5 relative z-10">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest"><span>Lên / Xuống</span><span className="text-[#D4AF37]">{offsetY}</span></div>
                                    <input type="range" min="-400" max="400" value={offsetY} onChange={(e) => setOffsetY(parseInt(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest"><span>Trái / Phải</span><span className="text-[#D4AF37]">{offsetX}</span></div>
                                    <input type="range" min="-200" max="200" value={offsetX} onChange={(e) => setOffsetX(parseInt(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest"><span>Xoay Góc</span><span className="text-[#D4AF37]">{rotation}°</span></div>
                                    <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest"><span>Kích Cỡ</span><span className="text-[#D4AF37]">{scale.toFixed(1)}x</span></div>
                                    <input type="range" min="0.5" max="10" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT CANVAS PANEL */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="relative w-full aspect-[3/4] md:aspect-auto md:h-full min-h-[500px] border border-white/10 shadow-2xl rounded-[3rem] overflow-hidden flex items-center justify-center bg-zinc-950">
                        {/* Frame decoration */}
                        <div className="absolute inset-4 border border-white/5 rounded-[2.5rem] pointer-events-none z-20"></div>
                        
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
                                <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.5)]"></div>
                                <p className="mt-4 text-[#D4AF37] font-black uppercase tracking-widest text-[10px] animate-pulse">Đang xử lý hình ảnh...</p>
                            </div>
                        )}
                        <img ref={imageRef} src={selectedImage} alt="User" className="hidden" onLoad={processImage} />
                        {!selectedImage && (
                            <div className="flex flex-col items-center justify-center text-center p-8">
                                <div className="w-24 h-24 rounded-full border border-[#D4AF37]/30 flex items-center justify-center mb-6 bg-[#D4AF37]/5">
                                    <span className="text-4xl filter grayscale opacity-50">📷</span>
                                </div>
                                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Phòng Thử Đồ Đã Sẵn Sàng</p>
                                <p className="text-gray-700 text-[11px] mt-2 font-medium">Vui lòng tải ảnh của bạn lên để bắt đầu trải nghiệm</p>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="max-w-[95%] max-h-[95%] object-contain relative z-10 drop-shadow-2xl rounded-2xl" />
                    </div>

                    {/* Download Button */}
                    <div className="flex justify-end">
                        {selectedImage && (
                            <button
                                onClick={handleDownload}
                                className="bg-white text-black hover:bg-[#D4AF37] px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] w-full md:w-auto justify-center group"
                            >
                                <span className="text-base group-hover:scale-110 transition-transform">📥</span> Lưu ảnh thành quả
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualTryOn;
