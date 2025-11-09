# Hướng dẫn cấu hình môi trường

## File .env (Tùy chọn)

**LƯU Ý QUAN TRỌNG:** 
- Trong **development**, frontend sẽ **tự động sử dụng proxy** để tránh lỗi CORS
- Proxy được cấu hình trong `package.json` và sẽ route requests đến `https://imeeet.onrender.com`
- **KHÔNG CẦN** tạo file `.env` trong development

Nếu bạn muốn override (không khuyến khích trong dev), tạo file `.env` trong thư mục `frontend/`:

```env
# Backend API URL (chỉ cần trong production)
REACT_APP_API_BASE_URL=https://imeeet.onrender.com
```

## Cách hoạt động:

1. **Development (npm start):**
   - Frontend tự động dùng **relative URLs** (ví dụ: `/api/auth/login`)
   - Proxy trong `package.json` sẽ route đến `https://imeeet.onrender.com`
   - **Không cần file .env** trong development

2. **Production (npm run build):**
   - Cần file `.env` với `REACT_APP_API_BASE_URL`
   - Frontend sẽ dùng absolute URL từ env

## Lưu ý:

1. **Chỉ sử dụng `REACT_APP_API_BASE_URL`** - không sử dụng `REACT_APP_API_URL` (đã được thay thế)
2. File `.env` không được commit lên git (đã có trong .gitignore)
3. Sau khi tạo/sửa file `.env`, cần **restart lại development server** để áp dụng thay đổi
4. **Trong development, proxy sẽ tự động xử lý CORS** - không cần cấu hình thêm

## Kiểm tra:

Sau khi chạy `npm start`, kiểm tra trong browser console:
- API calls sẽ đi qua proxy (relative URLs) và được route đến backend
- Không còn lỗi CORS

