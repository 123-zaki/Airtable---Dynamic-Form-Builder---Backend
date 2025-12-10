export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules) return true; // no rules --> always show

  const { logic, conditions } = rules;
  if (!Array.isArray(conditions) || conditions.length === 0) return true;

  const results = conditions.map((cond) => {
    const { questionKey, operator, value } = cond;
    const answer = answersSoFar?.[questionKey];

    if (answer === undefined || answer === null) {
      return false;
    }

    if (operator === "equals") {
      return answer === value;
    }

    if (operator === "notEquals") {
      return answer !== value;
    }

    if (operator === "contains") {
      if (Array.isArray(answer)) {
        return answer.includes(value);
      }
      if (typeof answer === "string") {
        return answer.includes(value);
      }
      return false;
    }

    // Unknown operator
    return false;
  });

  if (logic === "AND") {
    return results.every(Boolean);
  }
  if (logic === "OR") {
    return results.some(Boolean);
  }

  // Fallback if logic unknown
  return true;
}
