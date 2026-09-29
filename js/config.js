/**
 * FITFLOW CONFIGURATION & STATE MANAGEMENT
 */

const STORAGE_KEYS = {
  SUPABASE_URL: 'fitflow_supabase_url',
  SUPABASE_ANON_KEY: 'fitflow_supabase_anon_key',
  LOCAL_USER: 'fitflow_demo_user',
  LOCAL_WEIGHT_LOGS: 'fitflow_weight_logs',
  LOCAL_FOOD_LOGS: 'fitflow_food_logs',
  LOCAL_WORKOUT_LOGS: 'fitflow_workout_logs',
  LOCAL_TDEE: 'fitflow_latest_tdee'
};

export const AppConfig = {
  // Default demo user for instant test drive without login/keys
  DEFAULT_DEMO_USER: {
    id: 'demo-user-001',
    email: 'guest@fitflow.app',
    fullName: 'ผู้ใช้ทดสอบ (Demo User)',
    gender: 'male',
    age: 26,
    height: 175,
    weight: 70,
    targetWeight: 65,
    activity: 'moderate',
    goal: 'lose_normal',
    formula: 'mifflin'
  },

  getSupabaseCredentials() {
    const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '';
    const anonKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || '';
    return { url, anonKey, isConfigured: Boolean(url && anonKey) };
  },

  setSupabaseCredentials(url, anonKey) {
    if (url && anonKey) {
      localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
      localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
      return true;
    }
    return false;
  },

  clearSupabaseCredentials() {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  },

  getStorageKeys() {
    return STORAGE_KEYS;
  }
};
