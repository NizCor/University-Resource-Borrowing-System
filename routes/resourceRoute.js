//Import the express module
import express from "express";

//Import controller functions for handling resource routes
import {
    addResource,
    getAllResources,
    getResourceById,
    getResourcesByCategory,
    updateResource,
    deleteResource,
} from "../controller/resourceController.js";

//Create a new router instance
const route = express.Router();

//Define routes and their corresponding controller functions
route.post("/add", addResource);                            // Route to add a new resource
route.get("/getall", getAllResources);                      // Route to fetch all resources
route.get("/get/:id", getResourceById);                     // Route to fetch a resource by ID
route.get("/category/:category", getResourcesByCategory);   // Route to fetch resources by category
route.put("/update/:id", updateResource);                   // Route to update a resource by ID
route.delete("/delete/:id", deleteResource);                // Route to delete a resource by ID

export default route;
