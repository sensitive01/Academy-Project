const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');
const { upload } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Subject = require('../models/Subject');

const logFile = path.join(__dirname, '../debug_course.log');
const log = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
};

// @desc    Fetch all courses
// @route   GET /api/courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({}).populate('instructor', 'name').populate('subjects');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Fetch courses enrolled by current user
// @route   GET /api/courses/mine
router.get('/mine', protect, async (req, res) => {
  try {
    let student;
    const query = req.user.role === "student" ? { user: req.user._id } : { _id: req.query.studentId };
    
    // First find with all fields
    student = await Student.findOne(query);
    if (!student) return res.json([]);

    // Check if we need to migrate or handle old IDs
    let enrolledCourses = student.enrolledCourses || [];
    
    // We'll return them populated
    // We use a manual approach to handle potential old string IDs
    const courseIds = enrolledCourses.map(e => e.course || e);
    
    const coursesData = await Course.find({ _id: { $in: courseIds } })
      .populate('instructor', 'name');

    // Combine with progress data
    const results = enrolledCourses.map(e => {
      const courseId = e.course || e;
      const courseObj = coursesData.find(c => c._id.toString() === courseId.toString());
      return {
        _id: e._id || courseId, // use original e if its an ID
        course: courseObj,
        progress: e.progress || 0,
        completed: e.completed || false,
        completionDate: e.completionDate
      };
    }).filter(r => r.course); // remove if course not found

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Fetch courses available for enrollment (excluding already enrolled)
// @route   GET /api/courses/available
router.get('/available', protect, async (req, res) => {
  try {
    let student;
    if (req.user.role === "student") {
      student = await Student.findOne({ user: req.user._id });
    } else if (req.user.role === "parent") {
      const { studentId } = req.query;
      student = await Student.findById(studentId);
    }
    
    const enrolledIds = student?.enrolledCourses?.map(e => (e.course?._id || e.course || e)) || [];
    
    if (!student && req.user.role === "student") {
       return res.json([]);
    }

    const courses = await Course.find({
      _id: { $nin: enrolledIds },
      isActive: true
    }).populate("instructor", "name");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Fetch single course
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'name').populate('subjects');
        if (course) {
            res.json(course);
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    let student;
    if (req.user.role === "student") {
      student = await Student.findOne({ user: req.user._id });
    } else if (req.user.role === "parent") {
      student = await Student.findById(studentId);
    }
    if (!student) return res.status(404).json({ message: "Student not found" });

    const alreadyEnrolled = student.enrolledCourses.some(
      e => (e.course ? e.course.toString() : e.toString()) === course._id.toString()
    );
    if (alreadyEnrolled) return res.status(400).json({ message: "Already enrolled" });

    student.enrolledCourses.push({
      course: course._id,
      progress: 0,
      completed: false
    });

    await student.save();
    res.json({ message: "Successfully enrolled", courseId: course._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Enroll in a free course
// @route   POST /api/courses/:id/enroll-free
router.post('/:id/enroll-free', protect, async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.price !== 0) return res.status(400).json({ message: "Not a free course" });

    let student;
    if (req.user.role === "student") {
      student = await Student.findOne({ user: req.user._id });
    } else if (req.user.role === "parent") {
      student = await Student.findById(studentId);
    }
    if (!student) return res.status(404).json({ message: "Student not found" });

    const alreadyEnrolled = student.enrolledCourses.some(
      e => (e.course ? e.course.toString() : e.toString()) === course._id.toString()
    );
    if (alreadyEnrolled) return res.status(400).json({ message: "Already enrolled" });

    student.enrolledCourses.push({
      course: course._id,
      progress: 0,
      completed: false
    });

    await student.save();
    res.json({ message: "Successfully enrolled in free course", courseId: course._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a course
// @route   POST /api/courses
router.post('/', (req, res, next) => {
    upload.single('thumbnail')(req, res, (err) => {
        if (err) {
            log(`Multer Error: ${err.message}`);
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        next();
    });
}, async (req, res) => {
    try {
        log(`POST /api/courses started`);
        log(`Body keys: ${Object.keys(req.body).join(', ')}`);

        const { title, description, instructor, price, category, level, duration, durationUnit, syllabus, isActive, subjects, type, inlineSubjects, courseId } = req.body;

        const effectiveType = type || 'Academic';
        const trimmedCourseId = courseId ? courseId.trim() : "";

        if (effectiveType === 'Center Courses' && !trimmedCourseId) {
            return res.status(400).json({ message: 'Course ID is required for Center Courses' });
        }

        if (trimmedCourseId) {
            const existingCourse = await Course.findOne({ 
                courseId: { $regex: new RegExp(`^${trimmedCourseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
            });
            if (existingCourse) {
                return res.status(400).json({ message: `Course ID "${trimmedCourseId}" already exists. Please choose a unique Course ID.` });
            }
        }

        const thumbnail = req.file ? {
            url: req.file.path,
            public_id: req.file.filename
        } : null;

        let parsedSyllabus = [];
        if (syllabus) {
            try {
                parsedSyllabus = typeof syllabus === 'string' ? JSON.parse(syllabus) : syllabus;
            } catch (e) {
                log(`Syllabus parse error: ${e.message}`);
                console.error("Syllabus parse error:", e);
            }
        }

        const instructorId = instructor;

        if (!instructorId) {
            log(`Error: Missing instructorId. Body keys received: ${Object.keys(req.body).join(', ')}`);
            return res.status(400).json({ message: 'Instructor ID is required' });
        }

        const course = new Course({
            ...(trimmedCourseId ? { courseId: trimmedCourseId } : {}),
            title,
            description,
            duration: duration ? Number(duration) : 0,
            durationUnit: durationUnit || 'week',
            isActive: isActive === 'false' ? false : true,
            syllabus: parsedSyllabus,
            instructor: instructorId,
            thumbnail,
            price: Number(price) || 0,
            category,
            level,
            type: effectiveType,
            subjects: typeof subjects === 'string' ? JSON.parse(subjects) : subjects || []
        });

        const createdCourse = await course.save();
        
        let parsedInlineSubjects = [];
        if (inlineSubjects) {
            try {
                parsedInlineSubjects = typeof inlineSubjects === 'string' ? JSON.parse(inlineSubjects) : inlineSubjects;
                
                if (Array.isArray(parsedInlineSubjects) && parsedInlineSubjects.length > 0) {
                    const newSubjectIds = [];
                    for (const sub of parsedInlineSubjects) {
                        if (sub.name && sub.code) { // Basic validation
                            let existingSub = await Subject.findOne({ $or: [{ code: sub.code }, { name: sub.name }] });
                            if (existingSub) {
                                newSubjectIds.push(existingSub._id);
                            } else {
                                const newSub = new Subject({
                                    name: sub.name,
                                    code: sub.code,
                                    semester: sub.semester || 1,
                                    type: sub.type || 'Theory',
                                    course: createdCourse._id
                                });
                                await newSub.save();
                                newSubjectIds.push(newSub._id);
                            }
                        }
                    }
                    if (newSubjectIds.length > 0) {
                        createdCourse.subjects = [...createdCourse.subjects, ...newSubjectIds];
                        await createdCourse.save();
                    }
                }
            } catch (e) {
                log(`inlineSubjects parse error: ${e.message}`);
                console.error("inlineSubjects parse error:", e);
            }
        }

        log(`Course created: ${createdCourse._id}`);
        res.status(201).json(createdCourse);
    } catch (error) {
        log(`Create Error: ${error.message}`);
        console.error("POST /api/courses - Error:", error.message);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a course
// @route   PUT /api/courses/:id
router.put('/:id', upload.single('thumbnail'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const { title, description, instructor, price, category, level, duration, durationUnit, syllabus, isActive, lessons, subjects, type, inlineSubjects, courseId } = req.body;
        
        const effectiveType = type || course.type;
        if (courseId !== undefined) {
            const trimmedCourseId = courseId ? courseId.trim() : "";
            if (effectiveType === 'Center Courses' && !trimmedCourseId) {
                return res.status(400).json({ message: 'Course ID is required for Center Courses' });
            }

            if (trimmedCourseId) {
                const existing = await Course.findOne({ 
                    courseId: { $regex: new RegExp(`^${trimmedCourseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    _id: { $ne: course._id }
                });
                if (existing) {
                    return res.status(400).json({ message: `Course ID "${trimmedCourseId}" already exists in another course.` });
                }
                course.courseId = trimmedCourseId;
            } else {
                course.courseId = undefined;
            }
        }
        
        if (lessons) {
            course.lessons = lessons;
        }

        if (req.file) {
            course.thumbnail = {
                url: req.file.path,
                public_id: req.file.filename
            };
        }

        if (syllabus) {
            try {
                course.syllabus = typeof syllabus === 'string' ? JSON.parse(syllabus) : syllabus;
            } catch (e) {
                console.error("Syllabus parse error:", e);
            }
        }

        course.title = title || course.title;
        course.description = description || course.description;
        course.price = price !== undefined ? Number(price) : course.price;
        course.category = category || course.category;
        course.level = level || course.level;
        if (type) course.type = type;
        course.duration = duration !== undefined ? Number(duration) : course.duration;
        course.durationUnit = durationUnit || course.durationUnit;
        course.isActive = isActive !== undefined ? (isActive === 'false' ? false : true) : course.isActive;
        course.instructor = instructor || course.instructor;

        if (subjects) {
            course.subjects = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
        }

        const updatedCourse = await course.save();

        let parsedInlineSubjects = [];
        if (inlineSubjects) {
            try {
                parsedInlineSubjects = typeof inlineSubjects === 'string' ? JSON.parse(inlineSubjects) : inlineSubjects;
                
                if (Array.isArray(parsedInlineSubjects)) {
                    const newSubjectIds = [];
                    for (const sub of parsedInlineSubjects) {
                        if (sub._id) {
                            // Update existing subject
                            await Subject.findByIdAndUpdate(sub._id, {
                                name: sub.name,
                                code: sub.code,
                                semester: sub.semester || 1,
                                type: sub.type || 'Theory'
                            });
                            newSubjectIds.push(sub._id);
                        } else if (sub.name && sub.code) {
                            // Create new subject or use existing
                            let existingSub = await Subject.findOne({ $or: [{ code: sub.code }, { name: sub.name }] });
                            if (existingSub) {
                                newSubjectIds.push(existingSub._id);
                            } else {
                                const newSub = new Subject({
                                    name: sub.name,
                                    code: sub.code,
                                    semester: sub.semester || 1,
                                    type: sub.type || 'Theory',
                                    course: updatedCourse._id
                                });
                                await newSub.save();
                                newSubjectIds.push(newSub._id);
                            }
                        }
                    }
                    // Only overwrite if inlineSubjects was explicitly sent (which it is for center courses)
                    updatedCourse.subjects = newSubjectIds;
                    await updatedCourse.save();
                }
            } catch (e) {
                console.error("inlineSubjects parse error in PUT:", e);
            }
        }

        res.json(updatedCourse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Toggle course visibility
// @route   PATCH /api/courses/:id/status
router.patch('/:id/status', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        course.isActive = !course.isActive;
        await course.save();

        res.json({ message: `Course ${course.isActive ? 'enabled' : 'disabled'}`, isActive: course.isActive });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
 
        if (course) {
            await course.deleteOne();
            res.json({ message: 'Course removed' });
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Fetch students enrolled in a course
// @route   GET /api/courses/:id/students
router.get('/:id/students', async (req, res) => {
    try {
        const students = await Student.find({ "enrolledCourses.course": req.params.id })
            .select('studentNameEnglish email phone whatsapp profilePic status createdAt')
            .populate('parent', 'name email');
        res.json(students);
    } catch (error) {
        console.error('FETCH ENROLLED STUDENTS ERROR:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

const Feedback = require('../models/Feedback');
const Certificate = require('../models/Certificate');

// @desc    Upload lesson resource (video/doc)
// @route   POST /api/courses/upload-lesson-file
router.post('/upload-lesson-file', protect, upload.single('lessonFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({
            url: req.file.path,
            public_id: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update progress in a course
// @route   POST /api/courses/:id/progress
router.post('/:id/progress', protect, async (req, res) => {
  try {
    const { progress } = req.body;
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const enrollmentIdx = student.enrolledCourses.findIndex(
      e => (e.course ? e.course.toString() : e.toString()) === req.params.id
    );

    if (enrollmentIdx === -1) {
      return res.status(400).json({ message: "Not enrolled in this course" });
    }

    // Migrate to object if it's still a string ID
    if (!student.enrolledCourses[enrollmentIdx].course) {
      const courseId = student.enrolledCourses[enrollmentIdx];
      student.enrolledCourses[enrollmentIdx] = {
        course: courseId,
        progress: 0,
        completed: false
      };
    }

    const enrollment = student.enrolledCourses[enrollmentIdx];
    enrollment.progress = progress;

    if (progress >= 100 && !enrollment.completed) {
      enrollment.completed = true;
      enrollment.completionDate = new Date();
    }

    await student.save();
    res.json({ message: "Progress updated", enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit feedback/review for a course
// @route   POST /api/courses/:id/feedback
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const { rating, comment, isAnonymous } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const feedback = new Feedback({
      student: req.user._id,
      course: course._id,
      instructor: course.instructor,
      rating,
      comment,
      isAnonymous
    });

    await feedback.save();

    // Update Course rating and review count
    const allFeedbacks = await Feedback.find({ course: course._id });
    course.numReviews = allFeedbacks.length;
    course.rating = allFeedbacks.reduce((acc, f) => acc + f.rating, 0) / course.numReviews;
    await course.save();

    res.status(201).json({ message: "Feedback submitted", feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all reviews for a course
// @route   GET /api/courses/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ course: req.params.id })
      .populate('student', 'name profilePic')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get or issue a certificate
// @route   GET /api/courses/:id/certificate
router.get('/:id/certificate', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('user');
    const course = await Course.findById(req.params.id).populate('instructor', 'name');

    if (!student || !course) {
      return res.status(404).json({ message: "Information not found" });
    }

    const enrollment = student.enrolledCourses.find(
      e => (e.course ? e.course.toString() : e.toString()) === req.params.id
    );

    if (!enrollment || (enrollment.course ? !enrollment.completed : true)) {
      return res.status(400).json({ message: "Course not yet completed or not enrolled properly" });
    }

    let certificate = await Certificate.findOne({
      student: req.user._id,
      course: course._id
    });

    if (!certificate) {
      // Issue new certificate
      const certId = `CERT-${new Date().getTime()}-${req.user._id.toString().slice(-4)}`;
      certificate = new Certificate({
        student: req.user._id,
        course: course._id,
        certificateId: certId,
        data: {
          studentName: student.studentNameEnglish || req.user.name,
          courseTitle: course.title,
          instructorName: course.instructor?.name || 'Academic Board',
          completionDate: enrollment.completionDate || new Date()
        }
      });
      await certificate.save();
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;