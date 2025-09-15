import UserProgress from '../models/UserProgress';
import User from '../models/User';
import connectDatabase from '../config/database';

export const seedUserProgress = async () => {
  try {
    await connectDatabase();
    
    // Get all users
    const users = await User.find({});
    
    for (const user of users) {
      // Check if user already has progress for truth mode
      const truthProgress = await UserProgress.findOne({
        user_id: user._id,
        game_mode: 'truth'
      });
      
      if (!truthProgress) {
        await UserProgress.create({
          user_id: user._id,
          game_mode: 'truth',
          unlocked_levels: [1], // Level 1 unlocked by default
          current_level: 1,
          total_score: 0,
          completed_levels: []
        });
      } else if (!truthProgress.unlocked_levels.includes(1)) {
        // Ensure level 1 is unlocked
        truthProgress.unlocked_levels.push(1);
        await truthProgress.save();
      }
      
      // Check if user already has progress for dare mode
      const dareProgress = await UserProgress.findOne({
        user_id: user._id,
        game_mode: 'dare'
      });
      
      if (!dareProgress) {
        await UserProgress.create({
          user_id: user._id,
          game_mode: 'dare',
          unlocked_levels: [1], // Level 1 unlocked by default
          current_level: 1,
          total_score: 0,
          completed_levels: []
        });
      } else if (!dareProgress.unlocked_levels.includes(1)) {
        // Ensure level 1 is unlocked
        dareProgress.unlocked_levels.push(1);
        await dareProgress.save();
      }
    }
    
    console.log('User progress seeded successfully!');
    console.log(`Updated progress for ${users.length} users`);
    
  } catch (error) {
    console.error('Error seeding user progress:', error);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUserProgress().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}