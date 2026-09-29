/**
 * FITFLOW LANDING PAGE APPLICATION LOGIC
 */

import { TDEECalculator } from './tdeeCalculator.js';
import { dbService } from './supabaseClient.js';
import { AppConfig } from './config.js';

// Workout Database
const WORKOUT_DATABASE = [
  {
    id: 'wo-chest-press',
    category: 'strength',
    title: 'Dumbbell Bench Press',
    thaiTitle: 'ดัมเบลเบนช์เพรส (สร้างกล้ามเนื้ออก)',
    image: 'images/bench_press.jpg',
    level: 'ระดับกลาง (Intermediate)',
    duration: '20-30 นาที',
    calories: '180-240 kcal',
    target: 'อกส่วนกลาง, ไหล่ด้านหน้า, ไตรเซปส์',
    desc: 'ท่าฝึกพื้นฐานระดับคิงสำหรับสร้างกล้ามเนื้ออก เพิ่มความแข็งแรงและมวลกล้ามเนื้อท่อนบน ให้ความปลอดภัยต่อข้อต่อหัวไหล่มากกว่าบาร์เบลล์',
    steps: [
      'นอนราบบนเบาะ วางเท้าราบกับพื้น เกร็งแกนกลางลำตัว บีบสะบักด้านหลังลง',
      'ถือดัมเบลระดับอก หายใจเข้าแล้วดันดัมเบลขึ้นตรงจนแขนเกือบเหยียดตรง (ไม่ล็อกข้อศอก)',
      'ค่อยๆ ลดดัมเบลลงอย่างช้าๆ (2-3 วินาที) จนรู้สึกตึงที่กล้ามเนื้ออกแล้วดันขึ้นซ้ำ'
    ],
    tips: 'ทำ 3-4 เซ็ต เซ็ตละ 8-12 ครั้ง พักระหว่างเซ็ต 60-90 วินาที'
  },
  {
    id: 'wo-squat',
    category: 'strength',
    title: 'Barbell Goblet Squat',
    thaiTitle: 'สควอท (สร้างกล้ามเนื้อขาและก้น)',
    image: 'images/squat.jpg',
    level: 'ทุกระดับ (All Levels)',
    duration: '25-35 นาที',
    calories: '220-320 kcal',
    target: 'ต้นขาด้านหน้า, ก้น, แฮมสตริง, แกนกลาง',
    desc: 'การออกกำลังกายแบบ Compound Movement ที่เผาผลาญพลังงานสูงสุด กระตุ้นฮอร์โมนการเจริญเติบโต และเสริมความแข็งแรงของข้อต่อช่วงล่าง',
    steps: [
      'ยืนกางขากว้างกว่าหัวไหล่เล็กน้อย ปลายเท้าชี้ออกประมาณ 30 องศา',
      'เกร็งหน้าท้อง หายใจเข้า ดันสะโพกไปข้างหลังพร้อมงอเข่าย่อตัวลง ให้ต้นขาขนานกับพื้น',
      'ดันส้นเท้าขึ้นยืนตรงพร้อมหายใจออก ลำตัวไม่ก้มไปข้างหน้ามากเกินไป'
    ],
    tips: 'ทำ 4 เซ็ต เซ็ตละ 10-15 ครั้ง รักษาหลังให้ตรงตลอดการเคลื่อนไหว'
  },
  {
    id: 'wo-hiit-burn',
    category: 'cardio',
    title: 'HIIT Tabata Fat Blaster',
    thaiTitle: 'ทาบาตะ 20 นาที เผาผลาญไขมันขั้นสูง',
    image: 'images/hiit.jpg',
    level: 'ระดับสูง (Advanced)',
    duration: '20 นาที',
    calories: '250-350 kcal',
    target: 'หัวใจ, ระบบเผาผลาญ, ทั่วทั้งร่างกาย',
    desc: 'ฝึกแบบหนักสลับเบา (ออกกำลังกาย 20 วินาที พัก 10 วินาที รวม 8 รอบต่อท่า) ช่วยกระตุ้นระบบ Afterburn Effect เผาผลาญไขมันต่อเนื่องอีก 24 ชม.',
    steps: [
      'ท่าที่ 1: Burpees (20 วินาที ทำเต็มแรง / พัก 10 วินาที)',
      'ท่าที่ 2: High Knees วิ่งยกเข่าสูง (20 วินาที / พัก 10 วินาที)',
      'ท่าที่ 3: Mountain Climbers ปีนเขา (20 วินาที / พัก 10 วินาที)',
      'ท่าที่ 4: Jumping Squats กระโดดย่อเข่า (20 วินาที / พัก 10 วินาที)'
    ],
    tips: 'ควรยืดเหยียดร่างกายก่อนฝึก และดื่มน้ำจิบทีละน้อยระหว่างพัก'
  },
  {
    id: 'wo-home-core',
    category: 'home',
    title: 'Home Core & Abs Shred',
    thaiTitle: 'กระชับหน้าท้อง ไม่ต้องใช้อุปกรณ์ที่บ้าน',
    image: 'images/plank.jpg',
    level: 'เริ่มต้น - ปานกลาง (Beginner)',
    duration: '15 นาที',
    calories: '120-170 kcal',
    target: 'กล้ามท้องบน, ท้องล่าง, ซิกแพค, หลังส่วนล่าง',
    desc: 'โปรแกรมฝึกแกนกลางลำตัวเพื่อสรีระที่กระชับ ลดอาการปวดหลัง และเพิ่มสมรรถภาพในการเคลื่อนไหวประจำวัน',
    steps: [
      'ท่า Plank ค้างไว้ 45 วินาที จำนวน 3 เซ็ต',
      'ท่า Bicycle Crunches ปั่นจักรยานกลางอากาศ 20 ครั้ง/ข้าง 3 เซ็ต',
      'ท่า Dead Bug ควบคุมแกนกลาง 15 ครั้ง/ข้าง 3 เซ็ต'
    ],
    tips: 'เน้นเกร็งกล้ามเนื้อหน้าท้องตลอดเวลา ไม่ใช้คอหรือหลังกระชาก'
  },
  {
    id: 'wo-yoga-mobility',
    category: 'flexibility',
    title: 'Full Body Mobility & Yoga Flow',
    thaiTitle: 'ยืดเหยียดกล้ามเนื้อ & ผ่อนคลายออฟฟิศซินโดรม',
    image: 'images/yoga.jpg',
    level: 'ทุกระดับ (All Levels)',
    duration: '25 นาที',
    calories: '90-130 kcal',
    target: 'กล้ามเนื้อคอ, บ่า, หลัง, สะโพก, ข้อเท้า',
    desc: 'ช่วยคลายความตึงเครียดของกล้ามเนื้อหลังจากการฝึกหนัก ปรับสมดุลบุคลิกภาพ และลดความเสี่ยงต่อการบาดเจ็บเรื้อรัง',
    steps: [
      'ท่า Cat-Cow เคลื่อนไหวแนวกระดูกสันหลัง 10 รอบลมหายใจ',
      'ท่า Downward-Facing Dog ยืดกล้ามเนื้อน่องและหลัง 1 นาที',
      'ท่า Pigeon Pose ยืดเปิดสะโพกและกล้ามเนื้อก้น ข้างละ 1.5 นาที'
    ],
    tips: 'หายใจเข้า-ออกลึกๆ ยาวๆ ไม่เกร็งหรือกลั้นหายใจ'
  },
  {
    id: 'wo-calisthenics',
    category: 'home',
    title: 'Calisthenics Upper Blast',
    thaiTitle: 'บอดี้เวทท่อนบน Push-up & Dip',
    image: 'images/calisthenics.jpg',
    level: 'ปานกลาง (Intermediate)',
    duration: '20 นาที',
    calories: '160-220 kcal',
    target: 'อก, แขน, หลัง, ไหล่',
    desc: 'ฝึกด้วยน้ำหนักตัว พัฒนาการควบคุมร่างกายและกล้ามเนื้อที่คมชัด สามารถทำได้ทุกที่',
    steps: [
      'Standard Push-ups 15 ครั้ง 4 เซ็ต',
      'Bench / Chair Dips 12 ครั้ง 3 เซ็ต',
      'Pike Push-ups (ฝึกหัวไหล่) 10 ครั้ง 3 เซ็ต'
    ],
    tips: 'หากวิดพื้นไม่ไหว สามารถวางเข่าลงบนพื้นเพื่อปรับระดับความยากได้'
  }
];

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initQuickCalculator();
  initWorkoutCatalog();
  initFaqAccordion();
  initSupabaseSettingsModal();
  initAuthModal();
  updateAuthStatusUI();
});

