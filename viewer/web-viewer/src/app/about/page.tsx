"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mail, Users, Briefcase, Target, Building2 } from "lucide-react";

type Lang = "vi" | "en" | "zh" | "es";

type AboutCopy = {
    aboutUs: string;
    title: string;
    intro: string;
    founderTitle: string;
    founderNameLabel: string;
    founderName: string;
    founderDesc: string;
    hiringTitle: string;
    hiringDesc1: string;
    hiringDesc2: string;
    productTitle: string;
    productItems: string[];
    missionTitle: string;
    missionDesc1: string;
    missionDesc2: string;
    contactTitle: string;
    contactDesc: string;
    homeBtn: string;
};

const COPY: Record<Lang, AboutCopy> = {
    vi: {
        aboutUs: "About Us",
        title: "Giới thiệu về người sáng lập và dự án Rental Platform",
        intro:
            "Đây là phần giới thiệu chính thức về người tạo dự án và định hướng phát triển sản phẩm. Mục tiêu của nền tảng là giúp người thuê nhà và đội ngũ vận hành có trải nghiệm minh bạch, cập nhật nhanh và quản lý tập trung.",
        founderTitle: "Người sáng lập",
        founderNameLabel: "Họ và tên",
        founderName: "Vương Trung Kiên",
        founderDesc:
            "Tôi là người xây dựng ứng dụng này với mong muốn tạo ra một sản phẩm thực tế, có thể mở rộng và vận hành ổn định trong môi trường production.",
        hiringTitle: "Lời mời cộng tác",
        hiringDesc1:
            "Tôi đang tìm đồng nghiệp có cùng đam mê để phát triển dự án. Không yêu cầu bằng đại học, không bắt buộc đúng chuyên ngành.",
        hiringDesc2:
            "Chỉ cần bạn lập trình tốt TypeScript/JavaScript và thành thạo ít nhất một trong các công nghệ: React.js, Next.js, Node.js, NestJS, PostgreSQL.",
        productTitle: "Ứng dụng hiện làm được gì",
        productItems: [
            "Quản lý nhà cho thuê với nhiều vai trò người dùng và quản trị.",
            "Admin có thể thêm/sửa/xóa mềm bài đăng nhà.",
            "Viewer có thể xem bản đồ, xem chi tiết, lưu yêu thích và nhắn tin.",
            "Hệ thống có dashboard theo dõi vận hành, phiên hoạt động và nhật ký thao tác.",
            "Hệ thống đã triển khai production trên VPS với backend, database và frontend tách riêng.",
        ],
        missionTitle: "Sứ mệnh dự án",
        missionDesc1:
            "Xây dựng một nền tảng thuê nhà có dữ liệu rõ ràng, vận hành ổn định, dễ mở rộng và đủ nghiêm túc để phát triển thành sản phẩm doanh nghiệp.",
        missionDesc2:
            "Trọng tâm là kết nối đúng người, đúng nhu cầu: người thuê có thông tin minh bạch, đội ngũ vận hành có công cụ mạnh và cộng tác viên kỹ thuật có môi trường để cùng phát triển dài hạn.",
        contactTitle: "Liên hệ hợp tác",
        contactDesc:
            "Cam kết đãi ngộ tốt theo năng lực và cơ hội thăng tiến cao vì doanh nghiệp đang ở giai đoạn đầu. Rất mong được bắt tay với các đồng nghiệp trong tương lai.",
        homeBtn: "Quay về trang chính",
    },
    en: {
        aboutUs: "About Us",
        title: "About the Founder and the Rental Platform Project",
        intro:
            "This section introduces the project creator and the product direction. The platform is designed to give renters and operators a transparent, fast-updating, and centralized experience.",
        founderTitle: "Founder",
        founderNameLabel: "Full name",
        founderName: "Vuong Trung Kien",
        founderDesc:
            "I built this application to create a practical product that can scale and run reliably in production.",
        hiringTitle: "Collaboration Invitation",
        hiringDesc1:
            "I am looking for teammates who share the same passion. A university degree or matching major is not required.",
        hiringDesc2:
            "You are welcome if you are strong in TypeScript/JavaScript and proficient in at least one of these: React.js, Next.js, Node.js, NestJS, PostgreSQL.",
        productTitle: "What the app currently provides",
        productItems: [
            "Rental listing management with multiple user and management roles.",
            "Admins can create, update, and soft-delete property posts.",
            "Viewers can browse maps, view details, save favorites, and send messages.",
            "The dashboard supports system monitoring, live sessions, and audit logs.",
            "The system is deployed in production on VPS with separated backend, database, and frontends.",
        ],
        missionTitle: "Project Mission",
        missionDesc1:
            "Build a rental platform with transparent data, stable operations, strong scalability, and enterprise-grade discipline.",
        missionDesc2:
            "The mission is to connect the right people with the right needs: transparent info for renters, powerful tools for operators, and a long-term growth environment for technical collaborators.",
        contactTitle: "Contact for Collaboration",
        contactDesc:
            "Competitive compensation based on real capability, plus strong growth opportunities in an early-stage company. I look forward to building with future teammates.",
        homeBtn: "Back to Home",
    },
    zh: {
        aboutUs: "关于我们",
        title: "创始人与 Rental Platform 项目介绍",
        intro:
            "本页面用于介绍项目创始人和产品发展方向。平台目标是为租房用户与运营团队提供透明、快速更新、集中化的使用体验。",
        founderTitle: "创始人",
        founderNameLabel: "姓名",
        founderName: "Vương Trung Kiên",
        founderDesc:
            "我创建这个应用，是希望打造一个真正可落地、可扩展，并能稳定运行在生产环境中的产品。",
        hiringTitle: "合作邀请",
        hiringDesc1:
            "我正在寻找志同道合的伙伴共同开发项目。不要求大学学历，也不要求专业完全对口。",
        hiringDesc2:
            "只要你熟练 TypeScript/JavaScript，并至少精通以下一项技术：React.js、Next.js、Node.js、NestJS、PostgreSQL。",
        productTitle: "当前应用能力",
        productItems: [
            "支持多层级用户与管理权限。",
            "管理员可新增/编辑/软删除房源帖子。",
            "普通用户可查看地图、房源详情、收藏并发消息。",
            "仪表盘支持系统监控、在线会话与审计日志。",
            "系统已部署在 VPS 生产环境，前后端与数据库分离。",
        ],
        missionTitle: "项目使命",
        missionDesc1:
            "打造一个数据清晰、运行稳定、易于扩展、具备企业级发展潜力的租房平台。",
        missionDesc2:
            "核心是“正确的人连接正确的需求”：租客获得透明信息，运营团队拥有高效工具，技术伙伴拥有长期成长空间。",
        contactTitle: "合作联系",
        contactDesc:
            "我们承诺根据真实能力提供有竞争力的待遇，并提供高成长空间。期待与未来同事一起建设项目。",
        homeBtn: "返回首页",
    },
    es: {
        aboutUs: "Sobre Nosotros",
        title: "Sobre el Fundador y el Proyecto Rental Platform",
        intro:
            "Esta sección presenta al creador del proyecto y la dirección del producto. La plataforma busca ofrecer a inquilinos y operadores una experiencia transparente, actualizada y centralizada.",
        founderTitle: "Fundador",
        founderNameLabel: "Nombre completo",
        founderName: "Vuong Trung Kien",
        founderDesc:
            "Creé esta aplicación para construir un producto real, escalable y estable en un entorno de producción.",
        hiringTitle: "Invitación para Colaborar",
        hiringDesc1:
            "Estoy buscando colegas con la misma pasión para desarrollar el proyecto. No se requiere título universitario ni carrera específica.",
        hiringDesc2:
            "Solo necesitas dominar TypeScript/JavaScript y manejar al menos una de estas tecnologías: React.js, Next.js, Node.js, NestJS, PostgreSQL.",
        productTitle: "Qué hace actualmente la aplicación",
        productItems: [
            "Gestión de alquileres con múltiples roles de usuario y administración.",
            "Los admins pueden crear, editar y eliminar publicaciones de forma lógica.",
            "Los viewers pueden ver mapa, detalle, favoritos y mensajería.",
            "El panel permite monitoreo del sistema, sesiones activas y auditoría.",
            "El sistema ya está desplegado en producción en VPS con backend, base de datos y frontends separados.",
        ],
        missionTitle: "Misión del Proyecto",
        missionDesc1:
            "Construir una plataforma de alquiler con datos transparentes, operación estable, alta escalabilidad y enfoque serio de producto empresarial.",
        missionDesc2:
            "La misión es conectar a las personas correctas con las necesidades correctas: información clara para inquilinos, herramientas sólidas para operación y crecimiento real para colaboradores técnicos.",
        contactTitle: "Contacto para Colaboración",
        contactDesc:
            "Compromiso de remuneración competitiva según capacidad real y oportunidades de crecimiento altas en una empresa en etapa inicial.",
        homeBtn: "Volver al Inicio",
    },
};

