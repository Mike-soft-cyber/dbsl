const User = require('../models/User')

exports.getTeacher = async (req,res) => {
    try {
        const teacher = await User.findById(req.params.id, 'firstName lastName _id')
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        res.json(teacher)
    } catch (err) {
        res.status(500).json({message: 'Server Error(getTeacher)'})
    }
}
