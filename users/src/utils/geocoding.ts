type NominatimAddress = {
  house_number?: string;
  road?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  village?: string;
  hamlet?: string;
  city?: string;
  town?: string;
  county?: string;
  state?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  boundingbox?: string[];
  address?: NominatimAddress;
  class?: string;
  type?: string;
};

type AnchorLocation = {
  lat: number;
  lon: number;
  viewbox?: string;
};

export type GeocodedLocation = {
  lat: number;
  lon: number;
  zoom: number;
};

type BestMatch = {
  lat: number;
  lon: number;
  score: number;
  streetMatched: boolean;
};

type AddressTokens = {
  city: string;
  ward: string;
  street: string;
  streetCore: string;
  houseNumber: string;
};

export type ReverseGeocodedAddress = {
  displayName: string;
  streetAddress: string;
  ward: string;
  city: string;
};

const VIETNAM_COUNTRY = "Vietnam";
const DEFAULT_HEADERS = {
  "User-Agent": "RentalApp/1.0",
  "Accept-Language": "vi,en",
};

function removeVietnameseTones(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D");
}

function normalizeForMatch(value: string) {
  return removeVietnameseTones(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function stripStreetTypeWords(value: string) {
  return value
    .replace(/\b(?:duong|street|st|road|rd|avenue|ave|pho)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingAddressNoise(value: string) {
  let current = value.trim();
  const patterns = [
    /^(?:so\s*nha|so)\s*[\dA-Za-z/-]+\s*,?\s*/i,
    /^(?:hem|ngo|ngach|lane|alley)\s*[\dA-Za-z/-]+\s*,?\s*/i,
    /^[\dA-Za-z/-]+\s*,\s*/i,
  ];

  let changed = true;
  while (changed) {
    changed = false;

    for (const pattern of patterns) {
      const next = current.replace(pattern, "").trim();
      if (next !== current) {
        current = next;
        changed = true;
      }
    }
  }

  return current;
}

function extractHouseNumber(value: string) {
  const match = value.trim().match(/^(?:so\s*nha)?\s*([\dA-Za-z/-]+)/i);
  return match?.[1] ? normalizeForMatch(match[1]) : "";
}

function buildAddressTokens(streetAddress: string, ward: string, city: string): AddressTokens {
  const cleanedStreet = stripLeadingAddressNoise(streetAddress);
  const normalizedStreet = normalizeForMatch(cleanedStreet);
  const streetCore = normalizeForMatch(stripStreetTypeWords(cleanedStreet)) || normalizedStreet;

  return {
    city: normalizeForMatch(city),
    ward: normalizeForMatch(ward),
    street: normalizedStreet,
    streetCore,
    houseNumber: extractHouseNumber(streetAddress),
  };
}

function toViewbox(boundingbox?: string[]) {
  if (!boundingbox || boundingbox.length !== 4) return undefined;
  const [south, north, west, east] = boundingbox;
  return `${west},${north},${east},${south}`;
}

async function searchNominatim(query: string, options?: { anchor?: AnchorLocation; signal?: AbortSignal; limit?: number }) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: String(options?.limit ?? 6),
    countrycodes: "vn",
  });

  if (options?.anchor?.viewbox) {
    params.set("viewbox", options.anchor.viewbox);
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
    signal: options?.signal,
  });

  if (!response.ok) return [] as NominatimResult[];
  return (await response.json()) as NominatimResult[];
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreCandidate(candidate: NominatimResult, tokens: AddressTokens, anchor?: AnchorLocation) {
  const addressText = normalizeForMatch(
    [
      candidate.display_name,
      candidate.address?.house_number,
      candidate.address?.road,
      candidate.address?.residential,
      candidate.address?.neighbourhood,
      candidate.address?.suburb,
      candidate.address?.quarter,
      candidate.address?.village,
      candidate.address?.hamlet,
      candidate.address?.city,
      candidate.address?.town,
      candidate.address?.county,
      candidate.address?.state,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const streetMatched = Boolean(tokens.streetCore && addressText.includes(tokens.streetCore));
  const looseStreetMatched = Boolean(tokens.street && addressText.includes(tokens.street));
  let score = 0;

  if (tokens.city && addressText.includes(tokens.city)) score += 35;
  if (tokens.ward && addressText.includes(tokens.ward)) score += 24;
  if (streetMatched) score += 55;
  else if (looseStreetMatched) score += 35;
  if (tokens.houseNumber && addressText.includes(tokens.houseNumber)) score += 10;
  if (candidate.type === "road" || candidate.class === "highway") score += 8;

  const lat = Number.parseFloat(candidate.lat);
  const lon = Number.parseFloat(candidate.lon);
  if (anchor && Number.isFinite(lat) && Number.isFinite(lon)) {
    score -= Math.min(haversineDistanceKm(anchor.lat, anchor.lon, lat, lon) * 1.4, 30);
  }

  return { score, streetMatched: streetMatched || looseStreetMatched };
}

async function resolveAnchor(queries: string[], signal?: AbortSignal) {
  for (const query of dedupe(queries)) {
    const candidates = await searchNominatim(query, { signal, limit: 1 });
    const first = candidates[0];
    if (!first) continue;

    const lat = Number.parseFloat(first.lat);
    const lon = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    return {
      lat,
      lon,
      viewbox: toViewbox(first.boundingbox),
    } satisfies AnchorLocation;
  }

  return null;
}

function buildDetailedStageQueries(streetAddress: string, ward: string, city: string) {
  const trimmedStreet = streetAddress.trim();
  const strippedStreet = stripLeadingAddressNoise(trimmedStreet);
  const streetCore = stripStreetTypeWords(strippedStreet);

  return dedupe([
    [trimmedStreet, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    [strippedStreet, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    [streetCore, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
  ]);
}

export async function resolveVietnamProvinceCenter(city: string, signal?: AbortSignal): Promise<GeocodedLocation | null> {
  const normalizedCity = city.trim();
  if (!normalizedCity) return null;

  const provinceAnchor = await resolveAnchor([[normalizedCity, VIETNAM_COUNTRY].join(", ")], signal);
  return provinceAnchor ? { lat: provinceAnchor.lat, lon: provinceAnchor.lon, zoom: 11 } : null;
}

export async function resolveVietnamWardCenter(
  input: { ward?: string; city?: string },
  signal?: AbortSignal
): Promise<GeocodedLocation | null> {
  const ward = input.ward?.trim() || "";
  const city = input.city?.trim() || "";

  if (!city) return null;
  if (!ward) return resolveVietnamProvinceCenter(city, signal);

  const wardAnchor = await resolveAnchor(
    [
      [ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
      [city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    ],
    signal
  );

  if (!wardAnchor) return null;

  return {
    lat: wardAnchor.lat,
    lon: wardAnchor.lon,
    zoom: 14,
  };
}

export async function resolveVietnamDetailedAddress(
  input: { streetAddress?: string; ward?: string; city?: string },
  signal?: AbortSignal
): Promise<GeocodedLocation | null> {
  const streetAddress = input.streetAddress?.trim() || "";
  const ward = input.ward?.trim() || "";
  const city = input.city?.trim() || "";

  if (!city) return null;
  if (!streetAddress) return resolveVietnamWardCenter({ ward, city }, signal);

  const provinceAnchor = await resolveAnchor([[city, VIETNAM_COUNTRY].join(", ")], signal);
  const wardAnchor = ward
    ? await resolveAnchor(
        [
          [ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
          [city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
        ],
        signal
      )
    : provinceAnchor;
  const anchor = wardAnchor || provinceAnchor || undefined;
  const tokens = buildAddressTokens(streetAddress, ward, city);

  let bestMatch: BestMatch | null = null;
  for (const query of buildDetailedStageQueries(streetAddress, ward, city)) {
    const variants = dedupe([query, removeVietnameseTones(query)]);

    for (const variant of variants) {
      const candidates = await searchNominatim(variant, { anchor, signal });

      for (const candidate of candidates) {
        const lat = Number.parseFloat(candidate.lat);
        const lon = Number.parseFloat(candidate.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

        const scored = scoreCandidate(candidate, tokens, anchor);
        if (!bestMatch || scored.score > bestMatch.score) {
          bestMatch = {
            lat,
            lon,
            score: scored.score,
            streetMatched: scored.streetMatched,
          };
        }
      }
    }

    const currentBestMatch = bestMatch;
    if (currentBestMatch && currentBestMatch.score >= 70 && currentBestMatch.streetMatched) {
      break;
    }
  }

  const finalBestMatch = bestMatch;

  if (finalBestMatch && (finalBestMatch.streetMatched || finalBestMatch.score >= 65)) {
    return {
      lat: finalBestMatch.lat,
      lon: finalBestMatch.lon,
      zoom: finalBestMatch.streetMatched ? 17 : 16,
    };
  }

  if (wardAnchor) {
    return { lat: wardAnchor.lat, lon: wardAnchor.lon, zoom: 14 };
  }

  if (provinceAnchor) {
    return { lat: provinceAnchor.lat, lon: provinceAnchor.lon, zoom: 11 };
  }

  return finalBestMatch
    ? {
        lat: finalBestMatch.lat,
        lon: finalBestMatch.lon,
        zoom: 16,
      }
    : null;
}

export async function reverseGeocodeVietnamCoordinates(
  input: { lat: number; lon: number },
  signal?: AbortSignal
): Promise<ReverseGeocodedAddress | null> {
  const params = new URLSearchParams({
    lat: String(input.lat),
    lon: String(input.lon),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
    signal,
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as NominatimResult;

  const address = payload.address || {};
  const city = address.city || address.town || address.county || address.state || "";
  const ward = address.suburb || address.quarter || address.neighbourhood || address.village || address.hamlet || "";
  const streetAddress = [address.house_number, address.road || address.residential].filter(Boolean).join(" ").trim();

  return {
    displayName: payload.display_name || "",
    streetAddress,
    ward,
    city,
  };
}

export async function geocodeVietnameseAddress(input: {
  streetAddress?: string;
  ward?: string;
  city?: string;
  signal?: AbortSignal;
}): Promise<GeocodedLocation | null> {
  const streetAddress = input.streetAddress?.trim() || "";
  const ward = input.ward?.trim() || "";
  const city = input.city?.trim() || "";

  if (!city && !ward && !streetAddress) return null;
  if (!city) return null;
  if (!ward && !streetAddress) return resolveVietnamProvinceCenter(city, input.signal);
  if (!streetAddress) return resolveVietnamWardCenter({ ward, city }, input.signal);
  return resolveVietnamDetailedAddress({ streetAddress, ward, city }, input.signal);
}
