const User = require('../models/User')

exports.getSchool = async (req, res) => {
    try {
        const teacher = await User.findById(req.params.id, 'schoolName')
        if(!teacher) return res.status(400).json({message: "School not Found"})
        res.json({schoolName: teacher.schoolName})
    } catch (err) {
        res.status(500).json({message: "Server Error(School)"})
    }
}