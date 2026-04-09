import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

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

    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const faceMeshRef = useRef(null);
    const accessoryRef = useRef(null);
    const processedAccessoryRef = useRef(null);
    const lastResultsRef = useRef(null);

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
        <div className="flex flex-col items-center p-8 bg-white rounded-[3rem] shadow-2xl max-w-7xl mx-auto border border-gray-100 mb-20 font-sans">

            {/* Top Bar with Home Link */}
            <div className="w-full flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
                <Link to="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all group">
                    <span className="bg-slate-100 p-2 rounded-full group-hover:bg-indigo-50 transition-all">🏠</span>
                    Về Trang Chủ
                </Link>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">
                    AI <span className="text-indigo-600">STUDIO</span>
                </h2>
                <div className="w-24"></div> {/* Spacer */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full mb-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 shadow-inner">
                        <div className="flex flex-col">
                            <label className="mb-2 text-[9px] font-black uppercase text-slate-400 tracking-widest">1. Ảnh chân dung</label>
                            <input type="file" onChange={(e) => handleFileUpload(e, 'user')} className="text-xs border-2 border-dashed border-slate-200 p-3 rounded-2xl bg-white hover:border-indigo-400 transition-all cursor-pointer" />
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-2 text-[9px] font-black uppercase text-slate-400 tracking-widest">2. Ảnh phụ kiện</label>
                            <input type="file" onChange={(e) => handleFileUpload(e, 'accessory')} className="text-xs border-2 border-dashed border-slate-200 p-3 rounded-2xl bg-white hover:border-emerald-400 transition-all cursor-pointer" />
                        </div>
                    </div>

                    {accessoryRef.current && (
                        <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] space-y-8 shadow-2xl border-b-[8px] border-indigo-500">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Manual Control</span>
                                <button onClick={() => { setRemoveBgEnabled(!removeBgEnabled); processAccessory(accessoryRef.current); }} className={`px-4 py-1.5 rounded-full text-[8px] font-bold uppercase transition-all ${removeBgEnabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-white'}`}>Xóa nền AI</button>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase"><span>Lên / Xuống</span><span>{offsetY}px</span></div>
                                    <input type="range" min="-400" max="400" value={offsetY} onChange={(e) => setOffsetY(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase"><span>Trái / Phải</span><span>{offsetX}px</span></div>
                                    <input type="range" min="-200" max="200" value={offsetX} onChange={(e) => setOffsetX(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase"><span>Xoay Phụ Kiện</span><span>{rotation}°</span></div>
                                    <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase"><span>Kích cỡ (Scale)</span><span>{scale.toFixed(1)}x</span></div>
                                    <input type="range" min="0.5" max="10" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-8 flex flex-col items-center gap-6">
                    <div className="relative w-full border-8 border-white shadow-2xl rounded-[3.5rem] overflow-hidden min-h-[600px] flex items-center justify-center bg-slate-100 shadow-inner">
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 z-50 backdrop-blur-md">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <img ref={imageRef} src={selectedImage} alt="User" className="hidden" onLoad={processImage} />
                        {!selectedImage && <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-xs">Waiting for your photo</p>}
                        <canvas ref={canvasRef} className="max-w-full h-auto shadow-2xl" />
                    </div>

                    {/* Download Button */}
                    {selectedImage && (
                        <button
                            onClick={handleDownload}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                        >
                            <span className="text-lg">💾</span> Tải ảnh về máy ngay
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VirtualTryOn;
