import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    airtableUserId: {
        type: String,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String
    },
    accessToken: {
        type: String,
        trim: true
    },
    refreshToken: {
        type: String,
        trim: true
    },
    tokenType: {
        type: String,
        default: 'bearer'
    },
    scope: {
        type: String
    },
    accessTokenExpiry: {
        type: Date,
    },
    refreshTokenExpiry: {
        type: Date
    },
}, {timestamps: true});

export default mongoose.model('User', userSchema);