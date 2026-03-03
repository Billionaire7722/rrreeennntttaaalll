## [0.1.0] - 2026-03-02
### Added

#### Chat Feature - Viewer ↔ Admin
- **Web Viewer Chat Page** (`/viewer/web-viewer/src/app/chat/page.tsx`):
  - New dedicated chat page at http://localhost:3002/chat
  - Real-time messaging using WebSocket via Socket.io
  - Display messages with sender role (admin/viewer)
  - Timestamps and message history from backend API
  - Beautiful UI with message bubbles (blue for own messages, white for others)
  - Connection status indicator (online/offline)
  - Auto-scroll to newest messages
- **Profile Page Integration**:
  - Added Link to chat from profile page messages tab
  - Click "Hỗ trợ kỹ thuật" to open real chat interface

#### Backend Messaging Enhancements
- **WebSocket Gateway** (`backend/src/messages/messages.gateway.ts`):
  - Real-time message broadcasting
  - Event handlers: `send_message`, `new_message`, `message_sent`
- **API Endpoints**:
  - `GET /users/messages` - Get viewer messages
  - `POST /users/messages` - Send new message
  - `GET /users/admin/messages` - Admin view all viewer messages
  - `POST /users/admin/messages/:viewerId/reply` - Admin reply to viewer

### Changed
- **SocketContext**: Updated to handle real-time chat in web-viewer

## [0.0.9] - 2026-03-02
### Added

#### Local Development Setup
- **docker-compose.local.yml**: Created local development configuration with localhost URLs for development without Docker.
- **LOCAL_DEV.md**: Added comprehensive local development guide with:
  - Quick start instructions
  - Default accounts information
  - Port mapping table
  - Deploy to VPS instructions
- **Local environment configuration**: Created environment files for local development with proper localhost settings.

#### Scripts for Local Development
- **start-all.ps1**: PowerShell script to start all services locally
- **stop-local.bat**: Batch script to stop all services
- **seed-super-admin.ps1**: Script to seed super admin account
- **start-backend-local.ps1**: Script to start backend with proper environment
- **run-db-push.ps1**: Script to push Prisma schema to local database
- **run-prisma.ps1**: Script to generate Prisma client
- **run-seed.ps1**: Script to seed database with sample data

#### Infrastructure Fixes
- **Tailwind CSS v4**: Updated web-viewer to use Tailwind CSS v4 with @tailwindcss/postcss plugin
- **PostgreSQL port configuration**: Configured PostgreSQL to run on port 5433 for local development to avoid conflicts
- **Redis configuration**: Added Redis on port 6379 for local caching

### Changed
- **Backend environment**: Updated .env to use localhost PostgreSQL (port 5433) and Redis
- **Web viewer**: Configured NEXT_PUBLIC_API_BASE_URL for local backend connection
- **Super Admin Dashboard**: Configured VITE_API_BASE_URL for local backend connection
- **Rental Admin**: Configured EXPO_PUBLIC_API_BASE_URL for local backend connection

## [0.0.8] - 2026-02-28
### Changed

#### Security & Production Ops
- **Secret rotation completed on VPS**:
  - Rotated `SUPER_ADMIN_PASSWORD`, `JWT_SECRET`, PostgreSQL `postgres` password, and VPS `root` password.
  - Synchronized `backend/.env.production` and `docker-compose.yml` with rotated values.
  - Recreated/restarted services to force fresh env loading and validated health + login afterward.
- **Deployment resilience**:
  - Worked around `docker-compose` v1 recreate issues by using explicit remove/recreate flow for selected services.
  - Patched server-side pull blockers caused by local dirty files by deploying targeted file updates safely.

#### Data Consistency & Viewer UX
- **Database sync fix**: Synced `House` data from local environment to VPS production database (resolved mismatch where local added houses were missing and old deleted houses still appeared in production).
- **Web viewer bottom tab visibility**: Updated `BottomTabBar` layering/styling to remain visible above map/content after deployment (`z-index`, blur, shadow adjustments).
- **Guest detail gating**:
  - Web viewer map popup `Xem chi tiết` now redirects guests to login.
  - Property detail page now enforces authenticated viewer access.
  - Mobile viewer property detail now prompts login when unauthenticated.

