(function () {
  var FLAG = "edusphere.legacy.seed.v2";
  var state = window.ES && window.ES.store && window.ES.store.state;
  if (!state) return;

  function set(name, value) {
    localStorage.setItem(name, JSON.stringify(value));
  }

  function ordinal(number) {
    var suffixes = { 1: "st", 3: "rd" };
    return number + (suffixes[number] || "th") + " Semester";
  }

  function semesterNumber(semesterId) {
    return Number(String(semesterId).replace("sem-", ""));
  }

  function sectionById(id) {
    return state.sections.find(function (s) { return s.id === id; });
  }

  function classNameForSection(section) {
    if (!section) return "Unassigned";
    return "CS-" + semesterNumber(section.semesterId) + "-" + section.name;
  }

  function teacherById(id) {
    return state.teachers.find(function (t) { return t.id === id; });
  }

  function courseById(id) {
    return state.courses.find(function (c) { return c.id === id; });
  }

  function studentById(id) {
    return state.students.find(function (s) { return s.id === id; });
  }

  function dateDMY(value) {
    if (!value) return "17/11/2026";
    var parts = String(value).slice(0, 10).split("-");
    if (parts.length !== 3) return "17/11/2026";
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function cnic(index) {
    return "61101-" + String(1000000 + index * 7919).slice(0, 7) + "-" + String(index % 10);
  }

  var classes = state.sections.map(function (section) {
    return {
      name: classNameForSection(section),
      department: "Computer Science",
      semester: ordinal(semesterNumber(section.semesterId)),
      section: section.name + " (" + section.shift + ")"
    };
  });

  var students = state.students.map(function (student, index) {
    var section = sectionById(student.sectionId);
    return {
      rollNo: student.rollNo,
      name: student.name,
      email: student.email,
      phone: student.phone,
      cnic: cnic(index),
      className: classNameForSection(section),
      department: "Computer Science",
      semester: ordinal(semesterNumber(student.semesterId))
    };
  });

  var teachers = state.teachers.map(function (teacher) {
    var assignment = state.teacherAssignments.find(function (a) { return a.teacherId === teacher.id; });
    var course = assignment ? courseById(assignment.courseId) : null;
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      subject: course ? course.name : "Computer Science",
      qualification: teacher.designation || "Lecturer"
    };
  });

  var courses = state.courses.map(function (course) {
    var assignment = state.teacherAssignments.find(function (a) { return a.courseId === course.id; });
    var teacher = assignment ? teacherById(assignment.teacherId) : null;
    var section = assignment ? sectionById(assignment.sectionId) : null;
    var number = semesterNumber(course.semesterId);
    var semesterStudents = state.students.filter(function (s) { return s.semesterId === course.semesterId; });
    var sectionStudents = assignment ? state.students.filter(function (s) { return s.sectionId === assignment.sectionId; }) : semesterStudents;
    var semesterClasses = state.sections
      .filter(function (s) { return s.semesterId === course.semesterId; })
      .map(classNameForSection);
    return {
      code: course.code,
      name: course.name,
      teacher: teacher ? teacher.name : "",
      teacherId: teacher ? teacher.id : "",
      teacherEmail: teacher ? teacher.email : "",
      className: classNameForSection(section) || (semesterClasses[0] || ""),
      department: "Computer Science",
      credits: course.credits,
      semester: ordinal(number),
      students: sectionStudents.map(function (s) { return s.email; }),
      enrolledClasses: semesterClasses
    };
  });

  var assignments = state.assignments.map(function (assignment) {
    var course = courseById(assignment.courseId);
    var teacher = teacherById(assignment.teacherId);
    return {
      title: assignment.title,
      course: course ? course.code : "",
      teacher: teacher ? teacher.name : "",
      teacherId: teacher ? teacher.id : "",
      teacherEmail: teacher ? teacher.email : "",
      deadline: dateDMY(assignment.dueDate),
      marks: assignment.marks
    };
  });

  var results = [];
  state.results.forEach(function (result) {
    var course = courseById(result.courseId);
    var teacher = teacherById(result.teacherId);
    (result.entries || []).forEach(function (entry) {
      var student = studentById(entry.studentId);
      if (!student) return;
      results.push({
        studentName: student.name,
        studentEmail: student.email,
        course: course ? course.code : "",
        marks: entry.total,
        totalMarks: 100,
        grade: entry.grade,
        status: result.status === "Published" ? "Published" : "Pending",
        teacher: teacher ? teacher.name : "",
        teacherId: teacher ? teacher.id : "",
        teacherEmail: teacher ? teacher.email : ""
      });
    });
  });

  var announcements = state.announcements
    .filter(function (a) { return !/assignment/i.test(a.title + " " + a.message); })
    .map(function (a) {
      return { title: a.title, message: a.message, date: dateDMY(a.createdAt) };
    });

  var demoStudent = studentById(state.demo && state.demo.studentId) || students[0];
  var demoTeacher = teacherById(state.demo && state.demo.teacherId) || teachers[0];
  var users = [];
  if (demoTeacher) {
    users.push({ name: demoTeacher.name, email: demoTeacher.email, phone: demoTeacher.phone, role: "teacher", password: "teacher123" });
  }
  if (demoStudent) {
    users.push({ name: demoStudent.name, email: demoStudent.email, phone: demoStudent.phone, role: "student", password: "student123" });
  }

  set("classes", classes);
  set("students", students);
  set("teachers", teachers);
  set("courses", courses);
  set("assignments", assignments);
  set("results", results);
  set("announcements", announcements);
  set("users", users);
  set("profile", {
    name: "Admin",
    email: state.institution.email,
    phone: state.institution.phone
  });
  if (!localStorage.getItem("adminPassword")) localStorage.setItem("adminPassword", "admin123");
  localStorage.setItem(FLAG, "1");
})();
