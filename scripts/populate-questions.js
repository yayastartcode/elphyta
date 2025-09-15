import mongoose from 'mongoose';
import Question from '../api/models/Question.ts';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://ordertokoviral:MoTXURlEasHl2qRq@cluster0.if4lx.mongodb.net/elphyta?retryWrites=true&w=majority&appName=Cluster0';

// Sample questions for Pythagorean theorem in Bahasa Indonesia
const questions = [
  // Level 1 - Truth Mode
  {
    question_text: "Sebuah segitiga siku-siku memiliki sisi tegak 3 cm dan sisi alas 4 cm. Berapa panjang sisi miring?",
    options: {
      A: "5 cm",
      B: "6 cm",
      C: "7 cm",
      D: "8 cm"
    },
    correct_answer: "A",
    level: 1,
    game_mode: "truth",
    question_order: 1,
    explanation: "Menggunakan teorema Pythagoras: c² = a² + b² = 3² + 4² = 9 + 16 = 25, maka c = 5 cm"
  },
  {
    question_text: "Jika sisi miring segitiga siku-siku adalah 10 cm dan salah satu sisi tegaknya 6 cm, berapa panjang sisi yang lain?",
    options: {
      A: "7 cm",
      B: "8 cm",
      C: "9 cm",
      D: "10 cm"
    },
    correct_answer: "B",
    level: 1,
    game_mode: "truth",
    question_order: 2,
    explanation: "Menggunakan teorema Pythagoras: a² = c² - b² = 10² - 6² = 100 - 36 = 64, maka a = 8 cm"
  },
  {
    question_text: "Sebuah tangga sepanjang 13 meter disandarkan ke dinding. Jika jarak kaki tangga ke dinding 5 meter, berapa tinggi dinding yang dapat dicapai?",
    options: {
      A: "10 meter",
      B: "11 meter",
      C: "12 meter",
      D: "13 meter"
    },
    correct_answer: "C",
    level: 1,
    game_mode: "truth",
    question_order: 3,
    explanation: "Menggunakan teorema Pythagoras: h² = 13² - 5² = 169 - 25 = 144, maka h = 12 meter"
  },
  {
    question_text: "Dalam segitiga siku-siku, jika kedua sisi tegaknya masing-masing 5 cm dan 12 cm, berapa panjang sisi miringnya?",
    options: {
      A: "13 cm",
      B: "14 cm",
      C: "15 cm",
      D: "16 cm"
    },
    correct_answer: "A",
    level: 1,
    game_mode: "truth",
    question_order: 4,
    explanation: "Menggunakan teorema Pythagoras: c² = 5² + 12² = 25 + 144 = 169, maka c = 13 cm"
  },
  {
    question_text: "Sebuah persegi panjang memiliki panjang 8 cm dan lebar 6 cm. Berapa panjang diagonalnya?",
    options: {
      A: "9 cm",
      B: "10 cm",
      C: "11 cm",
      D: "12 cm"
    },
    correct_answer: "B",
    level: 1,
    game_mode: "truth",
    question_order: 5,
    explanation: "Diagonal persegi panjang menggunakan teorema Pythagoras: d² = 8² + 6² = 64 + 36 = 100, maka d = 10 cm"
  },
  // Level 1 - Dare Mode
  {
    question_text: "Sebuah kapal berlayar 9 km ke utara, kemudian 12 km ke timur. Berapa jarak terdekat kapal dari titik awal?",
    options: {
      A: "13 km",
      B: "14 km",
      C: "15 km",
      D: "16 km"
    },
    correct_answer: "C",
    level: 1,
    game_mode: "dare",
    question_order: 1,
    explanation: "Menggunakan teorema Pythagoras: d² = 9² + 12² = 81 + 144 = 225, maka d = 15 km"
  },
  {
    question_text: "Sebuah tiang bendera setinggi 20 meter ditopang kawat dari puncaknya ke tanah sejauh 15 meter dari kaki tiang. Berapa panjang kawat yang dibutuhkan?",
    options: {
      A: "23 meter",
      B: "24 meter",
      C: "25 meter",
      D: "26 meter"
    },
    correct_answer: "C",
    level: 1,
    game_mode: "dare",
    question_order: 2,
    explanation: "Menggunakan teorema Pythagoras: kawat² = 20² + 15² = 400 + 225 = 625, maka kawat = 25 meter"
  },
  {
    question_text: "Dua buah jalan berpotongan tegak lurus. Jika seseorang berjalan 7 km di jalan pertama dan 24 km di jalan kedua, berapa jarak terdekat dari titik perpotongan?",
    options: {
      A: "24 km",
      B: "25 km",
      C: "26 km",
      D: "27 km"
    },
    correct_answer: "B",
    level: 1,
    game_mode: "dare",
    question_order: 3,
    explanation: "Menggunakan teorema Pythagoras: d² = 7² + 24² = 49 + 576 = 625, maka d = 25 km"
  },
  {
    question_text: "Sebuah layar TV berbentuk persegi panjang memiliki lebar 40 cm dan tinggi 30 cm. Berapa panjang diagonal layar?",
    options: {
      A: "48 cm",
      B: "49 cm",
      C: "50 cm",
      D: "51 cm"
    },
    correct_answer: "C",
    level: 1,
    game_mode: "dare",
    question_order: 4,
    explanation: "Menggunakan teorema Pythagoras: d² = 40² + 30² = 1600 + 900 = 2500, maka d = 50 cm"
  },
  {
    question_text: "Sebuah pesawat terbang naik dengan sudut tertentu. Jika pesawat menempuh jarak horizontal 120 meter dan ketinggian 160 meter, berapa jarak tempuh pesawat?",
    options: {
      A: "180 meter",
      B: "190 meter",
      C: "200 meter",
      D: "210 meter"
    },
    correct_answer: "C",
    level: 1,
    game_mode: "dare",
    question_order: 5,
    explanation: "Menggunakan teorema Pythagoras: jarak² = 120² + 160² = 14400 + 25600 = 40000, maka jarak = 200 meter"
  }
];

async function populateQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Insert new questions
    await Question.insertMany(questions);
    console.log(`Inserted ${questions.length} questions`);

    console.log('Database populated successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

populateQuestions();