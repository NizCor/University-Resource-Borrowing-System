import Borrowing from "../model/borrowingModel.js";
import Resource from "../model/resourceModel.js";


////////////////////////////////////////////////////////////////////////////////////////
//Creating new borrowing request (student submits request)
export const createBorrowingRequest = async (req, res) => {
    try {
        const { resourceId, quantityBorrowed, expectedReturnDate, studentId, studentEmail } = req.body;

        //Check if the resource exists
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        //Check if the requested quantity is available
        if (resource.availableQuantity < quantityBorrowed) {
            return res.status(400).json({
                message: `Insufficient availability. Only ${resource.availableQuantity} unit(s) available.`,
            });
        }

        //Check if the expected return date is in the future
        if (new Date(expectedReturnDate) <= new Date()) {
            return res.status(400).json({ message: "Expected return date must be in the future." });
        }

        //Check if this student already has a pending/approved borrowing for the same resource
        const existingBorrowing = await Borrowing.findOne({
            studentId,
            resourceId,
            status: { $in: ["Pending", "Approved"] },
        });
        if (existingBorrowing) {
            return res.status(400).json({
                message: "You already have an active borrowing request for this resource.",
            });
        }

        //Create the borrowing record
        const borrowingData = new Borrowing(req.body);
        const savedBorrowing = await borrowingData.save();

        res.status(201).json(savedBorrowing);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For fetching all borrowing records (admin overview)
export const getAllBorrowings = async (req, res) => {
    try {
        //export resource name and category for readable output
        const borrowings = await Borrowing.find().populate("resourceId", "name category location");
        if (borrowings.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(borrowings);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//fetching all borrowings by the specific student
export const getBorrowingsByStudent = async (req, res) => {
    try {
        // Extract student ID from request parameters
        const { studentId } = req.params;
        const borrowings = await Borrowing.find({ studentId }).populate("resourceId", "name category location");
        if (borrowings.length === 0) {
            return res.status(404).json({ message: "No borrowing records found for this student." });
        }
        res.status(200).json(borrowings);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For fetching all overdue borrowings (items not returned past)
export const getOverdueBorrowings = async (req, res) => {
    try {
        const now = new Date();

        //Find all borrowings that are approved but past the expected return date
        const overdueBorrowings = await Borrowing.find({
            status: "Approved",
            expectedReturnDate: { $lt: now },
        }).populate("resourceId", "name category location");

        //Auto-mark them as Overdue in the database
        await Borrowing.updateMany(
            { status: "Approved", expectedReturnDate: { $lt: now } },
            { $set: { status: "Overdue" } }
        );

        res.status(200).json({
            count: overdueBorrowings.length,
            overdueBorrowings,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For approving a borrowing request (admin action)
export const approveBorrowing = async (req, res) => {
    try {
        const id = req.params.id;

        //Find the borrowing request
        const borrowing = await Borrowing.findById(id);
        if (!borrowing) {
            return res.status(404).json({ message: "Borrowing request not found." });
        }
        if (borrowing.status !== "Pending") {
            return res.status(400).json({ message: `Cannot approve. Current status is: ${borrowing.status}` });
        }

        //Find the associated resource and reduce available quantity
        const resource = await Resource.findById(borrowing.resourceId);
        if (!resource) {
            return res.status(404).json({ message: "Associated resource not found." });
        }
        if (resource.availableQuantity < borrowing.quantityBorrowed) {
            return res.status(400).json({ message: "Resource no longer available in required quantity." });
        }

        //Deduct from available quantity
        resource.availableQuantity -= borrowing.quantityBorrowed;
        await resource.save();

        //Update borrowing status to Approved
        borrowing.status = "Approved";
        if (req.body.adminNotes) borrowing.adminNotes = req.body.adminNotes;
        const updatedBorrowing = await borrowing.save();

        res.status(200).json(updatedBorrowing);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For rejecting a borrowing request (admin action)
export const rejectBorrowing = async (req, res) => {
    try {
        const id = req.params.id;

        const borrowing = await Borrowing.findById(id);
        if (!borrowing) {
            return res.status(404).json({ message: "Borrowing request not found." });
        }
        if (borrowing.status !== "Pending") {
            return res.status(400).json({ message: `Cannot reject. Current status is: ${borrowing.status}` });
        }

        //Update borrowing status to Rejected
        borrowing.status = "Rejected";
        if (req.body.adminNotes) borrowing.adminNotes = req.body.adminNotes;
        const updatedBorrowing = await borrowing.save();

        res.status(200).json(updatedBorrowing);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For marking an item as returned (admin/student confirms return)
export const returnItem = async (req, res) => {
    try {
        const id = req.params.id;

        // Find the borrowing record
        const borrowing = await Borrowing.findById(id);
        if (!borrowing) {
            return res.status(404).json({ message: "Borrowing record not found." });
        }
        if (!["Approved", "Overdue"].includes(borrowing.status)) {
            return res.status(400).json({ message: `Cannot return. Current status is: ${borrowing.status}` });
        }

        //Restore the available quantity of the resource
        const resource = await Resource.findById(borrowing.resourceId);
        if (resource) {
            resource.availableQuantity += borrowing.quantityBorrowed;
            await resource.save();
        }

        //Mark borrowing as Returned with the actual return date
        borrowing.status = "Returned";
        borrowing.actualReturnDate = new Date();
        if (req.body.adminNotes) borrowing.adminNotes = req.body.adminNotes;
        const updatedBorrowing = await borrowing.save();

        res.status(200).json(updatedBorrowing);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For deleting a borrowing record (admin action, e.g. clean up rejected records)
export const deleteBorrowing = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedBorrowing = await Borrowing.findByIdAndDelete(id);
        if (!deletedBorrowing) {
            return res.status(404).json({ message: "Borrowing record not found." });
        }
        res.status(200).json({ message: "Borrowing record deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};
