const Blog = require('../model/post_model');

const getAllPost = async (req, res) => {
    const blog = await Blog.find();
    if (!blog) return res.status(404).json({ 'message': 'No Blog found.' });
    res.json(blog);
}


const fetchPost = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Post ID required.' });
    const blog = await Blog.findOne({ id: req.params.id }).exec();
    if (!blog?.createdAt) {
        return res.status(404).json({ "message": `No Post matches ID ${req.params.id}.` });
    }
    res.json(blog);
}

const deletePost = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Post ID required.' });
    const blog = await Blog.findOneAndDelete({ id: req.params.id });
    if (!blog?.createdAt) {
        return res.status(404).json({ "message": `No Post matches ID ${req.params.id}.` });
    }
    return res.status(204).json({ "message": "Post ID deleted." });
}

const updatePost = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ 'message': 'Post ID required.' });
    const blog = await Blog.findOneAndUpdate({ id: req.params.id }, req.body);
    if (!blog?.updatedAt) {
        return res.status(404).json({ "message": `No Post matches ID ${req.params.id}.` });
    }
    const updatedblog = await Blog.findOne({ id: req.params.id }).exec();

    res.json(updatedblog);

}

const createPost = async (req, res) => {
    if (!req?.body?.title || !req?.body?.content || !req?.body?.category || !req?.body?.tags) {
        return res.status(400).json({ 'message': 'All fields are required' });
    }

    try {
        const result = await Blog.create({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            tags: req.body.tags,
        });

        // const post = await Blog.findOne({ title: req.body.title }).exec();
        res.status(201).json(result);

    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    getAllPost,
    createPost,
    fetchPost,
    deletePost,
    updatePost,

}