/**
 * Quick TDEE Calculator on Hero Section
 */
function initQuickCalculator() {
  const form = document.getElementById('quick-tdee-form');
  if (!form) return;

  const genderPills = document.querySelectorAll('#calc-gender-group .pill-option');
  let selectedGender = 'male';

  genderPills.forEach(pill => {
    pill.addEventListener('click', () => {
      genderPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedGender = pill.getAttribute('data-value');
      calculateQuickResult();
    });
  });

  // Inputs
  const ageInput = document.getElementById('calc-age');
  const heightInput = document.getElementById('calc-height');
  const weightInput = document.getElementById('calc-weight');
  const activitySelect = document.getElementById('calc-activity');
  const goalSelect = document.getElementById('calc-goal');

  [ageInput, heightInput, weightInput, activitySelect, goalSelect].forEach(input => {
    if (input) {
      input.addEventListener('input', calculateQuickResult);
      input.addEventListener('change', calculateQuickResult);
    }
  });

  function calculateQuickResult() {
    const age = parseFloat(ageInput.value);
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);
    const activity = activitySelect.value;
    const goal = goalSelect.value;

    if (!age || !height || !weight || age <= 0 || height <= 0 || weight <= 0) {
      return;
    }

    const result = TDEECalculator.calculateAll({
      gender: selectedGender,
      weight,
      height,
      age,
      activity,
      goal,
      formula: 'mifflin'
    });

    // Display result box
    const resultBox = document.getElementById('quick-calc-result');
    if (resultBox) {
      resultBox.classList.add('active');
      document.getElementById('result-tdee-val').textContent = result.tdee.toLocaleString();
      document.getElementById('result-target-cal').textContent = result.macros.targetCalories.toLocaleString() + ' kcal';
      document.getElementById('result-bmr-val').textContent = result.bmr.toLocaleString() + ' kcal';
      document.getElementById('result-bmi-val').textContent = result.bmi + ' (' + result.bmiStatus.split(' ')[0] + ')';
    }

    // Cache latest calculation
    localStorage.setItem(AppConfig.getStorageKeys().LOCAL_TDEE, JSON.stringify(result));
  }

  // Go to Dashboard button
  const saveAndGoBtn = document.getElementById('btn-save-to-dashboard');
  if (saveAndGoBtn) {
    saveAndGoBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const age = parseFloat(ageInput.value);
      const height = parseFloat(heightInput.value);
      const weight = parseFloat(weightInput.value);
      const activity = activitySelect.value;
      const goal = goalSelect.value;

      if (!age || !height || !weight) {
        showToast('กรุณากรอกข้อมูล อายุ ส่วนสูง และน้ำหนัก ให้ครบถ้วน', 'error');
        return;
      }

      await dbService.saveProfile({
        gender: selectedGender,
        age,
        height,
        weight,
        activity,
        goal
      });

      showToast('บันทึกผลการคำนวณเรียบร้อย! กำลังนำไปยังแดชบอร์ด...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    });
  }

  // Initial calculate
  calculateQuickResult();
}

