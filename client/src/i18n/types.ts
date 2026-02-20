// i18n/types.ts
export type LanguageCode = "en" | "fi";

// Navbar translations
export type NavbarTranslations = {
  home: string;
  calendar: string;
  health: string;
  settings: string;
  language: string;
};

// Common translations
export type CommonTranslations = {
  save: string;
  cancel: string;
  fill_both_fields: string;
  weak_password: string;
  medium_password: string;
  strong_password: string;
};

// Settings page
export type SettingsTranslations = {
  profile_section_title: string;
  email_label: string;
  username_label: string;
  gender_label: string;
  height_label: string;
  weight_label: string;
  edit_profile: string;
  change_password: string;
  profileAccount: string;
  link_polar: string;
  unlink_polar: string;
  unlink_polar_confirm: string;
  link_garmin: string;
  unlink_garmin: string;
  unlink_garmin_confirm: string;
  providerAccountManagement: string;
  delete_account: string;
  delete_account_confirm: string;
  failed_load_settings: string;
  failed_update_profile: string;
  password_changed: string;
  failed_connect_server: string;
  display_name_placeholder: string;
  select_gender: string;
  male: string;
  female: string;
  other: string;
  unknown: string;
  height_placeholder: string;
  weight_placeholder: string;
  old_password_placeholder: string;
  new_password_placeholder: string;
  failed_delete_account: string;
  unlinking: string;
  saving: string;
  changing: string;
  weak_password: string;
  medium_password: string;
  strong_password: string;
  weak_password_alert: string;
};

// Startup page
export type StartupTranslations = {
  patient: string;
  page_title: string;
  login: string;
  register: string;
  forgot_password: string;
  login_failed_session: string;
  general_error: string;
};

// Calendar page
export type CalendarTranslations = {
  title: string;
  prev: string;
  next: string;
  weekdays: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
  hasData: string;
  noData: string;
  healthStats: string;
  activities: string;
  manualActivities: string;
  noManualActivities: string;
  loadMonthError: string;
  connectError: string;
  loadStatsError: string;
  loadActivitiesError: string;
  loadManualError: string;
  deleteManualError: string;
  locale: string;
  loading: string;

  //  Add these for the forms/lists
  addActivityButton: string;
  activityTitlePlaceholder: string;
  activityTypePlaceholder: string;
  activityDurationPlaceholder: string;
  activityCaloriesPlaceholder: string;
  activityStepsPlaceholder: string;
  submitButton: string;
  cancelButton: string;

  noActivities: string;
  manuallyAdded: string;
  duration: string;
  startTime: string;
  avgHeartRate: string;
  activeCalories: string;
  stepsLabel: string; // avoid duplicate 'steps'
  noHealthStats: string;

  fields: {
    type: string;
    notes: string;
    steps: string;
    title: string;
    calories: string;
    duration: string;
  };

  heart: string;
  brain: string;
  legs: string;
  lungs: string;
  sleep: string;
  stress: string;
  activity: string;
  respiratory: string;
  skinTemp: string;
  manualActivity: string;
  deleteButton: string;
  unknown: string;
  minutesShort: string;

  durationPlaceholder: string;
  caloriesPlaceholder: string;
  stepsPlaceholder: string;

  submitting: string;

  activityTypes: {
    run: string;
    walk: string;
    gym: string;
    cycling: string;
  };
};

// Health Insights page
export type HealthInsightsTranslations = {
  title: string;
  sections: {
    profile: string;
    dailies: string;
    activities: string;
    sleep: string;
    stress: string;
    cardiovascular: string;
    bodyComposition: string;
    respiration: string;
  };
  loading: string;
  aiTitle: string;
  aiPlaceholder: string;
  comingSoon: string;
  analyzing: string;
  clearAnalysis: string;
  analyzeAll: string;
  analyzeSection: string;
  failedInsights: string;
  noDailies: string;
  sleepComingSoon: string;
  stressComingSoon: string;
  cardioComingSoon: string;
  noProfileData: string;
  noActivitiesForDate: string;
  noSleepData: string;
  noStressData: string;
  noCardioData: string;
  noRespirationData: string;
};

//home
export type HomeTranslations = {
  title: string;
  info: string;
  noMetrics: string;
  loading: string;
  guideTitle: string;
  aiTitle: string;
  noMessage: string;
  generatingMessage: string;

  bodyParts: {
    brain: string;
    heart: string;
    lungs: string;
    legs: string;
  };
};
//Login
export type LoginTranslations = {
  title: string;
  email: string;
  password: string;
  emailError: string;
  showPassword: string;
  hidePassword: string;
  loginButton: string;
  loading: string;
};

//register
export type RegisterTranslations = {
  title: string;
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;

  validEmail: string;
  weakPassword: string;
  passwordsDontMatch: string;

  showPassword: string;
  hidePassword: string;

  loading: string;
  registerButton: string;

  passwordMustContain: string;

  passwordStrength: {
    enter: string;
    weak: string;
    medium: string;
    strong: string;
  };

  requirements: {
    characters: string;
    number: string;
    lowercase: string;
    uppercase: string;
    special: string;
  };
};
//darkmodetoggle
export type DarkModeToggle = {
  darkMode: string;
  lightMode: string;
};
//logout
export type AuthTranslations = {
  logout: string;
};

// Complete translation type
export type Translations = {
  common: CommonTranslations;
  settings: SettingsTranslations;
  startup: StartupTranslations;
  calendar: CalendarTranslations;
  healthInsights: HealthInsightsTranslations;
  navbar: NavbarTranslations;
  locale: string;
  login: LoginTranslations;
  register: RegisterTranslations;
  darkmodetoggle: DarkModeToggle;
  auth: AuthTranslations;
  home: HomeTranslations;
};
