interface DrawRecord {
  date: string;
  numbers: string;
  powerball: string;
  multiplier: string;
}

interface ScoreBreakdown {
  frequencyScore: number;
  confluenceScore: number;
  patternScore: number;
  distributionScore: number;
  powerballScore: number;
  totalScore: number;
}

export interface GameWithScore {
  mainNumbers: number[];
  powerBall: number;
  score: number;
  breakdown?: ScoreBreakdown;
}

// Parse the Powerball Australia database
export async function parsePowerBallDatabase(): Promise<DrawRecord[]> {
  try {
    const response = await fetch("/database-powerball.csv");
    const text = await response.text();
    const lines = text.split("\n").slice(1);
    
    return lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(';');
        if (parts.length >= 4) {
          // Format: Concurso;Data;Números Sorteados;Powerball;Total de Ganhadores
          const nums = parts[2].trim().split(',').map(n => n.trim()).filter(n => n);
          return {
            date: parts[1].trim(),
            numbers: nums.join(' '),
            powerball: parts[3].trim(),
            multiplier: parts[4] || ''
          };
        }
        return null;
      })
      .filter((record): record is DrawRecord => record !== null);
  } catch (error) {
    console.error("Error parsing database:", error);
    return [];
  }
}

// Calculate number frequencies
export function calculateFrequencies(records: DrawRecord[]) {
  const mainFreq: { [key: number]: number } = {};
  const powerballFreq: { [key: number]: number } = {};
  const pairFreq: { [key: string]: number } = {};

  records.forEach(record => {
    const nums = record.numbers.split(" ").map(n => parseInt(n)).filter(n => !isNaN(n));
    
    // Count individual numbers
    nums.forEach(num => {
      if (num >= 1 && num <= 35) {
        mainFreq[num] = (mainFreq[num] || 0) + 1;
      }
    });

    // Count pairs (confluence)
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const pair = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
        pairFreq[pair] = (pairFreq[pair] || 0) + 1;
      }
    }

    // Count Powerball (1-20 for AU)
    const pb = parseInt(record.powerball);
    if (pb >= 1 && pb <= 20) {
      powerballFreq[pb] = (powerballFreq[pb] || 0) + 1;
    }
  });

  return { mainFreq, powerballFreq, pairFreq };
}

// Calculate frequency score (0-100)
function calculateFrequencyScore(
  numbers: number[], 
  powerball: number,
  mainFreq: { [key: number]: number },
  powerballFreq: { [key: number]: number },
  totalDraws: number
): number {
  let score = 0;
  const maxPossibleFreq = totalDraws * 0.05; // Top 5% frequency

  // Score main numbers (7 numbers for AU)
  numbers.forEach(num => {
    const freq = mainFreq[num] || 0;
    score += (freq / maxPossibleFreq) * 10; // Max 10 points per number = 70 total
  });

  // Score Powerball
  const pbFreq = powerballFreq[powerball] || 0;
  score += (pbFreq / maxPossibleFreq) * 30; // Max 30 points

  return Math.min(score, 100);
}

// Calculate confluence score (how often numbers appear together)
function calculateConfluenceScore(
  numbers: number[],
  pairFreq: { [key: string]: number },
  totalDraws: number
): number {
  let score = 0;
  let pairCount = 0;
  const maxPairFreq = totalDraws * 0.02; // Top pairs

  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const pair = [numbers[i], numbers[j]].sort((a, b) => a - b).join('-');
      const freq = pairFreq[pair] || 0;
      score += (freq / maxPairFreq) * 5;
      pairCount++;
    }
  }

  return pairCount > 0 ? Math.min(score / pairCount, 100) : 0;
}

// Calculate pattern score (sequences, gaps, etc)
function calculatePatternScore(numbers: number[]): number {
  let score = 100;

  // Penalize consecutive sequences (too predictable)
  let consecutiveCount = 0;
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] === numbers[i - 1] + 1) {
      consecutiveCount++;
    }
  }
  score -= consecutiveCount * 12;

  // Penalize all numbers in same range (adjusted for 1-35 range)
  const ranges = [
    numbers.filter(n => n <= 7).length,
    numbers.filter(n => n > 7 && n <= 14).length,
    numbers.filter(n => n > 14 && n <= 21).length,
    numbers.filter(n => n > 21 && n <= 28).length,
    numbers.filter(n => n > 28).length
  ];
  const maxInOneRange = Math.max(...ranges);
  if (maxInOneRange >= 5) score -= 20;
  if (maxInOneRange >= 6) score -= 30;

  // Check for arithmetic sequences
  const gaps = numbers.slice(1).map((n, i) => n - numbers[i]);
  const hasArithmeticSeq = gaps.every(g => g === gaps[0]) && gaps[0] !== 0;
  if (hasArithmeticSeq) score -= 25;

  return Math.max(score, 0);
}