#### House Attribution
- **House poster attribution (viewer/admin details)**:
  - Added backend `HouseAdmin` linkage so one house can have multiple posting admins.
  - `GET /houses` and `GET /houses/:id` now include `postedByAdmins` (`id`, `name`, `avatarUrl`).
  - Property detail screens now show poster chips (avatar + admin name) for web-viewer, mobile-viewer, and rental-admin.

#### Super Admin Console
- **Super-admin login reliability fixed**:
  - Corrected API endpoint resolution for deployed environment (eliminated localhost-bound failures).
  - Added clearer login error states for network vs credential failures.
- **Live monitoring page added** (`/live-monitor`):
  - Real-time session board (viewer/admin presence with relative time: minutes ago).
  - Real-time admin house actions stream (add/update/delete with timestamps and payload context).
- **Live monitor usability + realtime status improved**:
  - `Live Session Monitor` and `Admin House Actions` now support vertical scrolling (`overflow-y`) and can keep loading more rows without page jump.
  - Added backend presence heartbeat pipeline (`/presence/heartbeat`, `/presence/offline`) and consolidated API (`/admin/live-sessions`) for realtime online/offline status.
  - Online/offline semantics updated:
    - `ONLINE`: account is actively using app and still sending heartbeat.
    - `OFFLINE`: account logged out, closed tab/app, or heartbeat expired.
- **Admin account management completed** (`/admins`):
  - Added full admin edit capability (name, username, email, phone, optional password reset) via `PATCH /admin/admins/:id`.
  - Admin list now includes `username` and excludes soft-deleted accounts by default.
  - Super-admin account remains protected from edit/role/status/delete operations.
- **Super-admin self password change added**:
  - Added secure endpoint `PATCH /admin/me/password` requiring current password verification.
  - Added dashboard form in Admin Management so SUPER_ADMIN can change own password directly from UI.

#### RBAC v2 (Core Authorization Model)
- **Role model upgraded to 4 tiers**: `SUPER_ADMIN > ADMIN > VIEWER > GUEST`.
- **Backend enum + schema updated**:
  - Replaced `USER` with `VIEWER` and added `GUEST` in role definitions.
  - Registration now always creates `VIEWER` accounts.
- **Manual production migration added and applied**:
  - Added SQL migration to remap existing DB role values (`USER -> VIEWER`) and preserve data.
  - Added message metadata (`senderId`, `senderRole`) to support admin replies to viewer threads.
- **Authorization tightening**:
  - Viewer-only endpoints (`/users/profile`, `/users/favorites`, `/users/messages`) now require `VIEWER` role.
  - House mutation endpoints remain restricted to `ADMIN` / `SUPER_ADMIN`.
  - Added `POST /admin/admins` for SUPER_ADMIN-driven admin account creation.

#### Messaging Workflow
- **Viewer ↔ Admin messaging upgraded**:
  - Viewer-originated messages are tagged with sender role metadata.
  - New admin endpoints added for moderation/reply flows:
    - `GET /users/admin/messages`
    - `POST /users/admin/messages/:viewerId/reply`

#### rental-admin App
- **Auth model replaced**:
  - Removed hardcoded/demo local auth and switched to backend JWT login.
  - Enforced `ADMIN`/`SUPER_ADMIN` only access for rental-admin.
- **Property API calls secured**:
  - All create/edit/status/delete house actions now send bearer token headers to match backend RBAC.

#### Documentation
- **README objective refresh**:
  - Added a dedicated project-goal section describing the 4-role model and centralized permission boundaries.
  - Updated role terminology in architecture description (`USER/PUBLIC` -> `VIEWER/GUEST`) for alignment.
- **Web-viewer About Us section added**:
  - Added dedicated `/about` page introducing founder profile (Vương Trung Kiên), hiring message, project capabilities, mission, and contact email.
  - Added direct access from Navbar (`About Us`) and a homepage CTA card for visibility.
  - Added multilingual switcher on `/about`: Vietnamese, English, Chinese, and Spanish.
  - Updated homepage About CTA behavior: auto-display for 7 seconds, round `X` close button, and floating round reopen icon.
  - Enabled vertical scroll on `/about` so long content remains readable on small screens.

## [0.0.7] - 2026-02-28
### Changed

