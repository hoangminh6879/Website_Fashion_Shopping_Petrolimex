import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function ProductDetail() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setVariants(res.data.variants);
      });
  }, [id]);

  // 🔥 danh sách màu
  const colors = [...new Set(variants.map(v => v.color))];

  // 🔥 size theo màu
  const sizes = variants
    .filter(v => v.color === selectedColor)
    .map(v => v.size);

  // 🔥 variant đã chọn
  const selectedVariant = variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  if (!product) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">

      {/* TÊN */}
      <h1 className="text-2xl font-bold mb-4">
        {product.name}
      </h1>

      {/* ẢNH */}
      <img
        src={product.images?.[0] || "https://via.placeholder.com/300"}
        className="w-80 mb-4"
        alt=""
      />

      {/* GIÁ */}
      <div className="text-3xl text-red-500 mb-4">
        {selectedVariant
          ? `₫${selectedVariant.price}`
          : "Chọn phân loại"}
      </div>

      {/* COLOR */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Màu</h3>
        <div className="flex gap-2">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color);
                setSelectedSize(null);
              }}
              className={`px-4 py-2 border ${
                selectedColor === color
                  ? "bg-black text-white"
                  : ""
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* SIZE */}
      {selectedColor && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Size</h3>
          <div className="flex gap-2">
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 border ${
                  selectedSize === size
                    ? "bg-black text-white"
                    : ""
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STOCK */}
      {selectedVariant && (
        <div className="mb-4 text-gray-600">
          Còn lại: {selectedVariant.stock}
        </div>
      )}

      {/* BUTTON */}
      <button className="bg-red-500 text-white px-6 py-3 rounded">
        Thêm vào giỏ hàng
      </button>

    </div>
  );
}