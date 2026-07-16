const asyncHandler = require("express-async-handler");
const User = require("../../../modules/user-management/models/user.model");
const Message = require("../../../modules/chat/models/message.model"); // Needed for account deletion cleanup

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  let keyword = {};
  if (req.query.search) {
    const cleanSearch = escapeRegex(String(req.query.search)); 
    keyword = {
      $or: [
        { name: { $regex: cleanSearch, $options: "i" } },
        { email: { $regex: cleanSearch, $options: "i" } },
      ],
    };
  }

  // Fetch current user's contacts for sorting priority
  const me = await User.findById(req.user._id).select("contacts");
  const contactMap = new Map();
  if (me && me.contacts) {
      me.contacts.forEach(c => contactMap.set(c.user.toString(), c.lastMessageAt));
  }

  const usersRaw = await User.find({ ...keyword, _id: { $ne: req.user._id } })
    .select("name email avatar isOnline lastSeen") 
    .lean();

  // Custom sort: Contacts with recent messages FIRST
  const sortedUsers = usersRaw.sort((a, b) => {
    const timeA = contactMap.get(a._id.toString()) || 0;
    const timeB = contactMap.get(b._id.toString()) || 0;

    if (timeA || timeB) {
        return new Date(timeB).getTime() - new Date(timeA).getTime();
    }
    // Fallback to creation date for others
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const users = sortedUsers.slice(skip, skip + limit);

  const count = await User.countDocuments({ ...keyword, _id: { $ne: req.user._id } });

  res.json({
    success: true,
    users,
    page,
    pages: Math.ceil(count / limit),
    totalUsers: count
  });
});

// NEW: Block User
const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.blockedUsers.includes(userId)) {
        user.blockedUsers.push(userId);
        await user.save();
    }
    res.json({ success: true, message: "User blocked" });
});

// NEW: Unblock User
const unblockUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
    await user.save();
    res.json({ success: true, message: "User unblocked" });
});

// NEW: Delete Account (Cascade)
const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // 1. Delete all messages sent by or received by this user
    await Message.deleteMany({
        $or: [{ from: user._id }, { to: user._id }]
    });

    // 2. Delete user
    await user.deleteOne();

    res.json({ success: true, message: "Account deleted permanently" });
});

// NEW: Update Profile
const updateProfile = asyncHandler(async (req, res) => {
    const { bio, interests, preferredLanguage } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        user.bio = bio !== undefined ? bio : user.bio;
        user.interests = interests || user.interests;
        user.preferredLanguage = preferredLanguage || user.preferredLanguage;
        
        const updatedUser = await user.save();
        res.json({
            success: true,
            user: updatedUser
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

// NEW: Get Public Profile
const getPublicProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select("name avatar bio interests lastSeen createdAt isPublic");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.json({
        success: true,
        user
    });
});

// NEW: Upload Avatar
const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error("No file uploaded");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // Save relative path
    const relativePath = `/uploads/${req.file.filename}`;
    user.avatar = `${req.protocol}://${req.get("host")}${relativePath}`;
    await user.save();

    res.json({
        success: true,
        avatarUrl: user.avatar
    });
});

module.exports = { getAllUsers, blockUser, unblockUser, deleteAccount, updateProfile, getPublicProfile, uploadAvatar };