const mongoose = require("mongoose");

//unique: true
const TodoSchema = new mongoose.Schema({
  orderedId: {
    type: Number,
    default: 0,
    unique: false
  },
  text: {
    type: String,
    default: ''
  },
  done: {
    type: Boolean,
    default: false
  },
  creationDate: {
    type: Date,
    default: Date.now
  },

});

const ListSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemList: [TodoSchema],
  // [{ type: Schema.Types.ObjectId, ref: 'Todo' }]
  numItems: { type: Number, default: 0 },
  name: {
    type: String,
    default: 'untitled list'
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  },
  lastEditorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collaborators: [mongoose.Schema.Types.ObjectId]

});

const List = mongoose.model('List', ListSchema);
const Todo = mongoose.model('Todo', TodoSchema);

module.exports = mongoose.model("List", ListSchema);
/*
permit['C'] = T

C
R
U
D
O
*/
