import i18n from '../i18n';

const productDictionary = {
  // Common terms
  "Áo": "Shirt/Top",
  "Quần": "Pants/Trousers",
  "Váy": "Dress",
  "Đầm": "Dress",
  "Giày": "Shoes",
  "Dép": "Sandals",
  "Túi": "Bag",
  "Phụ kiện": "Accessories",
  "Nam": "Men",
  "Nữ": "Women",
  "Trẻ em": "Kids",
  "Thể thao": "Sport",
  "Công sở": "Office",
  "Dạo phố": "Streetwear",
  "Sơ mi": "Shirt",
  "Thun": "T-shirt",
  "Bò": "Denim/Jeans",
  "Kaki": "Khaki",
  "Len": "Wool",
  "Khoác": "Jacket",
  "Hoodie": "Hoodie",
  "Sweater": "Sweater",
  "Short": "Shorts",
  "Lửng": "Cropped",
  "Dài": "Long",
  "Ngắn": "Short",
  "Đen": "Black",
  "Trắng": "White",
  "Đỏ": "Red",
  "Xanh": "Blue",
  "Vàng": "Yellow",
  "Hồng": "Pink",
  "Xám": "Grey",
  "Nâu": "Brown",
  "Tím": "Purple",
  "Cam": "Orange",
  "Mới": "New",
  "Cao cấp": "Premium",
  "Chính hãng": "Genuine",
  "Thời trang": "Fashionable",
  "Đẹp": "Beautiful",
};

/**
 * Dịch một chuỗi (tên sản phẩm, tên danh mục) dựa trên từ điển đơn giản.
 * @param {string} text - Văn bản tiếng Việt cần dịch
 * @returns {string} - Văn bản đã được dịch sang tiếng Anh (nếu ngôn ngữ hiện tại là English)
 */
export const translateContent = (text) => {
  if (!text) return "";
  if (i18n.language !== 'en') return text;

  let translated = text;
  
  // Dịch các cụm từ chính
  Object.keys(productDictionary).forEach(key => {
    const regex = new RegExp(key, 'gi');
    translated = translated.replace(regex, productDictionary[key]);
  });

  return translated;
};
