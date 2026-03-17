import React, { useMemo, useState } from "react";
import { LayoutGrid, List, AlignJustify, ChevronLeft, ChevronRight } from "lucide-react";
import PropertyCard, { Property } from "./PropertyCard";
import { useLanguage } from "@/context/LanguageContext";

interface PropertyListProps {
  properties: Property[];
  onEdit?: (property: Property) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  favorites?: Set<string>;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  storageKey?: string;
}

type ViewMode = "grid" | "list" | "compact";

export default function PropertyList({
  properties,
  onEdit,
  onDelete,
  onToggleFavorite,
  favorites = new Set(),
  emptyIcon,
  emptyTitle,
  emptyDescription,
  storageKey = "property_list_view_mode",
}: PropertyListProps) {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    const savedMode = localStorage.getItem(storageKey) as ViewMode;
    if (savedMode && ["grid", "list", "compact"].includes(savedMode)) {
      setViewMode(savedMode);
    }
  }, [storageKey]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(storageKey, mode);
  };

  const itemsPerPage = useMemo(() => {
    if (viewMode === "grid") return 6;
    if (viewMode === "list") return 8;
    return 12;
  }, [viewMode]);

  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, properties.length);
  const currentItems = properties.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-16 text-center">
        <div className="mb-4 text-gray-300">{emptyIcon}</div>
        <h3 className="mb-1 text-base font-bold text-gray-800">{emptyTitle || t("property.list.emptyTitle")}</h3>
        <p className="max-w-xs text-sm text-gray-400">{emptyDescription}</p>
      </div>
    );
  }

  const SwitcherButton = ({
    mode,
    icon: Icon,
    label,
  }: {
    mode: ViewMode;
    icon: React.ComponentType<{ size?: number }>;
    label: string;
  }) => (
    <button
      onClick={() => handleViewModeChange(mode)}
      className={`flex items-center gap-1.5 rounded-lg p-1.5 transition-all ${
        viewMode === mode
          ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      }`}
      title={label}
    >
      <Icon size={16} />
      <span className={`text-xs font-bold ${viewMode === mode ? "block" : "hidden md:block"}`}>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("property.list.displayMode")}</span>
          <div className="flex rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
            <SwitcherButton mode="grid" icon={LayoutGrid} label={t("property.list.viewModes.grid")} />
            <SwitcherButton mode="list" icon={List} label={t("property.list.viewModes.list")} />
            <SwitcherButton mode="compact" icon={AlignJustify} label={t("property.list.viewModes.compact")} />
          </div>
        </div>

        <div className="text-xs font-medium text-gray-400">
          {t("common.showingRange", {
            start: startIndex + 1,
            end: endIndex,
            total: properties.length,
          })}
        </div>
      </div>

      <div
        className={`grid gap-4 transition-all duration-300 ${
          viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        }`}
      >
        {currentItems.map((property) => (
          <div key={property.id} className="animate-in fade-in duration-500">
            <PropertyCard
              property={property}
              variant={viewMode}
              isFavorite={favorites.has(property.id)}
              onToggleFavorite={onToggleFavorite}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border border-gray-100 bg-white p-2 text-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30 hover:bg-gray-50"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-10 w-10 rounded-xl text-sm font-bold transition-all ${
                  currentPage === page
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                    : "border border-gray-100 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="rounded-xl border border-gray-100 bg-white p-2 text-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30 hover:bg-gray-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
