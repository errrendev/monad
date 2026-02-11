import User from "../models/User.js";

const userProfileController = {
  // Get user profile by ID (for unified profile page)
  async getUserProfile(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      // Get user information
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.json({
        success: true,
        message: "User profile retrieved successfully",
        data: {
          user: {
            id: user.id,
            username: user.username,
            address: user.address,
            created_at: user.created_at,
            updated_at: user.updated_at
          }
        }
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch user profile",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

export default userProfileController;
