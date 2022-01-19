const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId
const blogsSchema = new mongoose.Schema({
    title:{type:String, require:true},

    body:{type:String, require:true},

    authorId:{type:objectId, required:true ,ref : 'Author'},

    tags:[String] ,

    category:{type:String, require:true},
    
    subcategory :[String],

    deletedAt : {type: Date, default:null},
    
    isDeleted:{type:Boolean, default:false},
    
    isPublished:{type:Boolean, default:false},

    publishedAt:{type: Date, default: null}
    
    },{timestamps : true })

module.exports= mongoose.model( 'Blog' ,blogsSchema)
