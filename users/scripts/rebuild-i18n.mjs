import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import extraTranslations from "./rebuild-i18n-extra.mjs";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "src", "i18n", "locales");
const LEGACY_ALIAS_OUTPUT = path.join(ROOT, "src", "i18n", "legacyKeyMap.json");

const LOCALE_CODE_MAP = {
  vi: "vi",
  en: "en",
  es: "es",
  zh: "zh-CN",
  "zh-TW": "zh-TW",
  fr: "fr",
  ko: "ko",
  ja: "ja",
  th: "th",
  id: "id",
};

const RUNTIME_TRANSLATION_PATCHES = {
  vi: {
    common: {
      darkMode: "Chế độ tối",
      lightMode: "Chế độ sáng",
      switchToDarkMode: "Chuyển sang chế độ tối",
      switchToLightMode: "Chuyển sang chế độ sáng",
    },
    property: {
      status: {
        pending: "Đang chờ",
      },
    },
  },
  en: {
    common: {
      darkMode: "Dark mode",
      lightMode: "Light mode",
      switchToDarkMode: "Switch to dark mode",
      switchToLightMode: "Switch to light mode",
    },
    property: {
      status: {
        pending: "Pending",
      },
    },
  },
  es: {
    common: {
      darkMode: "Modo oscuro",
      lightMode: "Modo claro",
      switchToDarkMode: "Cambiar a modo oscuro",
      switchToLightMode: "Cambiar a modo claro",
    },
    property: {
      status: {
        pending: "Pendiente",
      },
    },
  },
  "zh-CN": {
    common: {
      darkMode: "深色模式",
      lightMode: "浅色模式",
      switchToDarkMode: "切换到深色模式",
      switchToLightMode: "切换到浅色模式",
    },
    property: {
      status: {
        pending: "待处理",
      },
    },
  },
  "zh-TW": {
    common: {
      darkMode: "深色模式",
      lightMode: "淺色模式",
      switchToDarkMode: "切換到深色模式",
      switchToLightMode: "切換到淺色模式",
    },
    property: {
      status: {
        pending: "待處理",
      },
    },
  },
  fr: {
    common: {
      darkMode: "Mode sombre",
      lightMode: "Mode clair",
      switchToDarkMode: "Passer au mode sombre",
      switchToLightMode: "Passer au mode clair",
    },
    property: {
      status: {
        pending: "En attente",
      },
    },
  },
  ko: {
    common: {
      darkMode: "다크 모드",
      lightMode: "라이트 모드",
      switchToDarkMode: "다크 모드로 전환",
      switchToLightMode: "라이트 모드로 전환",
    },
    property: {
      status: {
        pending: "대기 중",
      },
    },
  },
  ja: {
    common: {
      darkMode: "ダークモード",
      lightMode: "ライトモード",
      switchToDarkMode: "ダークモードに切り替え",
      switchToLightMode: "ライトモードに切り替え",
    },
    property: {
      status: {
        pending: "保留中",
      },
    },
  },
  th: {
    common: {
      darkMode: "โหมดมืด",
      lightMode: "โหมดสว่าง",
      switchToDarkMode: "สลับเป็นโหมดมืด",
      switchToLightMode: "สลับเป็นโหมดสว่าง",
    },
    property: {
      status: {
        pending: "รอดำเนินการ",
      },
    },
  },
  id: {
    common: {
      darkMode: "Mode gelap",
      lightMode: "Mode terang",
      switchToDarkMode: "Beralih ke mode gelap",
      switchToLightMode: "Beralih ke mode terang",
    },
    property: {
      status: {
        pending: "Menunggu",
      },
    },
  },
};

