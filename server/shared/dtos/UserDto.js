/**
 * @class UserDto
 * @description A Data Transfer Object (DTO) used to sanitize and format user data
 * before sending it back to the client. Prevents sensitive data leakage.
 */
class UserDto {
    constructor(user) {
        // Only include fields safe for client-side use
        this.id = user._id || user.id; // Use either Mongoose _id or plain object id
        this.name = user.name;
        this.email = user.email;
        this.role = user.role; // Essential for UI features (premium/admin access)
        this.isPublic = user.isPublic; // Essential for Social Discovery UI toggle
        this.preferredLanguage = user.preferredLanguage; // Essential for chat settings
        this.createdAt = user.createdAt;
    }
}

module.exports = UserDto;