/**
 * Workout Catalog and Filter
 */
function initWorkoutCatalog() {
  const container = document.getElementById('workout-grid-container');
  if (!container) return;

  function renderWorkouts(category = 'all') {
    const filtered = category === 'all' 
      ? WORKOUT_DATABASE 
      : WORKOUT_DATABASE.filter(w => w.category === category);

    container.innerHTML = filtered.map(item => `
      <div class="workout-card glass-card glass-card-interactive" data-id="${item.id}">
        <div class="workout-card-media">
          <img src="${item.image}" alt="${item.thaiTitle}" class="workout-card-img" loading="lazy">
          <div class="workout-media-overlay"></div>
          <div class="workout-badge-overlay">
            <span class="badge ${item.category === 'strength' ? 'badge-primary' : item.category === 'cardio' ? 'badge-orange' : 'badge-cyan'}">
              ${item.category.toUpperCase()}
            </span>
          </div>
        </div>
        <div class="workout-card-body">
          <div class="workout-meta">
            <span>⏱️ ${item.duration}</span>
            <span>🔥 ${item.calories}</span>
          </div>
          <h3 class="workout-card-title">${item.thaiTitle}</h3>
          <p class="workout-card-desc">${item.desc}</p>
          <div class="workout-card-footer">
            <span class="badge badge-primary">${item.level}</span>
            <button class="btn btn-sm btn-outline btn-view-workout" data-id="${item.id}">ดูวิธีฝึก</button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach click events
    container.querySelectorAll('.btn-view-workout').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openWorkoutDetailModal(id);
      });
    });
  }

  // Category filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      renderWorkouts(cat);
    });
  });

  renderWorkouts('all');
}

/**
 * Open Workout Detail Modal
 */
function openWorkoutDetailModal(workoutId) {
  const item = WORKOUT_DATABASE.find(w => w.id === workoutId);
  if (!item) return;

  const modal = document.getElementById('workout-modal');
  if (!modal) return;

  const modalImg = document.getElementById('modal-workout-img');
  if (modalImg) {
    modalImg.src = item.image;
    modalImg.alt = item.thaiTitle;
  }

  document.getElementById('modal-workout-title').textContent = item.thaiTitle;
  document.getElementById('modal-workout-eng').textContent = item.title;
  document.getElementById('modal-workout-target').textContent = item.target;
  document.getElementById('modal-workout-duration').textContent = item.duration;
  document.getElementById('modal-workout-calories').textContent = item.calories;
  document.getElementById('modal-workout-tips').textContent = item.tips;

  const stepsList = document.getElementById('modal-workout-steps');
  stepsList.innerHTML = item.steps.map(step => `<li>${step}</li>`).join('');

  modal.classList.add('active');
}

/**
 * FAQ Accordion
 */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        items.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

/**
 * Supabase Settings Modal
 */
function initSupabaseSettingsModal() {
  const openBtns = document.querySelectorAll('.btn-open-supabase-modal');
  const modal = document.getElementById('supabase-config-modal');
  const closeBtn = document.getElementById('btn-close-supabase-modal');
  const saveBtn = document.getElementById('btn-save-supabase-config');
  const urlInput = document.getElementById('supabase-url-input');
  const keyInput = document.getElementById('supabase-anon-key-input');
  const clearBtn = document.getElementById('btn-clear-supabase-config');

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const creds = AppConfig.getSupabaseCredentials();
      if (urlInput) urlInput.value = creds.url;
      if (keyInput) keyInput.value = creds.anonKey;
      if (modal) modal.classList.add('active');
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();

      if (!url || !key) {
        showToast('กรุณากรอก Supabase URL และ Anon Key ให้ครบ', 'error');
        return;
      }

      AppConfig.setSupabaseCredentials(url, key);
      dbService.initClient();
      showToast('เชื่อมต่อ Supabase เรียบร้อยแล้ว!', 'success');
      modal.classList.remove('active');
      updateAuthStatusUI();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      AppConfig.clearSupabaseCredentials();
      dbService.initClient();
      showToast('ลบข้อมูลการเชื่อมต่อเรียบร้อย ใช้ Local Demo Mode', 'info');
      modal.classList.remove('active');
      updateAuthStatusUI();
    });
  }
}

/**
 * Authentication Modal (Sign In / Sign Up)
 */
function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  const openBtns = document.querySelectorAll('.btn-open-auth-modal');
  const closeBtn = document.getElementById('btn-close-auth-modal');
  const tabSignIn = document.getElementById('tab-auth-signin');
  const tabSignUp = document.getElementById('tab-auth-signup');
  const submitBtn = document.getElementById('btn-auth-submit');
  const nameGroup = document.getElementById('auth-name-group');

  let mode = 'signin'; // 'signin' or 'signup'

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) modal.classList.add('active');
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (tabSignIn && tabSignUp) {
    tabSignIn.addEventListener('click', () => {
      mode = 'signin';
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      nameGroup.style.display = 'none';
      submitBtn.textContent = 'เข้าสู่ระบบ (Sign In)';
    });

    tabSignUp.addEventListener('click', () => {
      mode = 'signup';
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      nameGroup.style.display = 'flex';
      submitBtn.textContent = 'สร้างบัญชีผู้ใช้ใหม่ (Sign Up)';
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const email = document.getElementById('auth-email').value.trim();
      const pass = document.getElementById('auth-pass').value.trim();
      const name = document.getElementById('auth-name')?.value.trim() || '';

      if (!email || !pass) {
        showToast('กรุณากรอกอีเมลและรหัสผ่าน', 'error');
        return;
      }

      try {
        if (mode === 'signup') {
          await dbService.signUp(email, pass, name);
          showToast('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลยืนยัน', 'success');
        } else {
          await dbService.signIn(email, pass);
          showToast('เข้าสู่ระบบสำเร็จ!', 'success');
        }
        modal.classList.remove('active');
        updateAuthStatusUI();
      } catch (err) {
        showToast(err.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน', 'error');
      }
    });
  }

  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    b.addEventListener('click', (e) => {
      if (e.target === b) b.classList.remove('active');
    });
  });
}

/**
 * Update UI according to database / auth state
 */
async function updateAuthStatusUI() {
  const user = await dbService.getCurrentUser();
  const dbPills = document.querySelectorAll('.supabase-status-indicator');

  dbPills.forEach(pill => {
    if (dbService.isCloudActive()) {
      pill.innerHTML = `<span class="status-dot"></span> Supabase Cloud Active`;
      pill.classList.remove('offline');
    } else {
      pill.innerHTML = `<span class="status-dot"></span> Local Storage (Demo Mode)`;
      pill.classList.add('offline');
    }
  });

  const authBtns = document.querySelectorAll('.btn-auth-trigger');
  authBtns.forEach(btn => {
    if (user && !user.isGuest) {
      btn.textContent = user.fullName || user.email;
      btn.setAttribute('href', 'dashboard.html');
    }
  });
}

/**
 * Toast Notification Utility
 */
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
