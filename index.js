require('dotenv').config()
const express = require('express')
const Note = require('./models/note')
const app = express()
const cors = require('cors')

app.use(express.static('dist'))
app.use(cors())
app.use(express.json())

const requestLogger = (req, res, next) => {
    console.log('Method: ' + req.method)
    console.log('Path: ' + req.path)
    console.log('Body:', req.body)
    console.log('---')
    next()
}

const errorHandler = (error, req, res, next) => {
    console.error(error.message)
    if (error.name === 'CastError') {
        return res.status(400).send({error: 'malformatted id'})
    } else if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    }
    
    next(error)
}

app.use(requestLogger)

app.get('/', (req, res) => {
    res.send('<h1>Hello World</h1>')
})

app.get('/api/notes', (req, res) => {
    Note.find({}).then(notes => {
        res.json(notes)
    })
})

app.get('/api/notes/:id', (req, res, next) => {
    Note.findById(req.params.id)
        .then(note => {
            if (note) {
                res.json(note)
            } else {
                res.status(404).end()
            }
        })
        .catch(error => next(error));
})

app.post('/api/notes', (req, res, next) => {
    const body = req.body

    if (!body.content) {
        return res.status(400).json({
            error: 'content missing'
        })
    }
    
    const note = new Note({
        content: body.content,
        important: Boolean(body.important) || false,
    })

    note.save()
        .then(savedNote => {
            return res.json(savedNote)
        })
        .catch(err => next(err))
})

app.put('/api/notes/:id', (req, res, next) => {
    const {content, important} = req.body

    Note.findByIdAndUpdate(
            req.params.id,
            { content, important },
            { new: true, runValidators: true, context: 'query'})
        .then(updatedNote => {
            res.json(updatedNote)
        })
        .catch(err => next(err))
})

app.delete('/api/notes/:id', (req, res, next) => {
    Note.findByIdAndDelete(req.params.id)
        .then(result => {
            return res.status(204).end()
        })
        .catch(err => next(err))
})

const unknowEndPoint = (req, res) => {
    res.status(404).json({error: 'unknown endpoint'})
}

app.use(unknowEndPoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})