#### rental-admin — Upload Pipeline
- **Cloudinary image/video upload fixed**: Resolved `"One or more images failed to upload"` error caused by three compounding bugs:
  - Frontend on Expo Web sent `blob:` URIs directly inside `FormData` which serialised as the literal string `[object Object]`. Fixed with a platform-aware `buildFormData` helper that fetches the blob and wraps it in a proper `File` object on web, while keeping the React Native `{ uri, type, name }` object format on native.
  - `Content-Type: multipart/form-data` header was manually set in every `fetch` call, stripping the required `boundary` parameter. Removed — `fetch` now sets it automatically.
  - Backend `FileInterceptor` was using disk storage by default, leaving `file.buffer` undefined. Switched to explicit `memoryStorage()`.
- **Cloudinary provider**: Updated `cloudinary.provider.ts` to read credentials from environment variables (`CLOUDINARY_URL`, `API_Key`, `API_Secret`) instead of hardcoded values.
- **Backend ValidationPipe**: Relaxed `forbidNonWhitelisted` and added `skipMissingProperties` to prevent the pipe from silently rejecting `multipart/form-data` requests.
- **CloudinaryService**: Refactored to use Node.js built-in `Readable` stream instead of the removed `buffer-to-stream` npm dependency.
- Same `buildFormData` fix applied to avatar uploads in `rental-admin/app/(tabs)/profile/index.tsx` and `viewer/mobile-viewer/app/(tabs)/favorites.tsx`.

#### rental-admin — Add New Home modal
- **Status field removed**: New listings always default to `"available"`. The status toggle was redundant on creation and has been removed.
- **Merged photo/video upload section**: The separate "Hình ảnh" and "Video" sections are now a single **"Ảnh & Video"** section with side-by-side upload buttons, a unified counter label, and individual rows for each uploaded file.
- **Default image fallback**: When no images are uploaded, the modal now resolves `assets/images/defaultimage.jpg` from the app bundle via `expo-asset`, uploads it to Cloudinary, and stores the returned public URL in PostgreSQL instead of a hardcoded third-party placeholder URL.
- **Modal responsiveness**: Added `alignItems: 'center'` to the overlay and a `webWrapper` View capped at `maxWidth: 520` so the modal is never cut off on mobile browsers.
- **Latitude/Longitude**: Cleared default pre-filled values (`21.0285` / `105.8542`); fields now show example placeholder text only.

#### rental-admin — Property Details screen
- **"Liên hệ ngay" → "Chỉnh sửa thông tin"**: The Contact button in the property detail bottom bar has been replaced with an Edit button (pencil icon) that opens the pre-filled `EditPropertyModal` for that property. Changes are saved via `updateProperty` from context.

#### rental-admin — Ward/Commune search input
- **New `DistrictSearchInput` component** (`components/DistrictSearchInput.tsx`): A searchable combobox replacing the plain `Picker` for the ward/commune field.
  - Collapsed state shows the selected label with a chevron trigger.
  - On open, a search `TextInput` auto-focuses and filters the list in real-time (case-insensitive contains match).
  - Dropdown renders inside a transparent `Modal` measured with `measureInWindow()` so it truly overlays all content below without being clipped by the parent `ScrollView`.
  - Tapping anywhere outside closes the dropdown via a full-screen invisible backdrop.
  - Shows up to 6 items with vertical scroll for longer filtered lists; "Không tìm thấy kết quả" when nothing matches.
- **Renamed field label**: "Quận/Huyện" → "Phường/Xã" in both `AddPropertyModal` and `EditPropertyModal`.
- Applied to `EditPropertyModal` as well for consistency.

## [0.0.6] - 2026-02-28
### Changed
- **Admin Profile Tab**: Renamed the "Quản lý" (Management) tab to "Hồ sơ" (Profile) with a `User` icon, matching the `web-viewer` and `mobile-viewer` profile pattern.
- **Cloudinary Avatar Upload**: Admin profile now features a clickable avatar circle powered by `expo-image-picker` streaming to the Cloudinary NestJS bridge.
- **Manage Houses Section**: The houses list now shows each property card with both **Edit** (pencil) and **Delete** (trash) buttons.
- **Edit Property Modal**: Created `EditPropertyModal.tsx` — a fully pre-filled form that allows editing all house fields (title, price, bedrooms, area, description, GPS, images, videos). Images and videos upload to Cloudinary before saving.
- **Backend PATCH Endpoint**: Added `PATCH /houses/:id` and `updateHouse` service method to NestJS to persist all editable house fields to PostgreSQL.
- **Add House**: The explicit "Thêm nhà mới" button is placed in the list header for easy access (replaces the old floating FAB).

