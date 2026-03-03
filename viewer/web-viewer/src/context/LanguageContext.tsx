"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Language = "vi" | "en" | "zh" | "es";

interface Translations {
    [key: string]: string;
}

const dictionaries: Record<Language, Translations> = {
    vi: {
        loading: "Đang tải...",
        no_info: "Không tìm thấy thông tin nhà.",
        go_back: "Quay lại",
        available: "Đang cho thuê",
        rented: "Đã thuê",
        million: "triệu",
        vnd_per_month: "VNĐ / tháng",
        posted_by: "Đăng bởi",
        no_poster_info: "Chưa có thông tin người đăng",
        bedrooms: "Phòng ngủ",
        private_bath: "Khép kín",
        shared_bath: "Chung",
        bathrooms: "Phòng tắm",
        area: "Diện tích",
        description: "Mô tả chi tiết",
        no_description: "Chưa có mô tả chi tiết.",
        contact_now: "Liên hệ ngay",
        hello: "Xin chào",
        guest: "Khách",
        search_placeholder: "Tìm kiếm nhà thuê...",
        map: "Bản đồ",
        profile: "Hồ sơ"
    },
    en: {
        loading: "Loading...",
        no_info: "Property information not found.",
        go_back: "Go back",
        available: "Available",
        rented: "Rented",
        million: "million",
        vnd_per_month: "VND / month",
        posted_by: "Posted by",
        no_poster_info: "No poster info",
        bedrooms: "Bedrooms",
        private_bath: "Private",
        shared_bath: "Shared",
        bathrooms: "Bathrooms",
        area: "Area",
        description: "Description",
        no_description: "No description available.",
        contact_now: "Contact Now",
        hello: "Hello",
        guest: "Guest",
        search_placeholder: "Search properties...",
        map: "Map",
        profile: "Profile"
    },
    zh: {
        loading: "加载中...",
        no_info: "未找到房产信息。",
        go_back: "返回",
        available: "可租",
        rented: "已租",
        million: "百万",
        vnd_per_month: "越南盾 / 月",
        posted_by: "发布者",
        no_poster_info: "无发布者信息",
        bedrooms: "卧室",
        private_bath: "独立",
        shared_bath: "共用",
        bathrooms: "浴室",
        area: "面积",
        description: "详细描述",
        no_description: "暂无描述。",
        contact_now: "立即联系",
        hello: "你好",
        guest: "游客",
        search_placeholder: "搜索房产...",
        map: "地图",
        profile: "简介"
    },
    es: {
        loading: "Cargando...",
        no_info: "Información de la propiedad no encontrada.",
        go_back: "Volver",
        available: "Disponible",
        rented: "Alquilado",
        million: "millones",
        vnd_per_month: "VND / mes",
        posted_by: "Publicado por",
        no_poster_info: "Sin información del anunciante",
        bedrooms: "Dormitorios",
        private_bath: "Privado",
        shared_bath: "Compartido",
        bathrooms: "Baños",
        area: "Área",
        description: "Descripción",
        no_description: "No hay descripción disponible.",
        contact_now: "Contactar ahora",
        hello: "Hola",
        guest: "Invitado",
        search_placeholder: "Buscar propiedades...",
        map: "Mapa",
        profile: "Perfil"
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof dictionaries.vi) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("vi");

    useEffect(() => {
        const savedLang = localStorage.getItem("app_lang") as Language;
        if (savedLang && dictionaries[savedLang]) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("app_lang", lang);
    };

    const t = (key: keyof typeof dictionaries.vi): string => {
        return dictionaries[language]?.[key] || dictionaries.vi[key] || (key as string);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