const LEGACY_KEY_MAP = {
  loading: "common.loading",
  go_back: "common.goBack",
  hello: "common.hello",
  guest: "common.guest",
  search: "common.search",
  cancel: "common.cancel",
  apply: "common.apply",
  reset: "common.reset",
  from: "common.from",
  to: "common.to",
  search_placeholder: "common.searchPlaceholder",
  upload: "common.upload",
  try_again: "common.tryAgain",
  save_changes: "common.saveChanges",
  saving: "common.saving",
  homepage: "navigation.home",
  post_listing_tab: "navigation.postListing",
  profile_tab: "navigation.profile",
  saved: "navigation.saved",
  my_listings: "navigation.myProperties",
  chats: "navigation.chats",
  settings: "navigation.settings",
  accounts_center: "navigation.accountsCenter",
  app_language: "navigation.appLanguage",
  help_support: "navigation.helpSupport",
  about: "navigation.about",
  log_out: "navigation.logOut",
  available: "property.status.available",
  rented: "property.status.rented",
  month_abbr: "property.units.monthAbbr",
  million: "property.units.million",
  vnd_per_month: "property.units.vndPerMonth",
  houses: "property.list.countLabel",
  add_property: "property.add.title",
  property_type: "property.form.propertyTypeLabel",
  house: "property.types.house",
  commercial_space: "property.types.commercialSpace",
  apartment: "property.types.apartment",
  condominium: "property.types.condominium",
  hotel: "property.types.hotel",
  city: "property.form.cityLabel",
  district: "property.form.districtLabel",
  address: "property.form.addressLabel",
  street_address: "property.form.streetAddressLabel",
  exact_location: "property.form.exactLocationLabel",
  drag_pin: "property.form.dragPinHint",
  use_current_location: "property.form.useCurrentLocation",
  geocoding_loading: "property.form.geocodingLoading",
  price_vnd: "property.form.priceLabel",
  contact_phone: "property.form.contactPhoneLabel",
  photos: "property.form.photosLabel",
  videos: "property.form.videosLabel",
  click_add_photos: "property.form.addPhotosHint",
  click_add_videos: "property.form.addVideosHint",
  preview_image: "property.form.previewImage",
  uploading_cloud: "property.form.uploadingMedia",
  advanced_filter: "property.filters.title",
  price_range: "property.filters.priceRange",
  location_area: "property.filters.locationArea",
  province_city: "property.filters.provinceCity",
  min_bedrooms: "property.filters.minBedrooms",
  bathroom_type: "property.filters.bathroomType",
  submitting_property: "property.add.submitting",
  submitted_success: "property.add.submitSuccess",
  submitted_failed: "property.add.submitError",
  submit_property: "property.add.submitButton",
  login_to_add: "property.add.loginRequired",
  price: "property.labels.price",
  bedrooms: "property.fields.bedrooms",
  bathrooms: "property.fields.bathrooms",
  private_bath: "property.fields.privateBath",
  shared_bath: "property.fields.sharedBath",
  area: "property.fields.area",
  description: "property.fields.description",
  no_description: "property.detail.noDescription",
  posted_by: "property.detail.postedBy",
  no_poster_info: "property.detail.noPosterInfo",
  no_info: "property.detail.notFound",
  manage_listing: "property.detail.manageListing",
  contact_now: "property.detail.contactNow",
  view_details: "property.actions.viewDetails",
  no_properties_found: "property.list.emptyTitle",
  display_mode: "property.list.displayMode",
  add_listing_hint: "profile.myPropertiesSectionDescription",
  my_listings_title: "profile.myPropertiesTitle",
  no_saved_properties: "profile.savedEmptyTitle",
  save_properties_hint: "profile.savedSectionDescription",
  no_listings_yet: "profile.myPropertiesEmptyTitle",
  saved_properties: "profile.savedSectionTitle",
  welcome_home: "profile.welcomeTitle",
  profile_welcome_desc: "profile.welcomeDescription",
  profile_updated_success: "profile.messages.profileUpdated",
  password_updated_success: "profile.messages.passwordUpdated",
  name_change_limit: "profile.messages.nameChangeLimit",
  profile_footer_hint: "profile.footerHint",
  edit_profile: "profile.editProfile",
  display_name: "profile.displayName",
  bio: "profile.bio",
  bio_placeholder: "profile.bioPlaceholder",
  no_bio_yet: "profile.noBioYet",
  change_limit: "profile.changeLimit",
  edit_cover: "profile.editCover",
  edit_profile_success: "profile.messages.editSuccess",
  edit_profile_fail: "profile.messages.editFailed",
  first_name: "profile.account.firstNameLabel",
  last_name: "profile.account.lastNameLabel",
  email_label: "profile.account.emailLabel",
  personal_info: "profile.account.personalInfoTitle",
  security_settings: "profile.account.securityTitle",
  current_password: "profile.account.currentPasswordLabel",
  new_password: "profile.account.newPasswordLabel",
  confirm_new_password: "profile.account.confirmPasswordLabel",
  update_password: "profile.account.updatePasswordButton",
  account_privacy_title: "profile.account.heroTitle",
  account_privacy_desc: "profile.account.heroDescription",
  conversations: "chat.conversationsTitle",
  online: "chat.online",
  offline: "chat.offline",
  view_property: "chat.viewProperty",
  start_chat_title: "chat.startTitle",
  start_chat_desc: "chat.startDescription",
  seen: "chat.seen",
  sent: "chat.sent",
  you_prefix: "chat.youPrefix",
  select_conversation: "chat.selectConversationTitle",
  chat_hint: "chat.selectConversationDescription",
  type_message: "chat.typeMessagePlaceholder",
  please_sign_in: "chat.signInRequiredTitle",
  chat_sign_in_required: "chat.signInRequiredDescription",
  no_conversations: "chat.emptyTitle",
  no_conversations_desc: "chat.emptyDescription",
  auto_chat_message: "chat.initialPropertyMessage",
  chat_count_singular: "chat.countSingular",
  chat_count_plural: "chat.countPlural",
  login_prompt_title: "auth.loginPrompt.title",
  login_prompt_desc: "auth.loginPrompt.description",
  login_title: "auth.login.title",
  login_subtitle: "auth.login.subtitle",
  hero_login_title: "auth.login.heroTitle",
  hero_login_desc: "auth.login.heroDescription",
  email_username_placeholder: "auth.login.emailOrUsernamePlaceholder",
  password_placeholder: "auth.shared.passwordPlaceholder",
  sign_in_btn: "auth.shared.signInButton",
  signing_in: "auth.login.submitting",
  no_account: "auth.login.noAccount",
  create_one: "auth.login.createOne",
  register_title: "auth.register.title",
  register_subtitle: "auth.register.subtitle",
  hero_register_title: "auth.register.heroTitle",
  hero_register_desc: "auth.register.heroDescription",
  logo_subtitle: "auth.shared.logoSubtitle",
  username_placeholder: "auth.register.usernamePlaceholder",
  email_placeholder: "auth.register.emailPlaceholder",
  phone_placeholder: "auth.register.phonePlaceholder",
  first_name_placeholder: "auth.register.firstNamePlaceholder",
  last_name_placeholder: "auth.register.lastNamePlaceholder",
  confirm_password_placeholder: "auth.register.confirmPasswordPlaceholder",
  create_account_btn: "auth.register.createAccountButton",
  creating_account: "auth.register.creatingAccount",
  already_have_account: "auth.register.alreadyHaveAccount",
  sign_in_link: "auth.shared.signInLink",
  password_requirements: "auth.register.passwordRequirements",
  accept_terms_label: "auth.register.acceptTermsLabel",
  terms_of_service: "legal.terms.linkLabel",
  privacy_policy: "legal.privacy.linkLabel",
  err_accept_terms: "auth.validation.acceptTermsRequired",
  err_enter_email_username: "auth.validation.emailOrUsernameRequired",
  err_enter_password: "auth.validation.passwordRequired",
  err_login_failed: "auth.validation.loginFailed",
  err_enter_first_name: "auth.validation.firstNameRequired",
  err_enter_last_name: "auth.validation.lastNameRequired",
  err_enter_full_name: "auth.validation.fullNameRequired",
  err_enter_username: "auth.validation.usernameRequired",
  err_username_length: "auth.validation.usernameLength",
  err_enter_email: "auth.validation.emailRequired",
  err_invalid_email: "auth.validation.emailInvalid",
  err_enter_phone: "auth.validation.phoneRequired",
  err_confirm_password: "auth.validation.confirmPasswordRequired",
  err_passwords_mismatch: "auth.validation.passwordsMismatch",
  err_complete_captcha: "auth.validation.captchaRequired",
  help_title: "help.centerTitle",
  help_subtitle: "help.centerSubtitle",
  search_help_placeholder: "help.searchPlaceholder",
  faq_title: "help.faqTitle",
  contact_us: "help.contact.title",
  contact_email: "help.contact.email",
  contact_chat: "help.contact.chat",
  contact_call: "help.contact.call",
  avg_response_time: "help.contact.avgResponseTime",
  still_need_help: "help.contact.stillNeedHelp",
  support_ticket_title: "help.ticket.title",
  support_success_msg: "help.ticket.successMessage",
  support_error_msg: "help.ticket.errorMessage",
  support_subject_label: "help.ticket.subjectLabel",
  support_subject_placeholder: "help.ticket.subjectPlaceholder",
  support_priority_label: "help.ticket.priorityLabel",
  support_priority_low: "help.ticket.priorities.low",
  support_priority_medium: "help.ticket.priorities.medium",
  support_priority_high: "help.ticket.priorities.high",
  support_message_label: "help.ticket.messageLabel",
  support_message_placeholder: "help.ticket.messagePlaceholder",
  support_submit_btn: "help.ticket.submitButton",
  support_submitting_btn: "help.ticket.submittingButton",
  about_us: "about.header",
  about_title: "about.title",
  about_intro: "about.intro",
  about_founder_title: "about.founder.title",
  about_founder_name_label: "about.founder.nameLabel",
  about_founder_name: "about.founder.name",
  about_founder_desc: "about.founder.description",
  about_hiring_title: "about.hiring.title",
  about_hiring_desc1: "about.hiring.descriptionPrimary",
  about_hiring_desc2: "about.hiring.descriptionSecondary",
  about_product_title: "about.product.title",
  about_mission_title: "about.mission.title",
  about_mission_desc1: "about.mission.descriptionPrimary",
  about_mission_desc2: "about.mission.descriptionSecondary",
  about_contact_title: "about.contact.title",
  about_contact_desc: "about.contact.description",
  about_home_btn: "about.contact.homeButton",
  terms_title: "legal.terms.title",
  terms_updated: "legal.terms.updated",
  terms_intro: "legal.terms.intro",
  privacy_title: "legal.privacy.title",
  privacy_updated: "legal.privacy.updated",
  privacy_welcome: "legal.privacy.welcome",
  privacy_intro: "legal.privacy.intro",
  privacy_agreement: "legal.privacy.agreement",
};

