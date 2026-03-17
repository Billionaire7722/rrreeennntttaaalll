const extraTranslations = {
  en: {
    common: {
      from: "From...",
      to: "To...",
      reset: "Reset",
      apply: "Apply",
      cancel: "Cancel",
      saveChanges: "Save Changes",
      upload: "Upload",
      hello: "Hello",
      guest: "Guest",
      search: "Search",
      saving: "Saving...",
      loadMore: "Load more",
      showingOf: "Showing {shown} of {total}",
      showingRange: "Showing {start}-{end} of {total}",
      theme: "Theme",
      view: "View",
      edit: "Edit",
      delete: "Delete"
    },
    property: {
      detail: {
        noDescription: "No description available.",
        manageListing: "Manage Listing"
      },
      add: {
        title: "Add Property"
      },
      form: {
        propertyTypeLabel: "Property Type",
        cityLabel: "City",
        districtLabel: "District",
        addressLabel: "Address",
        exactLocationLabel: "Exact Location",
        dragPinHint: "Drag the pin to the exact property location",
        priceLabel: "Price (VND)",
        contactPhoneLabel: "Contact Phone",
        photosLabel: "Photos",
        videosLabel: "Videos",
        addPhotosHint: "Click to add photos (max 7)",
        addVideosHint: "Click to add videos (max 2)",
        streetAddressLabel: "Street Address",
        useCurrentLocation: "Use my current location",
        geocodingLoading: "Searching location...",
        uploadingMedia: "Uploading photos and videos...",
        previewImage: "Preview Image",
        locationError: "Unable to retrieve your location.",
        invalidImageType: "Please upload PNG, JPG, GIF, WebP, BMP, or AVIF images only.",
        imageUploadError: "Failed to upload one or more images.",
        videoUploadError: "Failed to upload one or more videos."
      },
      filters: {
        title: "Advanced Filter",
        priceRange: "Price Range (VND)",
        locationArea: "Location",
        provinceCity: "Province / City",
        minBedrooms: "Minimum Bedrooms",
        bathroomType: "Bathroom Type"
      },
      types: {
        house: "House",
        commercialSpace: "Commercial Space",
        apartment: "Apartment",
        condominium: "Condominium",
        hotel: "Hotel"
      },
      list: {
        displayMode: "Display mode",
        emptyTitle: "No properties found",
        countLabel: "properties",
        viewModes: {
          grid: "Grid",
          list: "List",
          compact: "Compact"
        }
      },
      actions: {
        viewDetails: "View details"
      },
      edit: {
        title: "Edit property",
        submitSuccess: "Property updated successfully!",
        submitError: "Failed to update property",
        nameLabel: "Property name"
      },
      messages: {
        deleteConfirm: "Are you sure you want to delete this property? This action cannot be undone.",
        deleteFailed: "Failed to delete property."
      },
      media: {
        videoUploaded: "Video {index} uploaded"
      }
    },
    chat: {
      online: "Online",
      offline: "Offline",
      viewProperty: "View Property",
      startTitle: "Start a conversation",
      startDescription: "Say hello to start chatting",
      seen: "Seen",
      sent: "Sent",
      selectConversationTitle: "Select a conversation",
      selectConversationDescription: "Modern messenger style, connect with landlords and customers instantly.",
      typeMessagePlaceholder: "Type a message...",
      signInRequiredTitle: "Please Sign In",
      signInRequiredDescription: "You need to sign in to see your chat history.",
      emptyTitle: "No conversations yet",
      emptyDescription: "Your chat history will appear here.",
      initialPropertyMessage: "Hello, I'd like to contact you about the listing \"{title}\" (ID: {id}).",
      loadingMessages: "Loading messages..."
    },
    profile: {
      displayName: "Display Name",
      noBioYet: "Tell renters a bit about yourself",
      messages: {
        editSuccess: "Profile updated successfully",
        editFailed: "Profile update failed",
        nameChangeLimit: "You can only change your name once every 30 days."
      },
      savedEmptyTitle: "No saved properties",
      savedSectionDescription: "Save listings you like here",
      myPropertiesEmptyTitle: "No listings yet",
      myPropertiesSectionDescription: "Start posting your first listing",
      sectionsTitle: "Sections",
      sectionsDescription: "Choose one area to manage at a time.",
      uploadAvatarError: "Failed to upload profile picture. Please try again.",
      uploadCoverError: "Failed to upload cover image.",
      createdOn: "Created {date}",
      summaryTitle: "Summary"
    },
    auth: {
      loginPrompt: {
        title: "Login Required",
        description: "Sign in to your account to post listings and connect with thousands of potential tenants."
      }
    },
    help: {
      ticket: {
        successMessage: "Your support request has been submitted successfully. We'll get back to you soon.",
        errorMessage: "We couldn't submit your request. Please try again.",
        subjectLabel: "Subject",
        subjectPlaceholder: "Tell us what you need help with",
        priorityLabel: "Priority",
        priorities: {
          low: "Low",
          medium: "Medium",
          high: "High"
        },
        messageLabel: "Message",
        messagePlaceholder: "Describe the issue in as much detail as possible",
        submitButton: "Submit ticket",
        submittingButton: "Submitting...",
        submittedTitle: "Submitted!",
        redirectingBack: "Redirecting back..."
      }
    },
    about: {
      header: "About",
      title: "Helping renters and landlords connect with confidence",
      intro: "YourHome makes rental discovery simpler, faster, and more trustworthy for everyone involved.",
      founder: {
        title: "Founder",
        nameLabel: "Built by",
        name: "Vuong Trung Kien",
        description: "We care about making rental discovery feel clear, human, and dependable."
      },
      hiring: {
        title: "We're growing",
        descriptionPrimary: "We're always excited to meet thoughtful people who care about product quality, trust, and the renter experience.",
        descriptionSecondary: "If that sounds like you, we'd love to hear from you."
      },
      product: {
        title: "What YourHome helps you do",
        items: [
          "Browse verified rental listings on an interactive map.",
          "Filter by price, area, and location in seconds.",
          "Save properties and revisit them later.",
          "Message owners directly without leaving the app.",
          "Post and manage your own listings with ease."
        ]
      },
      mission: {
        title: "Our mission",
        descriptionPrimary: "We want rental discovery to feel practical and transparent instead of stressful and fragmented.",
        descriptionSecondary: "Clearer listings, faster conversations, and better tools help both renters and landlords move with confidence."
      },
      contact: {
        title: "Contact",
        description: "Questions, feedback, or partnership ideas? Reach out any time and we'll get back to you.",
        homeButton: "Back to home"
      }
    },
    user: {
      profileTitle: "User profile",
      notFoundTitle: "User not found",
      notFoundDescription: "This user could not be found or may have been removed.",
      messageUser: "Message user",
      propertiesByName: "Properties by {name}",
      noPropertiesTitle: "No properties yet",
      noPropertiesDescription: "This user hasn't posted any rental properties yet.",
      selfMessageError: "You cannot message yourself."
    },
    errors: {
      global: {
        title: "Something went wrong!",
        defaultDescription: "An unexpected error occurred."
      },
      notFound: {
        title: "Page not found",
        description: "The page you are looking for does not exist.",
        action: "Go home"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome. All rights reserved."
    }
  },
  vi: {
    common: {
      from: "Từ...",
      to: "Đến...",
      reset: "Đặt lại",
      apply: "Áp dụng",
      cancel: "Hủy",
      saveChanges: "Lưu thay đổi",
      upload: "Tải lên",
      hello: "Xin chào",
      guest: "Khách",
      search: "Tìm kiếm",
      saving: "Đang lưu...",
      loadMore: "Xem thêm",
      showingOf: "Hiển thị {shown} trên {total}",
      showingRange: "Hiển thị {start}-{end} trên {total}",
      theme: "Giao diện",
      view: "Xem",
      edit: "Chỉnh sửa",
      delete: "Xóa"
    },
    property: {
      detail: {
        noDescription: "Chưa có mô tả.",
        manageListing: "Quản lý tin đăng"
      },
      add: {
        title: "Thêm bất động sản"
      },
      form: {
        propertyTypeLabel: "Loại bất động sản",
        cityLabel: "Thành phố",
        districtLabel: "Quận / Huyện",
        addressLabel: "Địa chỉ",
        exactLocationLabel: "Vị trí chính xác",
        dragPinHint: "Kéo ghim để chọn đúng vị trí bất động sản",
        priceLabel: "Giá (VNĐ)",
        contactPhoneLabel: "Số điện thoại liên hệ",
        photosLabel: "Hình ảnh",
        videosLabel: "Video",
        addPhotosHint: "Nhấn để thêm ảnh (tối đa 7)",
        addVideosHint: "Nhấn để thêm video (tối đa 2)",
        streetAddressLabel: "Địa chỉ chi tiết",
        useCurrentLocation: "Dùng vị trí hiện tại",
        geocodingLoading: "Đang tìm vị trí...",
        uploadingMedia: "Đang tải ảnh và video lên...",
        previewImage: "Xem ảnh",
        locationError: "Không thể lấy vị trí của bạn.",
        invalidImageType: "Vui lòng chỉ tải lên ảnh PNG, JPG, GIF, WebP, BMP hoặc AVIF.",
        imageUploadError: "Tải lên một hoặc nhiều ảnh thất bại.",
        videoUploadError: "Tải lên một hoặc nhiều video thất bại."
      },
      filters: {
        title: "Bộ lọc nâng cao",
        priceRange: "Khoảng giá (VNĐ)",
        locationArea: "Khu vực",
        provinceCity: "Tỉnh / Thành phố",
        minBedrooms: "Số phòng ngủ tối thiểu",
        bathroomType: "Loại phòng tắm"
      },
      types: {
        house: "Nhà",
        commercialSpace: "Mặt bằng kinh doanh",
        apartment: "Căn hộ",
        condominium: "Chung cư",
        hotel: "Khách sạn"
      },
      list: {
        displayMode: "Chế độ hiển thị",
        emptyTitle: "Không tìm thấy bất động sản",
        countLabel: "nhà",
        viewModes: {
          grid: "Lưới",
          list: "Danh sách",
          compact: "Thu gọn"
        }
      },
      actions: {
        viewDetails: "Xem chi tiết"
      },
      edit: {
        title: "Chỉnh sửa bất động sản",
        submitSuccess: "Cập nhật tin đăng thành công!",
        submitError: "Cập nhật tin đăng thất bại",
        nameLabel: "Tên bất động sản"
      },
      messages: {
        deleteConfirm: "Bạn có chắc muốn xóa tin đăng này không? Hành động này không thể hoàn tác.",
        deleteFailed: "Xóa tin đăng thất bại."
      },
      media: {
        videoUploaded: "Đã tải lên video {index}"
      }
    },
    chat: {
      online: "Trực tuyến",
      offline: "Ngoại tuyến",
      viewProperty: "Xem bất động sản",
      startTitle: "Bắt đầu cuộc trò chuyện",
      startDescription: "Gửi lời chào để bắt đầu nhắn tin",
      seen: "Đã xem",
      sent: "Đã gửi",
      selectConversationTitle: "Chọn một cuộc trò chuyện",
      selectConversationDescription: "Giao diện nhắn tin hiện đại giúp bạn kết nối ngay với chủ nhà và khách thuê.",
      typeMessagePlaceholder: "Nhập tin nhắn...",
      signInRequiredTitle: "Vui lòng đăng nhập",
      signInRequiredDescription: "Bạn cần đăng nhập để xem lịch sử trò chuyện.",
      emptyTitle: "Chưa có cuộc trò chuyện nào",
      emptyDescription: "Lịch sử trò chuyện của bạn sẽ xuất hiện tại đây.",
      initialPropertyMessage: "Xin chào, tôi muốn liên hệ về tin đăng \"{title}\" (ID: {id}).",
      loadingMessages: "Đang tải tin nhắn..."
    },
    profile: {
      displayName: "Tên hiển thị",
      noBioYet: "Hãy chia sẻ đôi chút về bạn với người thuê",
      messages: {
        editSuccess: "Cập nhật hồ sơ thành công",
        editFailed: "Cập nhật hồ sơ thất bại",
        nameChangeLimit: "Bạn chỉ có thể đổi tên một lần mỗi 30 ngày."
      },
      savedEmptyTitle: "Không có bất động sản đã lưu",
      savedSectionDescription: "Lưu các tin đăng bạn thích tại đây",
      myPropertiesEmptyTitle: "Chưa có tin đăng nào",
      myPropertiesSectionDescription: "Hãy bắt đầu đăng tin đầu tiên của bạn",
      sectionsTitle: "Danh mục",
      sectionsDescription: "Chọn từng khu vực để quản lý dễ dàng hơn.",
      uploadAvatarError: "Tải ảnh đại diện thất bại. Vui lòng thử lại.",
      uploadCoverError: "Tải ảnh bìa thất bại.",
      createdOn: "Đăng ngày {date}",
      summaryTitle: "Tổng quan"
    },
    auth: {
      loginPrompt: {
        title: "Yêu cầu đăng nhập",
        description: "Đăng nhập để đăng tin và kết nối với hàng nghìn khách thuê tiềm năng."
      }
    },
    help: {
      ticket: {
        successMessage: "Yêu cầu hỗ trợ của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm.",
        errorMessage: "Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.",
        subjectLabel: "Chủ đề",
        subjectPlaceholder: "Hãy cho chúng tôi biết bạn cần hỗ trợ điều gì",
        priorityLabel: "Mức độ ưu tiên",
        priorities: {
          low: "Thấp",
          medium: "Trung bình",
          high: "Cao"
        },
        messageLabel: "Nội dung",
        messagePlaceholder: "Mô tả vấn đề của bạn càng chi tiết càng tốt",
        submitButton: "Gửi yêu cầu",
        submittingButton: "Đang gửi...",
        submittedTitle: "Đã gửi!",
        redirectingBack: "Đang quay lại..."
      }
    },
    about: {
      header: "Giới thiệu",
      title: "Kết nối người thuê và chủ nhà một cách đáng tin cậy",
      intro: "YourHome giúp việc tìm nhà thuê trở nên đơn giản hơn, nhanh hơn và đáng tin cậy hơn cho mọi người.",
      founder: {
        title: "Người sáng lập",
        nameLabel: "Xây dựng bởi",
        name: "Vương Trung Kiên",
        description: "Chúng tôi muốn trải nghiệm tìm nhà trở nên rõ ràng, gần gũi và đáng tin cậy."
      },
      hiring: {
        title: "Chúng tôi đang phát triển",
        descriptionPrimary: "Chúng tôi luôn muốn gặp những người quan tâm đến chất lượng sản phẩm, niềm tin và trải nghiệm của người thuê.",
        descriptionSecondary: "Nếu điều đó cũng là điều bạn quan tâm, hãy liên hệ với chúng tôi."
      },
      product: {
        title: "YourHome giúp bạn làm gì",
        items: [
          "Duyệt tin cho thuê đã xác minh trên bản đồ tương tác.",
          "Lọc nhanh theo giá, diện tích và vị trí.",
          "Lưu các bất động sản và xem lại sau.",
          "Nhắn tin trực tiếp với chủ nhà ngay trong ứng dụng.",
          "Đăng và quản lý tin của bạn một cách dễ dàng."
        ]
      },
      mission: {
        title: "Sứ mệnh của chúng tôi",
        descriptionPrimary: "Chúng tôi muốn việc tìm nhà thuê trở nên minh bạch và thiết thực thay vì căng thẳng và rời rạc.",
        descriptionSecondary: "Tin đăng rõ ràng hơn, cuộc trò chuyện nhanh hơn và công cụ tốt hơn sẽ giúp cả người thuê lẫn chủ nhà tự tin hơn."
      },
      contact: {
        title: "Liên hệ",
        description: "Bạn có câu hỏi, góp ý hoặc ý tưởng hợp tác? Hãy liên hệ bất cứ lúc nào và chúng tôi sẽ sớm phản hồi.",
        homeButton: "Về trang chủ"
      }
    },
    user: {
      profileTitle: "Hồ sơ người dùng",
      notFoundTitle: "Không tìm thấy người dùng",
      notFoundDescription: "Người dùng này không còn tồn tại hoặc đã bị xóa.",
      messageUser: "Nhắn tin",
      propertiesByName: "Tin đăng của {name}",
      noPropertiesTitle: "Chưa có bất động sản nào",
      noPropertiesDescription: "Người dùng này chưa đăng tin cho thuê nào.",
      selfMessageError: "Bạn không thể nhắn tin cho chính mình."
    },
    errors: {
      global: {
        title: "Đã xảy ra lỗi!",
        defaultDescription: "Đã xảy ra lỗi không mong muốn."
      },
      notFound: {
        title: "Không tìm thấy trang",
        description: "Trang bạn đang tìm không tồn tại.",
        action: "Về trang chủ"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome. Bảo lưu mọi quyền."
    }
  },
  es: {
    common: {
      from: "Desde...",
      to: "Hasta...",
      reset: "Restablecer",
      apply: "Aplicar",
      cancel: "Cancelar",
      saveChanges: "Guardar cambios",
      upload: "Subir",
      hello: "Hola",
      guest: "Invitado",
      search: "Buscar",
      saving: "Guardando...",
      loadMore: "Ver más",
      showingOf: "Mostrando {shown} de {total}",
      showingRange: "Mostrando {start}-{end} de {total}",
      theme: "Tema",
      view: "Ver",
      edit: "Editar",
      delete: "Eliminar"
    },
    property: {
      detail: {
        noDescription: "No hay descripción disponible.",
        manageListing: "Administrar anuncio"
      },
      add: {
        title: "Agregar propiedad"
      },
      form: {
        propertyTypeLabel: "Tipo de propiedad",
        cityLabel: "Ciudad",
        districtLabel: "Distrito",
        addressLabel: "Dirección",
        exactLocationLabel: "Ubicación exacta",
        dragPinHint: "Arrastra el marcador hasta la ubicación exacta de la propiedad",
        priceLabel: "Precio (VND)",
        contactPhoneLabel: "Teléfono de contacto",
        photosLabel: "Fotos",
        videosLabel: "Videos",
        addPhotosHint: "Haz clic para agregar fotos (máx. 7)",
        addVideosHint: "Haz clic para agregar videos (máx. 2)",
        streetAddressLabel: "Dirección detallada",
        useCurrentLocation: "Usar mi ubicación actual",
        geocodingLoading: "Buscando ubicación...",
        uploadingMedia: "Subiendo fotos y videos...",
        previewImage: "Vista previa",
        locationError: "No se pudo obtener tu ubicación.",
        invalidImageType: "Sube solo imágenes PNG, JPG, GIF, WebP, BMP o AVIF.",
        imageUploadError: "No se pudieron subir una o más imágenes.",
        videoUploadError: "No se pudieron subir uno o más videos."
      },
      filters: {
        title: "Filtro avanzado",
        priceRange: "Rango de precio (VND)",
        locationArea: "Ubicación",
        provinceCity: "Provincia / Ciudad",
        minBedrooms: "Dormitorios mínimos",
        bathroomType: "Tipo de baño"
      },
      types: {
        house: "Casa",
        commercialSpace: "Local comercial",
        apartment: "Apartamento",
        condominium: "Condominio",
        hotel: "Hotel"
      },
      list: {
        displayMode: "Modo de visualización",
        emptyTitle: "No se encontraron propiedades",
        countLabel: "propiedades",
        viewModes: {
          grid: "Cuadrícula",
          list: "Lista",
          compact: "Compacto"
        }
      },
      actions: {
        viewDetails: "Ver detalles"
      },
      edit: {
        title: "Editar propiedad",
        submitSuccess: "¡Propiedad actualizada con éxito!",
        submitError: "No se pudo actualizar la propiedad",
        nameLabel: "Nombre de la propiedad"
      },
      messages: {
        deleteConfirm: "¿Seguro que quieres eliminar esta propiedad? Esta acción no se puede deshacer.",
        deleteFailed: "No se pudo eliminar la propiedad."
      },
      media: {
        videoUploaded: "Video {index} subido"
      }
    },
    chat: {
      online: "En línea",
      offline: "Sin conexión",
      viewProperty: "Ver propiedad",
      startTitle: "Inicia una conversación",
      startDescription: "Saluda para comenzar a chatear",
      seen: "Visto",
      sent: "Enviado",
      selectConversationTitle: "Selecciona una conversación",
      selectConversationDescription: "Un chat moderno para conectar al instante con propietarios y clientes.",
      typeMessagePlaceholder: "Escribe un mensaje...",
      signInRequiredTitle: "Inicia sesión",
      signInRequiredDescription: "Debes iniciar sesión para ver tu historial de chats.",
      emptyTitle: "Aún no hay conversaciones",
      emptyDescription: "Tu historial de chats aparecerá aquí.",
      initialPropertyMessage: "Hola, me gustaría contactarte sobre el anuncio \"{title}\" (ID: {id}).",
      loadingMessages: "Cargando mensajes..."
    },
    profile: {
      displayName: "Nombre visible",
      noBioYet: "Cuéntales a los inquilinos un poco sobre ti",
      messages: {
        editSuccess: "Perfil actualizado correctamente",
        editFailed: "No se pudo actualizar el perfil",
        nameChangeLimit: "Solo puedes cambiar tu nombre una vez cada 30 días."
      },
      savedEmptyTitle: "No hay propiedades guardadas",
      savedSectionDescription: "Guarda aquí los anuncios que te gusten",
      myPropertiesEmptyTitle: "Aún no hay anuncios",
      myPropertiesSectionDescription: "Empieza publicando tu primer anuncio",
      sectionsTitle: "Secciones",
      sectionsDescription: "Elige un área para administrar a la vez.",
      uploadAvatarError: "No se pudo subir la foto de perfil. Inténtalo de nuevo.",
      uploadCoverError: "No se pudo subir la imagen de portada.",
      createdOn: "Publicado el {date}",
      summaryTitle: "Resumen"
    },
    auth: {
      loginPrompt: {
        title: "Inicio de sesión requerido",
        description: "Inicia sesión para publicar anuncios y conectar con miles de posibles inquilinos."
      }
    },
    help: {
      ticket: {
        successMessage: "Tu solicitud de soporte se envió correctamente. Te responderemos pronto.",
        errorMessage: "No pudimos enviar tu solicitud. Inténtalo de nuevo.",
        subjectLabel: "Asunto",
        subjectPlaceholder: "Cuéntanos en qué necesitas ayuda",
        priorityLabel: "Prioridad",
        priorities: {
          low: "Baja",
          medium: "Media",
          high: "Alta"
        },
        messageLabel: "Mensaje",
        messagePlaceholder: "Describe el problema con el mayor detalle posible",
        submitButton: "Enviar ticket",
        submittingButton: "Enviando...",
        submittedTitle: "¡Enviado!",
        redirectingBack: "Volviendo..."
      }
    },
    about: {
      header: "Acerca de",
      title: "Conectamos a inquilinos y propietarios con confianza",
      intro: "YourHome hace que la búsqueda de alquiler sea más simple, rápida y confiable para todos.",
      founder: {
        title: "Fundador",
        nameLabel: "Creado por",
        name: "Vuong Trung Kien",
        description: "Queremos que descubrir alquileres se sienta claro, humano y confiable."
      },
      hiring: {
        title: "Estamos creciendo",
        descriptionPrimary: "Siempre nos entusiasma conocer personas que valoran la calidad del producto, la confianza y la experiencia del inquilino.",
        descriptionSecondary: "Si eso te describe, nos encantará saber de ti."
      },
      product: {
        title: "Lo que YourHome te ayuda a hacer",
        items: [
          "Explorar anuncios verificados en un mapa interactivo.",
          "Filtrar por precio, área y ubicación en segundos.",
          "Guardar propiedades y revisarlas más tarde.",
          "Hablar con propietarios sin salir de la app.",
          "Publicar y administrar tus anuncios fácilmente."
        ]
      },
      mission: {
        title: "Nuestra misión",
        descriptionPrimary: "Queremos que descubrir alquileres sea práctico y transparente, no estresante ni fragmentado.",
        descriptionSecondary: "Mejores anuncios, conversaciones más rápidas y mejores herramientas ayudan tanto a inquilinos como a propietarios a avanzar con confianza."
      },
      contact: {
        title: "Contacto",
        description: "¿Tienes preguntas, comentarios o ideas de colaboración? Escríbenos cuando quieras y te responderemos pronto.",
        homeButton: "Volver al inicio"
      }
    },
    user: {
      profileTitle: "Perfil del usuario",
      notFoundTitle: "Usuario no encontrado",
      notFoundDescription: "No se pudo encontrar a este usuario o ha sido eliminado.",
      messageUser: "Enviar mensaje",
      propertiesByName: "Propiedades de {name}",
      noPropertiesTitle: "Aún no hay propiedades",
      noPropertiesDescription: "Este usuario todavía no ha publicado propiedades en alquiler.",
      selfMessageError: "No puedes enviarte mensajes a ti mismo."
    },
    errors: {
      global: {
        title: "¡Algo salió mal!",
        defaultDescription: "Ocurrió un error inesperado."
      },
      notFound: {
        title: "Página no encontrada",
        description: "La página que buscas no existe.",
        action: "Ir al inicio"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome. Todos los derechos reservados."
    }
  },
  "zh-CN": {
    common: {
      from: "从...",
      to: "到...",
      reset: "重置",
      apply: "应用",
      cancel: "取消",
      saveChanges: "保存更改",
      upload: "上传",
      hello: "你好",
      guest: "游客",
      search: "搜索",
      saving: "正在保存...",
      loadMore: "加载更多",
      showingOf: "已显示 {shown}/{total}",
      showingRange: "已显示 {start}-{end}/{total}",
      theme: "主题",
      view: "查看",
      edit: "编辑",
      delete: "删除"
    },
    property: {
      detail: {
        noDescription: "暂无描述。",
        manageListing: "管理房源"
      },
      add: {
        title: "新增房源"
      },
      form: {
        propertyTypeLabel: "房源类型",
        cityLabel: "城市",
        districtLabel: "地区",
        addressLabel: "地址",
        exactLocationLabel: "精确位置",
        dragPinHint: "拖动图钉选择房源的准确位置",
        priceLabel: "价格（VND）",
        contactPhoneLabel: "联系电话",
        photosLabel: "图片",
        videosLabel: "视频",
        addPhotosHint: "点击添加图片（最多 7 张）",
        addVideosHint: "点击添加视频（最多 2 个）",
        streetAddressLabel: "详细地址",
        useCurrentLocation: "使用我的当前位置",
        geocodingLoading: "正在查找位置...",
        uploadingMedia: "正在上传图片和视频...",
        previewImage: "预览图片",
        locationError: "无法获取你的位置。",
        invalidImageType: "请仅上传 PNG、JPG、GIF、WebP、BMP 或 AVIF 图片。",
        imageUploadError: "上传一张或多张图片失败。",
        videoUploadError: "上传一个或多个视频失败。"
      },
      filters: {
        title: "高级筛选",
        priceRange: "价格范围（VND）",
        locationArea: "区域",
        provinceCity: "省 / 城市",
        minBedrooms: "最少卧室数",
        bathroomType: "浴室类型"
      },
      types: {
        house: "房屋",
        commercialSpace: "商业空间",
        apartment: "公寓",
        condominium: "共管公寓",
        hotel: "酒店"
      },
      list: {
        displayMode: "显示模式",
        emptyTitle: "未找到房源",
        countLabel: "房源",
        viewModes: {
          grid: "网格",
          list: "列表",
          compact: "紧凑"
        }
      },
      actions: {
        viewDetails: "查看详情"
      },
      edit: {
        title: "编辑房源",
        submitSuccess: "房源更新成功！",
        submitError: "更新房源失败",
        nameLabel: "房源名称"
      },
      messages: {
        deleteConfirm: "确定要删除此房源吗？此操作无法撤销。",
        deleteFailed: "删除房源失败。"
      },
      media: {
        videoUploaded: "视频 {index} 已上传"
      }
    },
    chat: {
      online: "在线",
      offline: "离线",
      viewProperty: "查看房源",
      startTitle: "开始聊天",
      startDescription: "发送一条问候消息开始聊天",
      seen: "已读",
      sent: "已发送",
      selectConversationTitle: "选择一个对话",
      selectConversationDescription: "现代聊天体验，立即连接房东和客户。",
      typeMessagePlaceholder: "输入消息...",
      signInRequiredTitle: "请先登录",
      signInRequiredDescription: "你需要登录后才能查看聊天记录。",
      emptyTitle: "还没有对话",
      emptyDescription: "你的聊天记录会显示在这里。",
      initialPropertyMessage: "你好，我想咨询一下房源“{title}”（ID：{id}）。",
      loadingMessages: "正在加载消息..."
    },
    profile: {
      displayName: "显示名称",
      noBioYet: "向租客简单介绍一下你自己",
      messages: {
        editSuccess: "个人资料更新成功",
        editFailed: "个人资料更新失败",
        nameChangeLimit: "你每 30 天只能修改一次姓名。"
      },
      savedEmptyTitle: "暂无已保存房源",
      savedSectionDescription: "把你喜欢的房源保存在这里",
      myPropertiesEmptyTitle: "还没有房源",
      myPropertiesSectionDescription: "开始发布你的第一条房源",
      sectionsTitle: "分区",
      sectionsDescription: "一次选择一个区域进行管理。",
      uploadAvatarError: "上传头像失败，请重试。",
      uploadCoverError: "上传封面图片失败。",
      createdOn: "发布于 {date}",
      summaryTitle: "概览"
    },
    auth: {
      loginPrompt: {
        title: "需要登录",
        description: "登录后即可发布房源并与成千上万的潜在租客联系。"
      }
    },
    help: {
      ticket: {
        successMessage: "你的支持请求已成功提交，我们会尽快回复你。",
        errorMessage: "提交请求失败，请重试。",
        subjectLabel: "主题",
        subjectPlaceholder: "告诉我们你需要什么帮助",
        priorityLabel: "优先级",
        priorities: {
          low: "低",
          medium: "中",
          high: "高"
        },
        messageLabel: "内容",
        messagePlaceholder: "请尽可能详细地描述你的问题",
        submitButton: "提交工单",
        submittingButton: "提交中...",
        submittedTitle: "已提交！",
        redirectingBack: "正在返回..."
      }
    },
    about: {
      header: "关于",
      title: "让租客和房东更安心地建立联系",
      intro: "YourHome 让租房搜索对每个人来说都更简单、更快速、更值得信赖。",
      founder: {
        title: "创始人",
        nameLabel: "创建者",
        name: "Vuong Trung Kien",
        description: "我们希望租房发现的过程更加清晰、更有人情味，也更可靠。"
      },
      hiring: {
        title: "我们正在成长",
        descriptionPrimary: "我们一直期待认识重视产品质量、信任以及租客体验的人。",
        descriptionSecondary: "如果这也符合你的想法，我们很乐意听到你的声音。"
      },
      product: {
        title: "YourHome 可以帮你做什么",
        items: [
          "在互动地图上浏览已验证的租赁房源。",
          "几秒内按价格、面积和位置筛选房源。",
          "保存房源，方便之后再次查看。",
          "无需离开应用即可直接联系房东。",
          "轻松发布并管理你自己的房源。"
        ]
      },
      mission: {
        title: "我们的使命",
        descriptionPrimary: "我们希望租房发现变得务实、透明，而不是紧张和零散。",
        descriptionSecondary: "更清晰的房源信息、更快的沟通以及更好的工具，让租客和房东都能更有信心地做决定。"
      },
      contact: {
        title: "联系",
        description: "如果你有问题、反馈或合作想法，欢迎随时联系，我们会尽快回复。",
        homeButton: "返回首页"
      }
    },
    user: {
      profileTitle: "用户资料",
      notFoundTitle: "未找到用户",
      notFoundDescription: "找不到该用户，或者该用户已被移除。",
      messageUser: "发送消息",
      propertiesByName: "{name} 的房源",
      noPropertiesTitle: "还没有房源",
      noPropertiesDescription: "该用户还没有发布任何出租房源。",
      selfMessageError: "你不能给自己发消息。"
    },
    errors: {
      global: {
        title: "出错了！",
        defaultDescription: "发生了意外错误。"
      },
      notFound: {
        title: "页面不存在",
        description: "你访问的页面不存在。",
        action: "返回首页"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome。保留所有权利。"
    }
  },
  "zh-TW": {
    common: {
      from: "從...",
      to: "到...",
      reset: "重設",
      apply: "套用",
      cancel: "取消",
      saveChanges: "儲存變更",
      upload: "上傳",
      hello: "你好",
      guest: "訪客",
      search: "搜尋",
      saving: "儲存中...",
      loadMore: "載入更多",
      showingOf: "已顯示 {shown}/{total}",
      showingRange: "已顯示 {start}-{end}/{total}",
      theme: "主題",
      view: "查看",
      edit: "編輯",
      delete: "刪除"
    },
    property: {
      detail: {
        noDescription: "暫無描述。",
        manageListing: "管理房源"
      },
      add: {
        title: "新增房源"
      },
      form: {
        propertyTypeLabel: "房源類型",
        cityLabel: "城市",
        districtLabel: "地區",
        addressLabel: "地址",
        exactLocationLabel: "精確位置",
        dragPinHint: "拖曳圖釘以選擇房源的精確位置",
        priceLabel: "價格（VND）",
        contactPhoneLabel: "聯絡電話",
        photosLabel: "照片",
        videosLabel: "影片",
        addPhotosHint: "點擊新增照片（最多 7 張）",
        addVideosHint: "點擊新增影片（最多 2 個）",
        streetAddressLabel: "詳細地址",
        useCurrentLocation: "使用目前位置",
        geocodingLoading: "正在尋找位置...",
        uploadingMedia: "正在上傳照片與影片...",
        previewImage: "預覽圖片",
        locationError: "無法取得你的位置。",
        invalidImageType: "請只上傳 PNG、JPG、GIF、WebP、BMP 或 AVIF 圖片。",
        imageUploadError: "上傳一張或多張圖片失敗。",
        videoUploadError: "上傳一個或多個影片失敗。"
      },
      filters: {
        title: "進階篩選",
        priceRange: "價格範圍（VND）",
        locationArea: "區域",
        provinceCity: "省 / 城市",
        minBedrooms: "最少臥室數",
        bathroomType: "浴室類型"
      },
      types: {
        house: "房屋",
        commercialSpace: "商業空間",
        apartment: "公寓",
        condominium: "共管公寓",
        hotel: "飯店"
      },
      list: {
        displayMode: "顯示模式",
        emptyTitle: "找不到房源",
        countLabel: "房源",
        viewModes: {
          grid: "網格",
          list: "清單",
          compact: "緊湊"
        }
      },
      actions: {
        viewDetails: "查看詳情"
      },
      edit: {
        title: "編輯房源",
        submitSuccess: "房源更新成功！",
        submitError: "更新房源失敗",
        nameLabel: "房源名稱"
      },
      messages: {
        deleteConfirm: "確定要刪除此房源嗎？此操作無法復原。",
        deleteFailed: "刪除房源失敗。"
      },
      media: {
        videoUploaded: "影片 {index} 已上傳"
      }
    },
    chat: {
      online: "在線",
      offline: "離線",
      viewProperty: "查看房源",
      startTitle: "開始對話",
      startDescription: "送出問候訊息開始聊天",
      seen: "已讀",
      sent: "已送出",
      selectConversationTitle: "選擇一個對話",
      selectConversationDescription: "現代訊息體驗，立即連接房東與客戶。",
      typeMessagePlaceholder: "輸入訊息...",
      signInRequiredTitle: "請先登入",
      signInRequiredDescription: "你需要登入後才能查看聊天記錄。",
      emptyTitle: "尚無對話",
      emptyDescription: "你的聊天記錄將顯示在這裡。",
      initialPropertyMessage: "你好，我想詢問房源「{title}」（ID：{id}）。",
      loadingMessages: "正在載入訊息..."
    },
    profile: {
      displayName: "顯示名稱",
      noBioYet: "向租客簡單介紹一下你自己",
      messages: {
        editSuccess: "個人資料更新成功",
        editFailed: "個人資料更新失敗",
        nameChangeLimit: "你每 30 天只能修改一次姓名。"
      },
      savedEmptyTitle: "尚無已儲存房源",
      savedSectionDescription: "在這裡收藏你喜歡的房源",
      myPropertiesEmptyTitle: "還沒有房源",
      myPropertiesSectionDescription: "開始發布你的第一則房源",
      sectionsTitle: "分區",
      sectionsDescription: "一次選擇一個區域進行管理。",
      uploadAvatarError: "上傳頭像失敗，請再試一次。",
      uploadCoverError: "上傳封面圖片失敗。",
      createdOn: "發佈於 {date}",
      summaryTitle: "概覽"
    },
    auth: {
      loginPrompt: {
        title: "需要登入",
        description: "登入後即可發布房源並與成千上萬的潛在租客聯繫。"
      }
    },
    help: {
      ticket: {
        successMessage: "你的支援請求已成功提交，我們會盡快回覆你。",
        errorMessage: "提交請求失敗，請再試一次。",
        subjectLabel: "主題",
        subjectPlaceholder: "告訴我們你需要什麼幫助",
        priorityLabel: "優先順序",
        priorities: {
          low: "低",
          medium: "中",
          high: "高"
        },
        messageLabel: "內容",
        messagePlaceholder: "請盡可能詳細地描述你的問題",
        submitButton: "提交工單",
        submittingButton: "提交中...",
        submittedTitle: "已提交！",
        redirectingBack: "正在返回..."
      }
    },
    about: {
      header: "關於",
      title: "讓租客和房東更安心地建立連結",
      intro: "YourHome 讓租屋搜尋對每個人都更簡單、更快速，也更值得信賴。",
      founder: {
        title: "創辦人",
        nameLabel: "建立者",
        name: "Vuong Trung Kien",
        description: "我們希望租屋探索的過程更清楚、更有人情味，也更可靠。"
      },
      hiring: {
        title: "我們正在成長",
        descriptionPrimary: "我們一直期待認識重視產品品質、信任與租客體驗的人。",
        descriptionSecondary: "如果這也是你的想法，我們很樂意聽見你的聲音。"
      },
      product: {
        title: "YourHome 可以幫你做到什麼",
        items: [
          "在互動地圖上瀏覽已驗證的租屋房源。",
          "幾秒內依價格、面積與地點篩選房源。",
          "收藏房源並稍後再回來查看。",
          "不用離開應用程式即可直接聯絡房東。",
          "輕鬆發布並管理你自己的房源。"
        ]
      },
      mission: {
        title: "我們的使命",
        descriptionPrimary: "我們希望租屋探索變得務實且透明，而不是緊張與零散。",
        descriptionSecondary: "更清楚的房源資訊、更快速的對話與更好的工具，能讓租客與房東都更有信心地前進。"
      },
      contact: {
        title: "聯絡",
        description: "若你有問題、回饋或合作想法，歡迎隨時聯絡我們，我們會盡快回覆。",
        homeButton: "返回首頁"
      }
    },
    user: {
      profileTitle: "使用者資料",
      notFoundTitle: "找不到使用者",
      notFoundDescription: "找不到這位使用者，或此帳號已被移除。",
      messageUser: "傳送訊息",
      propertiesByName: "{name} 的房源",
      noPropertiesTitle: "尚無房源",
      noPropertiesDescription: "這位使用者尚未發布任何出租房源。",
      selfMessageError: "你不能傳訊息給自己。"
    },
    errors: {
      global: {
        title: "發生錯誤！",
        defaultDescription: "發生了未預期的錯誤。"
      },
      notFound: {
        title: "找不到頁面",
        description: "你要找的頁面不存在。",
        action: "返回首頁"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome。保留所有權利。"
    }
  },
  fr: {
    common: {
      from: "De...",
      to: "À...",
      reset: "Réinitialiser",
      apply: "Appliquer",
      cancel: "Annuler",
      saveChanges: "Enregistrer les modifications",
      upload: "Téléverser",
      hello: "Bonjour",
      guest: "Invité",
      search: "Rechercher",
      saving: "Enregistrement...",
      loadMore: "Voir plus",
      showingOf: "Affichage de {shown} sur {total}",
      showingRange: "Affichage de {start}-{end} sur {total}",
      theme: "Thème",
      view: "Voir",
      edit: "Modifier",
      delete: "Supprimer"
    },
    property: {
      detail: {
        noDescription: "Aucune description disponible.",
        manageListing: "Gérer l'annonce"
      },
      add: {
        title: "Ajouter un bien"
      },
      form: {
        propertyTypeLabel: "Type de bien",
        cityLabel: "Ville",
        districtLabel: "Quartier",
        addressLabel: "Adresse",
        exactLocationLabel: "Emplacement exact",
        dragPinHint: "Faites glisser l'épingle jusqu'à l'emplacement exact du bien",
        priceLabel: "Prix (VND)",
        contactPhoneLabel: "Téléphone de contact",
        photosLabel: "Photos",
        videosLabel: "Vidéos",
        addPhotosHint: "Cliquez pour ajouter des photos (max. 7)",
        addVideosHint: "Cliquez pour ajouter des vidéos (max. 2)",
        streetAddressLabel: "Adresse détaillée",
        useCurrentLocation: "Utiliser ma position actuelle",
        geocodingLoading: "Recherche de l'emplacement...",
        uploadingMedia: "Téléversement des photos et vidéos...",
        previewImage: "Aperçu de l'image",
        locationError: "Impossible de récupérer votre position.",
        invalidImageType: "Veuillez téléverser uniquement des images PNG, JPG, GIF, WebP, BMP ou AVIF.",
        imageUploadError: "Échec du téléversement d'une ou plusieurs images.",
        videoUploadError: "Échec du téléversement d'une ou plusieurs vidéos."
      },
      filters: {
        title: "Filtre avancé",
        priceRange: "Fourchette de prix (VND)",
        locationArea: "Zone",
        provinceCity: "Province / Ville",
        minBedrooms: "Nombre minimum de chambres",
        bathroomType: "Type de salle de bain"
      },
      types: {
        house: "Maison",
        commercialSpace: "Local commercial",
        apartment: "Appartement",
        condominium: "Condominium",
        hotel: "Hôtel"
      },
      list: {
        displayMode: "Mode d'affichage",
        emptyTitle: "Aucun bien trouvé",
        countLabel: "biens",
        viewModes: {
          grid: "Grille",
          list: "Liste",
          compact: "Compact"
        }
      },
      actions: {
        viewDetails: "Voir les détails"
      },
      edit: {
        title: "Modifier le bien",
        submitSuccess: "Bien mis à jour avec succès !",
        submitError: "Échec de la mise à jour du bien",
        nameLabel: "Nom du bien"
      },
      messages: {
        deleteConfirm: "Voulez-vous vraiment supprimer ce bien ? Cette action est irréversible.",
        deleteFailed: "Échec de la suppression du bien."
      },
      media: {
        videoUploaded: "Vidéo {index} téléversée"
      }
    },
    chat: {
      online: "En ligne",
      offline: "Hors ligne",
      viewProperty: "Voir le bien",
      startTitle: "Commencer une conversation",
      startDescription: "Envoyez un message pour commencer à discuter",
      seen: "Vu",
      sent: "Envoyé",
      selectConversationTitle: "Sélectionnez une conversation",
      selectConversationDescription: "Une messagerie moderne pour connecter instantanément propriétaires et clients.",
      typeMessagePlaceholder: "Tapez un message...",
      signInRequiredTitle: "Veuillez vous connecter",
      signInRequiredDescription: "Vous devez vous connecter pour voir votre historique de discussion.",
      emptyTitle: "Aucune conversation pour le moment",
      emptyDescription: "Votre historique de discussion apparaîtra ici.",
      initialPropertyMessage: "Bonjour, je souhaite vous contacter au sujet de l'annonce « {title} » (ID : {id}).",
      loadingMessages: "Chargement des messages..."
    },
    profile: {
      displayName: "Nom affiché",
      noBioYet: "Parlez un peu de vous aux locataires",
      messages: {
        editSuccess: "Profil mis à jour avec succès",
        editFailed: "Échec de la mise à jour du profil",
        nameChangeLimit: "Vous ne pouvez modifier votre nom qu'une fois tous les 30 jours."
      },
      savedEmptyTitle: "Aucun bien enregistré",
      savedSectionDescription: "Enregistrez ici les annonces qui vous plaisent",
      myPropertiesEmptyTitle: "Aucune annonce pour le moment",
      myPropertiesSectionDescription: "Commencez par publier votre première annonce",
      sectionsTitle: "Sections",
      sectionsDescription: "Choisissez une zone à gérer à la fois.",
      uploadAvatarError: "Échec du téléversement de la photo de profil. Veuillez réessayer.",
      uploadCoverError: "Échec du téléversement de l'image de couverture.",
      createdOn: "Publié le {date}",
      summaryTitle: "Résumé"
    },
    auth: {
      loginPrompt: {
        title: "Connexion requise",
        description: "Connectez-vous pour publier des annonces et entrer en contact avec des milliers de locataires potentiels."
      }
    },
    help: {
      ticket: {
        successMessage: "Votre demande d'assistance a été envoyée avec succès. Nous vous répondrons bientôt.",
        errorMessage: "Nous n'avons pas pu envoyer votre demande. Veuillez réessayer.",
        subjectLabel: "Sujet",
        subjectPlaceholder: "Dites-nous ce dont vous avez besoin",
        priorityLabel: "Priorité",
        priorities: {
          low: "Basse",
          medium: "Moyenne",
          high: "Haute"
        },
        messageLabel: "Message",
        messagePlaceholder: "Décrivez le problème avec le plus de détails possible",
        submitButton: "Envoyer le ticket",
        submittingButton: "Envoi...",
        submittedTitle: "Envoyé !",
        redirectingBack: "Retour en cours..."
      }
    },
    about: {
      header: "À propos",
      title: "Aider les locataires et les propriétaires à se connecter en toute confiance",
      intro: "YourHome rend la recherche de location plus simple, plus rapide et plus fiable pour tout le monde.",
      founder: {
        title: "Fondateur",
        nameLabel: "Créé par",
        name: "Vuong Trung Kien",
        description: "Nous voulons que la découverte d'une location soit claire, humaine et fiable."
      },
      hiring: {
        title: "Nous grandissons",
        descriptionPrimary: "Nous aimons rencontrer des personnes attentives à la qualité produit, à la confiance et à l'expérience des locataires.",
        descriptionSecondary: "Si cela vous ressemble, nous serions ravis d'échanger avec vous."
      },
      product: {
        title: "Ce que YourHome vous aide à faire",
        items: [
          "Parcourir des annonces vérifiées sur une carte interactive.",
          "Filtrer par prix, surface et emplacement en quelques secondes.",
          "Enregistrer des biens et y revenir plus tard.",
          "Contacter directement les propriétaires sans quitter l'application.",
          "Publier et gérer facilement vos propres annonces."
        ]
      },
      mission: {
        title: "Notre mission",
        descriptionPrimary: "Nous voulons que la recherche de location soit pratique et transparente plutôt que stressante et fragmentée.",
        descriptionSecondary: "Des annonces plus claires, des échanges plus rapides et de meilleurs outils aident locataires et propriétaires à avancer avec confiance."
      },
      contact: {
        title: "Contact",
        description: "Une question, un retour ou une idée de partenariat ? Écrivez-nous quand vous voulez et nous vous répondrons vite.",
        homeButton: "Retour à l'accueil"
      }
    },
    user: {
      profileTitle: "Profil utilisateur",
      notFoundTitle: "Utilisateur introuvable",
      notFoundDescription: "Cet utilisateur est introuvable ou a peut-être été supprimé.",
      messageUser: "Envoyer un message",
      propertiesByName: "Biens de {name}",
      noPropertiesTitle: "Aucun bien pour le moment",
      noPropertiesDescription: "Cet utilisateur n'a pas encore publié de biens à louer.",
      selfMessageError: "Vous ne pouvez pas vous envoyer un message à vous-même."
    },
    errors: {
      global: {
        title: "Une erreur s'est produite !",
        defaultDescription: "Une erreur inattendue s'est produite."
      },
      notFound: {
        title: "Page introuvable",
        description: "La page que vous recherchez n'existe pas.",
        action: "Aller à l'accueil"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome. Tous droits réservés."
    }
  },
  ko: {
    common: {
      from: "부터...",
      to: "까지...",
      reset: "재설정",
      apply: "적용",
      cancel: "취소",
      saveChanges: "변경 사항 저장",
      upload: "업로드",
      hello: "안녕하세요",
      guest: "게스트",
      search: "검색",
      saving: "저장 중...",
      loadMore: "더 보기",
      showingOf: "{total}개 중 {shown}개 표시",
      showingRange: "{total}개 중 {start}-{end}개 표시",
      theme: "테마",
      view: "보기",
      edit: "수정",
      delete: "삭제"
    },
    property: {
      detail: {
        noDescription: "설명이 없습니다.",
        manageListing: "매물 관리"
      },
      add: {
        title: "매물 추가"
      },
      form: {
        propertyTypeLabel: "매물 유형",
        cityLabel: "도시",
        districtLabel: "지역",
        addressLabel: "주소",
        exactLocationLabel: "정확한 위치",
        dragPinHint: "핀을 드래그해 정확한 위치를 선택하세요",
        priceLabel: "가격 (VND)",
        contactPhoneLabel: "연락처 전화번호",
        photosLabel: "사진",
        videosLabel: "동영상",
        addPhotosHint: "사진 추가하기 (최대 7장)",
        addVideosHint: "동영상 추가하기 (최대 2개)",
        streetAddressLabel: "상세 주소",
        useCurrentLocation: "현재 위치 사용",
        geocodingLoading: "위치 검색 중...",
        uploadingMedia: "사진과 동영상을 업로드하는 중...",
        previewImage: "이미지 미리보기",
        locationError: "위치를 가져올 수 없습니다.",
        invalidImageType: "PNG, JPG, GIF, WebP, BMP 또는 AVIF 이미지 파일만 업로드해 주세요.",
        imageUploadError: "하나 이상의 이미지 업로드에 실패했습니다.",
        videoUploadError: "하나 이상의 동영상 업로드에 실패했습니다."
      },
      filters: {
        title: "고급 필터",
        priceRange: "가격 범위 (VND)",
        locationArea: "지역",
        provinceCity: "주 / 도시",
        minBedrooms: "최소 침실 수",
        bathroomType: "욕실 유형"
      },
      types: {
        house: "주택",
        commercialSpace: "상업 공간",
        apartment: "아파트",
        condominium: "콘도",
        hotel: "호텔"
      },
      list: {
        displayMode: "표시 모드",
        emptyTitle: "매물을 찾을 수 없습니다",
        countLabel: "숙소",
        viewModes: {
          grid: "그리드",
          list: "목록",
          compact: "간단히"
        }
      },
      actions: {
        viewDetails: "상세 보기"
      },
      edit: {
        title: "매물 수정",
        submitSuccess: "매물이 성공적으로 수정되었습니다!",
        submitError: "매물 수정에 실패했습니다",
        nameLabel: "매물 이름"
      },
      messages: {
        deleteConfirm: "이 매물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
        deleteFailed: "매물 삭제에 실패했습니다."
      },
      media: {
        videoUploaded: "동영상 {index} 업로드 완료"
      }
    },
    chat: {
      online: "온라인",
      offline: "오프라인",
      viewProperty: "매물 보기",
      startTitle: "대화를 시작하세요",
      startDescription: "인사를 보내고 채팅을 시작하세요",
      seen: "읽음",
      sent: "보냄",
      selectConversationTitle: "대화를 선택하세요",
      selectConversationDescription: "현대적인 메신저 스타일로 집주인과 고객을 즉시 연결합니다.",
      typeMessagePlaceholder: "메시지를 입력하세요...",
      signInRequiredTitle: "로그인이 필요합니다",
      signInRequiredDescription: "채팅 기록을 보려면 로그인해야 합니다.",
      emptyTitle: "아직 대화가 없습니다",
      emptyDescription: "채팅 기록이 여기에 표시됩니다.",
      initialPropertyMessage: "안녕하세요. \"{title}\" 매물(ID: {id})에 대해 문의드리고 싶습니다.",
      loadingMessages: "메시지를 불러오는 중..."
    },
    profile: {
      displayName: "표시 이름",
      noBioYet: "임차인에게 자신을 간단히 소개해 주세요",
      messages: {
        editSuccess: "프로필이 성공적으로 업데이트되었습니다",
        editFailed: "프로필 업데이트에 실패했습니다",
        nameChangeLimit: "이름은 30일에 한 번만 변경할 수 있습니다."
      },
      savedEmptyTitle: "저장한 매물이 없습니다",
      savedSectionDescription: "마음에 드는 매물을 여기에 저장하세요",
      myPropertiesEmptyTitle: "아직 등록한 매물이 없습니다",
      myPropertiesSectionDescription: "첫 번째 매물을 등록해 보세요",
      sectionsTitle: "섹션",
      sectionsDescription: "한 번에 하나의 영역만 관리하세요.",
      uploadAvatarError: "프로필 사진 업로드에 실패했습니다. 다시 시도해 주세요.",
      uploadCoverError: "커버 이미지 업로드에 실패했습니다.",
      createdOn: "{date} 등록",
      summaryTitle: "요약"
    },
    auth: {
      loginPrompt: {
        title: "로그인이 필요합니다",
        description: "로그인하여 매물을 등록하고 수많은 잠재 임차인과 연결하세요."
      }
    },
    help: {
      ticket: {
        successMessage: "지원 요청이 성공적으로 제출되었습니다. 곧 답변드리겠습니다.",
        errorMessage: "요청을 제출하지 못했습니다. 다시 시도해 주세요.",
        subjectLabel: "제목",
        subjectPlaceholder: "어떤 도움이 필요한지 알려주세요",
        priorityLabel: "우선순위",
        priorities: {
          low: "낮음",
          medium: "보통",
          high: "높음"
        },
        messageLabel: "내용",
        messagePlaceholder: "문제를 가능한 한 자세히 설명해 주세요",
        submitButton: "티켓 제출",
        submittingButton: "제출 중...",
        submittedTitle: "제출 완료!",
        redirectingBack: "돌아가는 중..."
      }
    },
    about: {
      header: "소개",
      title: "임차인과 집주인이 더 자신 있게 연결되도록 돕습니다",
      intro: "YourHome은 모두에게 더 간단하고 빠르며 믿을 수 있는 임대 검색 경험을 제공합니다.",
      founder: {
        title: "창립자",
        nameLabel: "제작자",
        name: "Vuong Trung Kien",
        description: "우리는 임대 탐색 경험이 명확하고 인간적이며 신뢰할 수 있기를 바랍니다."
      },
      hiring: {
        title: "우리는 성장하고 있습니다",
        descriptionPrimary: "제품 품질, 신뢰, 그리고 임차인 경험을 중요하게 생각하는 분들을 언제나 환영합니다.",
        descriptionSecondary: "그런 분이라면 꼭 연락 주세요."
      },
      product: {
        title: "YourHome이 도와주는 일",
        items: [
          "인터랙티브 지도에서 검증된 임대 매물을 둘러보기.",
          "가격, 면적, 위치별로 빠르게 필터링하기.",
          "마음에 드는 매물을 저장하고 나중에 다시 보기.",
          "앱을 떠나지 않고 집주인에게 직접 메시지 보내기.",
          "내 매물을 손쉽게 등록하고 관리하기."
        ]
      },
      mission: {
        title: "우리의 미션",
        descriptionPrimary: "우리는 임대 검색이 스트레스 많고 단절된 경험이 아니라 실용적이고 투명한 경험이 되기를 바랍니다.",
        descriptionSecondary: "더 명확한 매물 정보, 더 빠른 대화, 더 나은 도구는 임차인과 집주인 모두가 자신 있게 움직이도록 돕습니다."
      },
      contact: {
        title: "문의",
        description: "질문, 피드백 또는 협업 제안이 있다면 언제든지 연락 주세요. 빠르게 답변드리겠습니다.",
        homeButton: "홈으로 돌아가기"
      }
    },
    user: {
      profileTitle: "사용자 프로필",
      notFoundTitle: "사용자를 찾을 수 없습니다",
      notFoundDescription: "이 사용자를 찾을 수 없거나 삭제되었을 수 있습니다.",
      messageUser: "메시지 보내기",
      propertiesByName: "{name}님의 매물",
      noPropertiesTitle: "아직 매물이 없습니다",
      noPropertiesDescription: "이 사용자는 아직 임대 매물을 등록하지 않았습니다.",
      selfMessageError: "자기 자신에게는 메시지를 보낼 수 없습니다."
    },
    errors: {
      global: {
        title: "문제가 발생했습니다!",
        defaultDescription: "예기치 않은 오류가 발생했습니다."
      },
      notFound: {
        title: "페이지를 찾을 수 없습니다",
        description: "찾으시는 페이지가 존재하지 않습니다.",
        action: "홈으로 이동"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome. 모든 권리 보유."
    }
  },
  ja: {
    common: {
      from: "開始...",
      to: "終了...",
      reset: "リセット",
      apply: "適用",
      cancel: "キャンセル",
      saveChanges: "変更を保存",
      upload: "アップロード",
      hello: "こんにちは",
      guest: "ゲスト",
      search: "検索",
      saving: "保存中...",
      loadMore: "もっと見る",
      showingOf: "{total}件中{shown}件を表示",
      showingRange: "{total}件中{start}-{end}件を表示",
      theme: "テーマ",
      view: "表示",
      edit: "編集",
      delete: "削除"
    },
    property: {
      detail: {
        noDescription: "説明はありません。",
        manageListing: "掲載を管理"
      },
      add: {
        title: "物件を追加"
      },
      form: {
        propertyTypeLabel: "物件タイプ",
        cityLabel: "都市",
        districtLabel: "地区",
        addressLabel: "住所",
        exactLocationLabel: "正確な位置",
        dragPinHint: "ピンをドラッグして物件の正確な位置を選択してください",
        priceLabel: "価格（VND）",
        contactPhoneLabel: "連絡先電話番号",
        photosLabel: "写真",
        videosLabel: "動画",
        addPhotosHint: "写真を追加（最大7枚）",
        addVideosHint: "動画を追加（最大2件）",
        streetAddressLabel: "詳細住所",
        useCurrentLocation: "現在地を使う",
        geocodingLoading: "位置を検索中...",
        uploadingMedia: "写真と動画をアップロード中...",
        previewImage: "画像をプレビュー",
        locationError: "現在地を取得できません。",
        invalidImageType: "PNG、JPG、GIF、WebP、BMP、AVIF画像のみアップロードできます。",
        imageUploadError: "1枚以上の画像のアップロードに失敗しました。",
        videoUploadError: "1本以上の動画のアップロードに失敗しました。"
      },
      filters: {
        title: "詳細フィルター",
        priceRange: "価格帯（VND）",
        locationArea: "エリア",
        provinceCity: "省 / 市",
        minBedrooms: "最低寝室数",
        bathroomType: "バスルームタイプ"
      },
      types: {
        house: "一戸建て",
        commercialSpace: "商業スペース",
        apartment: "アパート",
        condominium: "コンドミニアム",
        hotel: "ホテル"
      },
      list: {
        displayMode: "表示モード",
        emptyTitle: "物件が見つかりません",
        countLabel: "物件",
        viewModes: {
          grid: "グリッド",
          list: "リスト",
          compact: "コンパクト"
        }
      },
      actions: {
        viewDetails: "詳細を見る"
      },
      edit: {
        title: "物件を編集",
        submitSuccess: "物件が正常に更新されました！",
        submitError: "物件の更新に失敗しました",
        nameLabel: "物件名"
      },
      messages: {
        deleteConfirm: "この物件を削除してもよろしいですか？この操作は元に戻せません。",
        deleteFailed: "物件の削除に失敗しました。"
      },
      media: {
        videoUploaded: "動画 {index} をアップロードしました"
      }
    },
    chat: {
      online: "オンライン",
      offline: "オフライン",
      viewProperty: "物件を見る",
      startTitle: "会話を始めましょう",
      startDescription: "あいさつを送ってチャットを始めましょう",
      seen: "既読",
      sent: "送信済み",
      selectConversationTitle: "会話を選択",
      selectConversationDescription: "モダンなメッセージ体験で大家さんやお客様とすぐにつながれます。",
      typeMessagePlaceholder: "メッセージを入力...",
      signInRequiredTitle: "サインインしてください",
      signInRequiredDescription: "チャット履歴を見るにはサインインが必要です。",
      emptyTitle: "まだ会話はありません",
      emptyDescription: "チャット履歴はここに表示されます。",
      initialPropertyMessage: "こんにちは。物件「{title}」（ID: {id}）について問い合わせしたいです。",
      loadingMessages: "メッセージを読み込み中..."
    },
    profile: {
      displayName: "表示名",
      noBioYet: "入居希望者にあなたのことを少し紹介しましょう",
      messages: {
        editSuccess: "プロフィールを更新しました",
        editFailed: "プロフィールの更新に失敗しました",
        nameChangeLimit: "名前は30日に1回だけ変更できます。"
      },
      savedEmptyTitle: "保存済みの物件はありません",
      savedSectionDescription: "気に入った物件をここに保存できます",
      myPropertiesEmptyTitle: "まだ掲載はありません",
      myPropertiesSectionDescription: "最初の物件を掲載してみましょう",
      sectionsTitle: "セクション",
      sectionsDescription: "一度に管理する項目を1つ選択してください。",
      uploadAvatarError: "プロフィール画像のアップロードに失敗しました。もう一度お試しください。",
      uploadCoverError: "カバー画像のアップロードに失敗しました。",
      createdOn: "{date} に掲載",
      summaryTitle: "概要"
    },
    auth: {
      loginPrompt: {
        title: "ログインが必要です",
        description: "ログインすると物件を掲載し、多くの入居希望者とつながれます。"
      }
    },
    help: {
      ticket: {
        successMessage: "サポート依頼が正常に送信されました。まもなくご連絡します。",
        errorMessage: "依頼を送信できませんでした。もう一度お試しください。",
        subjectLabel: "件名",
        subjectPlaceholder: "どのようなサポートが必要か教えてください",
        priorityLabel: "優先度",
        priorities: {
          low: "低",
          medium: "中",
          high: "高"
        },
        messageLabel: "メッセージ",
        messagePlaceholder: "問題をできるだけ詳しく説明してください",
        submitButton: "チケットを送信",
        submittingButton: "送信中...",
        submittedTitle: "送信完了！",
        redirectingBack: "戻っています..."
      }
    },
    about: {
      header: "概要",
      title: "借り手と貸し手が安心してつながれるように",
      intro: "YourHomeは、誰にとっても賃貸探しをより簡単に、より速く、より信頼できるものにします。",
      founder: {
        title: "創設者",
        nameLabel: "制作",
        name: "Vuong Trung Kien",
        description: "私たちは、賃貸探しが明確で人間味があり、信頼できる体験であってほしいと考えています。"
      },
      hiring: {
        title: "成長中です",
        descriptionPrimary: "私たちは、プロダクト品質、信頼、そして借り手体験を大切にする人と出会いたいと思っています。",
        descriptionSecondary: "もしそれがあなたなら、ぜひご連絡ください。"
      },
      product: {
        title: "YourHomeでできること",
        items: [
          "インタラクティブ地図で確認済みの賃貸物件を探す。",
          "価格、広さ、場所で素早く絞り込む。",
          "気になる物件を保存して後で見返す。",
          "アプリを離れずに大家さんへ直接メッセージする。",
          "自分の物件を簡単に掲載・管理する。"
        ]
      },
      mission: {
        title: "私たちの使命",
        descriptionPrimary: "賃貸探しをストレスの多い断片的なものではなく、実用的で透明性の高いものにしたいと考えています。",
        descriptionSecondary: "より明確な掲載情報、より速い会話、そしてより良いツールが、借り手と貸し手の両方に自信をもたらします。"
      },
      contact: {
        title: "お問い合わせ",
        description: "ご質問、ご意見、提携のご相談があれば、いつでもご連絡ください。できるだけ早くお返事します。",
        homeButton: "ホームへ戻る"
      }
    },
    user: {
      profileTitle: "ユーザープロフィール",
      notFoundTitle: "ユーザーが見つかりません",
      notFoundDescription: "このユーザーは見つからないか、削除された可能性があります。",
      messageUser: "メッセージを送る",
      propertiesByName: "{name} の物件",
      noPropertiesTitle: "まだ物件はありません",
      noPropertiesDescription: "このユーザーはまだ賃貸物件を掲載していません。",
      selfMessageError: "自分自身にメッセージを送ることはできません。"
    },
    errors: {
      global: {
        title: "問題が発生しました！",
        defaultDescription: "予期しないエラーが発生しました。"
      },
      notFound: {
        title: "ページが見つかりません",
        description: "お探しのページは存在しません。",
        action: "ホームへ戻る"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome. All rights reserved."
    }
  },
  th: {
    common: {
      from: "จาก...",
      to: "ถึง...",
      reset: "รีเซ็ต",
      apply: "ใช้งาน",
      cancel: "ยกเลิก",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      upload: "อัปโหลด",
      hello: "สวัสดี",
      guest: "แขก",
      search: "ค้นหา",
      saving: "กำลังบันทึก...",
      loadMore: "โหลดเพิ่ม",
      showingOf: "แสดง {shown} จาก {total}",
      showingRange: "แสดง {start}-{end} จาก {total}",
      theme: "ธีม",
      view: "ดู",
      edit: "แก้ไข",
      delete: "ลบ"
    },
    property: {
      detail: {
        noDescription: "ยังไม่มีคำอธิบาย",
        manageListing: "จัดการประกาศ"
      },
      add: {
        title: "เพิ่มที่พัก"
      },
      form: {
        propertyTypeLabel: "ประเภทที่พัก",
        cityLabel: "เมือง",
        districtLabel: "เขต",
        addressLabel: "ที่อยู่",
        exactLocationLabel: "ตำแหน่งที่แน่นอน",
        dragPinHint: "ลากหมุดเพื่อเลือกตำแหน่งที่พักให้ถูกต้อง",
        priceLabel: "ราคา (VND)",
        contactPhoneLabel: "เบอร์โทรติดต่อ",
        photosLabel: "รูปภาพ",
        videosLabel: "วิดีโอ",
        addPhotosHint: "แตะเพื่อเพิ่มรูปภาพ (สูงสุด 7 รูป)",
        addVideosHint: "แตะเพื่อเพิ่มวิดีโอ (สูงสุด 2 รายการ)",
        streetAddressLabel: "ที่อยู่แบบละเอียด",
        useCurrentLocation: "ใช้ตำแหน่งปัจจุบัน",
        geocodingLoading: "กำลังค้นหาตำแหน่ง...",
        uploadingMedia: "กำลังอัปโหลดรูปภาพและวิดีโอ...",
        previewImage: "ดูตัวอย่างรูปภาพ",
        locationError: "ไม่สามารถระบุตำแหน่งของคุณได้",
        invalidImageType: "กรุณาอัปโหลดเฉพาะไฟล์ภาพ PNG, JPG, GIF, WebP, BMP หรือ AVIF เท่านั้น",
        imageUploadError: "อัปโหลดรูปภาพอย่างน้อยหนึ่งรายการไม่สำเร็จ",
        videoUploadError: "อัปโหลดวิดีโออย่างน้อยหนึ่งรายการไม่สำเร็จ"
      },
      filters: {
        title: "ตัวกรองขั้นสูง",
        priceRange: "ช่วงราคา (VND)",
        locationArea: "พื้นที่",
        provinceCity: "จังหวัด / เมือง",
        minBedrooms: "จำนวนห้องนอนขั้นต่ำ",
        bathroomType: "ประเภทห้องน้ำ"
      },
      types: {
        house: "บ้าน",
        commercialSpace: "พื้นที่เชิงพาณิชย์",
        apartment: "อพาร์ตเมนต์",
        condominium: "คอนโดมิเนียม",
        hotel: "โรงแรม"
      },
      list: {
        displayMode: "โหมดการแสดงผล",
        emptyTitle: "ไม่พบประกาศที่พัก",
        countLabel: "ที่พัก",
        viewModes: {
          grid: "ตาราง",
          list: "รายการ",
          compact: "กะทัดรัด"
        }
      },
      actions: {
        viewDetails: "ดูรายละเอียด"
      },
      edit: {
        title: "แก้ไขประกาศ",
        submitSuccess: "อัปเดตประกาศสำเร็จ!",
        submitError: "ไม่สามารถอัปเดตประกาศได้",
        nameLabel: "ชื่อที่พัก"
      },
      messages: {
        deleteConfirm: "คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
        deleteFailed: "ลบประกาศไม่สำเร็จ"
      },
      media: {
        videoUploaded: "อัปโหลดวิดีโอ {index} แล้ว"
      }
    },
    chat: {
      online: "ออนไลน์",
      offline: "ออฟไลน์",
      viewProperty: "ดูที่พัก",
      startTitle: "เริ่มการสนทนา",
      startDescription: "ส่งคำทักทายเพื่อเริ่มแชต",
      seen: "อ่านแล้ว",
      sent: "ส่งแล้ว",
      selectConversationTitle: "เลือกการสนทนา",
      selectConversationDescription: "แชตสมัยใหม่ที่ช่วยให้คุณเชื่อมต่อกับเจ้าของบ้านและลูกค้าได้ทันที",
      typeMessagePlaceholder: "พิมพ์ข้อความ...",
      signInRequiredTitle: "กรุณาเข้าสู่ระบบ",
      signInRequiredDescription: "คุณต้องเข้าสู่ระบบเพื่อดูประวัติการสนทนา",
      emptyTitle: "ยังไม่มีบทสนทนา",
      emptyDescription: "ประวัติการแชตของคุณจะแสดงที่นี่",
      initialPropertyMessage: "สวัสดี ฉันต้องการติดต่อเกี่ยวกับประกาศ \"{title}\" (ID: {id})",
      loadingMessages: "กำลังโหลดข้อความ..."
    },
    profile: {
      displayName: "ชื่อที่แสดง",
      noBioYet: "บอกผู้เช่าเกี่ยวกับตัวคุณสักหน่อย",
      messages: {
        editSuccess: "อัปเดตโปรไฟล์สำเร็จ",
        editFailed: "อัปเดตโปรไฟล์ไม่สำเร็จ",
        nameChangeLimit: "คุณสามารถเปลี่ยนชื่อได้เพียงครั้งเดียวทุก 30 วัน"
      },
      savedEmptyTitle: "ยังไม่มีที่พักที่บันทึกไว้",
      savedSectionDescription: "บันทึกประกาศที่คุณชอบไว้ที่นี่",
      myPropertiesEmptyTitle: "ยังไม่มีประกาศ",
      myPropertiesSectionDescription: "เริ่มโพสต์ประกาศแรกของคุณ",
      sectionsTitle: "ส่วนต่างๆ",
      sectionsDescription: "เลือกจัดการทีละส่วน",
      uploadAvatarError: "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง",
      uploadCoverError: "อัปโหลดรูปหน้าปกไม่สำเร็จ",
      createdOn: "โพสต์เมื่อ {date}",
      summaryTitle: "สรุป"
    },
    auth: {
      loginPrompt: {
        title: "จำเป็นต้องเข้าสู่ระบบ",
        description: "เข้าสู่ระบบเพื่อโพสต์ประกาศและเชื่อมต่อกับผู้เช่าที่มีศักยภาพจำนวนมาก"
      }
    },
    help: {
      ticket: {
        successMessage: "ส่งคำขอความช่วยเหลือเรียบร้อยแล้ว เราจะติดต่อกลับโดยเร็วที่สุด",
        errorMessage: "เราไม่สามารถส่งคำขอของคุณได้ กรุณาลองอีกครั้ง",
        subjectLabel: "หัวข้อ",
        subjectPlaceholder: "บอกเราว่าคุณต้องการความช่วยเหลือเรื่องใด",
        priorityLabel: "ระดับความสำคัญ",
        priorities: {
          low: "ต่ำ",
          medium: "ปานกลาง",
          high: "สูง"
        },
        messageLabel: "ข้อความ",
        messagePlaceholder: "อธิบายปัญหาให้ละเอียดที่สุด",
        submitButton: "ส่งคำขอ",
        submittingButton: "กำลังส่ง...",
        submittedTitle: "ส่งแล้ว!",
        redirectingBack: "กำลังย้อนกลับ..."
      }
    },
    about: {
      header: "เกี่ยวกับ",
      title: "ช่วยให้ผู้เช่าและเจ้าของบ้านเชื่อมต่อกันอย่างมั่นใจ",
      intro: "YourHome ทำให้การค้นหาที่เช่าง่ายขึ้น เร็วขึ้น และน่าเชื่อถือมากขึ้นสำหรับทุกคน",
      founder: {
        title: "ผู้ก่อตั้ง",
        nameLabel: "สร้างโดย",
        name: "Vuong Trung Kien",
        description: "เราอยากให้การค้นหาที่พักเช่าชัดเจน เป็นมิตร และเชื่อถือได้"
      },
      hiring: {
        title: "เรากำลังเติบโต",
        descriptionPrimary: "เรายินดีเสมอที่จะรู้จักคนที่ใส่ใจคุณภาพของผลิตภัณฑ์ ความน่าเชื่อถือ และประสบการณ์ของผู้เช่า",
        descriptionSecondary: "ถ้านั่นคือสิ่งที่คุณให้ความสำคัญ เราอยากได้ยินจากคุณ"
      },
      product: {
        title: "สิ่งที่ YourHome ช่วยคุณได้",
        items: [
          "ค้นหาประกาศเช่าที่ผ่านการตรวจสอบบนแผนที่แบบโต้ตอบ",
          "กรองตามราคา พื้นที่ และทำเลได้ภายในไม่กี่วินาที",
          "บันทึกที่พักไว้ดูภายหลังได้",
          "ส่งข้อความถึงเจ้าของบ้านได้โดยไม่ต้องออกจากแอป",
          "ลงประกาศและจัดการที่พักของคุณได้อย่างง่ายดาย"
        ]
      },
      mission: {
        title: "พันธกิจของเรา",
        descriptionPrimary: "เราอยากให้การค้นหาที่พักเช่าเป็นเรื่องโปร่งใสและใช้งานได้จริง แทนที่จะเครียดและกระจัดกระจาย",
        descriptionSecondary: "ประกาศที่ชัดเจนขึ้น การสนทนาที่เร็วขึ้น และเครื่องมือที่ดีกว่า จะช่วยให้ทั้งผู้เช่าและเจ้าของบ้านตัดสินใจได้อย่างมั่นใจ"
      },
      contact: {
        title: "ติดต่อ",
        description: "หากคุณมีคำถาม ข้อเสนอแนะ หรือแนวคิดความร่วมมือ ติดต่อเราได้ทุกเมื่อ แล้วเราจะตอบกลับโดยเร็ว",
        homeButton: "กลับหน้าแรก"
      }
    },
    user: {
      profileTitle: "โปรไฟล์ผู้ใช้",
      notFoundTitle: "ไม่พบผู้ใช้",
      notFoundDescription: "ไม่พบผู้ใช้นี้ หรืออาจถูกลบไปแล้ว",
      messageUser: "ส่งข้อความ",
      propertiesByName: "ประกาศของ {name}",
      noPropertiesTitle: "ยังไม่มีประกาศ",
      noPropertiesDescription: "ผู้ใช้นี้ยังไม่ได้โพสต์ที่พักให้เช่า",
      selfMessageError: "คุณไม่สามารถส่งข้อความถึงตัวเองได้"
    },
    errors: {
      global: {
        title: "เกิดข้อผิดพลาด!",
        defaultDescription: "เกิดข้อผิดพลาดที่ไม่คาดคิด"
      },
      notFound: {
        title: "ไม่พบหน้า",
        description: "ไม่พบหน้าที่คุณกำลังค้นหา",
        action: "กลับหน้าแรก"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome สงวนลิขสิทธิ์"
    }
  },
  id: {
    common: {
      from: "Dari...",
      to: "Hingga...",
      reset: "Atur ulang",
      apply: "Terapkan",
      cancel: "Batal",
      saveChanges: "Simpan perubahan",
      upload: "Unggah",
      hello: "Halo",
      guest: "Tamu",
      search: "Cari",
      saving: "Menyimpan...",
      loadMore: "Muat lagi",
      showingOf: "Menampilkan {shown} dari {total}",
      showingRange: "Menampilkan {start}-{end} dari {total}",
      theme: "Tema",
      view: "Lihat",
      edit: "Edit",
      delete: "Hapus"
    },
    property: {
      detail: {
        noDescription: "Tidak ada deskripsi.",
        manageListing: "Kelola iklan"
      },
      add: {
        title: "Tambah properti"
      },
      form: {
        propertyTypeLabel: "Jenis properti",
        cityLabel: "Kota",
        districtLabel: "Distrik",
        addressLabel: "Alamat",
        exactLocationLabel: "Lokasi tepat",
        dragPinHint: "Seret pin ke lokasi properti yang tepat",
        priceLabel: "Harga (VND)",
        contactPhoneLabel: "Nomor telepon kontak",
        photosLabel: "Foto",
        videosLabel: "Video",
        addPhotosHint: "Klik untuk menambahkan foto (maks. 7)",
        addVideosHint: "Klik untuk menambahkan video (maks. 2)",
        streetAddressLabel: "Alamat lengkap",
        useCurrentLocation: "Gunakan lokasi saya saat ini",
        geocodingLoading: "Mencari lokasi...",
        uploadingMedia: "Mengunggah foto dan video...",
        previewImage: "Pratinjau gambar",
        locationError: "Tidak dapat mengambil lokasi Anda.",
        invalidImageType: "Harap unggah hanya gambar PNG, JPG, GIF, WebP, BMP, atau AVIF.",
        imageUploadError: "Gagal mengunggah satu atau lebih gambar.",
        videoUploadError: "Gagal mengunggah satu atau lebih video."
      },
      filters: {
        title: "Filter lanjutan",
        priceRange: "Rentang harga (VND)",
        locationArea: "Lokasi",
        provinceCity: "Provinsi / Kota",
        minBedrooms: "Jumlah kamar minimum",
        bathroomType: "Tipe kamar mandi"
      },
      types: {
        house: "Rumah",
        commercialSpace: "Ruang komersial",
        apartment: "Apartemen",
        condominium: "Kondominium",
        hotel: "Hotel"
      },
      list: {
        displayMode: "Mode tampilan",
        emptyTitle: "Properti tidak ditemukan",
        countLabel: "properti",
        viewModes: {
          grid: "Grid",
          list: "Daftar",
          compact: "Ringkas"
        }
      },
      actions: {
        viewDetails: "Lihat detail"
      },
      edit: {
        title: "Edit properti",
        submitSuccess: "Properti berhasil diperbarui!",
        submitError: "Gagal memperbarui properti",
        nameLabel: "Nama properti"
      },
      messages: {
        deleteConfirm: "Apakah Anda yakin ingin menghapus properti ini? Tindakan ini tidak dapat dibatalkan.",
        deleteFailed: "Gagal menghapus properti."
      },
      media: {
        videoUploaded: "Video {index} berhasil diunggah"
      }
    },
    chat: {
      online: "Online",
      offline: "Offline",
      viewProperty: "Lihat properti",
      startTitle: "Mulai percakapan",
      startDescription: "Kirim sapaan untuk mulai mengobrol",
      seen: "Dilihat",
      sent: "Terkirim",
      selectConversationTitle: "Pilih percakapan",
      selectConversationDescription: "Gaya messenger modern untuk terhubung dengan pemilik dan pelanggan secara instan.",
      typeMessagePlaceholder: "Ketik pesan...",
      signInRequiredTitle: "Silakan masuk",
      signInRequiredDescription: "Anda perlu masuk untuk melihat riwayat obrolan.",
      emptyTitle: "Belum ada percakapan",
      emptyDescription: "Riwayat obrolan Anda akan muncul di sini.",
      initialPropertyMessage: "Halo, saya ingin menghubungi Anda mengenai iklan \"{title}\" (ID: {id}).",
      loadingMessages: "Memuat pesan..."
    },
    profile: {
      displayName: "Nama tampilan",
      noBioYet: "Ceritakan sedikit tentang diri Anda kepada penyewa",
      messages: {
        editSuccess: "Profil berhasil diperbarui",
        editFailed: "Gagal memperbarui profil",
        nameChangeLimit: "Anda hanya dapat mengubah nama satu kali setiap 30 hari."
      },
      savedEmptyTitle: "Belum ada properti tersimpan",
      savedSectionDescription: "Simpan iklan yang Anda sukai di sini",
      myPropertiesEmptyTitle: "Belum ada iklan",
      myPropertiesSectionDescription: "Mulai posting iklan pertama Anda",
      sectionsTitle: "Bagian",
      sectionsDescription: "Pilih satu area untuk dikelola pada satu waktu.",
      uploadAvatarError: "Gagal mengunggah foto profil. Silakan coba lagi.",
      uploadCoverError: "Gagal mengunggah gambar sampul.",
      createdOn: "Diposting pada {date}",
      summaryTitle: "Ringkasan"
    },
    auth: {
      loginPrompt: {
        title: "Login diperlukan",
        description: "Masuk untuk memposting iklan dan terhubung dengan ribuan calon penyewa."
      }
    },
    help: {
      ticket: {
        successMessage: "Permintaan dukungan Anda berhasil dikirim. Kami akan segera menghubungi Anda.",
        errorMessage: "Kami tidak dapat mengirim permintaan Anda. Silakan coba lagi.",
        subjectLabel: "Subjek",
        subjectPlaceholder: "Beri tahu kami bantuan apa yang Anda butuhkan",
        priorityLabel: "Prioritas",
        priorities: {
          low: "Rendah",
          medium: "Sedang",
          high: "Tinggi"
        },
        messageLabel: "Pesan",
        messagePlaceholder: "Jelaskan masalahnya sedetail mungkin",
        submitButton: "Kirim tiket",
        submittingButton: "Mengirim...",
        submittedTitle: "Terkirim!",
        redirectingBack: "Mengalihkan kembali..."
      }
    },
    about: {
      header: "Tentang",
      title: "Membantu penyewa dan pemilik terhubung dengan percaya diri",
      intro: "YourHome membuat pencarian sewa menjadi lebih sederhana, lebih cepat, dan lebih tepercaya untuk semua orang.",
      founder: {
        title: "Pendiri",
        nameLabel: "Dibuat oleh",
        name: "Vuong Trung Kien",
        description: "Kami ingin penemuan properti sewa terasa jelas, manusiawi, dan dapat diandalkan."
      },
      hiring: {
        title: "Kami sedang berkembang",
        descriptionPrimary: "Kami selalu senang bertemu orang-orang yang peduli pada kualitas produk, kepercayaan, dan pengalaman penyewa.",
        descriptionSecondary: "Jika itu terdengar seperti Anda, kami ingin mendengar dari Anda."
      },
      product: {
        title: "Apa yang dibantu oleh YourHome",
        items: [
          "Menjelajahi iklan sewa terverifikasi di peta interaktif.",
          "Menyaring berdasarkan harga, luas, dan lokasi dalam hitungan detik.",
          "Menyimpan properti dan melihatnya lagi nanti.",
          "Mengirim pesan langsung ke pemilik tanpa keluar dari aplikasi.",
          "Memposting dan mengelola iklan Anda dengan mudah."
        ]
      },
      mission: {
        title: "Misi kami",
        descriptionPrimary: "Kami ingin pencarian sewa terasa praktis dan transparan, bukan menegangkan dan terpecah-pecah.",
        descriptionSecondary: "Iklan yang lebih jelas, percakapan yang lebih cepat, dan alat yang lebih baik membantu penyewa maupun pemilik bergerak dengan percaya diri."
      },
      contact: {
        title: "Kontak",
        description: "Punya pertanyaan, masukan, atau ide kerja sama? Hubungi kami kapan saja dan kami akan segera merespons.",
        homeButton: "Kembali ke beranda"
      }
    },
    user: {
      profileTitle: "Profil pengguna",
      notFoundTitle: "Pengguna tidak ditemukan",
      notFoundDescription: "Pengguna ini tidak dapat ditemukan atau mungkin telah dihapus.",
      messageUser: "Kirim pesan",
      propertiesByName: "Properti milik {name}",
      noPropertiesTitle: "Belum ada properti",
      noPropertiesDescription: "Pengguna ini belum memposting properti sewa apa pun.",
      selfMessageError: "Anda tidak dapat mengirim pesan kepada diri sendiri."
    },
    errors: {
      global: {
        title: "Terjadi kesalahan!",
        defaultDescription: "Terjadi kesalahan tak terduga."
      },
      notFound: {
        title: "Halaman tidak ditemukan",
        description: "Halaman yang Anda cari tidak ada.",
        action: "Ke beranda"
      }
    },
    legal: {
      footerCopyright: "© {year} YourHome. Hak cipta dilindungi."
    }
  }
};

export default extraTranslations;
