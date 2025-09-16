// Test script to verify admin dashboard functionality
// Using native fetch API available in Node.js 18+

const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@elphyta.online';
const ADMIN_PASSWORD = 'password123';

async function testAdminDashboard() {
  try {
    console.log('🔐 Testing admin login...');
    
    // Step 1: Login as admin
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Admin login successful');
    const token = loginData.data.token;
    
    // Step 2: Test fetching questions
    console.log('\n📋 Testing question fetching...');
    const questionsResponse = await fetch(`${BASE_URL}/admin/questions?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const questionsData = await questionsResponse.json();
    
    if (questionsData.success) {
      console.log('✅ Questions fetched successfully');
      console.log(`   Total questions: ${questionsData.data.pagination.total_items}`);
      console.log(`   Questions on page 1: ${questionsData.data.questions.length}`);
    } else {
      console.error('❌ Failed to fetch questions:', questionsData.message);
    }
    
    // Step 3: Test creating a new question
    console.log('\n➕ Testing question creation...');
    const newQuestion = {
      question_text: 'Test question from automated test',
      option_a: 'Test Option A',
      option_b: 'Test Option B', 
      option_c: 'Test Option C',
      option_d: 'Test Option D',
      correct_answer: 'B',
      explanation: 'This is a test explanation for automated testing',
      level: 1,
      game_mode: 'truth',
      points: 10
    };
    
    const createResponse = await fetch(`${BASE_URL}/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newQuestion)
    });
    
    const createData = await createResponse.json();
    
    if (createData.success) {
      console.log('✅ Question created successfully');
      console.log(`   Question ID: ${createData.data._id}`);
      console.log(`   Question Order: ${createData.data.question_order}`);
      
      const questionId = createData.data._id;
      
      // Step 4: Test updating the question
      console.log('\n✏️  Testing question update...');
      const updateData = {
        question_text: 'Updated test question from automated test',
        option_a: 'Updated Option A',
        option_b: 'Updated Option B',
        option_c: 'Updated Option C', 
        option_d: 'Updated Option D',
        correct_answer: 'C',
        explanation: 'This is an updated test explanation',
        level: 2,
        game_mode: 'dare',
        points: 15
      };
      
      const updateResponse = await fetch(`${BASE_URL}/admin/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      const updateResult = await updateResponse.json();
      
      if (updateResult.success) {
        console.log('✅ Question updated successfully');
      } else {
        console.error('❌ Failed to update question:', updateResult.message);
      }
      
      // Step 5: Test deleting the question
      console.log('\n🗑️  Testing question deletion...');
      const deleteResponse = await fetch(`${BASE_URL}/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const deleteResult = await deleteResponse.json();
      
      if (deleteResult.success) {
        console.log('✅ Question deleted successfully');
      } else {
        console.error('❌ Failed to delete question:', deleteResult.message);
      }
      
    } else {
      console.error('❌ Failed to create question:', createData.message);
    }
    
    console.log('\n🎉 Admin dashboard test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAdminDashboard();