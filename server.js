
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

mongoose.Promise = global.Promise;

// config.js is where origin points are stored
const { PORT, DATABASE_URL } = require('./config');
const { seedData } = require('./models');

const jsonParser = bodyParser.json();

const app = express();

app.use(bodyParser.json());

//log the http layer
app.use(morgan('common'));
//app.use("/seedData", blogPostsRouter);

app.get('/posts', (req, res) => {
    seedData
        .find() //returns items in DB
        .exec() //returns promise

        .then(posts => {
            res.json({
                posts: posts.map(post => post.apiRepr()) //returns in representational format
            });
        })
        .catch(
            err => {
                console.error(err);
                res.status(500).json({message: "Internal server error"});
            }
        )
});

//request by ID
app.get('/posts/:id', (req, res) => {
    seedData
    .findByID(req.params.id)
    .exec()
    .then(restaurant =>res.json(restaurant.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'})
    });
});

app.post('/posts/', (req, res) => {

    const requiredFields = ['title', 'content', 'author']
    for (let i=0; i<requiredFields.length; i++) {
        const field = requiredFields[i];
        if(!(field in req.body)) {
            const message = 'Missing' + field + 'in request body';
            console.error(message);
            return res.status(400).send(message);
        }
    }

    seedData
    .create({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,})
    .then(
        seed => res.status(201).json(seed.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});

    });
});

app.put('posts/:id', (req, res) => {
    //ensure that the id in the request path and the one in request body match
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = (
            `Request path id (${req.params.id}) and request body id ` +
            `(${req.body.id}) must match`);
            console.error(message);
            res.status(400).json({message: message});
    }

    //fields that are updateable
    const toUpdate = {};
    const updateableFields = ['title', 'content', 'author']

    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field]= req.body[field];
        }
    });

    seedData
    // all key/value pairs in toUpdate will be updated
    .findByIdAndUpdate(req.params.id)
    .exec()
    .then(restaurant => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));

    });

app.delete(':id', (req, res) => {
    seedData
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(restaurant => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

//catch-all for non-existent endpoint
app.use('*', function(req, res) {
    res.status(404).json({message: 'Not Found'});
});

//declare server here however server gets created on runServer
let server;


//this function connects to the database and then starts the server
function runServer(databaseUrl = DATABASE_URL, port = PORT) {
    // connects to the database and starts the server
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                })
        });
    })
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            })
        })
    })
}

//if server.js is called indirectly (example 'node server.js') this
//block runs. But we also export the runServer command so other code (for instance, test code) can start the server as needed
if (require.main === module) {
    runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};