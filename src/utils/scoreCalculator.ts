// Score calculator based on historical frequency analysis
type NumberFrequency = {
  [key: number]: number;
};

type DatabaseRecord = {
  mainNumbers: number[];
  luckyStars: number[];
};

export const parseDatabase = async (): Promise<DatabaseRecord[]> => {
  try {
    const response = await fetch('/database-euromillions.csv');
    const text = await response.text();
    const lines = text.split('\n').slice(1); // Skip header
    
    const records: DatabaseRecord[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Extract numbers from format: "1892  Fri  7 Nov 2025  11 21 39 40 43 (02 08)  86,185,474     0"
      const numbersMatch = line.match(/(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+\((\d{1,2})\s+(\d{1,2})\)/);
      
      if (numbersMatch) {
        const mainNumbers = [
          parseInt(numbersMatch[1]),
          parseInt(numbersMatch[2]),
          parseInt(numbersMatch[3]),
          parseInt(numbersMatch[4]),
          parseInt(numbersMatch[5])
        ];
        
        const luckyStars = [
          parseInt(numbersMatch[6]),
          parseInt(numbersMatch[7])
        ];
        
        records.push({ mainNumbers, luckyStars });
      }
    }
    
    return records;
  } catch (error) {
    console.error('Error parsing database:', error);
    return [];
  }
};

export const calculateFrequencies = (records: DatabaseRecord[]) => {
  const mainFreq: NumberFrequency = {};
  const starFreq: NumberFrequency = {};
  
  // Initialize frequencies
  for (let i = 1; i <= 50; i++) mainFreq[i] = 0;
  for (let i = 1; i <= 12; i++) starFreq[i] = 0;
  
  // Count occurrences
  records.forEach(record => {
    record.mainNumbers.forEach(num => {
      mainFreq[num] = (mainFreq[num] || 0) + 1;
    });
    record.luckyStars.forEach(num => {
      starFreq[num] = (starFreq[num] || 0) + 1;
    });
  });
  
  return { mainFreq, starFreq };
};

export const calculateGameScore = (
  mainNumbers: number[],
  bonusNumbers: number[] | undefined,
  mainFreq: NumberFrequency,
  starFreq: NumberFrequency
): number => {
  // Calculate main numbers score (weighted 70%)
  let mainScore = 0;
  const maxMainFreq = Math.max(...Object.values(mainFreq));
  
  mainNumbers.forEach(num => {
    const frequency = mainFreq[num] || 0;
    mainScore += (frequency / maxMainFreq) * 100;
  });
  mainScore = (mainScore / mainNumbers.length) * 0.7;
  
  // Calculate bonus/lucky stars score (weighted 30%)
  let starScore = 0;
  if (bonusNumbers && bonusNumbers.length > 0) {
    const maxStarFreq = Math.max(...Object.values(starFreq));
    
    bonusNumbers.forEach(num => {
      const frequency = starFreq[num] || 0;
      starScore += (frequency / maxStarFreq) * 100;
    });
    starScore = (starScore / bonusNumbers.length) * 0.3;
  }
  
  // Total score (0-100)
  const totalScore = mainScore + starScore;
  
  // Add slight randomization (±5%) to make it feel more dynamic
  const variance = (Math.random() - 0.5) * 10;
  return Math.max(50, Math.min(100, totalScore + variance));
};

export const getScoreRating = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: 'EXCELLENT', color: 'text-green-success' };
  if (score >= 80) return { label: 'VERY GOOD', color: 'text-green-500' };
  if (score >= 70) return { label: 'GOOD', color: 'text-blue-500' };
  if (score >= 60) return { label: 'AVERAGE', color: 'text-yellow-500' };
  return { label: 'FAIR', color: 'text-orange-500' };
};
