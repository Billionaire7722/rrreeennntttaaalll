type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
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

type BoundingBox = {
  south: number;
  north: number;
  west: number;
  east: number;
};

type AnchorLocation = {
  lat: number;
  lon: number;
  viewbox?: string;
  bounds?: BoundingBox;
  displayName?: string;
};

type AddressTokens = {
  city: string;
  ward: string;
  street: string;
  streetCore: string;
  houseNumber: string;
};

type AdministrativeSearchInput = {
  city?: string;
  cityAliases?: string[];
  ward?: string;
  wardAliases?: string[];
};

type ValidatedCandidate = {
  lat: number;
  lon: number;
  displayName: string;
  streetName: string;
  streetScore: number;
  houseMatched: boolean;
};

export type LocationPrecision = "province" | "ward" | "street" | "exact";

export type LocationResolution = {
  lat: number;
  lon: number;
  zoom: number;
  precision: LocationPrecision;
  confidence: number;
  requiresManualConfirmation: boolean;
  normalizedStreetAddress: string;
  displayName: string;
  query: string;
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

const ADMIN_LABEL_PATTERNS = [
  /\b(?:viet\s*nam)\b/gi,
  /\b(?:thanh\s*pho|tp)\b/gi,
  /\b(?:tinh)\b/gi,
  /\b(?:phuong|p)\b/gi,
  /\b(?:xa|x)\b/gi,
  /\b(?:thi\s*tran|tt)\b/gi,
  /\b(?:quan|q)\b/gi,
  /\b(?:huyen|h)\b/gi,
  /\b(?:thi\s*xa|tx)\b/gi,
];

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

function includesNormalizedText(value: string, fragment: string) {
  const normalizedValue = normalizeForMatch(value);
  const normalizedFragment = normalizeForMatch(fragment);
  if (!normalizedValue || !normalizedFragment) return false;
  return normalizedValue.includes(normalizedFragment);
}

function normalizePunctuation(value: string) {
  return value
    .replace(/[;|]+/g, ",")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,+/g, ",")
    .replace(/\s+/g, " ")
    .replace(/,\s*,/g, ", ")
    .replace(/^,\s*|\s*,$/g, "")
    .trim();
}

function normalizeStreetAbbreviations(value: string) {
  return value
    .replace(/\b(?:đ|d)\.\s*/gi, "duong ")
    .replace(/\b(?:st|street)\b/gi, "duong")
    .replace(/\b(?:rd|road)\b/gi, "duong")
    .replace(/\b(?:ave|avenue)\b/gi, "duong")
    .replace(/\s+/g, " ")
    .trim();
}

