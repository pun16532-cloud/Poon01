/**
 * FITFLOW TDEE & BMR CALCULATOR ENGINE
 * Formulas: Mifflin-St Jeor, Harris-Benedict, WHO BMI Guidelines
 */

export const TDEECalculator = {
  // Activity Multipliers
  ACTIVITY_LEVELS: {
    sedentary: { multiplier: 1.2, label: 'ไม่ออกกำลังกาย / นั่งทำงานเป็นหลัก', desc: 'Little or no exercise' },
    light: { multiplier: 1.375, label: 'ออกกำลังกายเบาๆ (1-3 วัน/สัปดาห์)', desc: 'Light exercise 1-3 days/week' },
    moderate: { multiplier: 1.55, label: 'ออกกำลังกายปานกลาง (3-5 วัน/สัปดาห์)', desc: 'Moderate exercise 3-5 days/week' },
    active: { multiplier: 1.725, label: 'ออกกำลังกายหนัก (6-7 วัน/สัปดาห์)', desc: 'Hard exercise 6-7 days/week' },
    extreme: { multiplier: 1.9, label: 'ออกกำลังกายหนักมาก / นักกีฬา (วันละ 2 ครั้ง)', desc: 'Very hard exercise, physical job or athlete' }
  },

  // Goals Multipliers / Adjustments
  GOALS: {
    lose_fast: { label: 'ลดน้ำหนักแบบเร่งด่วน (-25%)', deficitRatio: -0.25, proteinMultiplier: 2.2, fatRatio: 0.25 },
    lose_normal: { label: 'ลดไขมัน / ลดน้ำหนักแบบกระชับสัดส่วน (-18%)', deficitRatio: -0.18, proteinMultiplier: 2.0, fatRatio: 0.25 },
    maintain: { label: 'รักษาน้ำหนัก / สุขภาพแข็งแรง (Maintenance)', deficitRatio: 0, proteinMultiplier: 1.8, fatRatio: 0.28 },
    gain_lean: { label: 'เพิ่มกล้ามเนื้อแบบลีน (Lean Bulk +10%)', deficitRatio: 0.10, proteinMultiplier: 2.0, fatRatio: 0.25 },
    gain_heavy: { label: 'เพิ่มกล้ามเนื้อและน้ำหนัก (Heavy Bulk +20%)', deficitRatio: 0.20, proteinMultiplier: 2.0, fatRatio: 0.25 }
  },

  /**
   * Calculate BMR using Mifflin-St Jeor equation (Most accurate for modern population)
   * Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
   * Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
   */
  calculateBMR(gender, weightKg, heightCm, ageYears, formula = 'mifflin') {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    const a = parseFloat(ageYears);

    if (isNaN(w) || isNaN(h) || isNaN(a) || w <= 0 || h <= 0 || a <= 0) {
      return 0;
    }

    if (formula === 'harris') {
      // Revised Harris-Benedict (1984)
      if (gender === 'male') {
        return Math.round(88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a));
      } else {
        return Math.round(447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a));
      }
    }

    // Default: Mifflin-St Jeor
    if (gender === 'male') {
      return Math.round((10 * w) + (6.25 * h) - (5 * a) + 5);
    } else {
      return Math.round((10 * w) + (6.25 * h) - (5 * a) - 161);
    }
  },

  /**
   * Calculate TDEE = BMR * Activity Multiplier
   */
  calculateTDEE(bmr, activityKey = 'sedentary') {
    const activity = this.ACTIVITY_LEVELS[activityKey] || this.ACTIVITY_LEVELS.sedentary;
    return Math.round(bmr * activity.multiplier);
  },

  /**
   * Calculate BMI = weight(kg) / (height(m) ^ 2)
   */
  calculateBMI(weightKg, heightCm) {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100; // to meters

    if (isNaN(w) || isNaN(h) || h <= 0) return { bmi: 0, status: 'N/A', color: 'text-muted' };

    const bmi = parseFloat((w / (h * h)).toFixed(1));
    let status = 'สมส่วน (Normal)';
    let color = 'text-primary-color';

    // WHO Asian Population BMI ranges
    if (bmi < 18.5) {
      status = 'น้ำหนักต่ำกว่าเกณฑ์ (Underweight)';
      color = 'text-cyan';
    } else if (bmi >= 18.5 && bmi < 23) {
      status = 'สมส่วน / สุขภาพดี (Normal)';
      color = 'text-primary-color';
    } else if (bmi >= 23 && bmi < 25) {
      status = 'น้ำหนักเกินเกณฑ์ (Overweight)';
      color = 'text-orange';
    } else if (bmi >= 25 && bmi < 30) {
      status = 'โรคอ้วนระดับ 1 (Obese Class I)';
      color = 'text-orange';
    } else {
      status = 'โรคอ้วนระดับ 2 (Obese Class II)';
      color = 'text-rose';
    }

    return { bmi, status, color };
  },

  /**
   * Calculate Ideal Body Weight Range (BMI 18.5 - 22.9 for Asian standard)
   */
  calculateIdealWeightRange(heightCm) {
    const h = parseFloat(heightCm) / 100;
    if (isNaN(h) || h <= 0) return { min: 0, max: 0 };
    return {
      min: Math.round(18.5 * (h * h)),
      max: Math.round(22.9 * (h * h))
    };
  },

  /**
   * Calculate Target Calories and Daily Macronutrients Breakdown
   * 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal
   */
  calculateMacros(tdee, weightKg, goalKey = 'maintain') {
    const goal = this.GOALS[goalKey] || this.GOALS.maintain;
    const targetCalories = Math.round(tdee * (1 + goal.deficitRatio));

    // Protein based on body weight
    const proteinGrams = Math.round(parseFloat(weightKg) * goal.proteinMultiplier);
    const proteinCalories = proteinGrams * 4;

    // Fat based on percentage of target calories
    const fatCalories = Math.round(targetCalories * goal.fatRatio);
    const fatGrams = Math.round(fatCalories / 9);

    // Carbohydrates fill the remainder
    const remainingCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
    const carbsGrams = Math.round(remainingCalories / 4);
    const carbsCalories = carbsGrams * 4;

    return {
      targetCalories,
      deficitKcal: targetCalories - tdee,
      protein: { grams: proteinGrams, calories: proteinCalories, pct: Math.round((proteinCalories / targetCalories) * 100) },
      fat: { grams: fatGrams, calories: fatCalories, pct: Math.round((fatCalories / targetCalories) * 100) },
      carbs: { grams: carbsGrams, calories: carbsCalories, pct: Math.round((carbsCalories / targetCalories) * 100) }
    };
  },

  /**
   * Comprehensive calculation bundle
   */
  calculateAll(params) {
    const { gender, weight, height, age, activity, goal = 'maintain', formula = 'mifflin' } = params;

    const bmr = this.calculateBMR(gender, weight, height, age, formula);
    const tdee = this.calculateTDEE(bmr, activity);
    const bmiData = this.calculateBMI(weight, height);
    const idealWeight = this.calculateIdealWeightRange(height);
    const macros = this.calculateMacros(tdee, weight, goal);

    return {
      bmr,
      tdee,
      bmi: bmiData.bmi,
      bmiStatus: bmiData.status,
      bmiColor: bmiData.color,
      idealWeight,
      macros,
      goalKey: goal,
      activityKey: activity,
      calculatedAt: new Date().toISOString()
    };
  }
};
