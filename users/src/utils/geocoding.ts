type NominatimAddress = {
  house_number?: string;
  road?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
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

type GeocodedLocation = {
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
    /^(?:so\s*nha|so|số\s*nhà)\s*[\dA-Za-z/-]+\s*,?\s*/i,
    /^(?:hem|hẻm|ngo|ngõ|ngach|ngách|lane|alley)\s*[\dA-Za-z/-]+\s*,?\s*/i,
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
  const match = value.trim().match(/^(?:so\s*nha|số\s*nhà)?\s*([\dA-Za-z/-]+)/i);
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

function buildQueries(streetAddress: string, ward: string, city: string) {
  const trimmedStreet = streetAddress.trim();
  const strippedStreet = stripLeadingAddressNoise(trimmedStreet);
  const streetCore = stripStreetTypeWords(strippedStreet);
  const area = [ward.trim(), city.trim(), VIETNAM_COUNTRY].filter(Boolean).join(", ");

  return dedupe([
    [trimmedStreet, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    [strippedStreet, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    [streetCore, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    [trimmedStreet, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    [strippedStreet, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    [streetCore, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    area,
  ]);
}

function toViewbox(boundingbox?: string[]) {
  if (!boundingbox || boundingbox.length !== 4) return undefined;
  const [south, north, west, east] = boundingbox;
  return `${west},${north},${east},${south}`;
}

async function searchNominatim(query: string, anchor?: AnchorLocation) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
    countrycodes: "vn",
  });

  if (anchor?.viewbox) {
    params.set("viewbox", anchor.viewbox);
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
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

async function resolveAnchor(ward: string, city: string) {
  const queries = dedupe([
    [ward.trim(), city.trim(), VIETNAM_COUNTRY].filter(Boolean).join(", "),
    [city.trim(), VIETNAM_COUNTRY].filter(Boolean).join(", "),
  ]);

  for (const query of queries) {
    const candidates = await searchNominatim(query);
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

export async function geocodeVietnameseAddress(input: { streetAddress?: string; ward?: string; city?: string }): Promise<GeocodedLocation | null> {
  const streetAddress = input.streetAddress?.trim() || "";
  const ward = input.ward?.trim() || "";
  const city = input.city?.trim() || "";

  if (!streetAddress && !ward && !city) return null;

  if (city && !ward && !streetAddress) {
    const cityAnchor = await resolveAnchor("", city);
    return cityAnchor ? { lat: cityAnchor.lat, lon: cityAnchor.lon, zoom: 12 } : null;
  }

  if (city && ward && !streetAddress) {
    const wardAnchor = await resolveAnchor(ward, city);
    if (wardAnchor) {
      return { lat: wardAnchor.lat, lon: wardAnchor.lon, zoom: 14 };
    }
  }

  const anchor = await resolveAnchor(ward, city);
  const tokens = buildAddressTokens(streetAddress, ward, city);
  const queries = buildQueries(streetAddress, ward, city);

  let bestMatch: BestMatch | null = null;

  for (const query of queries) {
    const variants = dedupe([query, removeVietnameseTones(query)]);

    for (const variant of variants) {
      const candidates = await searchNominatim(variant, anchor || undefined);

      for (const candidate of candidates) {
        const lat = Number.parseFloat(candidate.lat);
        const lon = Number.parseFloat(candidate.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

        const scored = scoreCandidate(candidate, tokens, anchor || undefined);
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

    const currentBest = bestMatch;
    if (currentBest && currentBest.score >= 70 && (currentBest.streetMatched || !tokens.streetCore)) {
      break;
    }
  }

  const finalBestMatch = bestMatch;

  if (finalBestMatch && (!tokens.streetCore || finalBestMatch.streetMatched || finalBestMatch.score >= 65)) {
    return {
      lat: finalBestMatch.lat,
      lon: finalBestMatch.lon,
      zoom: finalBestMatch.streetMatched ? 17 : 15,
    };
  }

  if (!streetAddress && anchor) {
    return {
      lat: anchor.lat,
      lon: anchor.lon,
      zoom: ward ? 14 : 12,
    };
  }

  if (anchor && finalBestMatch && finalBestMatch.score >= 20) {
    return {
      lat: anchor.lat,
      lon: anchor.lon,
      zoom: ward ? 14 : 12,
    };
  }

  return finalBestMatch
    ? {
        lat: finalBestMatch.lat,
        lon: finalBestMatch.lon,
        zoom: 16,
      }
    : null;
}
