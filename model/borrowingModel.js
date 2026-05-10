import mongoose from "mongoose";

//Define the schema for borrowing
const borrowingSchema = new mongoose.Schema(
    {
        studentName: {
            type: String,
            required: true,
        },
        studentId: {
            type: String,
            required: true,
        },
        studentEmail: {
            type: String,
            required: true,
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "resources",
            required: true,
        },
        quantityBorrowed: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        borrowDate: {
            type: Date,
            default: Date.now,
        },
        expectedReturnDate: {
            type: Date,
            required: true,
        },
        actualReturnDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Returned", "Overdue", "Rejected"],
            default: "Pending",
        },
        purpose: {
            type: String,
        },
        adminNotes: {
            type: String,
        },
    },
    { timestamps: true }
);

//Create and Export for borrowings
export default mongoose.model("borrowings", borrowingSchema);
