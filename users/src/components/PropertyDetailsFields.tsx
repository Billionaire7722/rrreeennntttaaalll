"use client";

import type React from "react";
import { getPropertyTypeRules } from "@/utils/propertyTypeRules";

type FormShape = {
  building_name: string;
  bedrooms: string;
  frontage: string;
  floors: string;
  toilets: string;
  contact_phone: string;
};

interface PropertyDetailsFieldsProps {
  propertyType: string;
  value: FormShape;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string, values?: Record<string, string | number | null | undefined>) => string;
}

export default function PropertyDetailsFields({
  propertyType,
  value,
  onChange,
  t,
}: PropertyDetailsFieldsProps) {
  const { isApartmentLike, isCommercialSpace } = getPropertyTypeRules(propertyType);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{t("property.detail.houseDetailsTitle")}</p>
        <p className="mt-1 text-xs text-gray-500">{t("property.detail.houseDetailsHint")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isApartmentLike ? (
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">{t("property.form.apartmentCondoNameLabel")}</label>
            <input
              name="building_name"
              value={value.building_name}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("property.form.apartmentCondoNamePlaceholder")}
            />
          </div>
        ) : null}

        {!isCommercialSpace ? (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("property.fields.bedrooms")}</label>
            <input
              type="number"
              min="0"
              name="bedrooms"
              value={value.bedrooms}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        ) : null}

        {isCommercialSpace ? (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("property.fields.frontage")} (m²)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              name="frontage"
              value={value.frontage}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        ) : null}

        {!isApartmentLike ? (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("property.fields.floors")}</label>
            <input
              type="number"
              min="0"
              name="floors"
              value={value.floors}
              onChange={onChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        ) : null}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">{t("property.fields.toilets")}</label>
          <input
            type="number"
            min="0"
            name="toilets"
            value={value.toilets}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">{t("property.form.contactPhoneLabel")}</label>
          <input
            name="contact_phone"
            value={value.contact_phone}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+84..."
          />
        </div>
      </div>
    </div>
  );
}
