export interface PasswordRule {
  key: string;
  label: string;
  test: (p: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'minLen', label: 'Хамгийн багадаа 8 тэмдэгт', test: (p) => p.length >= 8 },
  { key: 'hasUpper', label: 'Том үсэг агуулсан (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'hasLower', label: 'Жижиг үсэг агуулсан (a–z)', test: (p) => /[a-z]/.test(p) },
  { key: 'hasDigit', label: 'Тоо агуулсан (0–9)', test: (p) => /[0-9]/.test(p) },
  { 
    key: 'hasSpecial', 
    label: 'Тусгай тэмдэгт агуулсан (!@#$%…)', 
    test: (p) => /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(p) 
  },
] as const;

export function getPasswordStrength(password: string) {
  let passedCount = 0;
  
  const ruleStates = PASSWORD_RULES.map((rule) => {
    const passed = rule.test(password);
    if (passed) passedCount++;
    return { key: rule.key, label: rule.label, passed };
  });

  let percent = 0;
  let color = 'bg-[#A32D2D]'; // default red

  if (passedCount > 0) {
    if (passedCount <= 2) {
      percent = passedCount * 15 + 10; // 25-40% width
      color = 'bg-[#A32D2D]'; // red
    } else if (passedCount <= 4) {
      percent = (passedCount - 2) * 7.5 + 60; // 60-75% width
      color = 'bg-[#854F0B]'; // amber
    } else if (passedCount === 5) {
      percent = 100;
      color = 'bg-[#3B6D11]'; // green
    }
  }

  return {
    passedCount,
    ruleStates,
    percent,
    color,
    isValid: passedCount === 5,
  };
}
