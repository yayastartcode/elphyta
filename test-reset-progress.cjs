const jwt = require('jsonwebtoken');
require('dotenv').config();
const { exec } = require('child_process');

async function testResetProgress() {
  try {
    console.log('\n=== TESTING RESET PROGRESS API ===');
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: '68c6fc508f7d9cbeb7e60e7d',
        email: 'test@test.com',
        role: 'user'
      },
      process.env.JWT_SECRET
    );
    
    console.log('Generated token for reset progress test');
    
    // First, check current progress
    console.log('\n=== CHECKING CURRENT PROGRESS ===');
    const progressCommand = `curl -H "Authorization: Bearer ${token}" http://localhost:3001/game/progress`;
    
    exec(progressCommand, (progError, progStdout, progStderr) => {
      if (progError) {
        console.error('Error checking progress:', progError);
        return;
      }
      
      try {
        const progResponse = JSON.parse(progStdout);
        console.log('Current progress data:');
        console.log('- Progress records:', progResponse.data?.progress?.length || 0);
        console.log('- Level scores:', progResponse.data?.levelScores?.length || 0);
        
        // Now test reset
        console.log('\n=== TESTING RESET PROGRESS ===');
        const resetCommand = `curl -X DELETE \
          -H "Authorization: Bearer ${token}" \
          http://localhost:3001/game/reset-progress`;
        
        exec(resetCommand, (resetError, resetStdout, resetStderr) => {
          if (resetError) {
            console.error('Error resetting progress:', resetError);
            return;
          }
          
          console.log('Reset response:', resetStdout);
          
          try {
            const resetResponse = JSON.parse(resetStdout);
            if (resetResponse.success) {
              console.log('\n✅ Reset successful:', resetResponse.message);
              
              // Verify reset by checking progress again
              setTimeout(() => {
                console.log('\n=== VERIFYING RESET ===');
                exec(progressCommand, (verifyError, verifyStdout, verifyStderr) => {
                  if (verifyError) {
                    console.error('Error verifying reset:', verifyError);
                    return;
                  }
                  
                  try {
                    const verifyResponse = JSON.parse(verifyStdout);
                    console.log('After reset:');
                    console.log('- Progress records:', verifyResponse.data?.progress?.length || 0);
                    console.log('- Level scores:', verifyResponse.data?.levelScores?.length || 0);
                    
                    if ((verifyResponse.data?.progress?.length || 0) === 0 && 
                        (verifyResponse.data?.levelScores?.length || 0) === 0) {
                      console.log('\n✅ VERIFICATION SUCCESSFUL: All data has been reset!');
                    } else {
                      console.log('\n❌ VERIFICATION FAILED: Some data still exists');
                    }
                  } catch (parseError) {
                    console.error('Failed to parse verification response:', parseError.message);
                    console.log('Raw verification response:', verifyStdout);
                  }
                });
              }, 1000);
            } else {
              console.log('\n❌ Reset failed:', resetResponse.message);
            }
          } catch (parseError) {
            console.error('Failed to parse reset response:', parseError.message);
            console.log('Raw reset response:', resetStdout);
          }
        });
        
      } catch (parseError) {
        console.error('Failed to parse progress response:', parseError.message);
        console.log('Raw progress response:', progStdout);
      }
    });
    
  } catch (error) {
    console.error('Error testing reset progress:', error.message);
  }
}

testResetProgress();

// Keep the process alive to see all responses
setTimeout(() => {
  process.exit(0);
}, 5000);