function camelCase(value) {
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isUnsafeObjectKey(key) {
  return typeof key === "string" && UNSAFE_OBJECT_KEYS.has(key);
}

function setDeep(target, pathValue, value) {
  const parts = pathValue.split(".");
  let cursor = target;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const isLast = index === parts.length - 1;
    const isArrayIndex = /^\d+$/.test(part);
    const key = isArrayIndex ? Number(part) : part;
    if (isUnsafeObjectKey(key)) {
      throw new Error(`Unsafe translation path segment: ${part}`);
    }
    if (isLast) {
      cursor[key] = value;
      return;
    }
    const nextPart = parts[index + 1];
    const nextIsArrayIndex = /^\d+$/.test(nextPart);
    if (cursor[key] == null) cursor[key] = nextIsArrayIndex ? [] : Object.create(null);
    cursor = cursor[key];
  }
}

function mergeDeep(target, source) {
  if (source == null) return target;
  if (Array.isArray(source)) {
    const baseArray = Array.isArray(target) ? target : [];
    return source.map((item, index) => mergeDeep(baseArray[index], item));
  }
  if (typeof source !== "object") return source;
  const output = Array.isArray(target) ? [...target] : Object.assign(Object.create(null), target || {});
  for (const [key, value] of Object.entries(source)) {
    if (isUnsafeObjectKey(key)) continue;
    output[key] = mergeDeep(output[key], value);
  }
  return output;
}