## [0.0.5] - 2026-02-27
### Added
- **Cloudinary Integration**: Fully removed reliance on massive server-local Base64 data strings. Embedded `cloudinary` and `multer` parsing logic natively inside the NestJS `backend/src/upload` and `backend/src/cloudinary` modules.
- **Auto-WebP Reformatting**: The backend intercepts all image files, converts them aggressively to optimized `webp` formats preserving quality, and uploads them securely via `buffer-to-stream` bridging.
- **Universal Multi-Platform Avatar / Property Image Uploads**: 
    1. Re-hooked `rental-admin` app's `expo-image-picker` during new Property creations to stream binary straight to the backend's `/upload/image` API.
    2. Overhauled the Next.js `web-viewer` user `/profile` Avatar HTML5 `<input>` handling to natively POST binaries instead of strictly local demo states.
    3. Rebuilt the React Native `mobile-viewer` favorites `/profile` tab to include interactive, tappable Avatar circles hooking into Cloudinary the same way as `rental-admin`.

## [0.0.4] - 2026-02-27
### Fixed
- **Missing Property Endpoint**: Added the `@Get(':id')` endpoint to the `houses.controller.ts` and `houses.service.ts` in the NestJS backend. This resolves the 404 "No property information found" error when clicking "Xem chi tiết" from the Next.js `web-viewer` map, as the web viewer requires querying individual properties explicitly, unlike the mobile app which caches them globally.

## [0.0.3] - 2026-02-27
### Fixed
- **Web Viewer Real-Time Sync**: Implemented a 2000ms polling cycle matching the React Native TanStack query to guarantee-update without requiring manual the map pins auto browser refreshing.
- **Unified Advanced Filtering**: Injected the complex mobile filter system natively into the Next.js header `Navbar`. Users can now instantly filter web properties by exact Price, strict Province/Ward parameters, Bedroom counts, Bathroom types, and explicit Area metrics without reloading.
- **Interactive Profile Dashboard**: Transformed the basic "Favorites" landing page into a fully tabbed User Profile. Includes live Avatar uploads, dynamic Username data, a dedicated 'Tin Lưu' grid for saved properties, and a mocked 'Tin nhắn' tab representing administration chat history.

## [0.0.2] - 2026-02-27
### Fixed
- **Web Viewer API Polling**: Repaired `AxiosError 404` crashes on Web by routing all user property-saves through standard authenticated `users/favorites` NestJS controllers rather than dangling unmapped roots.
- **Web UI & Map Convergence**: Consolidated the Next.js Homepage to purely match the Expo Native application structure. Removed the side flexbox property list to create a unified interactive fullscreen map.
- **Marker & Popup Enhancements**: Swapped standard Leaflet defaults for React `divIcon` injected SVGs to dynamically render property statuses (Green = Available, Red = Rented). Made the entire Property Popup clickable for vastly improved UX routing over just the small anchor tag.
- **Favorites Schema Delivery**: Upgraded `favorites/page.tsx` to extract nested PostgreSQL Prisma `.house` relations natively, stripping massive performance lag from unneeded `Promise.all` multi-network looping.

## [0.0.1] - 2026-02-26
### Added
- **Next.js Web Viewer Environment**: Created exactly alongside the mobile app (`/viewer/web-viewer`) to provide an instantaneous, browser-native map grid exploration platform powered by Next.js 15, `react-leaflet`, and `Tailwind CSS`. Connected to existing backend infrastructure seamlessly.
- **Unified Viewer Monorepo Workspace**: Consolidated consumer applications into a shared `/viewer` directory. The Expo app is now at `/viewer/mobile-viewer` and the Next.js app is at `/viewer/web-viewer`. Unused `packages` have been purged.
- **Super Admin Dashboard**: A new completely separate React application (`/super-admin-dashboard`) built exclusively for Super Admins. It includes overview metrics, user/admin management, and system/login audit logs.
- **Role-Based Access Control (RBAC)**: Implemented `SUPER_ADMIN`, `ADMIN`, and `USER` roles in the NestJS backend with `RolesGuard`.
- **Audit System**: Server-side tracking of user login attempts and sensitive mutations, with persistent `LoginLog` and `AuditLog` records.
- **Soft Deletion**: Upgraded Database schema to intercept property and user deletions without cascading destructions, utilizing `deleted_at`.
- **Rate Limiting**: Integrated `AbnormalActivityGuard` to suspend brute-force action bots and unauthorized admins from hitting destructive routes natively.
