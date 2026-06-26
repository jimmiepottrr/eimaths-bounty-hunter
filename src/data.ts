export type Grade = {
  id: string;
  label: string;
  shortLabel: string;
  range: string;
  scene: string;
};

export type Quest = {
  id: string;
  title: string;
  topic: string;
  level: string;
  reward: number;
  exp: number;
  estimatedMinutes: number;
  description: string;
  icon: string;
  questionIds: string[];
};

export type Question = {
  id: string;
  questId: string;
  prompt: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
};

export type Reward = {
  id: string;
  name: string;
  cost: number;
  description: string;
  category: string;
  icon: string;
  value?: string;
};

export const grades: Grade[] = [
  { id: 'p4', label: 'Primary 4', shortLabel: 'P4', range: 'Build strong math foundations', scene: 'island' },
  { id: 'p5', label: 'Primary 5', shortLabel: 'P5', range: 'Take on greater challenges', scene: 'temple' },
  { id: 'p6', label: 'Primary 6', shortLabel: 'P6', range: 'Master skills and be the champion', scene: 'ruins' },
];

export const quests: Quest[] = [
  {
    id: 'addition-trail',
    title: 'Treasure Trail',
    topic: 'Arithmetic',
    level: 'Beginner',
    reward: 150,
    exp: 80,
    estimatedMinutes: 4,
    description: 'Solve addition clues, follow the map, and collect your first coins.',
    icon: '📖',
    questionIds: ['q1', 'q2', 'q3'],
  },
  {
    id: 'subtraction-cave',
    title: 'Cave of Clues',
    topic: 'Subtraction',
    level: 'Explorer',
    reward: 180,
    exp: 95,
    estimatedMinutes: 5,
    description: 'Use subtraction to unlock hidden cave doors and keep the streak alive.',
    icon: '🧭',
    questionIds: ['q4', 'q5', 'q6'],
  },
  {
    id: 'multiplication-map',
    title: 'Boss Map',
    topic: 'Multiplication',
    level: 'Boss',
    reward: 220,
    exp: 120,
    estimatedMinutes: 6,
    description: 'Multiply quickly to open the treasure chest before the boss escapes.',
    icon: '👾',
    questionIds: ['q7', 'q8', 'q9'],
  },
];

export const questions: Question[] = [
  {
    id: 'q1',
    questId: 'addition-trail',
    prompt: 'Mina has 7 coins and finds 5 more. How many coins does she have now?',
    options: ['10', '11', '12', '13'],
    answer: '12',
    hint: 'Start at 7 and count 5 more steps.',
    explanation: '7 + 5 = 12, so Mina has 12 coins.',
  },
  {
    id: 'q2',
    questId: 'addition-trail',
    prompt: 'What is 8 + 6?',
    options: ['12', '13', '14', '15'],
    answer: '14',
    hint: 'Make 10 first: 8 + 2 = 10, then add 4.',
    explanation: '8 + 6 can be split into 8 + 2 + 4, which equals 14.',
  },
  {
    id: 'q3',
    questId: 'addition-trail',
    prompt: 'There are 9 stars in a chest. Add 4 more stars. How many stars are there?',
    options: ['11', '12', '13', '14'],
    answer: '13',
    hint: '9 needs 1 more to become 10.',
    explanation: '9 + 4 = 13 because 9 + 1 + 3 = 13.',
  },
  {
    id: 'q4',
    questId: 'subtraction-cave',
    prompt: 'A hunter has 18 candies and gives away 7. How many are left?',
    options: ['9', '10', '11', '12'],
    answer: '11',
    hint: 'Think 18 - 7.',
    explanation: '18 - 7 = 11, so 11 candies remain.',
  },
  {
    id: 'q5',
    questId: 'subtraction-cave',
    prompt: 'What is 20 - 8?',
    options: ['10', '11', '12', '13'],
    answer: '12',
    hint: 'Take away 10, then give back 2.',
    explanation: '20 - 8 = 12.',
  },
  {
    id: 'q6',
    questId: 'subtraction-cave',
    prompt: 'You have 15 arrows and use 6. How many arrows are left?',
    options: ['8', '9', '10', '11'],
    answer: '9',
    hint: 'Count backward 6 steps from 15.',
    explanation: '15 - 6 = 9.',
  },
  {
    id: 'q7',
    questId: 'multiplication-map',
    prompt: 'There are 4 bags with 3 coins in each bag. How many coins total?',
    options: ['7', '10', '12', '14'],
    answer: '12',
    hint: 'This is 3 + 3 + 3 + 3.',
    explanation: '4 groups of 3 equals 12.',
  },
  {
    id: 'q8',
    questId: 'multiplication-map',
    prompt: 'What is 5 x 4?',
    options: ['16', '18', '20', '24'],
    answer: '20',
    hint: 'Count by 5 four times.',
    explanation: '5 + 5 + 5 + 5 = 20.',
  },
  {
    id: 'q9',
    questId: 'multiplication-map',
    prompt: 'There are 3 tables. Each table has 4 legs. How many legs total?',
    options: ['9', '10', '12', '16'],
    answer: '12',
    hint: 'This is 4 + 4 + 4.',
    explanation: '3 groups of 4 equals 12.',
  },
];

export const rewards: Reward[] = [
  {
    id: 'discount-100',
    name: '฿100 OFF',
    cost: 500,
    category: 'Course Discount',
    icon: '🎟️',
    value: '฿100',
    description: 'Redeem a starter coupon for your next Eimaths course.',
  },
  {
    id: 'discount-250',
    name: '฿250 OFF',
    cost: 1200,
    category: 'Course Discount',
    icon: '🎫',
    value: '฿250',
    description: 'A bigger discount for hunters building a strong streak.',
  },
  {
    id: 'discount-500',
    name: '฿500 OFF',
    cost: 2000,
    category: 'Course Discount',
    icon: '🏷️',
    value: '฿500',
    description: 'Popular coupon for the next course purchase.',
  },
  {
    id: 'discount-1000',
    name: '฿1,000 OFF',
    cost: 3500,
    category: 'Course Discount',
    icon: '🎁',
    value: '฿1,000',
    description: 'Top reward for dedicated bounty hunters.',
  },
];

export const getQuestionsForQuest = (questId: string) =>
  questions.filter((question) => question.questId === questId);
