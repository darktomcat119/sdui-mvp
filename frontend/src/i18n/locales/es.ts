const es = {
  // Common
  'common.loading': 'Cargando...',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar Cambios',
  'common.edit': 'Editar',
  'common.close': 'Cerrar',
  'common.previous': 'Anterior',
  'common.next': 'Siguiente',
  'common.pageOf': 'Página {{page}} de {{total}}',
  'common.noData': 'No hay datos disponibles.',
  'common.clear': 'Limpiar',
  'common.retry': 'Reintentar',

  // Roles
  'role.system_admin': 'Administrador del Sistema',
  'role.municipal_admin': 'Administrador Municipal',
  'role.treasury_operator': 'Tesorería / Operador',
  'role.legal_analyst': 'Legal / Analista',
  'role.comptroller_auditor': 'Contraloría / Auditor',

  // Status
  'status.success': 'Activo',
  'status.warning': 'Advertencia',
  'status.error': 'Error',
  'status.info': 'Info',
  'status.pending': 'Pendiente',
  'status.active': 'Activo',
  'status.inactive': 'Inactivo',
  'status.locked': 'Bloqueado',

  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.users': 'Usuarios',
  'nav.audit': 'Auditoría',
  'nav.expandMenu': 'Expandir menú',
  'nav.collapseMenu': 'Colapsar menú',

  // Route headers
  'route.dashboard.title': 'Dashboard',
  'route.dashboard.subtitle': 'Resumen general del sistema',
  'route.users.title': 'Gestión de Usuarios',
  'route.users.subtitle': 'Administrar cuentas y permisos del sistema',
  'route.usersNew.title': 'Crear Usuario',
  'route.usersNew.subtitle': 'Registrar una nueva cuenta de usuario',
  'route.auditLog.title': 'Registro de Auditoría',
  'route.auditLog.subtitle': 'Historial de acciones y eventos del sistema',
  'route.profile.title': 'Mi Perfil',
  'route.profile.subtitle': 'Gestione su información personal',

  // Header
  'header.myProfile': 'Mi Perfil',
  'header.logout': 'Cerrar sesión',

  // Login
  'login.emailLabel': 'Usuario Institucional',
  'login.emailPlaceholder': 'jperez@municipio.gob.mx',
  'login.passwordLabel': 'Contraseña',
  'login.submit': 'ACCEDER AL SISTEMA',
  'login.recovery': '¿Olvidó su contraseña? Contacte al administrador del sistema.',
  'login.copyright': '© 2026 Netbux Group S.A. de C.V. · Uso institucional autorizado',
  'login.error.emailRequired': 'El correo institucional es obligatorio.',
  'login.error.emailInvalid': 'Ingrese un correo electrónico válido.',
  'login.error.passwordRequired': 'La contraseña es obligatoria.',
  'login.error.invalidCredentials': 'Credenciales incorrectas',
  'login.error.invalidCredentialsMsg': 'El correo electrónico o la contraseña son incorrectos. Verifique sus datos e intente nuevamente.',
  'login.error.accountLocked': 'Cuenta bloqueada',
  'login.error.accountLockedMsg': 'Su cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos. Espere 15 minutos o contacte al administrador.',
  'login.error.connectionError': 'Error de conexión',
  'login.error.connectionErrorMsg': 'No se pudo conectar con el servidor. Verifique su conexión a internet e intente nuevamente.',
  'session.expired': 'Sesión expirada',
  'session.expiredMessage': 'Su sesión ha expirado. Inicie sesión nuevamente.',

  // Dashboard
  'dashboard.activeLicenses': 'Licencias Activas',
  'dashboard.pendingReview': 'Pendientes de Revisión',
  'dashboard.monthlyRevenue': 'Recaudación del Mes',
  'dashboard.actionsToday': 'Acciones Hoy',
  'dashboard.licensesModule': 'Módulo de Licencias',
  'dashboard.licensesModuleDesc': 'El módulo de Licencias de Funcionamiento estará disponible en el Milestone 2. Este dashboard mostrará métricas reales una vez que se implementen los cálculos y el motor de reglas.',

  // Users list
  'users.count': '{{count}} usuarios registrados',
  'users.newUser': 'Nuevo Usuario',
  'users.loadingUsers': 'Cargando usuarios...',
  'users.colName': 'Nombre',
  'users.colEmail': 'Correo Electrónico',
  'users.colRole': 'Rol',
  'users.colStatus': 'Estado',
  'users.colLastAccess': 'Último Acceso',
  'users.loadError': 'No se pudieron cargar los usuarios. Intente nuevamente.',

  // Create user
  'createUser.avatarHint': 'Foto de perfil (opcional)',
  'createUser.firstName': 'Nombre',
  'createUser.lastName': 'Apellido',
  'createUser.email': 'Correo Electrónico',
  'createUser.emailPlaceholder': 'usuario@municipio.gob.mx',
  'createUser.password': 'Contraseña',
  'createUser.role': 'Rol *',
  'createUser.submit': 'Crear Usuario',
  'createUser.success': 'Usuario creado correctamente.',
  'createUser.error': 'Error al crear el usuario.',
  'createUser.validation.firstNameMin': 'El nombre debe tener al menos 2 caracteres.',
  'createUser.validation.lastNameMin': 'El apellido debe tener al menos 2 caracteres.',
  'createUser.validation.emailInvalid': 'Ingrese un correo electrónico válido.',
  'createUser.validation.passwordMin': 'La contraseña debe tener al menos 8 caracteres.',
  'createUser.validation.passwordWeak': 'Debe incluir mayúscula, minúscula y un número.',

  // Audit log
  'audit.count': '{{count}} registros',
  'audit.loadingLogs': 'Cargando registros...',
  'audit.colTimestamp': 'Fecha/Hora',
  'audit.colUser': 'Usuario',
  'audit.colRole': 'Rol',
  'audit.colAction': 'Acción',
  'audit.colModule': 'Módulo',
  'audit.colEntity': 'Entidad',
  'audit.colIp': 'IP',
  'audit.filterModule': 'Módulo',
  'audit.filterAll': 'Todos',
  'audit.filterAuth': 'Autenticación',
  'audit.filterUsers': 'Usuarios',
  'audit.filterMunicipalities': 'Municipios',
  'audit.filterFrom': 'Desde',
  'audit.filterTo': 'Hasta',
  'audit.loadError': 'No se pudieron cargar los registros. Intente nuevamente.',

  // Profile
  'profile.personalInfo': 'Información Personal',
  'profile.firstName': 'Nombre',
  'profile.lastName': 'Apellido',
  'profile.email': 'Correo Electrónico',
  'profile.role': 'Rol',
  'profile.municipality': 'Municipio',
  'profile.municipalityDefault': 'Sistema Global',
  'profile.status': 'Estado',
  'profile.lastAccess': 'Último Acceso',
  'profile.avatarSuccess': 'Foto de perfil actualizada.',
  'profile.avatarError': 'Error al actualizar la foto de perfil.',
  'profile.updateSuccess': 'Perfil actualizado correctamente.',
  'profile.updateError': 'Error al actualizar el perfil. Intente nuevamente.',

  // Not found
  'notFound.message': 'La página que busca no existe.',
  'notFound.backToDashboard': 'Volver al Dashboard',

  // Avatar upload
  'avatar.fileTooLarge': 'El archivo excede 2 MB.',
  'avatar.uploadError': 'Error al subir la imagen.',

  // Environment banner
  'env.production': 'AMBIENTE: PRODUCCIÓN',
  'env.productionSubtitle': 'Acceso restringido a personal autorizado.',
  'env.testing': 'AMBIENTE: PRUEBAS — NO UTILIZAR DATOS REALES',
  'env.development': 'AMBIENTE: DESARROLLO — INESTABLE',
} as const;

export default es;
