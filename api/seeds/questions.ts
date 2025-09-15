import Question from '../models/Question';
import connectDatabase from '../config/database';

const sampleQuestions = [
  // Level 1 - Truth Mode Questions (Enhanced Pythagorean Problems)
  {
    question_text: "Sebuah tangga sepanjang 25 meter disandarkan pada dinding. Jika kaki tangga berjarak 15 meter dari dinding, berapa tinggi dinding yang dapat dicapai tangga?",
    options: {
      A: "20 meter",
      B: "18 meter",
      C: "22 meter",
      D: "16 meter"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 1,
    explanation: "Langkah penyelesaian:\n1. Diketahui: panjang tangga (hipotenusa) = 25 m, jarak kaki tangga = 15 m\n2. Dicari: tinggi dinding\n3. Rumus: a² + b² = c²\n4. Substitusi: 15² + tinggi² = 25²\n5. 225 + tinggi² = 625\n6. tinggi² = 625 - 225 = 400\n7. tinggi = √400 = 20 meter"
  },
  {
    question_text: "Seorang pilot terbang dari kota A ke kota B sejauh 120 km ke utara, kemudian ke kota C sejauh 160 km ke timur. Berapa jarak langsung dari kota A ke kota C?",
    options: {
      A: "200 km",
      B: "180 km",
      C: "220 km",
      D: "240 km"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 2,
    explanation: "Langkah penyelesaian:\n1. Membentuk segitiga siku-siku: A-B-C\n2. AB = 120 km (utara), BC = 160 km (timur)\n3. AC adalah hipotenusa\n4. Rumus: AC² = AB² + BC²\n5. AC² = 120² + 160²\n6. AC² = 14400 + 25600 = 40000\n7. AC = √40000 = 200 km"
  },
  {
    question_text: "Sebuah layar TV berbentuk persegi panjang memiliki lebar 48 cm dan tinggi 36 cm. Berapa panjang diagonal layar TV tersebut?",
    options: {
      A: "60 cm",
      B: "55 cm",
      C: "65 cm",
      D: "50 cm"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 3,
    explanation: "Langkah penyelesaian:\n1. Diketahui: lebar = 48 cm, tinggi = 36 cm\n2. Diagonal membentuk hipotenusa segitiga siku-siku\n3. Rumus: diagonal² = lebar² + tinggi²\n4. diagonal² = 48² + 36²\n5. diagonal² = 2304 + 1296 = 3600\n6. diagonal = √3600 = 60 cm"
  },
  {
    question_text: "Sebuah kapal berlayar 21 km ke selatan, kemudian 28 km ke barat. Jika kapal ingin kembali langsung ke titik awal, berapa jarak yang harus ditempuh?",
    options: {
      A: "35 km",
      B: "30 km",
      C: "40 km",
      D: "32 km"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 4,
    explanation: "Langkah penyelesaian:\n1. Kapal membentuk segitiga siku-siku\n2. Sisi pertama = 21 km (selatan)\n3. Sisi kedua = 28 km (barat)\n4. Jarak langsung = hipotenusa\n5. Rumus: jarak² = 21² + 28²\n6. jarak² = 441 + 784 = 1225\n7. jarak = √1225 = 35 km"
  },
  {
    question_text: "Sebuah tiang bendera setinggi 24 meter memiliki kawat penyangga yang ditarik dari puncak tiang ke tanah sejauh 10 meter dari kaki tiang. Berapa panjang kawat penyangga tersebut?",
    options: {
      A: "26 meter",
      B: "25 meter",
      C: "28 meter",
      D: "30 meter"
    },
    correct_answer: "A" as const,
    level: 1,
    game_mode: "truth" as const,
    question_order: 5,
    explanation: "Langkah penyelesaian:\n1. Diketahui: tinggi tiang = 24 m, jarak horizontal = 10 m\n2. Kawat penyangga = hipotenusa segitiga siku-siku\n3. Rumus: kawat² = tinggi² + jarak²\n4. kawat² = 24² + 10²\n5. kawat² = 576 + 100 = 676\n6. kawat = √676 = 26 meter"
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