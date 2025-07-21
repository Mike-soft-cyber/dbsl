const Document = require('../models/Document')
const Strands = require('../models/Strands')

exports.getDocument = async (req, res) => {
        try {
            const document = Document.schema.path('type').enumValues;
            res.json(document)
        } catch (error) {
            res.status(500).json({message: "Server Error"})
        }
}

exports.getTerms = async (req,res) => {
  try {
    const terms = Document.schema.path('term').enumValues;
    res.json(terms);
  } catch(err) {
    console.error(err)
    res.status(500).json({ message: 'Server Error' });
  }
}

exports.getGrades = async (req,res) => {
    try {
        const grades = Strands.schema.path('grade').enumValues
        res.json(grades)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server Error' });
    }
}
