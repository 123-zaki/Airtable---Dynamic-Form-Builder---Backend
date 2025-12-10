import mongoose from "mongoose";

const conditionSchema = new mongoose.Schema({
    questionKey: {
        type: String,
        required: true
    },
    operator: {
        type: String,
        enum: ["equals", "notEquals", "contains"],
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
},{_id: false}, {timestamps: true});

const conditionalRulesSchema = new mongoose.Schema({
    logic: {
        type: String,
        enum: ['AND', 'OR'],
        required: true
    },
    conditions: {
        types: [conditionSchema],
        default: []
    }
},{_id: false}, {timestamps: true});

const questionSchema = new mongoose.Schema({
    questionKey: {
        type: String,
        required: true,

    },
    airtableFieldId: {
        type: String,
        required: true
    },
    airtableFieldName: {
        type: String
    },
    label: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["shortText", "longText", "singleSelect", "multiSelect", "attachment"],
        required: true
    },
    required: {
        type: Boolean,
        default: false
    },

    // for select fields (singleSelect & multiSelect)
    options: {
        type: [String],
        default: undefined    // only needed for select fields
    },

    conditionalRules: {
        type: conditionalRulesSchema,
    },
},{_id: false}, {timestamps: true});

const formSchema = new mongoose.Schema({
    ownerUserid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    airtableBaseId: {
        type: String,
        required: true,
        index: true
    },
    airtableTableId: {
        type: String,
        required: true,
        index: true
    },
    questions: {
        type: [questionSchema],
        validate: {
            validator: (arr) => Array.isArray(arr) && arr.length > 0,
            message: 'At least one question is required'
        }
    }
}, {timestamps: true});

export default mongoose.model("Form", formSchema);