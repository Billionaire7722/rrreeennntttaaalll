"use client";

import React from "react";

export type RoomDetailsFormValue = {
  electricityPrice: string;
  waterPrice: string;
  paymentMethod: string;
  otherFees: string;
};

export const EMPTY_ROOM_DETAILS: RoomDetailsFormValue = {
  electricityPrice: "",
  waterPrice: "",
  paymentMethod: "",
  otherFees: "",
};

const PAYMENT_METHOD_DEPOSITS = [1, 2, 3, 4, 5];

interface RoomMiniApartmentFieldsProps {
  value: RoomDetailsFormValue;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  t: (key: string, values?: Record<string, string | number | null | undefined>) => string;
}

export default function RoomMiniApartmentFields({ value, onChange, t }: RoomMiniApartmentFieldsProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{t("property.form.roomDetailsTitle")}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{t("property.form.roomDetailsHint")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">{t("property.form.electricityPriceLabel")}</label>
          <input
            type="number"
            min="0"
            name="roomDetails.electricityPrice"
            value={value.electricityPrice}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">{t("property.form.waterPriceLabel")}</label>
          <input
            type="number"
            min="0"
            name="roomDetails.waterPrice"
            value={value.waterPrice}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{t("property.form.paymentMethodLabel")}</label>
        <select
          name="roomDetails.paymentMethod"
          value={value.paymentMethod}
          onChange={onChange}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t("property.form.paymentMethodPlaceholder")}</option>
          {PAYMENT_METHOD_DEPOSITS.map((deposits) => (
            <option key={deposits} value={t("property.form.depositMonthsOption", { deposits })}>
              {t("property.form.depositMonthsOption", { deposits })}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{t("property.form.otherFeesLabel")}</label>
        <textarea
          name="roomDetails.otherFees"
          value={value.otherFees}
          onChange={onChange}
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t("property.form.otherFeesPlaceholder")}
        />
      </div>
    </div>
  );
}
