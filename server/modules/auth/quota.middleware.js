const User = require('../user-management/models/user.model');

const checkQuota = async (req, res, next) => {
    try {
        // req.user is set by 'protect' middleware
        const user = await User.findById(req.user._id);
        
        if (!user || user.neuralQuota <= 0) {
            return res.status(403).json({ 
                success: false, 
                error: "Neural Link Depleted. Please recharge quota." 
            });
        }

        // Attach user to request for the controller to deduct later
        req.userWithQuota = user;
        next();
    } catch (error) {
        res.status(500).json({ success: false, error: "Quota check failed" });
    }
};

module.exports = { checkQuota };