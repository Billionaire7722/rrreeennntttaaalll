"use client";

export interface VietnamProvince {
  code: string;
  name: string;
  name_with_type?: string;
  slug?: string;
  type?: string;
}

export interface VietnamWard {
  code: string;
  name: string;
  name_with_type?: string;
  slug?: string;
  type?: string;
  path?: string;
  path_with_type?: string;
  parent_code: string;
}

type RawCollection<T> = Record<string, T> | T[];

function stripVietnameseTones(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(?:\u0111|\u0110)/g, "d");
}

export function normalizeAdministrativeName(value: string) {
  return stripVietnameseTones(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(?:thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa)\b/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toArray<T>(payload: RawCollection<T>) {
  return Array.isArray(payload) ? payload : Object.values(payload || {});
}

async function readJsonFile<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  const payload = (await response.json()) as RawCollection<T>;
  return toArray(payload);
}

export async function loadVietnamAdministrativeData(signal?: AbortSignal) {
  const [provinces, wards] = await Promise.all([
    readJsonFile<VietnamProvince>("/data/province.json", signal),
    readJsonFile<VietnamWard>("/data/ward.json", signal),
  ]);

  return { provinces, wards };
}

export function findProvinceByCode(provinces: VietnamProvince[], code?: string | null) {
  if (!code) return null;
  return provinces.find((province) => String(province.code) === String(code)) || null;
}

export function findProvinceByName(provinces: VietnamProvince[], name?: string | null) {
  const normalizedTarget = normalizeAdministrativeName(String(name || ""));
  if (!normalizedTarget) return null;

  return (
    provinces.find((province) => {
      const candidates = [province.name, province.name_with_type, province.slug];
      return candidates.some((candidate) => normalizeAdministrativeName(String(candidate || "")) === normalizedTarget);
    }) || null
  );
}

export function findWardByCode(wards: VietnamWard[], code?: string | null) {
  if (!code) return null;
  return wards.find((ward) => String(ward.code) === String(code)) || null;
}

export function findWardByName(wards: VietnamWard[], name?: string | null, provinceCode?: string | null) {
  const normalizedTarget = normalizeAdministrativeName(String(name || ""));
  if (!normalizedTarget) return null;

  return (
    wards.find((ward) => {
      if (provinceCode && String(ward.parent_code) !== String(provinceCode)) {
        return false;
      }

      const candidates = [ward.name, ward.name_with_type, ward.slug, ward.path, ward.path_with_type];
      return candidates.some((candidate) => normalizeAdministrativeName(String(candidate || "")) === normalizedTarget);
    }) || null
  );
}
