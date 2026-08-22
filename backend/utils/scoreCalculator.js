const calculateScore = ({ matched, partial, missing, roleSkills }) => {
  // Edge case: if role has no skills defined, return 0 to prevent division by zero
  if (!roleSkills || roleSkills.length === 0) {
    return {
      score: 0,
      breakdown: {
        matched: matched.length,
        partial: partial.length,
        missing: missing.length
      }
    };
  }

  const matchedPoints = matched.length * 2;
  const partialPoints = partial.length * 1;
  const totalPossible = roleSkills.length * 2;

  let score = ((matchedPoints + partialPoints) / totalPossible) * 100;
  
  // Handle edge case where score exceeds 100 if user has extra matched skills not in roleSkills
  if (score > 100) score = 100;

  return {
    score: Math.round(score),
    breakdown: {
      matched: matched.length,
      partial: partial.length,
      missing: missing.length
    }
  };
};

module.exports = { calculateScore };