const LANGS: Array<{ key: Lang; label: string }> = [
    { key: "vi", label: "VI" },
    { key: "en", label: "EN" },
    { key: "zh", label: "中文" },
    { key: "es", label: "ES" },
];

export default function AboutPage() {
    const [lang, setLang] = useState<Lang>("vi");
    const text = useMemo(() => COPY[lang], [lang]);

    return (
        <div className="h-full overflow-y-auto bg-slate-100 text-slate-900 pb-28">
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                <div className="flex justify-end mb-3">
                    <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
                        {LANGS.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setLang(item.key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                    lang === item.key
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-700 hover:bg-slate-100"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-10">
                    <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{text.aboutUs}</p>
                    <h1 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">{text.title}</h1>
                    <p className="mt-4 text-slate-700 leading-7">{text.intro}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <section className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                            <Users size={18} />
                            <h2>{text.founderTitle}</h2>
                        </div>
                        <p className="mt-4 text-slate-700 leading-7">
                            <strong>{text.founderNameLabel}:</strong> {text.founderName}.
                        </p>
                        <p className="mt-2 text-slate-700 leading-7">{text.founderDesc}</p>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                            <Briefcase size={18} />
                            <h2>{text.hiringTitle}</h2>
                        </div>
                        <p className="mt-4 text-slate-700 leading-7">{text.hiringDesc1}</p>
                        <p className="mt-2 text-slate-700 leading-7">{text.hiringDesc2}</p>
                    </section>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <section className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                            <Building2 size={18} />
                            <h2>{text.productTitle}</h2>
                        </div>
                        <ul className="mt-4 space-y-2 text-slate-700">
                            {text.productItems.map((item) => (
                                <li key={item}>- {item}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                            <Target size={18} />
                            <h2>{text.missionTitle}</h2>
                        </div>
                        <p className="mt-4 text-slate-700 leading-7">{text.missionDesc1}</p>
                        <p className="mt-2 text-slate-700 leading-7">{text.missionDesc2}</p>
                    </section>
                </div>

                <section className="mt-6 bg-slate-900 text-slate-100 rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-2 font-semibold">
                        <Mail size={18} />
                        <h2>{text.contactTitle}</h2>
                    </div>
                    <p className="mt-3 text-slate-200 leading-7">{text.contactDesc}</p>
                    <a
                        href="mailto:vuongtrungkien77forwork@gmail.com"
                        className="inline-block mt-4 text-blue-300 hover:text-blue-200 underline underline-offset-4"
                    >
                        vuongtrungkien77forwork@gmail.com
                    </a>
                    <div className="mt-6">
                        <Link
                            href="/"
                            className="inline-flex items-center rounded-lg bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-200 transition"
                        >
                            {text.homeBtn}
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
