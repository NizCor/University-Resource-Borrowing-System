//Import the express module
import express from "express";

//Import controller functions for handling borrowing routes
import {
    createBorrowingRequest,
    getAllBorrowings,
    getBorrowingsByStudent,
    getOverdueBorrowings,
    approveBorrowing,
    rejectBorrowing,
    returnItem,
    deleteBorrowing,
} from "../controller/borrowingController.js";

//Create a new router instance
const route = express.Router();

//Define routes and their corresponding controller functions
route.post("/request", createBorrowingRequest);             // Route for student to submit borrowing request
route.get("/getall", getAllBorrowings);                     // Route to fetch all borrowing records (admin)
route.get("/student/:studentId", getBorrowingsByStudent);   // Route to fetch borrowings by student ID
route.get("/overdue", getOverdueBorrowings);               // Route to fetch all overdue borrowings
route.put("/approve/:id", approveBorrowing);               // Route to approve a pending request (admin)
route.put("/reject/:id", rejectBorrowing);                 // Route to reject a pending request (admin)
route.put("/return/:id", returnItem);                      // Route to mark an item as returned
route.delete("/delete/:id", deleteBorrowing);              // Route to delete a borrowing record (admin)

export default route;
