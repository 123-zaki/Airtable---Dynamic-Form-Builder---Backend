import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    airtableRecordId: {
        type: String,
    },
    answers: {
        type: mongoose.Schema.Types.Mixed,   // {questionKey: value}
        required: true
    },
    deletedInAirtable: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

export default mongoose.model("Response", responseSchema);