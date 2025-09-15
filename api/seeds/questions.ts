import Question from '../models/Question';
import connectDatabase from '../config/database';

const sampleQuestions = [
  // Level 1 - Truth Mode Questions
  {
    question_text: "Jika sebuah segitiga siku-siku memiliki sisi a = 3 dan sisi b = 4, berapakah panjang sisi c (hipotenusa)?",
    options: {
      A: "5",
      B: "6",
      C: "7",
      D: "8"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 1,
    explanation: "Menggunakan teorema Pythagoras: c² = a² + b² = 3² + 4² = 9 + 16 = 25, maka c = 5"
  },
  {
    question_text: "Dalam segitiga siku-siku dengan sisi 5 dan 12, berapakah panjang hipotenusa?",
    options: {
      A: "13",
      B: "14",
      C: "15",
      D: "16"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 2,
    explanation: "c² = 5² + 12² = 25 + 144 = 169, maka c = 13"
  },
  {
    question_text: "Jika hipotenusa = 10 dan salah satu sisi = 6, berapakah panjang sisi lainnya?",
    options: {
      A: "8",
      B: "7",
      C: "9",
      D: "6"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 3,
    explanation: "b² = c² - a² = 10² - 6² = 100 - 36 = 64, maka b = 8"
  },
  {
    question_text: "Segitiga dengan sisi 8, 15, dan 17 adalah segitiga siku-siku. Benar atau salah?",
    options: {
      A: "Benar",
      B: "Salah",
      C: "Tidak dapat ditentukan",
      D: "Tergantung sudutnya"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 4,
    explanation: "8² + 15² = 64 + 225 = 289 = 17², jadi ini adalah segitiga siku-siku"
  },
  {
    question_text: "Dalam segitiga siku-siku sama kaki dengan sisi 7, berapakah panjang hipotenusa?",
    options: {
      A: "7√2",
      B: "14",
      C: "7√3",
      D: "10"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 5,
    explanation: "c² = 7² + 7² = 49 + 49 = 98, maka c = √98 = 7√2"
  },

  // Level 1 - Dare Mode Questions
  {
    question_text: "Hitung luas segitiga siku-siku dengan sisi 6 dan 8!",
    options: {
      A: "24",
      B: "48",
      C: "30",
      D: "36"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "dare" as const,
    question_order: 1,
    explanation: "Luas = (1/2) × alas × tinggi = (1/2) × 6 × 8 = 24"
  },
  {
    question_text: "Jika diagonal persegi adalah 10√2, berapakah panjang sisinya?",
    options: {
      A: "10",
      B: "5√2",
      C: "20",
      D: "5"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "dare" as const,
    question_order: 2,
    explanation: "Diagonal persegi = sisi × √2, jadi 10√2 = sisi × √2, maka sisi = 10"
  },
  {
    question_text: "Tinggi segitiga sama sisi dengan sisi 12 adalah?",
    options: {
      A: "6√3",
      B: "12√3",
      C: "6",
      D: "9"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "dare" as const,
    question_order: 3,
    explanation: "Tinggi = (√3/2) × sisi = (√3/2) × 12 = 6√3"
  },
  {
    question_text: "Jarak antara titik (0,0) dan (3,4) adalah?",
    options: {
      A: "5",
      B: "7",
      C: "6",
      D: "4"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "dare" as const,
    question_order: 4,
    explanation: "Jarak = √[(3-0)² + (4-0)²] = √[9 + 16] = √25 = 5"
  },
  {
    question_text: "Panjang tangga yang bersandar pada dinding setinggi 12 meter dengan jarak kaki tangga 5 meter dari dinding adalah?",
    options: {
      A: "13 meter",
      B: "17 meter",
      C: "15 meter",
      D: "11 meter"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "dare" as const,
    question_order: 5,
    explanation: "Panjang tangga = √(12² + 5²) = √(144 + 25) = √169 = 13 meter"
  }
];

export const seedQuestions = async () => {
  try {
    await connectDatabase();
    
    // Clear existing questions
    await Question.deleteMany({});
    
    // Insert sample questions
    await Question.insertMany(sampleQuestions);
    
    console.log('Sample questions seeded successfully!');
    console.log(`Inserted ${sampleQuestions.length} questions`);
    
  } catch (error) {
    console.error('Error seeding questions:', error);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedQuestions().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}