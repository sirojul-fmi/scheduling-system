/**
 * Genetic Algorithm Engine for School Scheduling
 * MIS At-Taqwa - Sistem Penjadwalan Otomatis
 *
 * Chromosome: Array of Genes
 * Gene: { classId, dayIndex, slotIndex, subjectId, teacherId }
 */

'use strict';

// ============================================================
// CONSTANTS
// ============================================================
const PENALTY = {
  TEACHER_CONFLICT: 100,
  CLASS_CONFLICT: 100,
  MAX_HOURS_DAY: 80,
  MAX_HOURS_WEEK: 80,
  SLOT_RESTRICTION: 90,
  BREAK_PRAYER_SLOT: 90,
  PREFERENCE_DAY: 20,
  UNEVEN_LOAD: 10,
};

const MAX_SCORE = 100000;

// ============================================================
// CHROMOSOME INITIALIZATION
// ============================================================

/**
 * Creates a random initial population.
 * @param {object} inputData - { assignments, timeSlots, teachers, teacherPrefs }
 * @param {number} populationSize
 * @returns {Array<Array>} population
 */
function initializePopulation(inputData, populationSize) {
  const population = [];
  for (let i = 0; i < populationSize; i++) {
    population.push(createRandomChromosome(inputData));
  }
  return population;
}

/**
 * Creates a single random chromosome (one complete schedule).
 */
function createRandomChromosome(inputData) {
  const { assignments, timeSlots } = inputData;
  const chromosome = [];

  // Group assignments by class
  const byClass = {};
  for (const a of assignments) {
    if (!byClass[a.class_id]) byClass[a.class_id] = [];
    byClass[a.class_id].push(a);
  }

  const lessonSlots = timeSlots.filter(s => s.category === 'lesson');

  for (const [classId, classAssignments] of Object.entries(byClass)) {
    // Expand assignments by hours_per_week
    const needed = [];
    for (const a of classAssignments) {
      for (let h = 0; h < a.hours_per_week; h++) {
        needed.push({ subjectId: a.subject_id, teacherId: a.teacher_id });
      }
    }

    // Shuffle needed list
    shuffleArray(needed);

    // Assign to random lesson slots
    const availableSlots = [...lessonSlots].sort(() => Math.random() - 0.5);
    for (let i = 0; i < needed.length && i < availableSlots.length; i++) {
      const slot = availableSlots[i];
      chromosome.push({
        classId: parseInt(classId),
        dayIndex: slot.day_index,
        slotIndex: slot.slot_index,
        subjectId: needed[i].subjectId,
        teacherId: needed[i].teacherId,
      });
    }
  }

  return chromosome;
}

// ============================================================
// FITNESS FUNCTION
// ============================================================

/**
 * Calculates fitness score for a chromosome.
 * @param {Array} chromosome
 * @param {object} inputData
 * @returns {object} { score, hardViolations, softViolations }
 */
