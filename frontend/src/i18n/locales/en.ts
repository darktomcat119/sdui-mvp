const en = {
  // Common
  'common.loading': 'Loading...',
  'common.cancel': 'Cancel',
  'common.save': 'Save Changes',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.pageOf': 'Page {{page}} of {{total}}',
  'common.noData': 'No data available.',
  'common.clear': 'Clear',
  'common.retry': 'Retry',

  // Roles
  'role.system_admin': 'System Administrator',
  'role.municipal_admin': 'Municipal Administrator',
  'role.treasury_operator': 'Treasury / Operator',
  'role.legal_analyst': 'Legal / Analyst',
  'role.comptroller_auditor': 'Comptroller / Auditor',

  // Status
  'status.success': 'Active',
  'status.warning': 'Warning',
  'status.error': 'Error',
  'status.info': 'Info',
  'status.pending': 'Pending',
  'status.active': 'Active',
  'status.inactive': 'Inactive',
  'status.locked': 'Locked',

  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.users': 'Users',
  'nav.audit': 'Audit',
  'nav.expandMenu': 'Expand menu',
  'nav.collapseMenu': 'Collapse menu',

  // Route headers
  'route.dashboard.title': 'Dashboard',
  'route.dashboard.subtitle': 'System overview',
  'route.users.title': 'User Management',
  'route.users.subtitle': 'Manage accounts and system permissions',
  'route.usersNew.title': 'Create User',
  'route.usersNew.subtitle': 'Register a new user account',
  'route.auditLog.title': 'Audit Log',
  'route.auditLog.subtitle': 'History of system actions and events',
  'route.profile.title': 'My Profile',
  'route.profile.subtitle': 'Manage your personal information',

  // Header
  'header.myProfile': 'My Profile',
  'header.logout': 'Sign out',

  // Login
  'login.emailLabel': 'Institutional Email',
  'login.emailPlaceholder': 'jdoe@municipality.gob.mx',
  'login.passwordLabel': 'Password',
  'login.submit': 'SIGN IN',
  'login.recovery': 'Forgot your password? Contact the system administrator.',
  'login.copyright': '© 2026 Netbux Group S.A. de C.V. · Authorized institutional use',
  'login.error.emailRequired': 'Institutional email is required.',
  'login.error.emailInvalid': 'Enter a valid email address.',
  'login.error.passwordRequired': 'Password is required.',
  'login.error.invalidCredentials': 'Invalid credentials',
  'login.error.invalidCredentialsMsg': 'The email or password is incorrect. Please verify your credentials and try again.',
  'login.error.accountLocked': 'Account locked',
  'login.error.accountLockedMsg': 'Your account has been temporarily locked due to multiple failed attempts. Wait 15 minutes or contact the administrator.',
  'login.error.connectionError': 'Connection error',
  'login.error.connectionErrorMsg': 'Could not connect to the server. Check your internet connection and try again.',
  'session.expired': 'Session expired',
  'session.expiredMessage': 'Your session has expired. Please sign in again.',

  // Dashboard
  'dashboard.activeLicenses': 'Active Licenses',
  'dashboard.pendingReview': 'Pending Review',
  'dashboard.monthlyRevenue': 'Monthly Revenue',
  'dashboard.actionsToday': 'Actions Today',
  'dashboard.licensesModule': 'Licenses Module',
  'dashboard.licensesModuleDesc': 'The Business Licenses module will be available in Milestone 2. This dashboard will display real metrics once the calculations and rules engine are implemented.',

  // Users list
  'users.count': '{{count}} registered users',
  'users.newUser': 'New User',
  'users.loadingUsers': 'Loading users...',
  'users.colName': 'Name',
  'users.colEmail': 'Email',
  'users.colRole': 'Role',
  'users.colStatus': 'Status',
  'users.colLastAccess': 'Last Access',
  'users.loadError': 'Could not load users. Please try again.',

  // Create user
  'createUser.avatarHint': 'Profile photo (optional)',
  'createUser.firstName': 'First Name',
  'createUser.lastName': 'Last Name',
  'createUser.email': 'Email',
  'createUser.emailPlaceholder': 'user@municipality.gob.mx',
  'createUser.password': 'Password',
  'createUser.role': 'Role *',
  'createUser.submit': 'Create User',
  'createUser.success': 'User created successfully.',
  'createUser.error': 'Error creating user.',
  'createUser.validation.firstNameMin': 'First name must be at least 2 characters.',
  'createUser.validation.lastNameMin': 'Last name must be at least 2 characters.',
  'createUser.validation.emailInvalid': 'Enter a valid email address.',
  'createUser.validation.passwordMin': 'Password must be at least 8 characters.',
  'createUser.validation.passwordWeak': 'Must include uppercase, lowercase, and a number.',

  // Audit log
  'audit.count': '{{count}} records',
  'audit.loadingLogs': 'Loading records...',
  'audit.colTimestamp': 'Date/Time',
  'audit.colUser': 'User',
  'audit.colRole': 'Role',
  'audit.colAction': 'Action',
  'audit.colModule': 'Module',
  'audit.colEntity': 'Entity',
  'audit.colIp': 'IP',
  'audit.filterModule': 'Module',
  'audit.filterAll': 'All',
  'audit.filterAuth': 'Authentication',
  'audit.filterUsers': 'Users',
  'audit.filterMunicipalities': 'Municipalities',
  'audit.filterFrom': 'From',
  'audit.filterTo': 'To',
  'audit.loadError': 'Could not load audit records. Please try again.',

  // Profile
  'profile.personalInfo': 'Personal Information',
  'profile.firstName': 'First Name',
  'profile.lastName': 'Last Name',
  'profile.email': 'Email',
  'profile.role': 'Role',
  'profile.municipality': 'Municipality',
  'profile.municipalityDefault': 'Global System',
  'profile.status': 'Status',
  'profile.lastAccess': 'Last Access',
  'profile.avatarSuccess': 'Profile photo updated.',
  'profile.avatarError': 'Error updating profile photo.',
  'profile.updateSuccess': 'Profile updated successfully.',
  'profile.updateError': 'Error updating profile. Please try again.',

  // Not found
  'notFound.message': 'The page you are looking for does not exist.',
  'notFound.backToDashboard': 'Back to Dashboard',

  // Avatar upload
  'avatar.fileTooLarge': 'File exceeds 2 MB.',
  'avatar.uploadError': 'Error uploading image.',

  // Environment banner
  'env.production': 'ENVIRONMENT: PRODUCTION',
  'env.productionSubtitle': 'Access restricted to authorized personnel.',
  'env.testing': 'ENVIRONMENT: TESTING — DO NOT USE REAL DATA',
  'env.development': 'ENVIRONMENT: DEVELOPMENT — UNSTABLE',
} as const;

export default en;
