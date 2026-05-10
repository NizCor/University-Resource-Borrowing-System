import mongoose from "mongoose";

//Define the schema for resource
const resourceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ["Camera & AV Equipment", "Musical Instrument", "Tool", "Stationery", "Sports Equipment", "Other"],
        },
        description: {
            type: String,
        },
        totalQuantity: {
            type: Number,
            required: true,
            min: 1,
        },
        availableQuantity: {
            type: Number,
            required: true,
            min: 0,
        },
        condition: {
            type: String,
            enum: ["Excellent", "Good", "Fair", "Needs Repair"],
            default: "Good",
        },
        location: {
            type: String,
        },
        addedDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

//Create and export the for resources
export default mongoose.model("resources", resourceSchema);