function formatJsonObject(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function extractLegacyDictionaries() {
  const content = execSync("git show HEAD:users/src/context/LanguageContext.tsx", {
    cwd: path.dirname(ROOT),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const startToken = "const dictionaries: Record<Language, Translations> = ";
  const startIndex = content.indexOf(startToken);
  if (startIndex === -1) throw new Error("Unable to locate legacy dictionaries.");
  const objectStart = content.indexOf("{", startIndex);
  const interfaceIndex = content.indexOf("interface LanguageContextType", objectStart);
  if (interfaceIndex === -1) throw new Error("Unable to determine the end of the legacy dictionaries.");
  const objectEnd = content.lastIndexOf("};", interfaceIndex);
  if (objectEnd === -1) throw new Error("Unable to locate the closing brace of the legacy dictionaries.");
  const objectLiteral = content.slice(objectStart, objectEnd + 1);
  return Function(`"use strict"; return (${objectLiteral});`)();
}

function mapLegacyKeyToPath(key) {
  if (LEGACY_KEY_MAP[key]) return LEGACY_KEY_MAP[key];
  let match = key.match(/^about_product_item(\d+)$/);
  if (match) return `about.product.items.${Number(match[1]) - 1}`;
  match = key.match(/^faq_q(\d+)$/);
  if (match) return `help.faq.items.${Number(match[1]) - 1}.question`;
  match = key.match(/^faq_a(\d+)$/);
  if (match) return `help.faq.items.${Number(match[1]) - 1}.answer`;
  match = key.match(/^tour_step(\d+)_(title|desc)$/);
  if (match) return `home.onboarding.steps.${Number(match[1]) - 1}.${match[2] === "title" ? "title" : "description"}`;
  match = key.match(/^tour_done_(title|desc)$/);
  if (match) return `home.onboarding.complete.${match[1] === "title" ? "title" : "description"}`;
  if (key === "tour_skip") return "home.onboarding.skip";
  if (key === "tour_next") return "home.onboarding.next";
  if (key === "tour_finish") return "home.onboarding.finish";
  match = key.match(/^terms_section(\d+)_(title|content)$/);
  if (match) return `legal.terms.sections.${Number(match[1]) - 1}.${match[2]}`;
  match = key.match(/^privacy_section(\d+)_(title|content)$/);
  if (match) return `legal.privacy.sections.${Number(match[1]) - 1}.${match[2]}`;
  match = key.match(/^support_priority_(low|medium|high)$/);
  if (match) return `help.ticket.priorities.${camelCase(match[1])}`;
  match = key.match(/^rule_(length|uppercase|lowercase|number|special)$/);
  if (match) return `auth.register.passwordRules.${camelCase(match[1])}`;
  return null;
}

function buildLocalePayload(legacyLocaleMessages) {
  const output = Object.create(null);
  for (const [legacyKey, translatedValue] of Object.entries(legacyLocaleMessages)) {
    const newPath = mapLegacyKeyToPath(legacyKey);
    if (!newPath) continue;
    setDeep(output, newPath, translatedValue);
  }
  return output;
}

function main() {
  const legacyDictionaries = extractLegacyDictionaries();
  const aliases = Object.create(null);
  const builtLocales = Object.create(null);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const [legacyLocale, translatedMessages] of Object.entries(legacyDictionaries)) {
    const locale = LOCALE_CODE_MAP[legacyLocale];
    if (!locale) continue;
    const mappedPayload = buildLocalePayload(translatedMessages);
    const extraPayload = extraTranslations[locale] ?? {};
    const runtimePatch = RUNTIME_TRANSLATION_PATCHES[locale] ?? {};
    builtLocales[locale] = mergeDeep(mergeDeep(mappedPayload, extraPayload), runtimePatch);
  }

  const englishLocale = builtLocales.en ?? {};
  for (const locale of Object.keys(builtLocales)) {
    const alignedPayload = locale === "en" ? englishLocale : mergeDeep(englishLocale, builtLocales[locale]);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${locale}.json`), formatJsonObject(alignedPayload));
  }

  const legacyKeys = Array.from(
    new Set(
      Object.values(legacyDictionaries).flatMap((dictionary) => Object.keys(dictionary ?? {}))
    )
  );
  for (const legacyKey of Object.keys(LEGACY_KEY_MAP)) legacyKeys.push(legacyKey);
  for (const legacyKey of legacyKeys) {
    const mappedPath = mapLegacyKeyToPath(legacyKey);
    if (mappedPath) aliases[legacyKey] = mappedPath;
  }
  fs.mkdirSync(path.dirname(LEGACY_ALIAS_OUTPUT), { recursive: true });
  fs.writeFileSync(LEGACY_ALIAS_OUTPUT, formatJsonObject(aliases));
}

main();