function stripStreetTypeWords(value: string) {
  return value
    .replace(/\b(?:duong|street|st|road|rd|avenue|ave|pho)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeAdministrativeSegment(value: string, ward: string, city: string) {
  const cleaned = normalizeStreetAbbreviations(normalizePunctuation(value));
  const segments = cleaned.split(",").map((segment) => segment.trim()).filter(Boolean);
  const normalizedWard = normalizeForMatch(ward);
  const normalizedCity = normalizeForMatch(city);

  const filteredSegments = segments.filter((segment) => {
    const normalizedSegment = normalizeForMatch(segment);
    if (!normalizedSegment) return false;

    if (normalizedWard && (normalizedSegment === normalizedWard || normalizedSegment.includes(normalizedWard))) {
      return false;
    }

    if (normalizedCity && (normalizedSegment === normalizedCity || normalizedSegment.includes(normalizedCity))) {
      return false;
    }

    if (normalizedSegment === normalizeForMatch(VIETNAM_COUNTRY)) {
      return false;
    }

    return true;
  });

  const firstSegment = filteredSegments[0] || cleaned;
  let normalized = firstSegment;

  for (const pattern of ADMIN_LABEL_PATTERNS) {
    normalized = normalized.replace(pattern, " ");
  }

  return normalizePunctuation(normalized).replace(/\s+/g, " ").trim();
}

export function normalizeVietnamStreetAddressInput(value: string, ward: string, city: string) {
  return removeAdministrativeSegment(value, ward, city)
    .replace(/\s+/g, " ")
    .replace(/^,\s*|\s*,$/g, "")
    .trim();
}

function extractHouseNumber(value: string) {
  const match = value.trim().match(/^([\dA-Za-z/-]+)/i);
  return match?.[1] ? normalizeForMatch(match[1]) : "";
}

function buildAddressTokens(streetAddress: string, ward: string, city: string): AddressTokens {
  const cleanedStreet = normalizeVietnamStreetAddressInput(streetAddress, ward, city);
  const normalizedStreet = normalizeForMatch(cleanedStreet);
  const streetCore = normalizeForMatch(stripStreetTypeWords(cleanedStreet)) || normalizedStreet;

  return {
    city: normalizeForMatch(city),
    ward: normalizeForMatch(ward),
    street: normalizedStreet,
    streetCore,
    houseNumber: extractHouseNumber(cleanedStreet),
  };
}

function toBounds(boundingbox?: string[]) {
  if (!boundingbox || boundingbox.length !== 4) return undefined;

  const [south, north, west, east] = boundingbox.map((value) => Number.parseFloat(value));
  if ([south, north, west, east].some((value) => !Number.isFinite(value))) return undefined;

  return { south, north, west, east } satisfies BoundingBox;
}

function toViewbox(bounds?: BoundingBox) {
  if (!bounds) return undefined;
  return `${bounds.west},${bounds.north},${bounds.east},${bounds.south}`;
}

function pointIsInsideBounds(lat: number, lon: number, bounds?: BoundingBox) {
  if (!bounds) return true;
  return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
}

async function searchNominatim(
  query: string,
  options?: {
    anchor?: AnchorLocation;
    bounded?: boolean;
    signal?: AbortSignal;
    limit?: number;
  }
) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: String(options?.limit ?? 8),
    countrycodes: "vn",
  });

  if (options?.anchor?.viewbox) {
    params.set("viewbox", options.anchor.viewbox);
  }
  if (options?.bounded) {
    params.set("bounded", "1");
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
    signal: options?.signal,
  });

  if (!response.ok) return [] as NominatimResult[];
  return (await response.json()) as NominatimResult[];
}

async function resolveAnchor(queries: string[], signal?: AbortSignal) {
  for (const query of dedupe(queries)) {
    const candidates = await searchNominatim(query, { signal, limit: 1 });
    const first = candidates[0];
    if (!first) continue;

    const lat = Number.parseFloat(first.lat);
    const lon = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const bounds = toBounds(first.boundingbox);

    return {
      lat,
      lon,
      bounds,
      viewbox: toViewbox(bounds),
      displayName: first.display_name,
    } satisfies AnchorLocation;
  }

  return null;
}

function extractCandidateStreetName(candidate: NominatimResult) {
  return (
    candidate.address?.road ||
    candidate.address?.pedestrian ||
    candidate.address?.residential ||
    candidate.address?.neighbourhood ||
    candidate.address?.suburb ||
    candidate.display_name.split(",")[0] ||
    ""
  );
}

function computeStreetMatchScore(expectedStreet: string, candidateStreet: string) {
  const normalizedExpected = normalizeForMatch(stripStreetTypeWords(expectedStreet));
  const normalizedCandidate = normalizeForMatch(stripStreetTypeWords(candidateStreet));

  if (!normalizedExpected || !normalizedCandidate) return 0;
  if (normalizedExpected === normalizedCandidate) return 1;
  if (normalizedCandidate.includes(normalizedExpected) || normalizedExpected.includes(normalizedCandidate)) return 0.92;

  const expectedTokens = normalizedExpected.split(" ").filter(Boolean);
  const candidateTokens = normalizedCandidate.split(" ").filter(Boolean);
  if (expectedTokens.length === 0 || candidateTokens.length === 0) return 0;

  const candidateSet = new Set(candidateTokens);
  const overlap = expectedTokens.filter((token) => candidateSet.has(token)).length;
  const overlapScore = overlap / Math.max(expectedTokens.length, candidateTokens.length);

  const firstExpected = expectedTokens[0];
  const firstCandidate = candidateTokens[0];
  const prefixBonus = firstExpected === firstCandidate ? 0.08 : 0;

  return Math.min(1, overlapScore + prefixBonus);
}

