export interface PasswordRule {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'minLen', label: 'Хамгийн багадаа 8 тэмдэгт', test: (password) => password.length >= 8 },
  { key: 'hasUpper', label: 'Том үсэг агуулсан', test: (password) => /[A-Z]/.test(password) },
  { key: 'hasLower', label: 'Жижиг үсэг агуулсан', test: (password) => /[a-z]/.test(password) },
  { key: 'hasDigit', label: 'Тоо агуулсан', test: (password) => /[0-9]/.test(password) },
  {
    key: 'hasSpecial',
    label: 'Тусгай тэмдэгт агуулсан',
    test: (password) => /[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(password),
  },
] as const;

export function getPasswordStrength(password: string) {
  let passedCount = 0;

  const ruleStates = PASSWORD_RULES.map((rule) => {
    const passed = rule.test(password);
    if (passed) passedCount += 1;
    return { key: rule.key, label: rule.label, passed };
  });

  let percent = 0;
  let color = 'bg-[#A32D2D]';

  if (passedCount > 0) {
    if (passedCount <= 2) {
      percent = passedCount * 15 + 10;
      color = 'bg-[#A32D2D]';
    } else if (passedCount <= 4) {
      percent = (passedCount - 2) * 7.5 + 60;
      color = 'bg-[#A56A16]';
    } else {
      percent = 100;
      color = 'bg-[#3B6D11]';
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
