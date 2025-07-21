const Document = require('../models/User')

exports.getRecentDocument = async (req, res) => {
    try {
        const userId = req.user

        const recentDocs = await Document.find({user: userId})
        .sort({createdAt: -1})
        .limit(5)

        res.status(200).json(recentDocs)
    } catch (err) {
        console.error(err)
        res.status(500).json({error: "Server Error"})
    }
}