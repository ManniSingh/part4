const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const supertest = require('supertest')
const User = require('../models/user')
const Blog = require('../models/blog')

const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

let token = null

beforeEach(async () => {
    await User.deleteMany({})
    await Blog.deleteMany({})
    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({ username: 'root', passwordHash })
    await user.save()
    const result = await api.post('/api/login').send({username: 'root',password: 'secret'})
    token = result.body.token    
  })

describe('Tests on Admin database consistency', () => {

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(500)
    expect(result.error.text).toContain('duplicate key error')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with username < 3 chars', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'ro',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('minimum allowed length')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
  })
})

describe('Tests on database consistency', () => {
    test('Adding a new valid Blog without a token shall fail', async () => {

      const newBlog = {
          "title": "TEST",
          "author": "TEST",
          "url": "TEST",
          "likes": 1
      }
      await api
        .post('/api/blogs')
        .set('Authorization', 'bearer ')
        .send(newBlog)
        .expect(401)
      const result = await User.findOne({username: 'root'})
      expect(result.blogs).toHaveLength(0)
    })
    test('Add a new valid Blog', async () => {

        const newBlog = {
            "title": "TEST",
            "author": "TEST",
            "url": "TEST",
            "likes": 1
        }
        await api
          .post('/api/blogs')
          .set('Authorization', 'bearer ' + token)
          .send(newBlog)
          .expect(200)
        const result = await User.findOne({username: 'root'})
        expect(result.blogs).toHaveLength(1)
      })
      test('Add a new invalid Blog', async () => {

        const newBlog = {
            "author": "TEST",
            "url": "TEST",
            "likes": 1
        }
        const result = await api
          .post('/api/blogs')
          .set('Authorization', 'bearer ' + token)
          .send(newBlog)
          .expect(400)
        expect(result.body.error).toContain('Blog validation failed')
      })
      test('Adding a duplicate blog under different user shall fail', async () => {
        const newBlog = {
            "title": "TEST",
            "author": "TEST",
            "url": "TEST",
            "likes": 1
        }
        const passwordHash = await bcrypt.hash('secret', 10)
        const user = new User({ username: 'subroot', passwordHash })
        await user.save()
        const result = await api.post('/api/login').send({username: 'subroot',password: 'secret'})
        const subtoken = result.body.token    
        await api
          .post('/api/blogs')
          .set('Authorization', 'bearer ' + token)
          .send(newBlog)
          .expect(200)
        await api
          .post('/api/blogs')
          .set('Authorization', 'bearer ' + subtoken)
          .send(newBlog)
          .expect(500)
      })
      test('Deletion by different user shall fail', async () => {
        const newBlog = {
            "title": "TEST",
            "author": "TEST",
            "url": "TEST",
            "likes": 1
        }
        const passwordHash = await bcrypt.hash('secret', 10)
        const user = new User({ username: 'subroot', passwordHash })
        await user.save()
        const result = await api.post('/api/login').send({username: 'subroot',password: 'secret'})
        const subtoken = result.body.token    
        const response = await api
                        .post('/api/blogs')
                        .set('Authorization', 'bearer ' + token)
                        .send(newBlog)
                        .expect(200)
        await api
          .del('/api/blogs/'+response.body.id)
          .set('Authorization', 'bearer ' + subtoken)
          .send(newBlog)
          .expect(403)
      })
      test('Update a Blog', async () => {
        const newBlog = {
          "title": "TEST",
          "author": "TEST",
          "url": "TEST",
          "likes": 1
        }
        const response = await api
                          .post('/api/blogs')
                          .set('Authorization', 'bearer ' + token)
                          .send(newBlog)
                          .expect(200)
        const updatedBlog = {
            "title": "TEST",
            "author": "TEST",
            "url": "TEST",
            "likes": 2
        }
        await api
          .put('/api/blogs/'+response.body.id)
          .set('Authorization', 'bearer ' + token)
          .send(updatedBlog)
          .expect(200)
        const result = await Blog.findOne({title: "TEST"})
        expect(result.likes).toBe(2)
      })
})


afterAll(() => {
    mongoose.connection.close()
})