function validateCandidate(
  candidate: NominatimResult,
  tokens: AddressTokens,
  bounds?: BoundingBox
): ValidatedCandidate | null {
  const lat = Number.parseFloat(candidate.lat);
  const lon = Number.parseFloat(candidate.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!pointIsInsideBounds(lat, lon, bounds)) return null;

  const streetName = extractCandidateStreetName(candidate);
  const streetScore = computeStreetMatchScore(tokens.streetCore || tokens.street, streetName);
  if (streetScore < 0.72) return null;

  const candidateText = normalizeForMatch(
    [
      candidate.display_name,
      candidate.address?.house_number,
      candidate.address?.road,
      candidate.address?.pedestrian,
      candidate.address?.residential,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const houseMatched = Boolean(tokens.houseNumber) && candidateText.includes(tokens.houseNumber);

  return {
    lat,
    lon,
    displayName: candidate.display_name,
    streetName,
    streetScore,
    houseMatched,
  };
}

function toResolution(
  input: {
    lat: number;
    lon: number;
    normalizedStreetAddress: string;
    displayName: string;
    query: string;
    precision: LocationPrecision;
    confidence: number;
    requiresManualConfirmation: boolean;
  }
): LocationResolution {
  const zoomByPrecision: Record<LocationPrecision, number> = {
    province: 11,
    ward: 14,
    street: 16,
    exact: 17,
  };

  return {
    lat: input.lat,
    lon: input.lon,
    zoom: zoomByPrecision[input.precision],
    precision: input.precision,
    confidence: input.confidence,
    requiresManualConfirmation: input.requiresManualConfirmation,
    normalizedStreetAddress: input.normalizedStreetAddress,
    displayName: input.displayName,
    query: input.query,
  };
}

function buildExactQuery(streetAddress: string, ward: string, city: string) {
  return [streetAddress, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", ");
}

function buildStreetLevelQuery(streetAddress: string, ward: string, city: string) {
  const stripped = stripStreetTypeWords(streetAddress);
  const withoutHouseNumber = stripped.replace(/^([\dA-Za-z/-]+)\s+/, "").trim() || stripped;
  return [withoutHouseNumber, ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", ");
}

function buildAdminLabelCandidates(primary: string, aliases: string[] = []) {
  return dedupe([primary, ...aliases].map((value) => normalizePunctuation(value)).filter(Boolean));
}

function appendVietnamScope(query: string) {
  if (!query) return "";
  return includesNormalizedText(query, VIETNAM_COUNTRY) ? query : [query, VIETNAM_COUNTRY].filter(Boolean).join(", ");
}

function buildProvinceQueries(city: string, cityAliases: string[] = []) {
  return dedupe(
    buildAdminLabelCandidates(city, cityAliases).flatMap((label) => [appendVietnamScope(label), label])
  );
}

function buildWardQueries(input: AdministrativeSearchInput) {
  const cityLabels = buildAdminLabelCandidates(input.city || "", input.cityAliases || []);
  const wardLabels = buildAdminLabelCandidates(input.ward || "", input.wardAliases || []);

  const queries = wardLabels.flatMap((wardLabel) => {
    if (cityLabels.length === 0) {
      return [appendVietnamScope(wardLabel), wardLabel];
    }

    return cityLabels.flatMap((cityLabel) => {
      const scoped = includesNormalizedText(wardLabel, cityLabel)
        ? appendVietnamScope(wardLabel)
        : appendVietnamScope([wardLabel, cityLabel].filter(Boolean).join(", "));

      return [scoped, wardLabel];
    });
  });

  return dedupe([
    ...queries,
    ...buildProvinceQueries(input.city || "", input.cityAliases || []),
  ]);
}

function buildAddressQueries(
  builder: (streetAddress: string, ward: string, city: string) => string,
  streetAddress: string,
  input: AdministrativeSearchInput
) {
  const cityLabels = buildAdminLabelCandidates(input.city || "", input.cityAliases || []);
  const wardLabels = buildAdminLabelCandidates(input.ward || "", input.wardAliases || []);

  if (wardLabels.length === 0) {
    return dedupe(
      cityLabels.flatMap((cityLabel) => {
        const scoped = builder(streetAddress, "", cityLabel);
        return [scoped, removeVietnameseTones(scoped)];
      })
    );
  }

  return dedupe(
    wardLabels.flatMap((wardLabel) => {
      const scopedWard = cityLabels.length === 0
        ? [wardLabel]
        : cityLabels.map((cityLabel) => (includesNormalizedText(wardLabel, cityLabel) ? wardLabel : [wardLabel, cityLabel].join(", ")));

      return scopedWard.flatMap((wardScope) => {
        const exact = builder(streetAddress, wardScope, "");
        return [exact, removeVietnameseTones(exact)];
      });
    })
  );
}

export async function resolveVietnamProvinceCenter(
  city: string,
  signal?: AbortSignal,
  cityAliases: string[] = []
): Promise<LocationResolution | null> {
  const normalizedCity = city.trim();
  if (!normalizedCity) return null;

  const provinceAnchor = await resolveAnchor(buildProvinceQueries(normalizedCity, cityAliases), signal);
  if (!provinceAnchor) return null;

  return toResolution({
    lat: provinceAnchor.lat,
    lon: provinceAnchor.lon,
    normalizedStreetAddress: "",
    displayName: provinceAnchor.displayName || normalizedCity,
    query: [normalizedCity, VIETNAM_COUNTRY].join(", "),
    precision: "province",
    confidence: 0.45,
    requiresManualConfirmation: true,
  });
}

export async function resolveVietnamWardCenter(
  input: AdministrativeSearchInput,
  signal?: AbortSignal
): Promise<LocationResolution | null> {
  const ward = input.ward?.trim() || "";
  const city = input.city?.trim() || "";

  if (!city) return null;
  if (!ward) return resolveVietnamProvinceCenter(city, signal, input.cityAliases || []);

  const wardQueries = buildWardQueries(input);
  const wardQuery = wardQueries[0] || [ward, city, VIETNAM_COUNTRY].filter(Boolean).join(", ");
  const wardAnchor = await resolveAnchor(wardQueries, signal);
  if (!wardAnchor) return null;

  return toResolution({
    lat: wardAnchor.lat,
    lon: wardAnchor.lon,
    normalizedStreetAddress: "",
    displayName: wardAnchor.displayName || wardQuery,
    query: wardQuery,
    precision: "ward",
    confidence: 0.68,
    requiresManualConfirmation: true,
  });
}

export async function resolveVietnamDetailedAddress(
  input: AdministrativeSearchInput & { streetAddress?: string },
  signal?: AbortSignal
): Promise<LocationResolution | null> {
  const ward = input.ward?.trim() || "";
  const city = input.city?.trim() || "";
  const normalizedStreetAddress = normalizeVietnamStreetAddressInput(input.streetAddress || "", ward, city);

  if (!city) return null;
  if (!normalizedStreetAddress) return resolveVietnamWardCenter({ ward, city }, signal);

  const provinceAnchor = await resolveAnchor(buildProvinceQueries(city, input.cityAliases || []), signal);
  const wardAnchor = ward
    ? await resolveAnchor(
        buildWardQueries(input),
        signal
      )
    : provinceAnchor;
  const strictAnchor = wardAnchor || provinceAnchor || undefined;
  const strictBounds = wardAnchor?.bounds || provinceAnchor?.bounds;
  const tokens = buildAddressTokens(normalizedStreetAddress, ward, city);

  const exactQuery = buildExactQuery(normalizedStreetAddress, ward, city);
  const streetQuery = buildStreetLevelQuery(normalizedStreetAddress, ward, city);
  const queryStages = [
    {
      queries: buildAddressQueries(buildExactQuery, normalizedStreetAddress, input),
      fallbackQuery: exactQuery,
      precision: "exact" as const,
      requireHouseMatch: true,
    },
    {
      queries: buildAddressQueries(buildStreetLevelQuery, normalizedStreetAddress, input),
      fallbackQuery: streetQuery,
      precision: "street" as const,
      requireHouseMatch: false,
    },
  ];

  let bestStreetCandidate: ValidatedCandidate | null = null;

  for (const stage of queryStages) {
    const variants = stage.queries.length > 0
      ? stage.queries
      : dedupe([stage.fallbackQuery, removeVietnameseTones(stage.fallbackQuery)]);

    for (const variant of variants) {
      const candidates = await searchNominatim(variant, {
        anchor: strictAnchor,
        bounded: Boolean(strictAnchor?.viewbox),
        signal,
        limit: 8,
      });

      for (const candidate of candidates) {
        const validated = validateCandidate(candidate, tokens, strictBounds);
        if (!validated) continue;

        if (stage.precision === "exact" && stage.requireHouseMatch && validated.houseMatched) {
          return toResolution({
            lat: validated.lat,
            lon: validated.lon,
            normalizedStreetAddress,
            displayName: validated.displayName,
            query: variant,
            precision: "exact",
            confidence: Math.min(0.99, 0.82 + validated.streetScore * 0.17),
            requiresManualConfirmation: false,
          });
        }

        if (!bestStreetCandidate || validated.streetScore > bestStreetCandidate.streetScore) {
          bestStreetCandidate = validated;
        }
      }
    }
  }

  if (bestStreetCandidate) {
    return toResolution({
      lat: bestStreetCandidate.lat,
      lon: bestStreetCandidate.lon,
      normalizedStreetAddress,
      displayName: bestStreetCandidate.displayName,
      query: queryStages[1]?.queries[0] || streetQuery,
      precision: "street",
      confidence: Math.min(0.88, 0.58 + bestStreetCandidate.streetScore * 0.24),
      requiresManualConfirmation: true,
    });
  }

  if (wardAnchor) {
    return toResolution({
      lat: wardAnchor.lat,
      lon: wardAnchor.lon,
      normalizedStreetAddress,
      displayName: wardAnchor.displayName || [ward, city].filter(Boolean).join(", "),
      query: exactQuery,
      precision: "ward",
      confidence: 0.52,
      requiresManualConfirmation: true,
    });
  }

  if (provinceAnchor) {
    return toResolution({
      lat: provinceAnchor.lat,
      lon: provinceAnchor.lon,
      normalizedStreetAddress,
      displayName: provinceAnchor.displayName || city,
      query: exactQuery,
      precision: "province",
      confidence: 0.38,
      requiresManualConfirmation: true,
    });
  }

  return null;
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
  const streetAddress = normalizeVietnamStreetAddressInput(
    [address.house_number, address.road || address.pedestrian || address.residential].filter(Boolean).join(" "),
    ward,
    city
  );

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
}): Promise<LocationResolution | null> {
  const streetAddress = input.streetAddress?.trim() || "";
  const ward = input.ward?.trim() || "";
  const city = input.city?.trim() || "";

  if (!city && !ward && !streetAddress) return null;
  if (!city) return null;
  if (!ward && !streetAddress) return resolveVietnamProvinceCenter(city, input.signal);
  if (!streetAddress) return resolveVietnamWardCenter({ ward, city }, input.signal);
  return resolveVietnamDetailedAddress({ streetAddress, ward, city }, input.signal);
}
