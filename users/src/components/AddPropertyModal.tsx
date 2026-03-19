"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api, { resolvedApiBaseUrl } from "@/api/axios";
import PropertyLocationSection from "@/components/PropertyLocationSection";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { DEFAULT_PROPERTY_COORDINATES, type PropertyLocationStatus } from "@/hooks/usePropertyLocationPicker";
import { normalizePropertyType, PROPERTY_TYPE_OPTIONS, toPropertyTypeApiValue } from "@/i18n";
import { SAFE_IMAGE_ACCEPT, isSafeImageFile } from "@/utils/safeMedia";
import RoomMiniApartmentFields, { EMPTY_ROOM_DETAILS } from "@/components/RoomMiniApartmentFields";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const API_BASE = () => {
  if (typeof window !== "undefined" && resolvedApiBaseUrl.startsWith("/")) {
    return `${window.location.origin}${resolvedApiBaseUrl}`;
  }

  if (resolvedApiBaseUrl) return resolvedApiBaseUrl;
  if (typeof window !== "undefined") return `${window.location.origin}/api`;
  return "http://localhost:3000";
};

function createInitialFormData() {
  return {
    name: "",
    property_type: "house",
    street_address: "",
    ward: "",
    city: "",
    ward_code: "",
    city_code: "",
    price: "",
    square: "",
    bedrooms: "",
    floors: "",
    toilets: "",
    description: "",
    contact_phone: "",
    latitude: DEFAULT_PROPERTY_COORDINATES[0],
    longitude: DEFAULT_PROPERTY_COORDINATES[1],
    roomDetails: { ...EMPTY_ROOM_DETAILS },
  };
}

async function uploadFile(file: File, type: "image" | "video"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE()}/upload/${type}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error(`${type} upload failed`);

  const data = await response.json();
  return data.url as string;
}

