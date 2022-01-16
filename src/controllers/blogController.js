const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId
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

        const author = await authorModel.findById(authorId);

        if (!author) {
            res.status(400).send({ status: false, message: `Author does not exit` })
            return
        }
        // Validation ends

        const blogData = {
            title,
            body,
            authorId,
            category,
            isPublished: isPublished ? isPublished : false,
            publishedAt: isPublished ? new Date() : null
        }

        if (tags) {

            blogData['tags'] = [tags]
        }

        if (subcategory) {

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
                const tagsArr = tags.trim().split(',').map(tag => tag.trim());
                filterData['tags'] = { $all: tagsArr }
            }

            if (isValid(subcategory)) {
                const subcatArr = subcategory.trim().split(',').map(subcat => subcat.trim());
                filterData['subcategory'] = { $all: subcatArr }
            }
        }

        const blogs = await blogModel.find(filterData)

        if (Array.isArray(blogs) && blogs.length === 0) {
            res.status(404).send({ status: false, message: 'No blogs found' })
            return
        }

        res.status(200).send({ status: true, message: 'Blogs list', data: blogs })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

// update blog

const updateBlog = async function (req, res) {
    try {
        let validId = req["validToken"]["authorId"]
        const requestBody = req.body
        const params = req.params
        const blogId = params.blogId
        const authorIdFromToken = req.authorId

        // Validation stats
        if (!isValidObjectId(blogId)) {
            res.status(400).send({ status: false, message: `${blogId} is not a valid blog id` })
            return
        }

        if (!isValidObjectId(authorIdFromToken)) {
            res.status(400).send({ status: false, message: `${authorIdFromToken} is not a valid token id` })
            return
        }

        const blog = await blogModel.findOne({ _id: blogId, isDeleted: false, deletedAt: null })
        if (!blog) {
            res.status(404).send({ status: false, message: `Blog not found` })
            return
        }

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
            updatedBlogData['$addToSet']['tags'] = { $each: [...tags] }
        }


        if (subcategory) {
            updatedBlogData['$addToSet']['subcategory'] = { $each: [...subcategory] }
        }

        const updatedBlog = await blogModel.findOneAndUpdate({ _id: blogId }, updatedBlogData, { new: true })

        res.status(200).send({ status: true, message: 'Blog updated successfully', data: updatedBlog });ंं
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });

    }
}
//delete 
const checkdeletestatus = async function (req, res) {
    try {
        let validId = req["validToken"]["authorId"]
        let blogId = req.params.blogId
        let authorId = req.query.authorId

        if (validId == authorId) {
            let deletedblogs = await blogModel.findOneAndUpdate({ _id: blogId, isDeleted: false },
                { isDeleted: true, deletedAt: Date.now() })
            if (deletedblogs) {
                res.status(200).send({ status: true, msg: "successfully deleted" })
            }
            else {
                res.status(400).send({ status: false, msg: "invalid blogId" })
            }
        } else {
            res.status(40).send({ status: false, msg: "invalid Id" })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message });

    }
}
//delete by params
const deletebyparams = async function (req, res) {
    try {
        let validId = req["validToken"]["authorId"]
        let category = req.query.category
        let authorId = req.query.authorId
        let tags = req.query.tags
        let subcategory = req.query.subcategory
        let unpublished = req.query.unpublished
        if (validId == authorId) {
            let deleteByDetails = await blogModel.updateMany({

                authorId: authorId, $or: [{
                    category: category, tags: tags

                    , subcategory: subcategory, ispublished: unpublished
                }], isDeleted: false

            }, { isDeleted: true, deletedAt: Date.now() })

            if (deleteByDetails) {
                console.log(deleteByDetails)
                return res.status(404).send({ status: true, msg: "Document is deleted" })
            } else {
                res.status(400).send({ status: false, msg: "invalid detailes" })
            }
        } else {
            res.status(401).send({ status: false, msg: "invalid detailes" })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message });

    }

}

module.exports = {createBlog,getBlogs,updateBlog,checkdeletestatus,deletebyparams}
