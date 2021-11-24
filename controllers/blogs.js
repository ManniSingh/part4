const blogsRouter = require('express').Router()
//const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs.map((blog) => blog.toJSON()))
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.put('/:id', async (request, response, next) => {
  const { body } = request
  const user = request.user
  if (!request.token || !user) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const blog = {
		title: body.title,
    author: body.author,
    url: body.url,
    user: user._id,
    likes: body.likes || 0
	}
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    if(updatedBlog) {
      response.json(updatedBlog.toJSON())
    } else{
      response.status(400).end()
    }
})

blogsRouter.post('/', async (request, response) => {
  const { body } = request
  //const decodedToken = jwt.verify(request.token, process.env.SECRET)
  const user = request.user
  if (!request.token || !user) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  //const user = await User.findById(decodedToken.id)
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    user: user._id,
    likes: body.likes || 0
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  //await Blog.findByIdAndRemove(request.params.id)
  const blog = await Blog.findById(request.params.id)
  //const userid = jwt.verify(request.token, process.env.SECRET).id
  if ( blog.user.toString() === request.user.id.toString() ){
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  } else{
    response.status(403).end()
  }
})

module.exports = blogsRouter