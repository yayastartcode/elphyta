const jwt = require('jsonwebtoken');
require('dotenv').config();
const { exec } = require('child_process');

async function testLevelUnlock() {
  try {
    console.log('\n=== TESTING LEVEL UNLOCK LOGIC ===');
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: '68c6fc508f7d9cbeb7e60e7d',
        email: 'test@test.com',
        role: 'user'
      },
      process.env.JWT_SECRET
    );
    
    console.log('Generated token for level unlock test');
    
    // Test submitting level 1 with 80% score (4 out of 5 correct)
    // This should unlock level 2
    const submitData = {
      gameMode: 'truth',
      level: 1,
      answers: ['A', 'A', 'A', 'A', 'B'], // 4 correct, 1 wrong = 80%
      timeSpent: 45
    };
    
    console.log('\nSubmitting level 1 with 80% score...');
    console.log('Expected: Should unlock level 2');
    
    const curlCommand = `curl -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${token}" \
      -d '${JSON.stringify(submitData)}' \
      http://localhost:3001/game/submit`;
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing curl:', error);
        return;
      }
      
      console.log('\n=== SUBMIT RESPONSE ===');
      console.log('Response:', stdout);
      
      try {
        const response = JSON.parse(stdout);
        console.log('\n=== PARSED SUBMIT RESPONSE ===');
        console.log('Success:', response.success);
        console.log('Message:', response.message);
        if (response.data) {
          console.log('Score:', response.data.score);
          console.log('Percentage:', response.data.percentage);
          console.log('Next Level Unlocked:', response.data.nextLevelUnlocked);
        }
        
        // Now check progress to verify unlock
        setTimeout(() => {
          console.log('\n=== CHECKING PROGRESS AFTER SUBMIT ===');
          const progressCommand = `curl -H "Authorization: Bearer ${token}" http://localhost:3001/game/progress`;
          
          exec(progressCommand, (progError, progStdout, progStderr) => {
            if (progError) {
              console.error('Error checking progress:', progError);
              return;
            }
            
            try {
              const progResponse = JSON.parse(progStdout);
              if (progResponse.success && progResponse.data.progress) {
                const truthProgress = progResponse.data.progress.find(p => p.game_mode === 'truth');
                console.log('Truth mode progress:');
                console.log('  Current Level:', truthProgress.current_level);
                console.log('  Unlocked Levels:', truthProgress.unlocked_levels);
                console.log('  Completed Levels:', truthProgress.completed_levels);
                
                // Check if level 2 is unlocked
                if (truthProgress.unlocked_levels.includes(2)) {
                  console.log('\n✅ SUCCESS: Level 2 is unlocked!');
                } else {
                  console.log('\n❌ ISSUE: Level 2 is NOT unlocked');
                }
              }
            } catch (parseError) {
              console.error('Failed to parse progress response:', parseError.message);
              console.log('Raw progress response:', progStdout);
            }
          });
        }, 1000);
        
      } catch (parseError) {
        console.error('Failed to parse submit response:', parseError.message);
        console.log('Raw submit response:', stdout);
      }
    });
    
  } catch (error) {
    console.error('Error testing level unlock:', error.message);
  }
}

testLevelUnlock();

// Keep the process alive to see both responses
setTimeout(() => {
  process.exit(0);
}, 5000);