/**
 * FITFLOW USER DASHBOARD & TRACKING ENGINE
 */

import { TDEECalculator } from './tdeeCalculator.js';
import { dbService } from './supabaseClient.js';
import { AppConfig } from './config.js';
import { showToast } from './app.js';

let weightChartInstance = null;
let currentProfile = null;
let currentCalculation = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadUserProfileAndMetrics();
  await loadAndRenderWeightTracker();
  await loadAndRenderDailyFoodLogs();
  await loadAndRenderWorkoutLogs();
  setupDashboardEventListeners();
  updateCloudStatusUI();
});

/**
 * Load user profile, calculate BMR/TDEE and update metric cards
 */
async function loadUserProfileAndMetrics() {
  currentProfile = await dbService.getCurrentUser();

  // Calculate metrics
  currentCalculation = TDEECalculator.calculateAll({
    gender: currentProfile.gender || 'male',
    weight: currentProfile.weight || 65,
    height: currentProfile.height || 170,
    age: currentProfile.age || 25,
    activity: currentProfile.activity || 'moderate',
    goal: currentProfile.goal || 'lose_normal',
    formula: currentProfile.formula || 'mifflin'
  });

  // Update DOM elements
  document.getElementById('dash-user-name').textContent = currentProfile.fullName || 'ผู้ใช้งาน';
  document.getElementById('dash-user-email').textContent = currentProfile.email || 'guest@fitflow.app';
  document.getElementById('dash-user-avatar').textContent = (currentProfile.fullName || 'U').charAt(0).toUpperCase();

  // Metrics
  document.getElementById('metric-weight').textContent = currentProfile.weight;
  document.getElementById('metric-target-weight').textContent = currentProfile.targetWeight || currentCalculation.idealWeight.min + '-' + currentCalculation.idealWeight.max;
  document.getElementById('metric-bmr').textContent = currentCalculation.bmr.toLocaleString();
  document.getElementById('metric-tdee').textContent = currentCalculation.tdee.toLocaleString();
  document.getElementById('metric-target-calories').textContent = currentCalculation.macros.targetCalories.toLocaleString();
  
  const bmiEl = document.getElementById('metric-bmi');
  if (bmiEl) {
    bmiEl.textContent = currentCalculation.bmi;
    document.getElementById('metric-bmi-status').textContent = currentCalculation.bmiStatus;
  }

  // Populate edit profile modal inputs
  populateProfileForm(currentProfile);
}

/**
 * Render Weight Trend Chart via Chart.js
 */
async function loadAndRenderWeightTracker() {
  const logs = await dbService.getWeightLogs();
  const ctx = document.getElementById('weightTrendChart');
  if (!ctx || !window.Chart) return;

  const labels = logs.map(l => l.date);
  const dataPoints = logs.map(l => l.weight);
  const targetVal = currentProfile.targetWeight || 65;

  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#94a3b8' : '#475569';

  weightChartInstance = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'น้ำหนักตัว (กก.)',
          data: dataPoints,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'เป้าหมาย (' + targetVal + ' กก.)',
          data: Array(labels.length).fill(targetVal),
          borderColor: '#06b6d4',
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: 'Outfit, Prompt' } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Outfit, Prompt' },
          bodyFont: { family: 'Outfit, Prompt' },
          padding: 12
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Outfit, Prompt' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Outfit, Prompt' } }
        }
      }
    }
  });

  // Render recent weight table
  renderWeightTable(logs);
}

function renderWeightTable(logs) {
  const container = document.getElementById('weight-history-list');
  if (!container) return;

  if (logs.length === 0) {
    container.innerHTML = `<div class="empty-log-state">ยังไม่มีบันทึกน้ำหนัก</div>`;
    return;
  }

  const reversed = [...logs].reverse();
  container.innerHTML = reversed.slice(0, 7).map(item => `
    <div class="log-item-row">
      <div class="log-left">
        <div class="log-icon-pill log-icon-weight">⚖️</div>
        <div>
          <div class="log-title">${item.weight} กก.</div>
          <div class="log-sub">${item.date} ${item.notes ? `• "${item.notes}"` : ''}</div>
        </div>
      </div>
      <div class="log-value text-cyan">${item.weight} kg</div>
    </div>
  `).join('');
}