export default function AddPropertyModal({ isOpen, onClose, onSuccess }: AddPropertyModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState(createInitialFormData);
  const [locationStatus, setLocationStatus] = useState<PropertyLocationStatus | null>(null);
  const isRoomMiniApartment = normalizePropertyType(formData.property_type) === "roomMiniApartment";

  const resetForm = useCallback(() => {
    imagePreviews.forEach((preview) => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });

    setFormData(createInitialFormData());
    setImages([]);
    setVideos([]);
    setImagePreviews([]);
    setPreviewIndex(null);
    setSubmitState("idle");
    setUploadingMedia(false);
    setLocationStatus(null);

    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, [imagePreviews]);

  useEffect(() => {
    if (previewIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewIndex(null);
      if (event.key === "ArrowRight") {
        setPreviewIndex((value) => (value !== null && value < imagePreviews.length - 1 ? value + 1 : value));
      }
      if (event.key === "ArrowLeft") {
        setPreviewIndex((value) => (value !== null && value > 0 ? value - 1 : value));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imagePreviews.length, previewIndex]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = event.target;
    let value = event.target.value;

    if (name === "price") {
      const rawValue = value.replace(/\D/g, "");
      value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    if (name.startsWith("roomDetails.")) {
      const roomDetailField = name.replace("roomDetails.", "");
      setFormData((previous) => ({
        ...previous,
        roomDetails: {
          ...previous.roomDetails,
          [roomDetailField]: value,
        },
      }));
      return;
    }

    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const supportedFiles = files.filter(isSafeImageFile);
    if (!supportedFiles.length) {
      window.alert(t("property.form.invalidImageType"));
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    const remaining = 7 - images.length;
    const filesToUpload = supportedFiles.slice(0, remaining);

    setUploadingMedia(true);

    try {
      const urls = await Promise.all(filesToUpload.map((file) => uploadFile(file, "image")));
      const previews = filesToUpload.map((file) => URL.createObjectURL(file));
      setImages((previous) => [...previous, ...urls]);
      setImagePreviews((previous) => [...previous, ...previews]);
    } catch (error) {
      console.error("Image upload error", error);
      window.alert(t("property.form.imageUploadError"));
    } finally {
      setUploadingMedia(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remaining = 2 - videos.length;
    const filesToUpload = files.slice(0, remaining);

    setUploadingMedia(true);

    try {
      const urls = await Promise.all(filesToUpload.map((file) => uploadFile(file, "video")));
      setVideos((previous) => [...previous, ...urls]);
    } catch (error) {
      console.error("Video upload error", error);
      window.alert(t("property.form.videoUploadError"));
    } finally {
      setUploadingMedia(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const previewToRemove = imagePreviews[index];
    if (previewToRemove?.startsWith("blob:")) {
      URL.revokeObjectURL(previewToRemove);
    }

    setImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    setImagePreviews((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const removeVideo = (index: number) => {
    setVideos((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      window.alert(t("property.add.loginRequired"));
      return;
    }

    if (locationStatus?.requiresManualPinConfirmation && !locationStatus.hasManualPinOverride) {
      window.alert(t("property.form.locationNeedsPinConfirmation"));
      return;
    }

    setSubmitState("loading");

    try {
      const normalizedStreetAddress = formData.street_address.trim();
      const normalizedWard = formData.ward.trim();
      const normalizedCity = formData.city.trim();
      const fullAddressString = [normalizedStreetAddress, normalizedWard, normalizedCity].filter(Boolean).join(", ");
      const payload: Record<string, unknown> = {
        property_type: toPropertyTypeApiValue(formData.property_type),
        address: normalizedStreetAddress,
        ward: normalizedWard,
        ward_code: formData.ward_code || null,
        city: normalizedCity,
        city_code: formData.city_code || null,
        price: formData.price ? Number(String(formData.price).replace(/\./g, "")) : null,
        square: formData.square ? Number(formData.square) : null,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        floors: formData.floors ? Number(formData.floors) : null,
        toilets: formData.toilets ? Number(formData.toilets) : null,
        description: formData.description.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        name: fullAddressString || formData.street_address || formData.name,
        ...(isRoomMiniApartment
          ? {
              roomDetails: {
                electricityPrice: formData.roomDetails.electricityPrice ? Number(formData.roomDetails.electricityPrice) : null,
                waterPrice: formData.roomDetails.waterPrice ? Number(formData.roomDetails.waterPrice) : null,
                paymentMethod: formData.roomDetails.paymentMethod || null,
                otherFees: formData.roomDetails.otherFees.trim() || null,
              },
            }
          : {}),
      };

      images.forEach((url, index) => {
        payload[`image_url_${index + 1}`] = url;
      });

      videos.forEach((url, index) => {
        payload[`video_url_${index + 1}`] = url;
      });

      await api.post("/houses", payload);
      setSubmitState("success");

      setTimeout(() => {
        resetForm();
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      setSubmitState("error");
    }
  }, [formData, images, isRoomMiniApartment, locationStatus, onClose, onSuccess, resetForm, t, user, videos]);

  if (!isOpen) return null;

  return (
    <>
      {previewIndex !== null ? (
        <div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
          >
            <X size={22} className="text-white" />
          </button>

          {previewIndex > 0 ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setPreviewIndex((value) => (value !== null ? value - 1 : 0));
              }}
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          ) : null}

          <div className="flex max-h-[82vh] max-w-[92vw] items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <SafeImage
              src={imagePreviews[previewIndex]}
              alt={t("property.form.previewImage")}
              className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl"
              allowBlob
            />
          </div>

          {previewIndex < imagePreviews.length - 1 ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setPreviewIndex((value) => (value !== null ? value + 1 : 0));
              }}
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          ) : null}

          {imagePreviews.length > 1 ? (
            <div className="absolute bottom-6 flex gap-2">
              {imagePreviews.map((_, index) => (
                <button
                  key={index}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === previewIndex ? "w-5 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          ) : null}

          <div className="absolute bottom-6 right-5 text-xs font-semibold text-white/70">
            {previewIndex + 1} / {imagePreviews.length}
          </div>
        </div>
      ) : null}

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
        <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">{t("property.add.title")}</h2>
            <button onClick={onClose} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          {submitState !== "idle" ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 p-10">
              {submitState === "loading" ? (
                <>
                  <Loader2 size={48} className="animate-spin text-blue-600" />
                  <p className="text-lg font-medium text-gray-700">{t("property.add.submitting")}</p>
                </>
              ) : null}

              {submitState === "success" ? (
                <>
                  <CheckCircle size={60} className="text-green-500" />
                  <p className="text-lg font-medium text-green-600">{t("property.add.submitSuccess")}</p>
                </>
              ) : null}

              {submitState === "error" ? (
                <>
                  <XCircle size={60} className="text-red-500" />
                  <p className="text-lg font-medium text-red-600">{t("property.add.submitError")}</p>
                  <button
                    type="button"
                    onClick={() => setSubmitState("idle")}
                    className="mt-4 rounded-xl bg-gray-100 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    {t("common.tryAgain")}
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("property.form.houseTypeLabel")} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROPERTY_TYPE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.apiValue}>
                      {t(option.translationKey)}
                    </option>
                  ))}
                </select>
              </div>

              <PropertyLocationSection
                isOpen={isOpen}
                value={{
                  city: formData.city,
                  cityCode: formData.city_code,
                  ward: formData.ward,
                  wardCode: formData.ward_code,
                  streetAddress: formData.street_address,
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
                onChange={(patch) =>
                  setFormData((previous) => ({
                    ...previous,
                    ...(patch.city !== undefined ? { city: patch.city } : {}),
                    ...(patch.cityCode !== undefined ? { city_code: patch.cityCode } : {}),
                    ...(patch.ward !== undefined ? { ward: patch.ward } : {}),
                    ...(patch.wardCode !== undefined ? { ward_code: patch.wardCode } : {}),
                    ...(patch.streetAddress !== undefined ? { street_address: patch.streetAddress } : {}),
                    ...(patch.latitude !== undefined ? { latitude: patch.latitude } : {}),
                    ...(patch.longitude !== undefined ? { longitude: patch.longitude } : {}),
                  }))
                }
                onStatusChange={setLocationStatus}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t("property.form.priceLabel")}</label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t("property.fields.area")}</label>
                  <input
                    type="number"
                    name="square"
                    value={formData.square}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t("property.detail.houseDetailsTitle")}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("property.detail.houseDetailsHint")}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t("property.fields.bedrooms")}</label>
                    <input
                      type="number"
                      min="0"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white bg-white/90 px-4 py-2 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t("property.fields.floors")}</label>
                    <input
                      type="number"
                      min="0"
                      name="floors"
                      value={formData.floors}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white bg-white/90 px-4 py-2 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t("property.fields.toilets")}</label>
                    <input
                      type="number"
                      min="0"
                      name="toilets"
                      value={formData.toilets}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white bg-white/90 px-4 py-2 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t("property.form.contactPhoneLabel")}</label>
                    <input
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white bg-white/90 px-4 py-2 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500"
                      placeholder="+84..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t("property.fields.description")}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("property.fields.description")}
                />
              </div>

              {isRoomMiniApartment ? <RoomMiniApartmentFields value={formData.roomDetails} onChange={handleChange} t={t} /> : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <ImageIcon size={15} /> {t("property.form.photosLabel")}
                    <span className="font-normal text-gray-400">({images.length}/7)</span>
                  </label>
                  {images.length < 7 ? (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 disabled:opacity-50 hover:text-blue-700"
                    >
                      <Upload size={13} /> {t("common.upload")}
                    </button>
                  ) : null}
                </div>

                <input ref={imageInputRef} type="file" accept={SAFE_IMAGE_ACCEPT} multiple className="hidden" onChange={handleImageSelect} />

                {imagePreviews.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        <SafeImage src={src} alt="" className="h-full w-full object-cover" allowBlob />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setPreviewIndex(index)}
                            title={t("property.form.previewImage")}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-colors hover:bg-white"
                          >
                            <Eye size={14} className="text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-colors hover:bg-white"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {images.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors disabled:opacity-50 hover:border-blue-300 hover:text-blue-500"
                  >
                    <ImageIcon size={22} />
                    <span className="text-xs">{t("property.form.addPhotosHint")}</span>
                  </button>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Video size={15} /> {t("property.form.videosLabel")}
                    <span className="font-normal text-gray-400">({videos.length}/2)</span>
                  </label>
                  {videos.length < 2 ? (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 disabled:opacity-50 hover:text-blue-700"
                    >
                      <Upload size={13} /> {t("common.upload")}
                    </button>
                  ) : null}
                </div>

                <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoSelect} />

                {videos.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {videos.map((_, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <Video size={16} className="shrink-0 text-blue-500" />
                        <span className="flex-1 truncate text-xs text-gray-600">
                          {t("property.media.videoUploaded", { index: index + 1 })}
                        </span>
                        <button type="button" onClick={() => removeVideo(index)} className="text-gray-400 transition-colors hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {videos.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="flex h-16 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors disabled:opacity-50 hover:border-blue-300 hover:text-blue-500"
                  >
                    <Video size={18} />
                    <span className="text-xs">{t("property.form.addVideosHint")}</span>
                  </button>
                ) : null}
              </div>

              {uploadingMedia ? (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 size={16} className="animate-spin" />
                  {t("property.form.uploadingMedia")}
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={uploadingMedia}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors disabled:opacity-70 hover:bg-blue-700"
                >
                  {t("property.add.submitButton")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
