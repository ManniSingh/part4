const blogsRouter = require('express').Router()
const Blog = require('../models/blog')


blogsRouter.get('/', (request, response) => {
  Blog.find({}).then(blogs => {
      response.json(blogs.map(blog => blog.toJSON()))
    })
})

blogsRouter.get('/:id', (request, response, next) => {
	Blog.findById(request.params.id)
		.then(ret => {ret?response.json(ret):response.status(404).end()})
		.catch(error => next(error))
})

blogsRouter.put('/:id', (request, response, next) => {
	const body = request.body
	const blog = {
		title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0
	}
	Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
		.then(updated => {response.json(updated)})
		.catch(error => next(error))
})

blogsRouter.post('/', (request, response, next) => {
  const body = request.body

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0
  })

  blog.save()
    .then(result => {
      response.status(201).json(result.toJSON())
    })
    .catch(error => next(error))
})

blogsRouter.delete('/:id', (request, response, next) => {
	Blog.findByIdAndRemove(request.params.id)
	// eslint-disable-next-line no-unused-vars
		.then(result => {
			response.status(204).end()
		})
		.catch(error => next(error))
})

module.exports = blogsRouter