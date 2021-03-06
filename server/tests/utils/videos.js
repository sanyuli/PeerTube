'use strict'

const fs = require('fs')
const pathUtils = require('path')
const request = require('supertest')

const videosUtils = {
  getVideoCategories,
  getVideoLicences,
  getVideoLanguages,
  getAllVideosListBy,
  getVideo,
  getVideosList,
  getVideosListPagination,
  getVideosListSort,
  removeVideo,
  searchVideo,
  searchVideoWithPagination,
  searchVideoWithSort,
  testVideoImage,
  uploadVideo,
  updateVideo,
  rateVideo
}

// ---------------------- Export functions --------------------

function getVideoCategories (url, end) {
  const path = '/api/v1/videos/categories'

  request(url)
    .get(path)
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(end)
}

function getVideoLicences (url, end) {
  const path = '/api/v1/videos/licences'

  request(url)
    .get(path)
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(end)
}

function getVideoLanguages (url, end) {
  const path = '/api/v1/videos/languages'

  request(url)
    .get(path)
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(end)
}

function getAllVideosListBy (url, end) {
  const path = '/api/v1/videos'

  request(url)
    .get(path)
    .query({ sort: 'createdAt' })
    .query({ start: 0 })
    .query({ count: 10000 })
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(end)
}

function getVideo (url, id, end) {
  const path = '/api/v1/videos/' + id

  request(url)
    .get(path)
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(end)
}

function getVideosList (url, end) {
  const path = '/api/v1/videos'

  request(url)
    .get(path)
    .query({ sort: 'name' })
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(end)
}

function getVideosListPagination (url, start, count, sort, end) {
  if (!end) {
    end = sort
    sort = null
  }

  const path = '/api/v1/videos'

  const req = request(url)
              .get(path)
              .query({ start: start })
              .query({ count: count })

  if (sort) req.query({ sort })

  req.set('Accept', 'application/json')
     .expect(200)
     .expect('Content-Type', /json/)
     .end(end)
}

function getVideosListSort (url, sort, end) {
  const path = '/api/v1/videos'

  request(url)
    .get(path)
    .query({ sort: sort })
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(end)
}

function removeVideo (url, token, id, expectedStatus, end) {
  if (!end) {
    end = expectedStatus
    expectedStatus = 204
  }

  const path = '/api/v1/videos'

  request(url)
    .delete(path + '/' + id)
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + token)
    .expect(expectedStatus)
    .end(end)
}

function searchVideo (url, search, field, end) {
  if (!end) {
    end = field
    field = null
  }

  const path = '/api/v1/videos'
  const req = request(url)
              .get(path + '/search/' + search)
              .set('Accept', 'application/json')

  if (field) req.query({ field: field })
  req.expect(200)
     .expect('Content-Type', /json/)
     .end(end)
}

function searchVideoWithPagination (url, search, field, start, count, sort, end) {
  if (!end) {
    end = sort
    sort = null
  }

  const path = '/api/v1/videos'

  const req = request(url)
              .get(path + '/search/' + search)
              .query({ start: start })
              .query({ count: count })
              .query({ field: field })

  if (sort) req.query({ sort })

  req.set('Accept', 'application/json')
     .expect(200)
     .expect('Content-Type', /json/)
     .end(end)
}

function searchVideoWithSort (url, search, sort, end) {
  const path = '/api/v1/videos'

  request(url)
    .get(path + '/search/' + search)
    .query({ sort: sort })
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(end)
}

function testVideoImage (url, videoName, imagePath, callback) {
  // Don't test images if the node env is not set
  // Because we need a special ffmpeg version for this test
  if (process.env.NODE_TEST_IMAGE) {
    request(url)
      .get(imagePath)
      .expect(200)
      .end(function (err, res) {
        if (err) return callback(err)

        fs.readFile(pathUtils.join(__dirname, '..', 'api', 'fixtures', videoName + '.jpg'), function (err, data) {
          if (err) return callback(err)

          callback(null, data.equals(res.body))
        })
      })
  } else {
    console.log('Do not test images. Enable it by setting NODE_TEST_IMAGE env variable.')
    callback(null, true)
  }
}

function uploadVideo (url, accessToken, videoAttributesArg, specialStatus, end) {
  if (!end) {
    end = specialStatus
    specialStatus = 204
  }

  const path = '/api/v1/videos'

  // Default attributes
  let attributes = {
    name: 'my super video',
    category: 5,
    licence: 4,
    language: 3,
    nsfw: true,
    description: 'my super description',
    tags: [ 'tag' ],
    fixture: 'video_short.webm'
  }
  attributes = Object.assign(attributes, videoAttributesArg)

  const req = request(url)
              .post(path)
              .set('Accept', 'application/json')
              .set('Authorization', 'Bearer ' + accessToken)
              .field('name', attributes.name)
              .field('category', attributes.category)
              .field('licence', attributes.licence)
              .field('language', attributes.language)
              .field('nsfw', attributes.nsfw)
              .field('description', attributes.description)

  for (let i = 0; i < attributes.tags.length; i++) {
    req.field('tags[' + i + ']', attributes.tags[i])
  }

  let filepath = ''
  if (pathUtils.isAbsolute(attributes.fixture)) {
    filepath = attributes.fixture
  } else {
    filepath = pathUtils.join(__dirname, '..', 'api', 'fixtures', attributes.fixture)
  }

  req.attach('videofile', filepath)
     .expect(specialStatus)
     .end(end)
}

function updateVideo (url, accessToken, id, attributes, specialStatus, end) {
  if (!end) {
    end = specialStatus
    specialStatus = 204
  }

  const path = '/api/v1/videos/' + id

  const req = request(url)
              .put(path)
              .set('Accept', 'application/json')
              .set('Authorization', 'Bearer ' + accessToken)

  if (attributes.name) req.field('name', attributes.name)
  if (attributes.category) req.field('category', attributes.category)
  if (attributes.licence) req.field('licence', attributes.licence)
  if (attributes.language) req.field('language', attributes.language)
  if (attributes.nsfw) req.field('nsfw', attributes.nsfw)
  if (attributes.description) req.field('description', attributes.description)

  if (attributes.tags) {
    for (let i = 0; i < attributes.tags.length; i++) {
      req.field('tags[' + i + ']', attributes.tags[i])
    }
  }

  req.expect(specialStatus).end(end)
}

function rateVideo (url, accessToken, id, rating, specialStatus, end) {
  if (!end) {
    end = specialStatus
    specialStatus = 204
  }

  const path = '/api/v1/videos/' + id + '/rate'

  request(url)
    .put(path)
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + accessToken)
    .send({ rating })
    .expect(specialStatus)
    .end(end)
}

// ---------------------------------------------------------------------------

module.exports = videosUtils