function calculateFitness(chromosome, inputData) {
  const { teachers, teacherPrefs, timeSlots } = inputData;
  let hardPenalty = 0;
  let softPenalty = 0;
  let hardViolations = 0;
  let softViolations = 0;

  // Index for fast lookup: teacher -> [dayIndex, slotIndex] -> count
  const teacherSlotMap = {}; // key: `${teacherId}-${dayIndex}-${slotIndex}`
  const classSlotMap = {};   // key: `${classId}-${dayIndex}-${slotIndex}`
  const teacherDayHours = {}; // key: `${teacherId}-${dayIndex}`
  const teacherWeekHours = {}; // key: `${teacherId}`

  // Break/prayer slot set
  const nonLessonSlots = new Set(
    timeSlots
      .filter(s => s.category !== 'lesson')
      .map(s => `${s.day_index}-${s.slot_index}`)
  );

  // Subject slot restrictions map: subjectId -> { allowed_day_slots, restriction_type }
  const subjectRestrictions = {};
  if (inputData.subjectRestrictions) {
    for (const r of inputData.subjectRestrictions) {
      subjectRestrictions[r.subject_id] = r;
    }
  }

  // Teacher preference map: teacherId -> { dayIndex -> preference_level }
  const prefMap = {};
  if (teacherPrefs) {
    for (const p of teacherPrefs) {
      if (!prefMap[p.teacher_id]) prefMap[p.teacher_id] = {};
      prefMap[p.teacher_id][p.day_index] = p.preference_level;
    }
  }

  // Teacher max hours map
  const teacherMaxHours = {};
  for (const t of teachers) {
    teacherMaxHours[t.id] = { day: t.max_hours_per_day, week: t.max_hours_per_week };
  }

  for (const gene of chromosome) {
    const { classId, dayIndex, slotIndex, subjectId, teacherId } = gene;
    const slotKey = `${dayIndex}-${slotIndex}`;
    const teacherSlotKey = `${teacherId}-${dayIndex}-${slotIndex}`;
    const classSlotKey = `${classId}-${dayIndex}-${slotIndex}`;
    const teacherDayKey = `${teacherId}-${dayIndex}`;

    // 1. Teacher conflict (hard)
    if (teacherSlotMap[teacherSlotKey]) {
      hardPenalty += PENALTY.TEACHER_CONFLICT;
      hardViolations++;
    }
    teacherSlotMap[teacherSlotKey] = (teacherSlotMap[teacherSlotKey] || 0) + 1;

    // 2. Class conflict (hard)
    if (classSlotMap[classSlotKey]) {
      hardPenalty += PENALTY.CLASS_CONFLICT;
      hardViolations++;
    }
    classSlotMap[classSlotKey] = (classSlotMap[classSlotKey] || 0) + 1;

    // 3. Break/prayer slot violation (hard)
    if (nonLessonSlots.has(slotKey)) {
      hardPenalty += PENALTY.BREAK_PRAYER_SLOT;
      hardViolations++;
    }

    // 4. Subject slot restriction (hard)
    const restriction = subjectRestrictions[subjectId];
    if (restriction && restriction.allowed_day_slots && restriction.allowed_day_slots.length > 0) {
      const allowed = restriction.allowed_day_slots;
      const isAllowed = allowed.some(s => s.day_index === dayIndex && s.slot_index === slotIndex);
      if (restriction.restriction_type === 'whitelist' && !isAllowed) {
        hardPenalty += PENALTY.SLOT_RESTRICTION;
        hardViolations++;
      } else if (restriction.restriction_type === 'blacklist' && isAllowed) {
        hardPenalty += PENALTY.SLOT_RESTRICTION;
        hardViolations++;
      }
    }

    // Track hours
    teacherDayHours[teacherDayKey] = (teacherDayHours[teacherDayKey] || 0) + 1;
    teacherWeekHours[teacherId] = (teacherWeekHours[teacherId] || 0) + 1;
  }

  // 5. Max hours per day (hard)
  for (const [key, count] of Object.entries(teacherDayHours)) {
    const teacherId = parseInt(key.split('-')[0]);
    const maxDay = teacherMaxHours[teacherId]?.day || 6;
    if (count > maxDay) {
      hardPenalty += PENALTY.MAX_HOURS_DAY * (count - maxDay);
      hardViolations++;
    }
  }

  // 6. Max hours per week (hard)
  for (const [teacherId, count] of Object.entries(teacherWeekHours)) {
    const maxWeek = teacherMaxHours[parseInt(teacherId)]?.week || 24;
    if (count > maxWeek) {
      hardPenalty += PENALTY.MAX_HOURS_WEEK * (count - maxWeek);
      hardViolations++;
    }
  }

  // 7. Teacher day preference (soft)
  for (const gene of chromosome) {
    const { teacherId, dayIndex } = gene;
    const prefs = prefMap[teacherId];
    if (prefs) {
      const level = prefs[dayIndex] ?? 2;
      if (level === 1) { // Not preferred
        softPenalty += PENALTY.PREFERENCE_DAY;
        softViolations++;
      }
    }
  }

  // 8. Uneven load distribution per day per teacher (soft)
  const teacherDayGroups = {};
  for (const [key, count] of Object.entries(teacherDayHours)) {
    const teacherId = key.split('-')[0];
    if (!teacherDayGroups[teacherId]) teacherDayGroups[teacherId] = [];
    teacherDayGroups[teacherId].push(count);
  }
  for (const counts of Object.values(teacherDayGroups)) {
    if (counts.length > 1) {
      const avg = counts.reduce((s, v) => s + v, 0) / counts.length;
      const variance = counts.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / counts.length;
      if (variance > 1) {
        softPenalty += PENALTY.UNEVEN_LOAD * variance;
        softViolations++;
      }
    }
  }

  const score = Math.max(0, MAX_SCORE - hardPenalty - softPenalty);
  return { score, hardViolations, softViolations };
}

