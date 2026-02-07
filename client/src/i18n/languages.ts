export type LanguageCode = "en" | "fi";

export interface Translations {
  settings_title: string;

  // Profile section
  profile_section_title: string;
  email_label: string;
  username_label: string;
  gender_label: string;
  height_label: string;
  weight_label: string;

  edit_profile: string;
  change_password: string;

  provider: string;
  link_polar: string;
  unlink_polar: string;
  link_garmin: string;
  unlink_garmin: string;
  unlinking: string;

  language: string;
  language_coming_soon: string;

  account_management: string;
  delete_account: string;

  edit_profile_modal_title: string;
  display_name_placeholder: string;
  select_gender: string;
  male: string;
  female: string;
  other: string;
  unknown: string;
  height_placeholder: string;
  weight_placeholder: string;
  save: string;
  cancel: string;
  saving: string;

  change_password_modal_title: string;
  old_password_placeholder: string;
  new_password_placeholder: string;
  changing: string;
  enter_password: string;
  weak_password: string;
  medium_password: string;
  strong_password: string;
  password_requirements_label: string;
  fill_both_fields: string;
  password_not_strong: string;
  password_changed: string;

  failed_connect_server: string;
  failed_load_settings: string;
  failed_update_profile: string;
  failed_change_password: string;
  unlink_garmin_confirm: string;
  failed_unlink_garmin: string;
  unlink_polar_confirm: string;
  failed_unlink_polar: string;
  delete_account_confirm: string;
  failed_delete_account: string;
  startup_welcome: string;
  startup_get_started: string;

  
  profileAccount: string;
  providerAccountManagement: string;
  accountManagement: string;
  editProfile: string;
  changePassword: string;
  linkPolar: string;
  linkGarmin: string;
  deletePermanently: string;

  navbar: {
    home: string;
    calendar: string;
    health: string;
    settings: string;
  };
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    settings_title: "Settings",

    profile_section_title: "Profile & Account",
    email_label: "Email",
    username_label: "Username",
    gender_label: "Gender",
    height_label: "Height",
    weight_label: "Weight",

    edit_profile: "Edit Profile",
    change_password: "Change Password",

    provider: "Provider",
    link_polar: "Link Polar",
    unlink_polar: "Unlink Polar",
    link_garmin: "Link Garmin",
    unlink_garmin: "Unlink Garmin",
    unlinking: "Unlinking...",

    language: "Language",
    language_coming_soon: "Language settings coming soon.",

    account_management: "Account Management",
    delete_account: "Permanently Delete Account",

    edit_profile_modal_title: "Edit Profile",
    display_name_placeholder: "Display name",
    select_gender: "Select Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    unknown: "Unknown",
    height_placeholder: "Height (cm)",
    weight_placeholder: "Weight (kg)",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",

    change_password_modal_title: "Change Password",
    old_password_placeholder: "Old password",
    new_password_placeholder: "New password",
    changing: "Changing...",
    enter_password: "Enter a password",
    weak_password: "Weak password",
    medium_password: "Medium password",
    strong_password: "Strong password",
    password_requirements_label: "Password must contain:",
    fill_both_fields: "Please fill both fields",
    password_not_strong: "Password isn't strong enough",
    password_changed: "Password changed",

    failed_connect_server: "Failed to connect to server",
    failed_load_settings: "Failed to load settings",
    failed_update_profile: "Failed to update profile",
    failed_change_password: "Failed to change password",
    unlink_garmin_confirm: "Unlink Garmin from your account?",
    failed_unlink_garmin: "Failed to unlink Garmin",
    unlink_polar_confirm: "Unlink Polar from your account?",
    failed_unlink_polar: "Failed to unlink Polar",
    delete_account_confirm:
      "This will permanently delete your account. Continue?",
    failed_delete_account: "Failed to delete account",
    startup_welcome: "Welcome to the app!",
    startup_get_started: "Get Started",

    profileAccount: "Profile & Account",
    providerAccountManagement: "Providers",
    accountManagement: "Account Management",
    editProfile: "Edit Profile",
    changePassword: "Change Password",
    linkPolar: "Link Polar",
    linkGarmin: "Link Garmin",
    deletePermanently: "Permanently Delete Account",

    navbar: {
      home: "Home",
      calendar: "Calendar",
      health: "Health Insights",
      settings: "Settings",
    },
  },

  fi: {
    settings_title: "Asetukset",

    profile_section_title: "Profiili & tili",
    email_label: "Sähköposti",
    username_label: "Käyttäjänimi",
    gender_label: "Sukupuoli",
    height_label: "Pituus",
    weight_label: "Paino",

    edit_profile: "Muokkaa profiilia",
    change_password: "Vaihda salasana",

    provider: "Palvelu",
    link_polar: "Yhdistä Polar",
    unlink_polar: "Poista Polar",
    link_garmin: "Yhdistä Garmin",
    unlink_garmin: "Poista Garmin",
    unlinking: "Poistetaan yhteys...",

    language: "Kieli",
    language_coming_soon: "Kieliasetukset tulossa pian.",

    account_management: "Tilinhallinta",
    delete_account: "Poista tili pysyvästi",

    edit_profile_modal_title: "Muokkaa profiilia",
    display_name_placeholder: "Näyttönimi",
    select_gender: "Valitse sukupuoli",
    male: "Mies",
    female: "Nainen",
    other: "Muu",
    unknown: "Tuntematon",
    height_placeholder: "Pituus (cm)",
    weight_placeholder: "Paino (kg)",
    save: "Tallenna",
    cancel: "Peruuta",
    saving: "Tallennetaan...",

    change_password_modal_title: "Vaihda salasana",
    old_password_placeholder: "Vanha salasana",
    new_password_placeholder: "Uusi salasana",
    changing: "Vaihdetaan...",
    enter_password: "Syötä salasana",
    weak_password: "Heikko salasana",
    medium_password: "Keskivahva salasana",
    strong_password: "Vahva salasana",
    password_requirements_label: "Salasanan tulee sisältää:",
    fill_both_fields: "Täytä molemmat kentät",
    password_not_strong: "Salasana ei ole tarpeeksi vahva",
    password_changed: "Salasana vaihdettu",

    failed_connect_server: "Yhteyden muodostaminen palvelimeen epäonnistui",
    failed_load_settings: "Asetusten lataaminen epäonnistui",
    failed_update_profile: "Profiilin päivitys epäonnistui",
    failed_change_password: "Salasanan vaihto epäonnistui",
    unlink_garmin_confirm: "Poista Garmin tililtäsi?",
    failed_unlink_garmin: "Garminin poistaminen epäonnistui",
    unlink_polar_confirm: "Poista Polar tililtäsi?",
    failed_unlink_polar: "Polarin poistaminen epäonnistui",
    delete_account_confirm: "Tämä poistaa tilisi pysyvästi. Jatketaanko?",
    failed_delete_account: "Tilin poistaminen epäonnistui",
    startup_welcome: "Tervetuloa sovellukseen!",
    startup_get_started: "Aloita",

    profileAccount: "Profiili & tili",
    providerAccountManagement: "Palveluntarjoajat ja tilinhallinta",
    accountManagement: "Tilinhallinta",
    editProfile: "Muokkaa profiilia",
    changePassword: "Vaihda salasana",
    linkPolar: "Yhdistä Polar",
    linkGarmin: "Yhdistä Garmin",
    deletePermanently: "Poista pysyvästi",

    navbar: {
      home: "Koti",
      calendar: "Kalenteri",
      health: "Terveysnäkymät",
      settings: "Asetukset",
    },
  },
};

export const languages: LanguageCode[] = ["en", "fi"];
