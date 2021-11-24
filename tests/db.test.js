// TESTS BEFORE USER ADMIN
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.blogs)
  })

describe('Tests on already present blogs', () => {
  test('all blogs are returned', async () => {
      const blogs = await helper.blogsInDb()
      expect(blogs).toHaveLength(helper.blogs.length)
  })

  test('id property present in the blogs', async () => {
      const blogs = await helper.blogsInDb()
      for (let blog of blogs){
          expect(blog.id).toBeDefined()
      }
  })
})

const newBlog = helper.newBlog

describe('Alteration tests', () => {
  test('a valid blog can be added', async () => {
      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd).toHaveLength(helper.blogs.length + 1)
      const foundBlog = blogsAtEnd.filter((b)=>b.title === newBlog.title && b.author === newBlog.author 
                                              && b.url===newBlog.url)
      expect(foundBlog).toHaveLength(1)
    })

  test('missing likes property defaults to value 0', async () => {
      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd).toHaveLength(helper.blogs.length + 1)
      const foundBlog = blogsAtEnd.filter((b)=>b.title === newBlog.title)[0]
      expect(foundBlog.likes).toBe(0)
    })

  test('missing title and url properties', async () => {
      await api
        .post('/api/blogs')
        .send(helper.partialBlog)
        .expect(400)
    })
  test('delete a blog', async () => {
    const blogs = await helper.blogsInDb()
    await api
      .del('/api/blogs/'+blogs[blogs.length-1].id)
      .expect(204)
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.blogs.length-1)
  })
  test('update a blog', async () => {
    const blogs = await helper.blogsInDb()
    const upBlog = helper.blogs[0] 
    upBlog.likes = upBlog.likes+1
    await api
      .put('/api/blogs/'+upBlog._id)
      .send(upBlog)
      .expect(200)
  })
})

afterAll(() => {
  mongoose.connection.close()
})

