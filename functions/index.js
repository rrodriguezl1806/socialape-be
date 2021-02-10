const functions = require("firebase-functions");
const app = require("express")()
const {
    getAllScreams,
    postOneScream,
    getScream,
    postCommentOnScream,
    likesScream,
    unlikesScream,
    deleteScream
} = require("./handles/screams")
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require("./handles/users")
const FBAuth = require("./util/fbAuth")
const { db } = require("./util/admin")
const cors = require("cors")

app.use(cors())

// screams route
app.get('/screams', getAllScreams)
app.post('/scream', FBAuth, postOneScream)
app.get('/scream/:screamId', getScream)
app.delete('/scream/:screamId', FBAuth, deleteScream)
app.get('/scream/:screamId/like', FBAuth, likesScream)
app.get('/scream/:screamId/unlike', FBAuth, unlikesScream)
app.post('/scream/:screamId/comment', FBAuth, postCommentOnScream)

// users route
app.post('/signup', signup)
app.post('/login', login)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)
app.post('/user/image', FBAuth, uploadImage)

exports.api = functions.https.onRequest(app)

exports.createNotificationOnLike = functions.firestore
    .document('likes/{id}')
    .onCreate((snap, context) => {
        return db.doc(`/screams/${snap.data().screamId}`).get()
            .then(doc => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snap.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snap.data().userHandle,
                        type: 'like',
                        read: false,
                        screamId: doc.id
                    })
                }
            })
            .then(() => {
                return
            })
            .catch(err => { return })
    });

exports.deleteNotificationOnUnLike = functions.firestore
    .document('notification/{id}')
    .onDelete((snap, context) => {
        return db.doc(`/notification/${snap.id}`).delete()
            .then(() => {
                return
            })
            .catch(err => { return })
    });

exports.createNotificationOnComment = functions.firestore
    .document('comments/{id}')
    .onCreate((snap, context) => {
        return db.doc(`/screams/${snap.data().screamId}`).get()
            .then(doc => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snap.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snap.data().userHandle,
                        type: 'comment',
                        read: false,
                        screamId: doc.id
                    })
                }
            })
            .then(() => {
                return
            })
            .catch(err => { return })
    });

