// Create web server application
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');

// Use body parser to parse JSON body
app.use(bodyParser.json());

// Create database variable outside of any route
var db;

// Connect to database before starting server
// process.env.MONGODB_URI is the default environment variable on Heroku
MongoClient.connect(process.env.MONGODB_URI, function(err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object for reuse
    db = database;
    console.log('Database connection ready');

    // Initialize the app
    var server = app.listen(process.env.PORT || 8080, function() {
        var port = server.address().port;
        console.log('App now running on port', port);
    });
});

// Root endpoint
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Get all comments
app.get('/api/comments', function(req, res) {
    db.collection(COMMENTS_COLLECTION).find({}).toArray(function(err, docs) {
        if (err) {
            handleError(res, err.message, 'Failed to get comments');
        } else {
            res.status(200).json(docs);
        }
    });
});

// Create a new comment
app.post('/api/comments', function(req, res) {
    var newComment = req.body;
    newComment.createDate = new Date();

    if (!req.body.comment) {
        handleError(res, 'Invalid user input', 'Must provide a comment', 400);
    } else {
        db.collection(COMMENTS_COLLECTION).insertOne(newComment, function(err, doc) {
            if (err) {
                handleError(res, err.message, 'Failed to create new comment');
            } else {
                res.status(201).json(doc.ops[0]);
            }
        });
    }
});

// Delete a comment
app.delete('/api/comments/:id', function(req, res) {
    db.collection(COMMENTS_COLLECTION).deleteOne(
        { _id: new ObjectID(req.params.id) },
        function(err, result) {
            if (err) {
                handleError(res, err.message, 'Failed to delete comment');
            } else {
                res.status(200).json(req.params.id);
            }
        }
    );
});

// Update a comment
app.put('/api/comments/:id', function(req, res) {
    var updateDoc = req.body;
    delete updateDoc._id;

    db.collection(COMMENTS_COLLECTION).updateOne(
        { _id: new ObjectID(req.params.id) },
        updateDoc,
        function(err, doc) {
            if (err) {
                handleError(res, err.message, 'Failed to update comment');
            } else {
                res.status(204).end();
            }
        }
    );
});

// Error handling
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Error handler
function handleError(res, reason, message, code) {
    console.log('ERROR: ' + reason);
    res.status(code || 500).json({ error: message });
}