/**
 * Load and render Food Logs & Calorie Balance
 */
async function loadAndRenderDailyFoodLogs() {
  const today = new Date().toISOString().split('T')[0];
  const logs = await dbService.getFoodLogs(today);
  const workoutLogs = await dbService.getWorkoutLogs(today);

  // Sum consumed
  const totalConsumed = logs.reduce((acc, cur) => acc + (cur.calories || 0), 0);
  const totalProtein = logs.reduce((acc, cur) => acc + (cur.protein || 0), 0);
  const totalCarbs = logs.reduce((acc, cur) => acc + (cur.carbs || 0), 0);
  const totalFat = logs.reduce((acc, cur) => acc + (cur.fat || 0), 0);

  // Sum burned from workouts
  const totalBurned = workoutLogs.reduce((acc, cur) => acc + (cur.caloriesBurned || 0), 0);

  const target = currentCalculation.macros.targetCalories;
  const remaining = target - totalConsumed + totalBurned;
  const percent = Math.min(100, Math.round((totalConsumed / target) * 100));

  // Update DOM
  document.getElementById('cal-target-num').textContent = target.toLocaleString();
  document.getElementById('cal-consumed-num').textContent = totalConsumed.toLocaleString();
  document.getElementById('cal-burned-num').textContent = totalBurned.toLocaleString();
  
  const remainingEl = document.getElementById('cal-remaining-num');
  if (remainingEl) {
    remainingEl.textContent = remaining.toLocaleString();
    if (remaining < 0) {
      remainingEl.classList.add('text-orange');
    } else {
      remainingEl.classList.remove('text-orange');
    }
  }

  // Progress Bar
  const progressFill = document.getElementById('cal-progress-fill');
  if (progressFill) {
    progressFill.style.width = percent + '%';
    if (percent >= 100) {
      progressFill.classList.add('over-limit');
    } else {
      progressFill.classList.remove('over-limit');
    }
  }

  // Macro Target breakdown
  const targetProteinGrams = currentCalculation.macros.protein.grams;
  const targetCarbsGrams = currentCalculation.macros.carbs.grams;
  const targetFatGrams = currentCalculation.macros.fat.grams;

  document.getElementById('macro-protein-val').textContent = `${totalProtein}g / ${targetProteinGrams}g`;
  document.getElementById('macro-carbs-val').textContent = `${totalCarbs}g / ${targetCarbsGrams}g`;
  document.getElementById('macro-fat-val').textContent = `${totalFat}g / ${targetFatGrams}g`;

  document.getElementById('macro-protein-bar').style.width = Math.min(100, Math.round((totalProtein / targetProteinGrams) * 100)) + '%';
  document.getElementById('macro-carbs-bar').style.width = Math.min(100, Math.round((totalCarbs / targetCarbsGrams) * 100)) + '%';
  document.getElementById('macro-fat-bar').style.width = Math.min(100, Math.round((totalFat / targetFatGrams) * 100)) + '%';

  // Render list
  const container = document.getElementById('food-logs-list');
  if (!container) return;

  if (logs.length === 0) {
    container.innerHTML = `<div class="empty-log-state">ยังไม่มีบันทึกอาหารสำหรับวันนี้</div>`;
    return;
  }

  container.innerHTML = logs.map(item => `
    <div class="log-item-row" data-id="${item.id}">
      <div class="log-left">
        <div class="log-icon-pill log-icon-food">🍽️</div>
        <div>
          <div class="log-title">${item.name}</div>
          <div class="log-sub">มื้อ${translateMeal(item.meal || item.meal_type)} • P: ${item.protein || 0}g | C: ${item.carbs || 0}g | F: ${item.fat || 0}g</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="log-value text-primary-color">+${item.calories} kcal</span>
        <button class="btn-delete-log btn-delete-food" data-id="${item.id}" title="ลบรายการ">🗑️</button>
      </div>
    </div>
  `).join('');

  // Delete button triggers
  container.querySelectorAll('.btn-delete-food').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await dbService.deleteFoodLog(id);
      showToast('ลบรายการอาหารเรียบร้อย', 'info');
      await loadAndRenderDailyFoodLogs();
    });
  });
}

function translateMeal(meal) {
  switch (meal) {
    case 'breakfast': return 'เช้า';
    case 'lunch': return 'กลางวัน';
    case 'dinner': return 'เย็น';
    case 'snack': return 'ของว่าง';
    default: return 'ทั่วไป';
  }
}