// Calculate distribution score (even/odd, high/low balance)
function calculateDistributionScore(numbers: number[]): number {
  let score = 0;

  // Even/Odd balance (optimal is 3-4 or 4-3 for 7 numbers)
  const evenCount = numbers.filter(n => n % 2 === 0).length;
  if (evenCount >= 3 && evenCount <= 4) {
    score += 50;
  } else if (evenCount === 2 || evenCount === 5) {
    score += 30;
  } else {
    score += 10;
  }

  // High/Low balance (optimal is 3-4 or 4-3, where 17 is the midpoint for 1-35)
  const lowCount = numbers.filter(n => n <= 17).length;
  if (lowCount >= 3 && lowCount <= 4) {
    score += 50;
  } else if (lowCount === 2 || lowCount === 5) {
    score += 30;
  } else {
    score += 10;
  }

  return score;
}

// Calculate Powerball affinity score
function calculatePowerBallScore(
  mainNumbers: number[],
  powerball: number,
  records: DrawRecord[]
): number {
  let score = 0;
  let matchCount = 0;

  // Check how often this Powerball appeared with similar main numbers
  records.forEach(record => {
    const nums = record.numbers.split(" ").map(n => parseInt(n)).filter(n => !isNaN(n));
    const pb = parseInt(record.powerball);
    
    if (pb === powerball) {
      const commonNums = mainNumbers.filter(n => nums.includes(n)).length;
      if (commonNums >= 2) {
        matchCount++;
      }
    }
  });

  score = records.length > 0 ? (matchCount / records.length) * 1000 : 0;
  return Math.min(score, 100);
}

// Main scoring function
export function calculateGameScore(
  game: { mainNumbers: number[], powerBall: number },
  mainFreq: { [key: number]: number },
  powerballFreq: { [key: number]: number },
  pairFreq: { [key: string]: number },
  records: DrawRecord[]
): GameWithScore {
  const totalDraws = records.length;

  const frequencyScore = calculateFrequencyScore(
    game.mainNumbers, 
    game.powerBall, 
    mainFreq, 
    powerballFreq, 
    totalDraws
  );

  const confluenceScore = calculateConfluenceScore(
    game.mainNumbers, 
    pairFreq, 
    totalDraws
  );

  const patternScore = calculatePatternScore(game.mainNumbers);

  const distributionScore = calculateDistributionScore(game.mainNumbers);

  const powerballScore = calculatePowerBallScore(
    game.mainNumbers,
    game.powerBall,
    records
  );

  // Weighted average
  const totalScore = (
    frequencyScore * 0.25 +
    confluenceScore * 0.25 +
    patternScore * 0.20 +
    distributionScore * 0.15 +
    powerballScore * 0.15
  );

  return {
    ...game,
    score: totalScore,
    breakdown: {
      frequencyScore,
      confluenceScore,
      patternScore,
      distributionScore,
      powerballScore,
      totalScore
    }
  };
}

// Normalize score to range 70-92.3
export function normalizeScore(rawScore: number): number {
  // Clamp raw score to 0-100
  const clampedScore = Math.max(0, Math.min(100, rawScore));
  
  // Map 0-100 to 70-92.3
  const minScore = 70;
  const maxScore = 92.3;
  const normalizedScore = minScore + (clampedScore / 100) * (maxScore - minScore);
  
  return normalizedScore;
}

export function getScoreRating(score: number): { label: string, color: string } {
  if (score >= 88) return { label: "EXCELLENT", color: "text-green-success" };
  if (score >= 82) return { label: "VERY GOOD", color: "text-primary-blue" };
  if (score >= 77) return { label: "GOOD", color: "text-gold-ai" };
  if (score >= 73) return { label: "AVERAGE", color: "text-muted-foreground" };
  return { label: "BELOW AVERAGE", color: "text-red-cta" };
}
