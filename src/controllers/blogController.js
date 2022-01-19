const mongoose = require("mongoose")
const authorModel = require('../models/authorModel')
const blogModel = require('../models/blogModel')
//------------------------------------functions-------------------------------------//
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}
//-------------------------------------//----------------------------------//

//create blog
const createBlog = async function (req, res) {
    try {
        const requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        

        // Extract params
        const { title, body, authorId, tags, category, subcategory, isPublished } = requestBody;

        const author = await authorModel.findById(authorId);

        if (!author) {
            res.status(400).send({ status: false, message: `Author does not exit` })
            return
        }

        // Validation starts
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: 'Blog Title is required' })
            return
        }

        if (!isValid(body)) {
            res.status(400).send({ status: false, message: 'Blog body is required' })
            return
        }

        if (!isValid(authorId)) {
            res.status(400).send({ status: false, message: 'Author id is required' })
            return
        }

        if (!isValidObjectId(authorId)) {
            res.status(400).send({ status: false, message: `${authorId} is not a valid author id` })
            return
        }

        if (!isValid(category)) {
            res.status(400).send({ status: false, message: 'Blog category is required' })
            return
        }

        
        // Validation ends

        let blogData = {
            title,
            body,
            authorId,
            category,
            isPublished: isPublished ? isPublished : false,
            publishedAt: isPublished ? new Date() : null
        }

        if(tags) {
             blogData['tags'] = [tags]
        }

        if(subcategory) {
                blogData['subcategory'] = [subcategory]
        }
        
        const newBlog = await blogModel.create(blogData)
        res.status(201).send({ status: true, message: 'New blog created successfully', data: newBlog })
    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message });
    }
}


//get blog
const getBlogs = async function (req, res) {
    try {
        const filterData = { isDeleted: false, deletedAt: null, isPublished: true }
        const queryParams = req.query

        if (isValidRequestBody(queryParams)) {
            const { authorId, category, tags, subcategory } = queryParams

            if (isValid(authorId) && isValidObjectId(authorId)) {
                filterData['authorId'] = authorId
            }

            if (isValid(category)) {
                filterData['category'] = category.trim()
            }

            if (isValid(tags)) {
                
                filterData['tags'] = tags
            }

            if (isValid(subcategory)) {
                
                filterData['subcategory'] = subcategory
            }
        }

        const blogs = await blogModel.find(filterData)

        if (blogs.length === 0) {
            res.status(404).send({ status: false, message: 'No blogs found' })
            return
        }
       
       return  res.status(200).send({ status: true, message: 'Blogs list', data: blogs })

    } catch (error) {
       return res.status(500).send({ status: false, message: error.message });
    }
}

// update blog

const updateBlog = async function (req, res) {
    try {
        
        const requestBody = req.body
        const params = req.params
        const blogId = params.blogId
        const authorIdFromToken = req.authorId

        // Validation stats
        if (!isValidObjectId(blogId)) {
            res.status(400).send({ status: false, message: `${blogId} is not a valid blog id` })
            return
        }

        const blog = await blogModel.findOne({ _id: blogId, isDeleted: false, deletedAt: null })
        if (!blog) {
            res.status(404).send({ status: false, message: `Blog not found` })
            return
        }
        console.log(blog.authorId)

        //authorization
        if (blog.authorId.toString() !== authorIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
        const { title, body, tags, category, subcategory, isPublished } = requestBody

        const updatedBlogData = {}

        if (!isValidRequestBody(requestBody)) {
            res.status(200).send({ status: true, message: 'No paramateres passed. Blog unmodified', data: blog })
            return
        }
        if (isValid(title)) {
            updatedBlogData['title'] = title
        }

        if (isValid(body)) {
            updatedBlogData['body'] = body
        }

        if (isValid(category)) {

            updatedBlogData['category'] = category
        }

        if (isPublished !== undefined) {
            updatedBlogData['isPublished'] = isPublished
            updatedBlogData['publishedAt'] = isPublished ? new Date() : null
        }
        if (tags) {
            if (Array.isArray(tags) && tags.length > 0) {
                updateBlog.$addToSet["tags"] = tags
            }
            
            else if (Object.prototype.toString.call(tags) === "[object String]" && isValid(tags)) {
                updateBlog["$addToSet"]["tags"] = [tags]
            }
            else{
                return res.status(400).send({status:false,msg:"invalid input tags"})
            }
        }

        console.log(subcategory)
        if(subcategory){
            if (Array.isArray(subcategory) && subcategory.length > 0) {
                updateBlog.$addToSet["subcategory"] = subcategory
            }
           
            else if (typeof (subcategory) === "string" && isValid(subcategory)) {
                updateBlog.$addToSet["subcategory"] = [subcategory]
            }
            else{
                return res.status(400).send({status:false,msg:"invalid input subcategory"})
            }
    }

        const updatedBlog = await blogModel.findOneAndUpdate({ _id: blogId }, updatedBlogData, { new: true })

        res.status(200).send({ status: true, message: 'Blog updated successfully', data: updatedBlog });
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });

    }
}
//delete 
const checkdeletestatus = async function (req, res) {
    try {
        let blogId = req.params.blogId
        const authorIdFromToken = req.authorId
        
        const blog=await blogModel.findOne({_id:blogId,isDeleted:false})
        
        if(!blog){
            return res.status(404).send({ status: false, message: 'blog not exist' })
        }

        if (blog.authorId.toString() !== authorIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
            let deletedblogs = await blogModel.findOneAndUpdate({ _id: blogId, isDeleted: false },
                { isDeleted: true, deletedAt: Date.now() })
            if (deletedblogs) {
                res.status(200).send({ status: true, msg: "successfully deleted" })
            }
            else {
                res.status(400).send({ status: false, msg: "invalid blogId" })
            }
       
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message });

    }
}
//delete by params
const deletebyparams = async function (req, res) {
    try {
        const authorIdFromToken = req.authorId

        const {authorId,tags,category,subcategory,isPublished}=req.query

        if (! isValidRequestBody(req.query)) {
            return res.status(404).send({ msg: "please provide the query it's needed" })
        }

        if (authorId !== authorIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }

            let deleteByDetails = await blogModel.updateMany({authorId: authorId, $or: [{category: category, tags: tags, subcategory: subcategory, ispublished: unpublished
                }], isDeleted: false}, { isDeleted: true, deletedAt: Date.now() })

            if (deleteByDetails) {
                
                return res.status(404).send({ status: true, msg: "Document is deleted" })
            } else {
                return res.status(400).send({ status: false, msg: "invalid detailes" })
            }
        
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message });

    }

}

module.exports = {createBlog,getBlogs,updateBlog,checkdeletestatus,deletebyparams}
