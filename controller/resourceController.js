import Resource from "../model/resourceModel.js";


////////////////////////////////////////////////////////////////////////////////////////
//For adding a new resource to the inventory
export const addResource = async (req, res) => {
    try {
        //Create a new resource instance with the request body
        const resourceData = new Resource(req.body);
        const { name, category } = req.body;

        //Check if a resource with the same name and category already exists
        const resourceExists = await Resource.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
            category: { $regex: new RegExp(`^${category}$`, "i")}
        });
        if (resourceExists) {
            return res.status(400).json({ message: "Resource with this name and category already exists." });
        }

        //Ensure availableQuantity defaults to totalQuantity if not provided
        if (resourceData.availableQuantity === undefined &&
            resourceData.totalQuantity !== undefined){
                resourceData.availableQuantity = resourceData.totalQuantity;
        }

        //Save the new resource to the database
        const savedResource = await resourceData.save();
        // Send a success response with the saved resource data
        res.status(201).json(savedResource);
    } catch (error) {
        //Handle any errors and send an internal server error response
        
        console.log(error);
        res.status(500).json({
            error: error.message
        });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For fetching all resources from the database
export const getAllResources = async (req, res) => {
    try {
        //Find all resources in the database
        const resources = await Resource.find();
        //If no resources are found, send a 404 error response
        if (resources.length === 0) {
            return res.status(200).json([]);
        }
        //Send a success response with the fetched resources data
        res.status(200).json(resources);
    } catch (error) {
        //Handle any errors and send an internal server error response
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For fetching a single resource by ID
export const getResourceById = async (req, res) => {
    try {
        //Extract resource id from request parameters
        const id = req.params.id;
        //Find the resource by ID
        const resource = await Resource.findById(id);
        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }
        res.status(200).json(resource);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For fetching resources filtered by category
export const getResourcesByCategory = async (req, res) => {
    try {
        // Extract category from request parameters
        const { category } = req.params;
        // Find all resources matching the category
        const resources = await Resource.find({ category });
        if (resources.length === 0) {
            return res.status(404).json({ message: `No resources found in category: ${category}` });
        }
        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For updating a resource's details
export const updateResource = async (req, res) => {
    try {
        //Extract resource id from request parameters
        const id = req.params.id;
        //Update the resource and return the updated document
        const updatedResource = await Resource.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedResource) {
            return res.status(404).json({ message: "Resource not found." });
        }
        res.status(200).json(updatedResource);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};



////////////////////////////////////////////////////////////////////////////////////////
//For deleting a resource from the inventory
export const deleteResource = async (req, res) => {
    try {
        //Extract resource id from request parameters
        const id = req.params.id;
        //Delete the resource from the database
        const deletedResource = await Resource.findByIdAndDelete(id);
        if (!deletedResource) {
            return res.status(404).json({ message: "Resource not found." });
        }
        res.status(200).json({ message: "Resource deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
};
