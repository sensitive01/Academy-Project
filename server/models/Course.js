const mongoose = require('mongoose');

/* =========================
   LESSON SCHEMA
========================= */
const lessonSchema = mongoose.Schema({
  title: { type: String, required: true },

  type: { 
    type: String, 
    enum: ['video', 'document', 'quiz', 'assignment'], 
    default: 'video' 
  },

  url: { type: String }, // only for video/document

  duration: { type: String },

  isFree: { type: Boolean, default: false },

  // Quiz structure (only if type = quiz)
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String
  }],

  // Assignment submission type
  maxMarks: Number,

  // Link to syllabus topic index
  topicIndex: { type: Number, default: 0 },
});


/* =========================
   COURSE SCHEMA
========================= */
const courseSchema = mongoose.Schema({
  
  title: {
    type: String,
    default: 'Untitled Course'
  },

  description: {
    type: String,
    default: ''
  },

  duration: {
    type: Number,
    default: 0
  },

  durationUnit: {
    type: String,
    enum: ['week', 'month'],
    default: 'week'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  syllabus: [{
    week: String,
    topic: String,
    description: String,
    projectName: String
  }],

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  thumbnail: {
    url: String,
    public_id: String
  },

  price: {
    type: Number,
    default: 0,
  },

  category: {
    type: String,
    default: 'General',
  },

  type: {
    type: String,
    enum: ['Online Courses', 'Center Courses'],
    default: 'Online Courses'
  },

  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },

  lessons: [lessonSchema],

  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],

  totalLessons: {
    type: Number,
    default: 0
  },

  enrolledCount: {
    type: Number,
    default: 0
  },

  certificateEnabled: {
    type: Boolean,
    default: false
  },

  milestones: [{
    title: String,
    description: String,
    unlockAfterPercentage: Number
  }],

  rating: {
    type: Number,
    default: 0,
  },

  numReviews: {
    type: Number,
    default: 0,
  },

}, {
  timestamps: true,
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;