const { db } = require('../util/admin')

exports.getAllScreams = (req, res) => {
    db
        .collection("screams")
        .orderBy("createdAt", 'desc')
        .get()
        .then(data => {
            let screams = []
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    userHandle: doc.data().userHandle,
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    userImage: doc.data().userImage,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount
                })
            })
            return res.json(screams)
        })
        .catch(err => console.log(err))
}

exports.postOneScream = (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    }

    db.collection("screams")
        .add(newScream)
        .then(doc => {
            let resScream = newScream
            resScream.screamId = doc.id
            res.json(resScream)
        })
        .catch(err => res.status(500).json({message: 'something went wrong'}))
}

exports.getScream = (req, res) => {
    let screamData = {}
    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found'})
            }
            screamData = doc.data()
            screamData.screamId = doc.id
            return db.collection('comments')
                .where('screamId', '==', req.params.screamId)
                .get()
        })
        .then((data) => {
            screamData.comments = []
            data.forEach(doc => {
                screamData.comments.push(doc.data())
            })
            return res.json(screamData)
        })
        .catch(err => {
            console.log('error', err)
            res.status(500).json({error: err.code})
        })
}

exports.postCommentOnScream = (req, res) => {
    let newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    }
    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if (!doc.exists) return res.status(404).json({ error: 'Scream not found' })
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
        })
        .then(() => {
            return db.collection('comments').add(newComment)
        })
        .then(() => {
            return res.json(newComment)
        })
        .catch(err => res.status(500).json({ error: err.code }))
}

exports.likesScream = (req, res) => {
    const likeDocument = db.collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId)
        .limit(1)
    const screamDocument = db.doc(`screams/${req.params.screamId}`)

    let screamData
    screamDocument.get()
        .then(doc => {
            if (doc.exists) {
                screamData = doc.data()
                screamData.screamId = doc.id
                return likeDocument.get()
            } else {
                res.status(404).json({ error: "Scream not found"})
            }
        })
        .then(data => {
            if (data.empty) {
                return db.collection('likes')
                    .add({
                        screamId: req.params.screamId,
                        userHandle: req.user.handle
                    })
                    .then(() => {
                        screamData.likeCount ++
                        return screamDocument.update({ likeCount: screamData.likeCount })
                    })
                    .then(() => {
                        res.json(screamData)
                    })
                    .catch(err => {
                        res.status(500).json({error: err.code})
                    })
            } else {
                res.status(400).json({ error: "Scream already liked"})
            }
        })
        .catch(err => {
            console.log('', err)
            res.status(500).json({error: err.code})
        })
}

exports.unlikesScream = (req, res) => {
    const likeDocument = db.collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId)
        .limit(1)
    const screamDocument = db.doc(`screams/${req.params.screamId}`)

    let screamData
    screamDocument.get()
        .then(doc => {
            if (doc.exists) {
                screamData = doc.data()
                screamData.screamId = doc.id
                return likeDocument.get()
            } else {
                res.status(404).json({ error: "Scream not found"})
            }
        })
        .then(data => {
            if (data.empty) {
                res.status(400).json({ error: "Scream not liked"})
            } else {
                return db.doc(`likes/${data.docs[0].id}`)
                    .delete()
                    .then(() => {
                        screamData.likeCount--
                        screamDocument.update({ likeCount: screamData.likeCount })
                    })
                    .then(() => {
                        res.json(screamData)
                    })
            }
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({error: err.code})
        })
}

exports.deleteScream = (req, res) => {
    db.doc(`/screams/${req.params.screamId}`).get()
        .then(data => {
            if (!data.exists) {
                res.status(404).json({ error: "Scream not found" })
            }
            return data.ref.delete()
        })
        .then(() => res.json({ message: "Scream deleted successfully" }))
        .catch(err => res.status(500).json({ error: err.code }))
}

