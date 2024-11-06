const express = require('express');
const router = express.Router();
const postController = require('../controller/post_controller');
const { convertFile } = require('../controller/csv_converter');

// router.route('/')
//     .post(postController.createPost).
//     get(postController.getAllPost).
//     get(postController.fetchPost);

router.route('/:id')
    .get(postController.fetchPost).
    put(postController.updatePost)
    .delete(postController.deletePost);

router.route('/')
    .get(convertFile);


module.exports = router;
