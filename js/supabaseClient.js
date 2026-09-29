/**
 * FITFLOW SUPABASE CLIENT & DATA LAYER
 * Supports: Live Supabase Cloud Database + Seamless LocalStorage Fallback
 */

import { AppConfig } from './config.js';

class SupabaseDataService {
  constructor() {
    this.client = null;
    this.isLive = false;
    this.initClient();
  }

  initClient() {
    const creds = AppConfig.getSupabaseCredentials();
    if (creds.isConfigured && window.supabase) {
      try {
        this.client = window.supabase.createClient(creds.url, creds.anonKey);
        this.isLive = true;
        console.log('✅ Connected to Supabase Cloud');
      } catch (err) {
        console.warn('⚠️ Failed to initialize Supabase, fallback to local storage:', err);
        this.client = null;
        this.isLive = false;
      }
    } else {
      this.client = null;
      this.isLive = false;
    }
  }

  isCloudActive() {
    return this.isLive;
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  async getCurrentUser() {
    if (this.isLive && this.client) {
      try {
        const { data: { user }, error } = await this.client.auth.getUser();
        if (error || !user) return this.getLocalUser();
        
        // Also fetch user profile
        const { data: profile } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return {
          id: user.id,
          email: user.email,
          fullName: profile?.full_name || user.email.split('@')[0],
          gender: profile?.gender || 'male',
          age: profile?.age || 25,
          height: profile?.height || 170,
          weight: profile?.weight || 65,
          targetWeight: profile?.target_weight || 60,
          activity: profile?.activity_level || 'moderate',
          goal: profile?.goal || 'lose_normal',
          isGuest: false
        };
      } catch (e) {
        return this.getLocalUser();
      }
    }
    return this.getLocalUser();
  }

  getLocalUser() {
    const raw = localStorage.getItem(AppConfig.getStorageKeys().LOCAL_USER);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    // Set and return default demo user
    const defaultUser = { ...AppConfig.DEFAULT_DEMO_USER, isGuest: true };
    localStorage.setItem(AppConfig.getStorageKeys().LOCAL_USER, JSON.stringify(defaultUser));
    return defaultUser;
  }

  async saveProfile(profileData) {
    if (this.isLive && this.client) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) {
        const { error } = await this.client.from('profiles').upsert({
          id: user.id,
          full_name: profileData.fullName,
          gender: profileData.gender,
          age: parseInt(profileData.age),
          height: parseFloat(profileData.height),
          weight: parseFloat(profileData.weight),
          target_weight: parseFloat(profileData.targetWeight),
          activity_level: profileData.activity,
          goal: profileData.goal,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
      }
    }

    // Always update local cache
    const current = this.getLocalUser();
    const updated = { ...current, ...profileData };
    localStorage.setItem(AppConfig.getStorageKeys().LOCAL_USER, JSON.stringify(updated));
    return updated;
  }

  async signUp(email, password, fullName) {
    if (!this.isLive || !this.client) {
      throw new Error('กรุณาระบุ Supabase URL และ Anon Key ในเมนูการตั้งค่าก่อนลงทะเบียนระบบคลาวด์');
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) throw error;
    return data;
  }

  async signIn(email, password) {
    if (!this.isLive || !this.client) {
      throw new Error('กรุณาระบุ Supabase URL และ Anon Key ในเมนูการตั้งค่าก่อนเข้าสู่ระบบ');
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    if (this.isLive && this.client) {
      await this.client.auth.signOut();
    }
    // Return to guest demo user
    localStorage.setItem(AppConfig.getStorageKeys().LOCAL_USER, JSON.stringify({
      ...AppConfig.DEFAULT_DEMO_USER,
      isGuest: true
    }));
  }

  // ==========================================
  // WEIGHT LOGS
  // ==========================================
  async getWeightLogs() {
    if (this.isLive && this.client) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) {
        const { data, error } = await this.client
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });
        if (!error && data) return data;
      }
    }

    // Local fallback with pre-populated sample logs for visual delight
    const raw = localStorage.getItem(AppConfig.getStorageKeys().LOCAL_WEIGHT_LOGS);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }

    // Default 7-day initial demo data
    const today = new Date();
    const sample = [];
    const weights = [71.5, 71.2, 70.9, 70.8, 70.5, 70.3, 70.0];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      sample.push({
        id: 'w-' + d.getTime(),
        date: d.toISOString().split('T')[0],
        weight: weights[6 - i],
        notes: i === 0 ? 'วันนี้รู้สึกสดชื่น กล้ามเนื้อกระชับ' : ''
      });
    }
    localStorage.setItem(AppConfig.getStorageKeys().LOCAL_WEIGHT_LOGS, JSON.stringify(sample));
    return sample;
  }

  async addWeightLog(weight, date = new Date().toISOString().split('T')[0], notes = '') {
    const entry = {
      id: 'w-' + Date.now(),
      weight: parseFloat(weight),
      date,
      notes,
      created_at: new Date().toISOString()
    };

    if (this.isLive && this.client) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) {
        const { data, error } = await this.client.from('weight_logs').insert([{
          user_id: user.id,
          weight: entry.weight,
          date: entry.date,
          notes: entry.notes
        }]).select();
        if (error) throw error;
        if (data && data[0]) entry.id = data[0].id;
      }
    }

    const logs = await this.getWeightLogs();
    // Update if date exists or push new
    const existingIdx = logs.findIndex(item => item.date === date);
    if (existingIdx >= 0) {
      logs[existingIdx] = entry;
    } else {
      logs.push(entry);
    }
    logs.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(AppConfig.getStorageKeys().LOCAL_WEIGHT_LOGS, JSON.stringify(logs));
    return entry;
  }

  // ==========================================
  // DAILY FOOD & CALORIE LOGS
  // ==========================================
  async getFoodLogs(date = new Date().toISOString().split('T')[0]) {
    if (this.isLive && this.client) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) {
        const { data, error } = await this.client
          .from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      }
    }

    const raw = localStorage.getItem(AppConfig.getStorageKeys().LOCAL_FOOD_LOGS);
    let allLogs = [];
    if (raw) {
      try { allLogs = JSON.parse(raw); } catch (e) {}
    } else {
      // Default initial daily food entries
      allLogs = [
        { id: 'f-1', name: 'อกไก่ต้ม 150g + ข้าวกล้อง 1 ถ้วย', calories: 380, protein: 40, carbs: 45, fat: 5, meal: 'lunch', date },
        { id: 'f-2', name: 'เวย์โปรตีน 1 สกู๊ป + กล้วยหอม 1 ผล', calories: 220, protein: 25, carbs: 28, fat: 2, meal: 'snack', date },
        { id: 'f-3', name: 'ไข่ต้ม 2 ฟอง + ขนมปังโฮลวีต 2 แผ่น', calories: 290, protein: 18, carbs: 30, fat: 10, meal: 'breakfast', date }
      ];
      localStorage.setItem(AppConfig.getStorageKeys().LOCAL_FOOD_LOGS, JSON.stringify(allLogs));
    }
    return allLogs.filter(f => f.date === date);
  }

  async addFoodLog(entry) {
    const newLog = {
      id: 'f-' + Date.now(),
      name: entry.name,
      calories: parseInt(entry.calories),
      protein: parseInt(entry.protein || 0),
      carbs: parseInt(entry.carbs || 0),
      fat: parseInt(entry.fat || 0),
      meal: entry.meal || 'lunch',
      date: entry.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    if (this.isLive && this.client) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) {
        const { data, error } = await this.client.from('food_logs').insert([{
          user_id: user.id,
          name: newLog.name,
          calories: newLog.calories,
          protein: newLog.protein,
          carbs: newLog.carbs,
          fat: newLog.fat,
          meal_type: newLog.meal,
          date: newLog.date
        }]).select();
        if (error) console.error(error);
        if (data && data[0]) newLog.id = data[0].id;
      }
    }

    const raw = localStorage.getItem(AppConfig.getStorageKeys().LOCAL_FOOD_LOGS);
    let allLogs = raw ? JSON.parse(raw) : [];
    allLogs.unshift(newLog);
    localStorage.setItem(AppConfig.getStorageKeys().LOCAL_FOOD_LOGS, JSON.stringify(allLogs));
    return newLog;
  }

  async deleteFoodLog(id) {
    if (this.isLive && this.client) {
      await this.client.from('food_logs').delete().eq('id', id);
    }
    const raw = localStorage.getItem(AppConfig.getStorageKeys().LOCAL_FOOD_LOGS);
    if (raw) {
      const filtered = JSON.parse(raw).filter(item => item.id !== id);
      localStorage.setItem(AppConfig.getStorageKeys().LOCAL_FOOD_LOGS, JSON.stringify(filtered));
    }
    return true;
  }

  // ==========================================
  // WORKOUT LOGS
  // ==========================================
  async getWorkoutLogs(date = new Date().toISOString().split('T')[0]) {
    if (this.isLive && this.client) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) {
        const { data, error } = await this.client
          .from('workout_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      }
    }

    const raw = localStorage.getItem(AppConfig.getStorageKeys().LOCAL_WORKOUT_LOGS);
    let allLogs = [];
    if (raw) {
      try { allLogs = JSON.parse(raw); } catch (e) {}
    } else {
      allLogs = [
        { id: 'wo-1', type: 'Weight Training', name: 'Push Day (อก, ไหล่, หลังแขน)', durationMinutes: 45, caloriesBurned: 320, date },
        { id: 'wo-2', type: 'Cardio', name: 'เดินชันลู่วิ่ง Incline Treadmill', durationMinutes: 25, caloriesBurned: 180, date }
      ];
      localStorage.setItem(AppConfig.getStorageKeys().LOCAL_WORKOUT_LOGS, JSON.stringify(allLogs));
    }
    return allLogs.filter(w => w.date === date);
  }

  async addWorkoutLog(entry) {
    const newLog = {
      id: 'wo-' + Date.now(),
      type: entry.type || 'Strength Training',
      name: entry.name,
      durationMinutes: parseInt(entry.durationMinutes || 30),
      caloriesBurned: parseInt(entry.caloriesBurned || 200),
      date: entry.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    if (this.isLive && this.client) {
      const { data: { user } } = await this.client.auth.getUser();
      if (user) {
        const { data, error } = await this.client.from('workout_logs').insert([{
          user_id: user.id,
          activity_type: newLog.type,
          activity_name: newLog.name,
          duration_minutes: newLog.durationMinutes,
          calories_burned: newLog.caloriesBurned,
          date: newLog.date
        }]).select();
        if (error) console.error(error);
        if (data && data[0]) newLog.id = data[0].id;
      }
    }

    const raw = localStorage.getItem(AppConfig.getStorageKeys().LOCAL_WORKOUT_LOGS);
    let allLogs = raw ? JSON.parse(raw) : [];
    allLogs.unshift(newLog);
    localStorage.setItem(AppConfig.getStorageKeys().LOCAL_WORKOUT_LOGS, JSON.stringify(allLogs));
    return newLog;
  }

  async deleteWorkoutLog(id) {
    if (this.isLive && this.client) {
      await this.client.from('workout_logs').delete().eq('id', id);
    }
    const raw = localStorage.getItem(AppConfig.getStorageKeys().LOCAL_WORKOUT_LOGS);
    if (raw) {
      const filtered = JSON.parse(raw).filter(item => item.id !== id);
      localStorage.setItem(AppConfig.getStorageKeys().LOCAL_WORKOUT_LOGS, JSON.stringify(filtered));
    }
    return true;
  }
}

export const dbService = new SupabaseDataService();
