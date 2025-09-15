import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Question from '../api/models/Question.js';

// Load environment variables
dotenv.config();

const sampleQuestions = [
  // Truth questions - Level 1
  {
    question_text: "Berapa hasil dari a² + b² jika a = 3 dan b = 4?",
    options: {
      A: "25",
      B: "12",
      C: "7",
      D: "49"
    },
    correct_answer: "A",
    explanation: "Menggunakan teorema Pythagoras: a² + b² = 3² + 4² = 9 + 16 = 25",
    game_mode: "truth",
    level: 1,
    question_order: 1
  },
  {
    question_text: "Dalam segitiga siku-siku, jika sisi miring = 5 dan salah satu sisi = 3, berapa sisi lainnya?",
    options: {
      A: "4",
      B: "2",
      C: "8",
      D: "6"
    },
    correct_answer: "A",
    explanation: "Menggunakan teorema Pythagoras: c² = a² + b², maka 5² = 3² + b², sehingga b² = 25 - 9 = 16, b = 4",
    game_mode: "truth",
    level: 1,
    question_order: 2
  },
  {
    question_text: "Apa nama teorema yang menyatakan hubungan antara sisi-sisi segitiga siku-siku?",
    options: {
      A: "Teorema Pythagoras",
      B: "Teorema Thales",
      C: "Teorema Euclid",
      D: "Teorema Newton"
    },
    correct_answer: "A",
    explanation: "Teorema Pythagoras menyatakan bahwa dalam segitiga siku-siku, kuadrat sisi miring sama dengan jumlah kuadrat kedua sisi lainnya",
    game_mode: "truth",
    level: 1,
    question_order: 3
  },
  {
    question_text: "Jika sebuah tangga sepanjang 13 meter disandarkan ke dinding setinggi 12 meter, berapa jarak kaki tangga dari dinding?",
    options: {
      A: "5 meter",
      B: "1 meter",
      C: "25 meter",
      D: "7 meter"
    },
    correct_answer: "A",
    explanation: "Menggunakan teorema Pythagoras: 13² = 12² + x², maka x² = 169 - 144 = 25, x = 5 meter",
    game_mode: "truth",
    level: 1,
    question_order: 4
  },
  {
    question_text: "Berapa panjang diagonal persegi yang memiliki sisi 10 cm?",
    options: {
      A: "10√2 cm",
      B: "20 cm",
      C: "10 cm",
      D: "100 cm"
    },
    correct_answer: "A",
    explanation: "Diagonal persegi = sisi × √2 = 10 × √2 = 10√2 cm",
    game_mode: "truth",
    level: 1,
    question_order: 5
  },
  // Dare questions - Level 1
  {
    question_text: "Hitunglah panjang sisi miring segitiga dengan sisi 6 dan 8!",
    options: {
      A: "10",
      B: "14",
      C: "48",
      D: "100"
    },
    correct_answer: "A",
    explanation: "c² = a² + b² = 6² + 8² = 36 + 64 = 100, maka c = 10",
    game_mode: "dare",
    level: 1,
    question_order: 1
  },
  {
    question_text: "Sebuah kapal berlayar 15 km ke utara, kemudian 20 km ke timur. Berapa jarak terdekat kapal dari titik awal?",
    options: {
      A: "25 km",
      B: "35 km",
      C: "300 km",
      D: "625 km"
    },
    correct_answer: "A",
    explanation: "Jarak = √(15² + 20²) = √(225 + 400) = √625 = 25 km",
    game_mode: "dare",
    level: 1,
    question_order: 2
  },
  {
    question_text: "Dalam koordinat kartesius, berapa jarak antara titik (0,0) dan (3,4)?",
    options: {
      A: "5",
      B: "7",
      C: "12",
      D: "25"
    },
    correct_answer: "A",
    explanation: "Jarak = √((3-0)² + (4-0)²) = √(9 + 16) = √25 = 5",
    game_mode: "dare",
    level: 1,
    question_order: 3
  },
  {
    question_text: "Berapa luas segitiga siku-siku dengan sisi 5, 12, dan 13?",
    options: {
      A: "30",
      B: "60",
      C: "65",
      D: "78"
    },
    correct_answer: "A",
    explanation: "Luas = (1/2) × alas × tinggi = (1/2) × 5 × 12 = 30",
    game_mode: "dare",
    level: 1,
    question_order: 4
  },
  {
    question_text: "Jika sisi-sisi segitiga adalah 9, 12, dan 15, apakah ini segitiga siku-siku?",
    options: {
      A: "Ya",
      B: "Tidak",
      C: "Tidak dapat ditentukan",
      D: "Hanya jika sudutnya 90°"
    },
    correct_answer: "A",
    explanation: "9² + 12² = 81 + 144 = 225 = 15², memenuhi teorema Pythagoras, jadi ini segitiga siku-siku",
    game_mode: "dare",
    level: 1,
    question_order: 5
  }
];

async function seedQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('MongoDB Connected:', mongoose.connection.host);

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Insert sample questions
    const result = await Question.insertMany(sampleQuestions);
    console.log('Sample questions seeded successfully!');
    console.log(`Inserted ${result.length} questions`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedQuestions();
}

export default seedQuestions;