export type Grade = {
  id: string;
  label: string;
  range: string;
};

export type Quest = {
  id: string;
  title: string;
  topic: string;
  level: string;
  reward: number;
  estimatedMinutes: number;
  description: string;
  questionIds: string[];
};

export type Question = {
  id: string;
  questId: string;
  prompt: string;
  options: string[];
  answer: string;
  hint: string;
};

export type Reward = {
  id: string;
  name: string;
  cost: number;
  description: string;
  category: string;
};

export const grades: Grade[] = [
  { id: 'k1', label: 'อนุบาล 1', range: 'นับจำนวน 1-10' },
  { id: 'k2', label: 'อนุบาล 2', range: 'บวก-ลบด้วยภาพ' },
  { id: 'p1', label: 'ป.1', range: 'บวก-ลบไม่เกิน 20' },
  { id: 'p2', label: 'ป.2', range: 'โจทย์สองขั้นตอน' },
  { id: 'p3', label: 'ป.3', range: 'คูณ หาร และเวลา' },
  { id: 'p4', label: 'ป.4', range: 'เศษส่วนและรูปทรง' },
  { id: 'p5', label: 'ป.5', range: 'ทศนิยมและเปอร์เซ็นต์' },
  { id: 'p6', label: 'ป.6', range: 'เตรียมสอบเข้า ม.1' },
];

export const quests: Quest[] = [
  {
    id: 'addition-trail',
    title: 'เส้นทางนักล่าผลบวก',
    topic: 'Addition',
    level: 'เริ่มต้น',
    reward: 30,
    estimatedMinutes: 4,
    description: 'ฝึกบวกเลขจากสถานการณ์สั้น ๆ เพื่อเก็บเบาะแสแรกของนักล่า',
    questionIds: ['q1', 'q2', 'q3'],
  },
  {
    id: 'subtraction-cave',
    title: 'ถ้ำลบเลขลับ',
    topic: 'Subtraction',
    level: 'กลาง',
    reward: 35,
    estimatedMinutes: 5,
    description: 'แก้โจทย์ลบเลขและเลือกคำตอบให้ไวเพื่อผ่านประตูถ้ำ',
    questionIds: ['q4', 'q5', 'q6'],
  },
  {
    id: 'multiplication-map',
    title: 'แผนที่คูณเหรียญ',
    topic: 'Multiplication',
    level: 'ท้าทาย',
    reward: 45,
    estimatedMinutes: 6,
    description: 'ใช้แม่สูตรคูณพื้นฐานเพื่อปลดล็อกหีบสมบัติ',
    questionIds: ['q7', 'q8', 'q9'],
  },
];

export const questions: Question[] = [
  {
    id: 'q1',
    questId: 'addition-trail',
    prompt: 'มินมีเหรียญ 7 เหรียญ ได้เพิ่มอีก 5 เหรียญ ตอนนี้มีทั้งหมดกี่เหรียญ?',
    options: ['10', '11', '12', '13'],
    answer: '12',
    hint: 'เริ่มจาก 7 แล้วนับเพิ่มอีก 5 ครั้ง',
  },
  {
    id: 'q2',
    questId: 'addition-trail',
    prompt: '8 + 6 เท่ากับเท่าไร?',
    options: ['12', '13', '14', '15'],
    answer: '14',
    hint: '8 + 2 = 10 แล้วบวกที่เหลืออีก 4',
  },
  {
    id: 'q3',
    questId: 'addition-trail',
    prompt: 'ในกล่องมีดาว 9 ดวง เติมอีก 4 ดวง รวมเป็นกี่ดวง?',
    options: ['11', '12', '13', '14'],
    answer: '13',
    hint: 'ลองแยก 4 เป็น 1 + 3 เพื่อให้ 9 กลายเป็น 10 ก่อน',
  },
  {
    id: 'q4',
    questId: 'subtraction-cave',
    prompt: 'มีลูกอม 18 เม็ด แบ่งให้เพื่อน 7 เม็ด เหลือกี่เม็ด?',
    options: ['9', '10', '11', '12'],
    answer: '11',
    hint: 'คิดเป็น 18 - 7',
  },
  {
    id: 'q5',
    questId: 'subtraction-cave',
    prompt: '20 - 8 เท่ากับเท่าไร?',
    options: ['10', '11', '12', '13'],
    answer: '12',
    hint: '20 - 10 = 10 แล้วคืนกลับมา 2',
  },
  {
    id: 'q6',
    questId: 'subtraction-cave',
    prompt: 'นักล่ามีลูกศร 15 ดอก ใช้ไป 6 ดอก เหลือกี่ดอก?',
    options: ['8', '9', '10', '11'],
    answer: '9',
    hint: 'นับถอยหลังจาก 15 ไป 6 ครั้ง',
  },
  {
    id: 'q7',
    questId: 'multiplication-map',
    prompt: 'มีถุงเหรียญ 4 ถุง ถุงละ 3 เหรียญ รวมกี่เหรียญ?',
    options: ['7', '10', '12', '14'],
    answer: '12',
    hint: '3 + 3 + 3 + 3',
  },
  {
    id: 'q8',
    questId: 'multiplication-map',
    prompt: '5 x 4 เท่ากับเท่าไร?',
    options: ['16', '18', '20', '24'],
    answer: '20',
    hint: 'นับทีละ 5 ทั้งหมด 4 ครั้ง',
  },
  {
    id: 'q9',
    questId: 'multiplication-map',
    prompt: 'โต๊ะ 3 ตัว แต่ละตัวมีขา 4 ขา รวมขาทั้งหมดกี่ขา?',
    options: ['9', '10', '12', '16'],
    answer: '12',
    hint: '4 + 4 + 4',
  },
];

export const rewards: Reward[] = [
  {
    id: 'badge-bronze',
    name: 'ตรานักล่าฝึกหัด',
    cost: 40,
    category: 'Badge',
    description: 'ปลดล็อกตราแรกสำหรับเด็กที่เริ่มทำภารกิจต่อเนื่อง',
  },
  {
    id: 'avatar-hat',
    name: 'หมวกนักล่าสมบัติ',
    cost: 80,
    category: 'Avatar',
    description: 'ของตกแต่ง avatar เพื่อฉลองการทำแบบฝึกหัดสำเร็จ',
  },
  {
    id: 'line-sticker',
    name: 'สติกเกอร์ชมเชย LINE',
    cost: 120,
    category: 'Parent reward',
    description: 'ให้ผู้ปกครองส่งสติกเกอร์ชื่นชมหลังเรียนจบ',
  },
  {
    id: 'homework-pass',
    name: 'คูปองเลือกภารกิจเอง',
    cost: 160,
    category: 'Privilege',
    description: 'เด็กเลือกหัวข้อภารกิจถัดไปได้ 1 ครั้ง',
  },
];

export const getQuestionsForQuest = (questId: string) =>
  questions.filter((question) => question.questId === questId);
