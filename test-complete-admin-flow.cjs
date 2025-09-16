const BASE_URL = 'http://localhost:3001';

// Test data
const adminCredentials = {
  email: 'admin@elphyta.online',
  password: 'password123'
};

const testQuestion = {
  question_text: 'What is the capital of Indonesia?',
  option_a: 'Jakarta',
  option_b: 'Surabaya',
  option_c: 'Bandung',
  option_d: 'Medan',
  correct_answer: 'A',
  explanation: 'Jakarta is the capital and largest city of Indonesia.',
  level: 1,
  game_mode: 'truth'
};

const updatedQuestion = {
  question_text: 'What is the largest city in Indonesia?',
  option_a: 'Jakarta',
  option_b: 'Surabaya',
  option_c: 'Bandung',
  option_d: 'Medan',
  correct_answer: 'A',
  explanation: 'Jakarta is both the capital and largest city of Indonesia.',
  level: 2,
  game_mode: 'dare'
};

async function testCompleteAdminFlow() {
  console.log('🚀 Starting Complete Admin Dashboard Test...');
  
  try {
    // Step 1: Admin Login
    console.log('\n1. Testing Admin Login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminCredentials)
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    
    const token = loginData.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   User: ${loginData.data.user.email} (${loginData.data.user.role})`);
    
    // Step 2: Get Initial Questions Count
    console.log('\n2. Getting initial questions list...');
    const initialQuestionsResponse = await fetch(`${BASE_URL}/admin/questions?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const initialQuestionsData = await initialQuestionsResponse.json();
    if (!initialQuestionsData.success) {
      throw new Error(`Failed to fetch questions: ${initialQuestionsData.message}`);
    }
    
    const initialCount = initialQuestionsData.data.pagination.total_items;
    console.log(`✅ Initial questions count: ${initialCount}`);
    
    // Step 3: Create New Question
    console.log('\n3. Testing Question Creation...');
    const createResponse = await fetch(`${BASE_URL}/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testQuestion)
    });
    
    const createData = await createResponse.json();
    if (!createData.success) {
      throw new Error(`Question creation failed: ${createData.message}`);
    }
    
    const createdQuestionId = createData.data._id;
    console.log('✅ Question created successfully');
    console.log(`   Question ID: ${createdQuestionId}`);
    console.log(`   Question: ${createData.data.question_text}`);
    console.log('   Full response:', JSON.stringify(createData, null, 2));
    
    // Step 4: Verify Question Count Increased
    console.log('\n4. Verifying question count increased...');
    const afterCreateResponse = await fetch(`${BASE_URL}/admin/questions?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const afterCreateData = await afterCreateResponse.json();
    const newCount = afterCreateData.data.pagination.total_items;
    
    if (newCount !== initialCount + 1) {
      throw new Error(`Question count mismatch. Expected: ${initialCount + 1}, Got: ${newCount}`);
    }
    
    console.log(`✅ Question count verified: ${newCount} (increased by 1)`);
    
    // Step 5: Verify Question in List
    console.log('\n5. Verifying question appears in list...');
    const verifyResponse = await fetch(`${BASE_URL}/admin/questions?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const verifyData = await verifyResponse.json();
    const foundQuestion = verifyData.data.questions.find(q => q._id === createdQuestionId);
    
    if (!foundQuestion) {
      throw new Error('Created question not found in questions list');
    }
    
    console.log('✅ Question found in list successfully');
    console.log(`   Question: ${foundQuestion.question_text}`);
    console.log(`   Options: A=${foundQuestion.options.A}, B=${foundQuestion.options.B}`);
    console.log(`   Correct Answer: ${foundQuestion.correct_answer}`);
    
    // Step 6: Update Question
    console.log('\n6. Testing Question Update...');
    if (!createdQuestionId) {
      console.log('⚠️ Skipping update test - no question ID available');
    } else {
      const updateResponse = await fetch(`${BASE_URL}/admin/questions/${createdQuestionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedQuestion)
      });
      
      const updateData = await updateResponse.json();
      if (!updateData.success) {
        throw new Error(`Question update failed: ${updateData.message}`);
      }
      
      console.log('✅ Question updated successfully');
      console.log(`   New Question: ${updateData.data.question_text}`);
      console.log(`   New Level: ${updateData.data.level}`);
      console.log(`   New Game Mode: ${updateData.data.game_mode}`);
    }
    
    // Step 7: Test Filtering
    console.log('\n7. Testing Question Filtering...');
    const filterResponse = await fetch(`${BASE_URL}/admin/questions?level=2&game_mode=dare`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const filterData = await filterResponse.json();
    if (!filterData.success) {
      throw new Error(`Question filtering failed: ${filterData.message}`);
    }
    
    console.log(`✅ Filtering works: Found ${filterData.data.questions.length} level 2/dare questions`);
    
    // Step 8: Test Search
    console.log('\n8. Testing Question Search...');
    const searchResponse = await fetch(`${BASE_URL}/admin/questions?search=largest`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const searchData = await searchResponse.json();
    if (!searchData.success) {
      throw new Error(`Question search failed: ${searchData.message}`);
    }
    
    console.log(`✅ Search works: Found ${searchData.data.questions.length} questions containing 'largest'`);
    
    // Step 9: Delete Question
    console.log('\n9. Testing Question Deletion...');
    if (!createdQuestionId) {
      console.log('⚠️ Skipping delete test - no question ID available');
    } else {
      const deleteResponse = await fetch(`${BASE_URL}/admin/questions/${createdQuestionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const deleteData = await deleteResponse.json();
      if (!deleteData.success) {
        throw new Error(`Question deletion failed: ${deleteData.message}`);
      }
      
      console.log('✅ Question deleted successfully');
    }
    
    // Step 10: Verify Question Count Decreased
    console.log('\n10. Verifying question count decreased...');
    const finalResponse = await fetch(`${BASE_URL}/admin/questions?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const finalData = await finalResponse.json();
    const finalCount = finalData.data.pagination.total_items;
    
    if (finalCount !== initialCount) {
      throw new Error(`Final count mismatch. Expected: ${initialCount}, Got: ${finalCount}`);
    }
    
    console.log(`✅ Question count verified: ${finalCount} (back to original)`);
    
    // Step 11: Test Pagination
    console.log('\n11. Testing Pagination...');
    const paginationResponse = await fetch(`${BASE_URL}/admin/questions?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const paginationData = await paginationResponse.json();
    if (!paginationData.success) {
      throw new Error(`Pagination test failed: ${paginationData.message}`);
    }
    
    console.log(`✅ Pagination works: Page 1 of ${paginationData.data.totalPages}, showing ${paginationData.data.questions.length} questions`);
    
    console.log('\n🎉 ALL TESTS PASSED! Admin Dashboard is fully functional.');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Admin authentication');
    console.log('   ✅ Question creation');
    console.log('   ✅ Question retrieval');
    console.log('   ✅ Question updating');
    console.log('   ✅ Question filtering');
    console.log('   ✅ Question searching');
    console.log('   ✅ Question deletion');
    console.log('   ✅ Pagination');
    console.log('   ✅ Data integrity verification');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCompleteAdminFlow();