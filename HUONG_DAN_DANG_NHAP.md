# Đăng nhập KSNB Automation (Neon + Vercel)

Mọi trang tài liệu và ảnh đều bị chặn trên máy chủ Vercel nếu chưa đăng nhập.
User lưu trong Neon (mật khẩu mã hoá bcrypt). Không phân quyền: đăng nhập là xem được tất cả.
Quản trị (admin) có thêm trang **Quản lý user**.

## 1. Tạo project Neon
1. Vào https://console.neon.tech → đăng nhập → **New Project**.
2. Name: `ksnb-automation` · Region: **AWS Asia Pacific (Singapore)** · Postgres mặc định → **Create**.
3. Bấm **Connect** → chọn **Connection string**, bật **Connection pooling** → **Copy** chuỗi `postgresql://...`.
   (Không cần tạo bảng – web tự tạo bảng `ksnb_users` lần đầu chạy.)

## 2. Khai báo biến môi trường trên Vercel
Vercel → project **ksnbauto** → **Settings → Environment Variables** → thêm (chọn cả Production, Preview):

| Name | Value |
|---|---|
| `DATABASE_URL` | chuỗi kết nối Neon vừa copy |
| `AUTH_SECRET` | chuỗi bí mật ≥ 32 ký tự, tự đặt (vd. gõ ngẫu nhiên). **Ghi lại** – cần ở bước 4 |

> Cách khác: Vercel → **Storage → Connect Database → Neon** cũng tự thêm `DATABASE_URL`.

## 3. Đẩy code lên GitHub
```
git add -A
git commit -m "Them dang nhap Neon"
git push
```
Vercel tự build lại (khoảng 1 phút). Nếu thêm biến môi trường SAU khi đã deploy: Deployments → bản mới nhất → **⋯ → Redeploy**.

## 4. Tạo admin đầu tiên
Mở `https://ksnbauto.vercel.app` → web tự chuyển sang trang **Khởi tạo** →
nhập **AUTH_SECRET**, mã user admin, họ tên, mật khẩu → **Tạo quản trị** → đăng nhập.
Trang khởi tạo tự khoá vĩnh viễn khi đã có ít nhất 1 user.

## 5. Thêm user
Góc trên phải mọi trang → biểu tượng tài khoản → **Quản lý user** (`/admin.html`):
- Thêm từng user, hoặc dán danh sách từ Excel (3 cột: Mã user, Họ tên, Mật khẩu).
- Đặt lại mật khẩu, khoá/mở khoá, cấp/bỏ quyền quản trị, xoá.

## Cơ chế an toàn
- Mã user không phân biệt hoa/thường (`nv001` = `NV001`).
- Sai mật khẩu 5 lần → tạm khoá 10 phút.
- Phiên đăng nhập giữ 30 ngày. Khoá user / đặt lại mật khẩu → user bị đăng xuất trong tối đa 5 phút.
- User tự đổi mật khẩu ở menu tài khoản → các thiết bị khác bị đăng xuất.

## Sửa tài liệu trên máy (live_sync_server.py)
Không bị ảnh hưởng: mở file trên máy vẫn xem/sửa bình thường, không cần đăng nhập.
Tài liệu mới: thêm vào đúng thư mục và chèn dòng sau ngay trước `</body>` để có menu tài khoản:
```html
<script src="/auth-bar.js" defer></script>
```

## Lưu ý URL
`vercel.json` đã tắt `cleanUrls` (cấu hình cũ làm hỏng link tương đối trong các trang danh mục).
Link giữ dạng `.../Tho_DMX/Quy_trinh_xxx.html`.

## Thêm quy trình mới vào mục có sẵn (không cần push GitHub)
Menu tài khoản → **Quản trị** → phần **Thêm quy trình mới vào mục có sẵn**:
1. Chọn **Mục** (CE & Gia dụng, Thợ ĐMX, ICT Android / iOS / Windows) và **Nhóm** trong mục (lấy đúng các nhóm đang có trên trang mục, hoặc tạo nhóm mới).
2. Chọn file `.html` (và ảnh/PDF đi kèm nếu trang dùng ảnh riêng) → **Tải lên**.
3. Quy trình hiện ngay trên trang mục và trang chủ, tại địa chỉ `/<mục>/<tên_file>.html`.

- File lưu trong Neon (bảng `ksnb_files`), tối đa 3 MB/file. Neon Free có 0,5 GB.
- Link trong file mới dùng như các trang có sẵn: `index.html` = về danh mục, `../index.html` (hoặc `../../index.html` với ICT) = về trang chủ, ảnh `ten_anh.png` = ảnh tải kèm.
- Không được trùng tên với file đã có trong repo (web tự chặn). Tải lại cùng tên = ghi đè.
- Muốn đưa hẳn vào repo sau này: tải file về, chép vào đúng thư mục, push GitHub, rồi xoá bản trong trang Quản trị.
