import { Property } from "@shared/types/property";

const HANOI_CENTER = { lat: 21.0285, lng: 105.8542 };

// Generate random coordinates within a ~10km radius of Hanoi center
function getRandomCoordinate(center: { lat: number; lng: number }, radius: number) {
  const r = radius / 111.3; // roughly convert km to degrees
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  // Adjust for longitude scaling based on latitude
  const newLng = x / Math.cos((center.lat * Math.PI) / 180);

  return {
    latitude: center.lat + y,
    longitude: center.lng + newLng
  };
}

const addresses = [
  "Đường Láng, Đống Đa", "Kim Mã, Ba Đình", "Cầu Giấy", "Hồ Tây",
  "Hai Bà Trưng", "Hoàn Kiếm", "Trần Duy Hưng", "Nguyễn Khuyến",
  "Phố Huế", "Hàng Bài", "Tây Sơn", "Phạm Văn Đồng"
];

const titles = [
  "Căn hộ cao cấp", "Nhà phố nguyên căn", "Phòng trọ giá rẻ",
  "Studio tiện nghi", "Chung cư mini", "Căn hộ dịch vụ"
];

const generatedProperties: Property[] = Array.from({ length: 10 }).map((_, index) => {
  const coords = getRandomCoordinate(HANOI_CENTER, 5); // 5km radius
  const isAvailable = index < 7; // 7 available, 3 rented

  return {
    id: `rand-${index + 1}`,
    title: `${titles[Math.floor(Math.random() * titles.length)]} ${index + 1}`,
    address: addresses[Math.floor(Math.random() * addresses.length)],
    price: Math.floor(Math.random() * 20000000) + 3000000, // 3M to 23M
    bedrooms: Math.floor(Math.random() * 3) + 1,
    hasPrivateBathroom: Math.random() > 0.3, // 70% chance of private bath
    status: isAvailable ? "available" : "rented",
    latitude: coords.latitude,
    longitude: coords.longitude,
    images: [
      `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop&sig=${index}`,
      `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop&sig=${index}`
    ],
    area: Math.floor(Math.random() * 50) + 15,
  } as Property;
});

export const INITIAL_PROPERTIES: Property[] = generatedProperties;