// ============================================================
// SELECTION - Tournament Selection
// ============================================================

/**
 * Tournament selection: pick best from k random individuals.
 * @param {Array} population
 * @param {Array} fitnessScores
 * @param {number} tournamentSize
 * @returns {Array} selected chromosome
 */
function tournamentSelection(population, fitnessScores, tournamentSize = 3) {
  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length);
    if (fitnessScores[idx].score > bestScore) {
      bestScore = fitnessScores[idx].score;
      best = population[idx];
    }
  }
  return best;
}

// ============================================================
// CROSSOVER - Two-Point Crossover
// ============================================================

/**
 * Two-point crossover between two parent chromosomes.
 * @param {Array} parent1
 * @param {Array} parent2
 * @param {number} crossoverRate
 * @returns {[Array, Array]} [offspring1, offspring2]
 */
function twoPointCrossover(parent1, parent2, crossoverRate = 0.8) {
  if (Math.random() > crossoverRate) {
    return [deepCopy(parent1), deepCopy(parent2)];
  }

  const len = Math.min(parent1.length, parent2.length);
  if (len < 3) return [deepCopy(parent1), deepCopy(parent2)];

  let p1 = Math.floor(Math.random() * (len - 1));
  let p2 = Math.floor(Math.random() * (len - 1));
  if (p1 > p2) [p1, p2] = [p2, p1];
  if (p1 === p2) p2 = Math.min(p2 + 1, len - 1);

  const offspring1 = [
    ...deepCopy(parent1.slice(0, p1)),
    ...deepCopy(parent2.slice(p1, p2)),
    ...deepCopy(parent1.slice(p2)),
  ];
  const offspring2 = [
    ...deepCopy(parent2.slice(0, p1)),
    ...deepCopy(parent1.slice(p1, p2)),
    ...deepCopy(parent2.slice(p2)),
  ];

  return [offspring1, offspring2];
}

// ============================================================
// MUTATION - Swap Mutation
// ============================================================

/**
 * Swap two random genes within a chromosome.
 * @param {Array} chromosome
 * @param {number} mutationRate
 * @returns {Array} mutated chromosome
 */
function swapMutation(chromosome, mutationRate = 0.05) {
  const mutated = deepCopy(chromosome);
  for (let i = 0; i < mutated.length; i++) {
    if (Math.random() < mutationRate) {
      const j = Math.floor(Math.random() * mutated.length);
      // Swap slot assignments
      const tmpDay = mutated[i].dayIndex;
      const tmpSlot = mutated[i].slotIndex;
      mutated[i].dayIndex = mutated[j].dayIndex;
      mutated[i].slotIndex = mutated[j].slotIndex;
      mutated[j].dayIndex = tmpDay;
      mutated[j].slotIndex = tmpSlot;
    }
  }
  return mutated;
}

// ============================================================
// MAIN GA FUNCTION
// ============================================================

