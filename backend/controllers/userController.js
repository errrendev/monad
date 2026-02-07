import User from "../models/User.js";

/**
 * User Controller
 *
 * Handles requests related to users and leaderboards.
 */
const userController = {
  // -------------------------
  // 🔹 CRUD
  // -------------------------

  async create(req, res) {
    try {
      const { username, address, chain } = req.body;

      // Check for existing user with same address and chain
      if (address && chain) {
        const existingByAddress = await User.findByAddress(address, chain);
        if (existingByAddress) {
          return res.status(409).json({
            success: false,
            error: "User with this wallet address already exists on this chain"
          });
        }
      }

      // Check for existing username
      if (username) {
        const existingByUsername = await User.findByUsername(username);
        if (existingByUsername) {
          return res.status(409).json({
            success: false,
            error: "Username is already taken. Please choose a different one."
          });
        }
      }

      const user = await User.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      console.error("Error creating user:", error);

      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          return res.status(409).json({
            success: false,
            error: "Username is already taken"
          });
        }
        if (error.message.includes('address')) {
          return res.status(409).json({
            success: false,
            error: "Wallet address is already registered"
          });
        }
        return res.status(409).json({
          success: false,
          error: "User already exists"
        });
      }

      res.status(400).json({ success: false, error: error.message });
    }
  },

  async findById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findByAddress(req, res) {
    try {
      const { address } = req.params;
      const { chain } = req.query;  // e.g., ?chain=ethereum or ?chain=solana

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const user = await User.findByAddress(address, chain || null); // or default chain

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error in findByAddress:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async findAll(req, res) {
    try {
      const { limit, offset } = req.query;
      const users = await User.findAll({
        limit: Number.parseInt(limit) || 1000,
        offset: Number.parseInt(offset) || 0,
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const user = await User.update(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async remove(req, res) {
    try {
      await User.delete(req.params.id);
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // -------------------------
  // 🏆 Leaderboards
  // -------------------------

  async leaderboardByWins(req, res) {
    try {
      const { limit } = req.query;
      const data = await User.leaderboardByWins(Number.parseInt(limit) || 10);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async leaderboardByEarnings(req, res) {
    try {
      const { limit } = req.query;
      const data = await User.leaderboardByEarnings(Number.parseInt(limit) || 10);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async leaderboardByStakes(req, res) {
    try {
      const { limit } = req.query;
      const data = await User.leaderboardByStakes(Number.parseInt(limit) || 10);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async leaderboardByWinRate(req, res) {
    try {
      const { limit } = req.query;
      const data = await User.leaderboardByWinRate(Number.parseInt(limit) || 10);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default userController;
