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

// Parse the PowerBall database
export async function parsePowerBallDatabase(): Promise<DrawRecord[]> {
  try {
    const response = await fetch("/database-powerball.csv");
    const text = await response.text();
    const lines = text.split("\n").slice(1);
    
    return lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const nums = parts[1].trim().split(' ');
          return {
            date: parts[0],
            numbers: nums.slice(0, 5).join(' '),
            powerball: nums[5] || '',
            multiplier: parts[2]
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
    const nums = record.numbers.split(" ").map(n => parseInt(n));
    
    // Count individual numbers
    nums.forEach(num => {
      mainFreq[num] = (mainFreq[num] || 0) + 1;
    });

    // Count pairs (confluence)
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const pair = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
        pairFreq[pair] = (pairFreq[pair] || 0) + 1;
      }
    }

    // Count PowerBall
    const pb = parseInt(record.powerball);
    powerballFreq[pb] = (powerballFreq[pb] || 0) + 1;
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

  // Score main numbers
  numbers.forEach(num => {
    const freq = mainFreq[num] || 0;
    score += (freq / maxPossibleFreq) * 15; // Max 15 points per number = 75 total
  });

  // Score PowerBall
  const pbFreq = powerballFreq[powerball] || 0;
  score += (pbFreq / maxPossibleFreq) * 25; // Max 25 points

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
      score += (freq / maxPairFreq) * 10;
      pairCount++;
    }
  }

  return Math.min(score / pairCount, 100);
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
  score -= consecutiveCount * 15;

  // Penalize all numbers in same range
  const ranges = [
    numbers.filter(n => n <= 15).length,
    numbers.filter(n => n > 15 && n <= 30).length,
    numbers.filter(n => n > 30 && n <= 45).length,
    numbers.filter(n => n > 45 && n <= 60).length,
    numbers.filter(n => n > 60).length
  ];
  const maxInOneRange = Math.max(...ranges);
  if (maxInOneRange >= 4) score -= 20;
  if (maxInOneRange === 5) score -= 30;

  // Check for arithmetic sequences
  const gaps = numbers.slice(1).map((n, i) => n - numbers[i]);
  const hasArithmeticSeq = gaps.every(g => g === gaps[0]);
  if (hasArithmeticSeq) score -= 25;

  return Math.max(score, 0);
}

// Calculate distribution score (even/odd, high/low balance)
function calculateDistributionScore(numbers: number[]): number {
  let score = 0;

  // Even/Odd balance (optimal is 2-3 or 3-2)
  const evenCount = numbers.filter(n => n % 2 === 0).length;
  if (evenCount >= 2 && evenCount <= 3) {
    score += 50;
  } else if (evenCount === 1 || evenCount === 4) {
    score += 30;
  } else {
    score += 10;
  }

  // High/Low balance (optimal is 2-3 or 3-2, where 35 is the midpoint)
  const lowCount = numbers.filter(n => n <= 35).length;
  if (lowCount >= 2 && lowCount <= 3) {
    score += 50;
  } else if (lowCount === 1 || lowCount === 4) {
    score += 30;
  } else {
    score += 10;
  }

  return score;
}

// Calculate PowerBall affinity score
function calculatePowerBallScore(
  mainNumbers: number[],
  powerball: number,
  records: DrawRecord[]
): number {
  let score = 0;
  let matchCount = 0;

  // Check how often this PowerBall appeared with similar main numbers
  records.forEach(record => {
    const nums = record.numbers.split(" ").map(n => parseInt(n));
    const pb = parseInt(record.powerball);
    
    if (pb === powerball) {
      const commonNums = mainNumbers.filter(n => nums.includes(n)).length;
      if (commonNums >= 2) {
        matchCount++;
      }
    }
  });

  score = (matchCount / records.length) * 1000;
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