/**
 * Run the Genetic Algorithm.
 * @param {object} inputData - { assignments, timeSlots, teachers, teacherPrefs, subjectRestrictions }
 * @param {object} params - { populationSize, maxGenerations, crossoverRate, mutationRate, elitismRate, tournamentSize }
 * @param {Function} onProgress - callback(generation, bestFitness, avgFitness, hardViolations)
 * @returns {object} { bestChromosome, bestFitness, logs }
 */
function runGA(inputData, params = {}, onProgress = null) {
  const {
    populationSize = 100,
    maxGenerations = 200,
    crossoverRate = 0.8,
    mutationRate = 0.05,
    elitismRate = 0.1,
    tournamentSize = 3,
  } = params;

  const logs = [];
  const eliteCount = Math.max(1, Math.floor(populationSize * elitismRate));

  // Initialize population
  let population = initializePopulation(inputData, populationSize);
  let fitnessScores = population.map(c => calculateFitness(c, inputData));

  let bestChromosome = null;
  let bestFitness = -Infinity;
  let bestHardViolations = Infinity;

  for (let gen = 0; gen < maxGenerations; gen++) {
    // Find best
    let genBestIdx = 0;
    let genBestScore = fitnessScores[0].score;
    let totalScore = 0;

    for (let i = 0; i < population.length; i++) {
      totalScore += fitnessScores[i].score;
      if (fitnessScores[i].score > genBestScore) {
        genBestScore = fitnessScores[i].score;
        genBestIdx = i;
      }
    }

    const avgFitness = totalScore / population.length;
    const currentHardViolations = fitnessScores[genBestIdx].hardViolations;

    // Update global best
    if (genBestScore > bestFitness) {
      bestFitness = genBestScore;
      bestChromosome = deepCopy(population[genBestIdx]);
      bestHardViolations = currentHardViolations;
    }

    // Log every 10 generations
    if (gen % 10 === 0 || gen === maxGenerations - 1) {
      const logEntry = {
        generation: gen + 1,
        bestFitness: Math.round(bestFitness),
        avgFitness: Math.round(avgFitness),
        hardViolations: bestHardViolations,
      };
      logs.push(logEntry);
      if (onProgress) onProgress(logEntry);
    }

    // Early stopping: no hard violations
    if (bestHardViolations === 0 && gen > 50) {
      const finalLog = { generation: gen + 1, bestFitness: Math.round(bestFitness), avgFitness: Math.round(avgFitness), hardViolations: 0 };
      logs.push(finalLog);
      if (onProgress) onProgress(finalLog);
      break;
    }

    // Create next generation
    // Sort population by fitness (descending)
    const indexed = population.map((c, i) => ({ c, score: fitnessScores[i] }));
    indexed.sort((a, b) => b.score.score - a.score.score);

    const nextPopulation = [];

    // Elitism: carry over top individuals
    for (let i = 0; i < eliteCount; i++) {
      nextPopulation.push(deepCopy(indexed[i].c));
    }

    // Fill rest with crossover + mutation
    const sortedPop = indexed.map(x => x.c);
    const sortedFit = indexed.map(x => x.score);

    while (nextPopulation.length < populationSize) {
      const p1 = tournamentSelection(sortedPop, sortedFit, tournamentSize);
      const p2 = tournamentSelection(sortedPop, sortedFit, tournamentSize);
      const [o1, o2] = twoPointCrossover(p1, p2, crossoverRate);
      nextPopulation.push(swapMutation(o1, mutationRate));
      if (nextPopulation.length < populationSize) {
        nextPopulation.push(swapMutation(o2, mutationRate));
      }
    }

    population = nextPopulation;
    fitnessScores = population.map(c => calculateFitness(c, inputData));
  }

  return { bestChromosome, bestFitness: Math.round(bestFitness), logs, hardViolations: bestHardViolations };
}

// ============================================================
// HELPERS
// ============================================================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  runGA,
  calculateFitness,
  initializePopulation,
  tournamentSelection,
  twoPointCrossover,
  swapMutation,
  createRandomChromosome,
};