/**
 * Load and render Workout Logs
 */
async function loadAndRenderWorkoutLogs() {
  const today = new Date().toISOString().split('T')[0];
  const logs = await dbService.getWorkoutLogs(today);
  const container = document.getElementById('workout-logs-list');
  if (!container) return;

  if (logs.length === 0) {
    container.innerHTML = `<div class="empty-log-state">ยังไม่มีบันทึกการออกกำลังกายวันนี้</div>`;
    return;
  }

  container.innerHTML = logs.map(item => `
    <div class="log-item-row" data-id="${item.id}">
      <div class="log-left">
        <div class="log-icon-pill log-icon-workout">⚡</div>
        <div>
          <div class="log-title">${item.activity_name || item.name}</div>
          <div class="log-sub">${item.activity_type || item.type} • ⏱️ ${item.duration_minutes || item.durationMinutes} นาที</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="log-value text-orange">🔥 -${item.calories_burned || item.caloriesBurned} kcal</span>
        <button class="btn-delete-log btn-delete-workout" data-id="${item.id}" title="ลบรายการ">🗑️</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-delete-workout').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await dbService.deleteWorkoutLog(id);
      showToast('ลบรายการออกกำลังกายเรียบร้อย', 'info');
      await loadAndRenderWorkoutLogs();
      await loadAndRenderDailyFoodLogs();
    });
  });
}

/**
 * Setup Event Listeners for All Modals & Forms
 */
function setupDashboardEventListeners() {
  // 1. Add Weight Log Form
  const weightForm = document.getElementById('form-add-weight');
  if (weightForm) {
    weightForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const weight = parseFloat(document.getElementById('input-weight-val').value);
      const date = document.getElementById('input-weight-date').value || new Date().toISOString().split('T')[0];
      const notes = document.getElementById('input-weight-notes')?.value || '';

      if (!weight || weight <= 0) {
        showToast('กรุณาระบุน้ำหนักให้ถูกต้อง', 'error');
        return;
      }

      await dbService.addWeightLog(weight, date, notes);
      // Also update profile current weight
      await dbService.saveProfile({ weight });
      closeAllModals();
      showToast('บันทึกน้ำหนักสำเร็จ!', 'success');
      await loadUserProfileAndMetrics();
      await loadAndRenderWeightTracker();
    });
  }

  // 2. Add Food Log Form
  const foodForm = document.getElementById('form-add-food');
  if (foodForm) {
    foodForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('input-food-name').value.trim();
      const calories = parseInt(document.getElementById('input-food-calories').value);
      const protein = parseInt(document.getElementById('input-food-protein').value) || 0;
      const carbs = parseInt(document.getElementById('input-food-carbs').value) || 0;
      const fat = parseInt(document.getElementById('input-food-fat').value) || 0;
      const meal = document.getElementById('input-food-meal').value;

      if (!name || isNaN(calories) || calories < 0) {
        showToast('กรุณากรอกชื่ออาหารและแคลอรีให้ถูกต้อง', 'error');
        return;
      }

      await dbService.addFoodLog({ name, calories, protein, carbs, fat, meal });
      closeAllModals();
      foodForm.reset();
      showToast('บันทึกมื้ออาหารสำเร็จ!', 'success');
      await loadAndRenderDailyFoodLogs();
    });
  }

  // 3. Add Workout Log Form
  const workoutForm = document.getElementById('form-add-workout');
  if (workoutForm) {
    workoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('input-wo-name').value.trim();
      const type = document.getElementById('input-wo-type').value;
      const durationMinutes = parseInt(document.getElementById('input-wo-duration').value) || 30;
      const caloriesBurned = parseInt(document.getElementById('input-wo-calories').value) || 150;

      if (!name) {
        showToast('กรุณาระบุชื่อกิจกรรมการฝึก', 'error');
        return;
      }

      await dbService.addWorkoutLog({ name, type, durationMinutes, caloriesBurned });
      closeAllModals();
      workoutForm.reset();
      showToast('บันทึกการออกกำลังกายสำเร็จ!', 'success');
      await loadAndRenderWorkoutLogs();
      await loadAndRenderDailyFoodLogs();
    });
  }

  // 4. Update Profile & TDEE Form
  const profileForm = document.getElementById('form-edit-profile');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('edit-user-fullname').value.trim();
      const gender = document.getElementById('edit-user-gender').value;
      const age = parseInt(document.getElementById('edit-user-age').value);
      const height = parseFloat(document.getElementById('edit-user-height').value);
      const weight = parseFloat(document.getElementById('edit-user-weight').value);
      const targetWeight = parseFloat(document.getElementById('edit-user-target-weight').value);
      const activity = document.getElementById('edit-user-activity').value;
      const goal = document.getElementById('edit-user-goal').value;

      await dbService.saveProfile({
        fullName,
        gender,
        age,
        height,
        weight,
        targetWeight,
        activity,
        goal
      });

      closeAllModals();
      showToast('อัปเดตข้อมูลโปรไฟล์และคำนวณ TDEE ใหม่เรียบร้อย!', 'success');
      await loadUserProfileAndMetrics();
      await loadAndRenderWeightTracker();
      await loadAndRenderDailyFoodLogs();
    });
  }

  // Modal Open Buttons
  setupModalTriggers('btn-open-add-weight', 'modal-add-weight');
  setupModalTriggers('btn-open-add-food', 'modal-add-food');
  setupModalTriggers('btn-open-add-workout', 'modal-add-workout');
  setupModalTriggers('btn-open-edit-profile', 'modal-edit-profile');
  setupModalTriggers('btn-open-supabase-settings', 'modal-supabase-settings');

  // Supabase Settings in Dashboard
  const saveDbBtn = document.getElementById('btn-dash-save-supabase');
  if (saveDbBtn) {
    saveDbBtn.addEventListener('click', () => {
      const url = document.getElementById('dash-supabase-url').value.trim();
      const key = document.getElementById('dash-supabase-key').value.trim();
      if (!url || !key) {
        showToast('กรุณากรอก Supabase URL และ Key ให้ครบ', 'error');
        return;
      }
      AppConfig.setSupabaseCredentials(url, key);
      dbService.initClient();
      showToast('เชื่อมต่อ Supabase สำเร็จ!', 'success');
      closeAllModals();
      updateCloudStatusUI();
    });
  }

  // Export Data Button
  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const weightLogs = await dbService.getWeightLogs();
      const foodLogs = await dbService.getFoodLogs();
      const workoutLogs = await dbService.getWorkoutLogs();
      const backup = {
        profile: currentProfile,
        calculation: currentCalculation,
        weightLogs,
        foodLogs,
        workoutLogs,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FITFLOW-Backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON สำเร็จ!', 'success');
    });
  }

  // Sign out button
  const signOutBtn = document.getElementById('btn-signout');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await dbService.signOut();
      showToast('ออกจากระบบเรียบร้อย', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    });
  }

  // Close modals on backdrop click or close buttons
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals();
    });
  });
}

function setupModalTriggers(btnId, modalId) {
  const btns = document.querySelectorAll(`.${btnId}, #${btnId}`);
  const modal = document.getElementById(modalId);
  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) modal.classList.add('active');
    });
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
}

function populateProfileForm(profile) {
  if (!profile) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  setVal('edit-user-fullname', profile.fullName);
  setVal('edit-user-gender', profile.gender || 'male');
  setVal('edit-user-age', profile.age || 25);
  setVal('edit-user-height', profile.height || 170);
  setVal('edit-user-weight', profile.weight || 65);
  setVal('edit-user-target-weight', profile.targetWeight || 60);
  setVal('edit-user-activity', profile.activity || 'moderate');
  setVal('edit-user-goal', profile.goal || 'lose_normal');

  // Supabase inputs
  const creds = AppConfig.getSupabaseCredentials();
  setVal('dash-supabase-url', creds.url);
  setVal('dash-supabase-key', creds.anonKey);
}

function updateCloudStatusUI() {
  const pill = document.getElementById('dash-cloud-status');
  if (!pill) return;
  if (dbService.isCloudActive()) {
    pill.innerHTML = `<span class="status-dot"></span> Supabase Connected`;
    pill.classList.remove('offline');
  } else {
    pill.innerHTML = `<span class="status-dot"></span> Local Storage Mode`;
    pill.classList.add('offline');
  }
}
