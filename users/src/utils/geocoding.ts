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
  streetVariants: string[];
  streetCoreVariants: string[];
  houseNumber: string;
};

const VIETNAM_COUNTRY = "Vietnam";
const HOUSE_LABEL_PREFIXES = new Set(["so", "nha"]);
const ALLEY_PREFIXES = new Set(["hem", "ngo", "ngach", "lane", "alley"]);
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
  return removeVietnameseTones(value)
    .replace(/\b(?:duong|street|st|road|rd|avenue|ave|pho)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeAddressUnitToken(value: string) {
  return /^[0-9A-Za-z]+(?:[/-][0-9A-Za-z]+)*$/.test(value.trim());
}

function extractHouseNumber(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";

  const normalizedParts = parts.map((part) => normalizeForMatch(part));
  let index = 0;

  if (normalizedParts[index] === "so" && normalizedParts[index + 1] === "nha") {
    index += 2;
  } else if (HOUSE_LABEL_PREFIXES.has(normalizedParts[index])) {
    index += 1;
  }

  if (ALLEY_PREFIXES.has(normalizedParts[index] || "")) {
    index += 1;
  }

  const candidate = parts[index];
  return candidate && looksLikeAddressUnitToken(candidate) ? normalizeForMatch(candidate) : "";
}

function buildStreetVariants(streetAddress: string) {
  const trimmedStreet = streetAddress.trim().replace(/\s+/g, " ");
  if (!trimmedStreet) return [] as string[];

  const variants = [trimmedStreet];
  const commaSeparatedParts = trimmedStreet.split(",").map((part) => part.trim()).filter(Boolean);
  if (commaSeparatedParts.length > 1) {
    variants.push(commaSeparatedParts.slice(1).join(" "));
  }

  const parts = trimmedStreet.split(/\s+/).filter(Boolean);
  const normalizedParts = parts.map((part) => normalizeForMatch(part));
  const pushVariant = (startIndex: number) => {
    if (startIndex <= 0 || startIndex >= parts.length) return;
    variants.push(parts.slice(startIndex).join(" "));
  };

  if (normalizedParts[0] === "so" && normalizedParts[1] === "nha") {
    pushVariant(2);
    if (looksLikeAddressUnitToken(parts[2] || "")) {
      pushVariant(3);
    }
  } else if (HOUSE_LABEL_PREFIXES.has(normalizedParts[0])) {
    pushVariant(1);
    if (looksLikeAddressUnitToken(parts[1] || "")) {
      pushVariant(2);
    }
  }

  if (ALLEY_PREFIXES.has(normalizedParts[0])) {
    pushVariant(1);
    if (looksLikeAddressUnitToken(parts[1] || "")) {
      pushVariant(2);
    }
  }

  if (looksLikeAddressUnitToken(parts[0]) && parts.length > 1) {
    pushVariant(1);
  }

  return dedupe(
    variants.flatMap((variant) => {
      const compactVariant = variant.trim().replace(/\s+/g, " ");
      const strippedStreetType = stripStreetTypeWords(compactVariant);
      return [compactVariant, strippedStreetType];
    })
  );
}

function buildAddressTokens(streetAddress: string, ward: string, city: string): AddressTokens {
  const streetVariants = buildStreetVariants(streetAddress);
  const normalizedStreetVariants = dedupe(streetVariants.map((variant) => normalizeForMatch(variant)));
  const normalizedStreetCoreVariants = dedupe(
    streetVariants.map((variant) => normalizeForMatch(stripStreetTypeWords(variant)))
  );

  return {
    city: normalizeForMatch(city),
    ward: normalizeForMatch(ward),
    streetVariants: normalizedStreetVariants,
    streetCoreVariants: normalizedStreetCoreVariants.length ? normalizedStreetCoreVariants : normalizedStreetVariants,
    houseNumber: extractHouseNumber(streetAddress),
  };
}

function buildQueries(streetAddress: string, ward: string, city: string) {
  const streetVariants = buildStreetVariants(streetAddress);
  const area = [ward.trim(), city.trim(), VIETNAM_COUNTRY].filter(Boolean).join(", ");

  return dedupe([
    ...streetVariants.flatMap((streetVariant) => [
      [streetVariant, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
      [streetVariant, city, VIETNAM_COUNTRY].filter(Boolean).join(", "),
    ]),
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

  const streetMatched = tokens.streetCoreVariants.some((streetVariant) => streetVariant && addressText.includes(streetVariant));
  const looseStreetMatched = tokens.streetVariants.some((streetVariant) => streetVariant && addressText.includes(streetVariant));
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
  const hasStreetTokens = tokens.streetCoreVariants.length > 0 || tokens.streetVariants.length > 0;

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
    if (currentBest && currentBest.score >= 70 && (currentBest.streetMatched || !hasStreetTokens)) {
      break;
    }
  }

  const finalBestMatch = bestMatch;

  if (finalBestMatch && (!hasStreetTokens || finalBestMatch.streetMatched || finalBestMatch.score >= 65)) {
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
