import mongoose from "mongoose";

const personalizedGiftSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        badge: {
            type: String,
        },
        type: {
            type: String,
            enum: ["image", "video"],
            default: "image",
        },
        sectionType: {
            type: String,
            enum: ["Personalized", "Customized"],
            default: "Customized",
        },
        media: {
            url: String,
            public_id: String,
            fileType: String,
        },
        videoUrl: {
            type: String,
        },
        link: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.PersonalizedGift ||
    mongoose.model("PersonalizedGift", personalizedGiftSchema);