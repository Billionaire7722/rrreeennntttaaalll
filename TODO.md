# TODO - Authentication Updates

## Backend Changes
- [x] 1. Add password validation in auth.service.ts (8-12 chars, uppercase, lowercase, number, special char)
- [x] 2. Add login attempt tracking (5 failed = 15 min lock)
- [x] 3. Add duplicate email/username check during registration

## Frontend (web-viewer) Changes
- [x] 4. Install react-google-recaptcha
- [x] 5. Create Captcha component
- [x] 6. Update register/page.tsx with:
  - Password validation
  - Field error styling (red border)
  - Captcha
  - Duplicate email/username check
- [x] 7. Update login/page.tsx with:
  - Captcha
  - Error message "Email hoặc mật khẩu không đúng"
- [x] 8. Add global error state CSS

## Notes
- Captcha sử dụng test key của Google (6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI)
- Để sử dụng thực tế, cần đăng ký reCAPTCHA v2 và thay bằng site key thực
- Backend hiện chưa verify captcha token (nên thêm trong production)
