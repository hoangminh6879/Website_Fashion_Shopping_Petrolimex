import React, { useState } from 'react';
import AutoText from './AutoText';
import { useTranslation } from 'react-i18next';

export default function FilterSidebar({ categories, selectedCategory, setSelectedCategory, filterPrice, setFilterPrice, selectedRating, setSelectedRating, filterPromotion, setFilterPromotion }) {
  const { t } = useTranslation();
  
  const [minPrice, setMinPrice] = useState(filterPrice?.min || '');
  const [maxPrice, setMaxPrice] = useState(filterPrice?.max || '');

  const applyPrice = () => {
    setFilterPrice({ min: minPrice ? Number(minPrice) : null, max: maxPrice ? Number(maxPrice) : null });
  };

  const renderTitle = (title) => (
    <h3 className="font-medium text-[13px] text-gray-800 mb-3"><AutoText text={title} /></h3>
  );

  return (
    <div className="w-60 shrink-0 hidden md:block select-none">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="font-bold text-sm uppercase tracking-wide"><AutoText text="BỘ LỌC TÌM KIẾM" /></span>
      </div>

      <div className="border-b border-gray-200 pb-5 mb-5">
        {renderTitle("Nơi Bán")}
        <div className="space-y-2.5 text-[13px] text-gray-700">
          {['Hà Nội', 'TP. Hồ Chí Minh', 'Thái Nguyên', 'Vĩnh Phúc'].map(item => (
            <label key={item} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-3.5 h-3.5 border-gray-300 rounded-sm text-[#ee4d2d] focus:ring-[#ee4d2d] focus:ring-1" />
              <span className="group-hover:text-[#ee4d2d] transition-colors"><AutoText text={item} /></span>
            </label>
          ))}
          <div className="text-[12.5px] text-gray-500 cursor-pointer hover:text-[#ee4d2d] mt-2 flex items-center gap-1">
             <AutoText text="Thêm" />
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 pb-5 mb-5">
        {renderTitle("Theo Danh Mục")}
        <div className="space-y-2.5 text-[13px] text-gray-700">
          {categories && categories.slice(0, 4).map(cat => (
            <label key={cat._id} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedCategory === cat._id}
                onChange={() => setSelectedCategory(selectedCategory === cat._id ? null : cat._id)}
                className="w-3.5 h-3.5 border-gray-300 rounded-sm text-[#ee4d2d] focus:ring-[#ee4d2d]" 
              />
              <span className={`transition-colors ${selectedCategory === cat._id ? 'text-[#ee4d2d] font-medium' : 'group-hover:text-[#ee4d2d]'}`}><AutoText text={cat.name} /></span>
            </label>
          ))}
          {categories && categories.length > 4 && (
            <div className="text-[12.5px] text-gray-500 cursor-pointer hover:text-[#ee4d2d] mt-2 flex items-center gap-1">
               <AutoText text="Thêm" />
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 pb-5 mb-5">
        {renderTitle("Khuyến Mãi")}
        <div className="space-y-2.5 text-[13px] text-gray-700">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={filterPromotion?.flashSale || false}
              onChange={(e) => setFilterPromotion({...filterPromotion, flashSale: e.target.checked})}
              className="w-3.5 h-3.5 border-gray-300 rounded-sm text-[#ee4d2d] focus:ring-[#ee4d2d]" 
            />
            <span className={`transition-colors ${filterPromotion?.flashSale ? 'text-[#ee4d2d] font-medium' : 'group-hover:text-[#ee4d2d]'}`}>
              <AutoText text="Flash Sale" />
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={filterPromotion?.event || false}
              onChange={(e) => setFilterPromotion({...filterPromotion, event: e.target.checked})}
              className="w-3.5 h-3.5 border-gray-300 rounded-sm text-[#ee4d2d] focus:ring-[#ee4d2d]" 
            />
            <span className={`transition-colors ${filterPromotion?.event ? 'text-[#ee4d2d] font-medium' : 'group-hover:text-[#ee4d2d]'}`}>
              <AutoText text="Sự Kiện" />
            </span>
          </label>
        </div>
      </div>

      <div className="border-b border-gray-200 pb-5 mb-5">
        {renderTitle("Khoảng Giá")}
        <div className="flex items-center gap-2 mt-4">
          <input 
            type="number" 
            placeholder="₫ TỪ" 
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-2 py-1.5 text-[12px] border border-gray-300 rounded-sm focus:border-[#ee4d2d] focus:outline-none"
          />
          <span className="text-gray-400">-</span>
          <input 
            type="number" 
            placeholder="₫ ĐẾN" 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-2 py-1.5 text-[12px] border border-gray-300 rounded-sm focus:border-[#ee4d2d] focus:outline-none"
          />
        </div>
        <button 
          onClick={applyPrice}
          className="w-full mt-3 bg-[#ee4d2d] text-white py-1.5 text-[13px] font-medium rounded-sm hover:bg-[#d73211] transition-colors"
        >
          <AutoText text="ÁP DỤNG" />
        </button>
      </div>

      <div className="border-b border-gray-200 pb-5 mb-5">
        {renderTitle("Đánh Giá")}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
             <div 
               key={rating} 
               onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
               className={`flex items-center gap-2 cursor-pointer group px-2 py-1 -ml-2 rounded-md ${selectedRating === rating ? 'bg-gray-100' : ''}`}
             >
                <div className="flex text-[14px]">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < rating ? "text-[#ffce3d]" : "text-gray-300"}>★</span>
                  ))}
                </div>
                {rating < 5 && <span className="text-[13px] text-gray-700"><AutoText text="trở lên" /></span>}
             </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
