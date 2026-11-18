(function () {
  const KEY = "edusphere.state.v2";

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 9);
  }

  function semesterName(n) {
    const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
    return n + suffix + " Semester";
  }

  function grade(pct) {
    if (pct >= 85) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 75) return "B+";
    if (pct >= 70) return "B";
    if (pct >= 65) return "C+";
    if (pct >= 60) return "C";
    if (pct >= 50) return "D";
    return "F";
  }

  function seed() {
    const departments = [
      { id: "d-cs", name: "Computer Science", code: "CS", head: "Dr. Ahmed Khan" }
    ];

    const programs = [
      { id: "p-bscs", name: "BS Computer Science", code: "BSCS", departmentId: "d-cs", duration: "4 years" }
    ];

    const academicYears = [
      { id: "ay-2627", label: "2026–2027", status: "Active" },
      { id: "ay-2526", label: "2025–2026", status: "Archived" }
    ];

    const semesterNumbers = [1, 3, 6, 7];
    const semesters = semesterNumbers.map(function (n) {
      return { id: "sem-" + n, number: n, name: semesterName(n), academicYearId: "ay-2627" };
    });

    const shiftCodes = { Morning: "T", Evening: "E" };
    const sections = [];
    semesterNumbers.forEach(function (number) {
      ["Morning", "Evening"].forEach(function (shift) {
        for (let i = 1; i <= 4; i++) {
          const code = shiftCodes[shift] + i;
          sections.push({
            id: "sec-cs" + number + "-" + code.toLowerCase(),
            name: code,
            departmentId: "d-cs",
            programId: "p-bscs",
            semesterId: "sem-" + number,
            academicYearId: "ay-2627",
            shift: shift,
            room: (shift === "Morning" ? "M" : "E") + "-" + (number * 100 + i),
            capacity: 30,
            classTeacherId: ""
          });
        }
      });
    });

    const courseData = {
      1: [
        ["cs-101", "CS-101", "Introduction to Computing", 3],
        ["cs-102", "CS-102", "Programming Fundamentals", 4],
        ["cs-103", "CS-103", "Digital Logic Design", 3],
        ["mt-101", "MTH-101", "Calculus I", 3],
        ["en-101", "ENG-101", "Communication Skills", 2]
      ],
      3: [
        ["cs-301", "CS-301", "Data Structures", 4],
        ["cs-302", "CS-302", "Database Systems", 4],
        ["cs-303", "CS-303", "Computer Organization", 3],
        ["cs-304", "CS-304", "Discrete Mathematics", 3],
        ["cs-305", "CS-305", "Object-Oriented Programming", 3]
      ],
      6: [
        ["cs-601", "CS-601", "Operating Systems", 4],
        ["cs-602", "CS-602", "Computer Networks", 4],
        ["cs-603", "CS-603", "Software Engineering", 3],
        ["cs-604", "CS-604", "Artificial Intelligence", 3],
        ["cs-605", "CS-605", "Database Administration", 3]
      ],
      7: [
        ["cs-701", "CS-701", "Distributed Systems", 4],
        ["cs-702", "CS-702", "Cloud Computing", 3],
        ["cs-703", "CS-703", "Machine Learning", 4],
        ["cs-704", "CS-704", "Cyber Security", 3],
        ["cs-705", "CS-705", "Capstone Project", 3]
      ]
    };

    const courses = [];
    Object.keys(courseData).forEach(function (number) {
      courseData[number].forEach(function (c) {
        courses.push({
          id: c[0], code: c[1], name: c[2], credits: c[3],
          departmentId: "d-cs", programId: "p-bscs", semesterId: "sem-" + number
        });
      });
    });

    const teacherNames = [
      "Dr. Ahmed Khan", "Prof. Sarah Ali", "Dr. Kamran Hussain", "Ms. Ayesha Siddiqui",
      "Mr. Bilal Ahmed", "Ms. Fatima Noor", "Dr. Usman Tariq", "Ms. Hina Shahid",
      "Mr. Arslan Nawaz", "Ms. Nida Rehman", "Dr. Sana Iqbal", "Mr. Hamza Yousaf",
      "Ms. Mehwish Naveed", "Mr. Omar Farooq", "Ms. Rabia Sattar", "Dr. Zain Abbas",
      "Ms. Komal Shafique", "Mr. Tayyab Riaz", "Ms. Sadia Mansoor", "Mr. Adnan Saeed"
    ];
    const designations = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"];
    const teachers = teacherNames.map(function (name, i) {
      return {
        id: "t-" + String(i + 1).padStart(2, "0"),
        name: name,
        employeeId: "EMP-" + (2001 + i),
        email: name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.+|\.+$/g, "") + "@edusphere.edu",
        phone: "+92 300 67" + String(1000 + i),
        departmentId: "d-cs",
        designation: designations[i % designations.length],
        status: "Active",
        joinDate: (2016 + (i % 8)) + "-09-01",
        address: "EduSphere University, Main Campus",
        photo: ""
      };
    });

    const firstNames = [
      "Ali", "Sana", "Usman", "Ayesha", "Hamza", "Hina", "Bilal", "Mehwish", "Omar", "Rabia",
      "Zain", "Komal", "Arslan", "Nida", "Kamran", "Sadia", "Tayyab", "Ambreen", "Faisal", "Iram",
      "Adnan", "Naila", "Shayan", "Sumaira", "Waleed", "Farah", "Assad", "Areeba", "Junaid", "Saima",
      "Moiz", "Yasmin", "Rehan", "Qurat", "Daniyal", "Mahnoor", "Imran", "Saba", "Ashir", "Rida",
      "Mudassir", "Amina", "Raza", "Bushra", "Farhan", "Iqra", "Salman", "Kiran", "Umair", "Noshaba"
    ];
    const lastNames = [
      "Raza", "Iqbal", "Tariq", "Malik", "Yousaf", "Shahid", "Awais", "Naveed", "Farooq", "Sattar",
      "Abbas", "Shafique", "Nawaz", "Rehman", "Akbar", "Mansoor", "Riaz", "Zahoor", "Noman", "Bashir",
      "Saeed", "Ayub", "Qureshi", "Perveen", "Iqbal", "Deeba", "Hussain", "Khan", "Latif", "Ahmad"
    ];
    constStudentBirthYear = { 1: 2007, 3: 2006, 6: 2004, 7: 2003 };
    const admissionDate = { 1: "2026-09-01", 3: "2025-09-01", 6: "2024-09-01", 7: "2023-09-01" };

    const students = [];
    let studentIndex = 0;
    sections.forEach(function (section, sectionIndex) {
      const count = 25 + (sectionIndex % 6);
      const semesterNumber = Number(section.semesterId.replace("sem-", ""));
      for (let i = 0; i < count; i++) {
        const first = firstNames[studentIndex % firstNames.length];
        const last = lastNames[(studentIndex * 7) % lastNames.length];
        const father = lastNames[(studentIndex * 3 + 4) % lastNames.length];
        const code = section.name;
        const rollNo = "CS-" + semesterNumber + "-" + code + "-" + String(i + 1).padStart(3, "0");
        const id = "s-" + section.id.slice(4) + "-" + (i + 1);
        students.push({
          id: id,
          rollNo: rollNo,
          name: first + " " + last,
          fatherName: father + " " + last,
          email: (first + "." + last + "." + rollNo.replace(/-/g, "")).toLowerCase() + "@student.edusphere.edu",
          phone: "+92 3" + (10 + (studentIndex % 20)) + " " + String(1000000 + studentIndex * 137).slice(0, 7),
          dob: constStudentBirthYear[semesterNumber] + "-" + String(1 + (studentIndex % 12)).padStart(2, "0") + "-" + String(1 + (studentIndex % 27)).padStart(2, "0"),
          gender: studentIndex % 2 === 0 ? "M" : "F",
          photo: "",
          address: "Hostel Block " + String.fromCharCode(65 + (studentIndex % 4)) + ", EduSphere University",
          departmentId: section.departmentId,
          programId: section.programId,
          academicYearId: section.academicYearId,
          semesterId: section.semesterId,
          sectionId: section.id,
          admissionDate: admissionDate[semesterNumber],
          status: "Active",
          deleted: false
        });
        studentIndex++;
      }
    });

    const teacherAssignments = [];
    const timetable = [];
    const busyTeachers = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const slotsByShift = {
      Morning: [["08:30", "09:30"], ["09:45", "10:45"], ["11:00", "12:00"], ["12:15", "13:15"]],
      Evening: [["14:00", "15:00"], ["15:15", "16:15"], ["16:30", "17:30"], ["17:45", "18:45"]]
    };

    sections.forEach(function (section, sectionIndex) {
      const sectionCourses = courses.filter(function (c) {
        return c.programId === section.programId && c.semesterId === section.semesterId;
      });
      days.forEach(function (day, dayIndex) {
        slotsByShift[section.shift].forEach(function (slot, slotIndex) {
          const course = sectionCourses[(dayIndex + slotIndex + sectionIndex) % sectionCourses.length];
          let teacherIndex = (sectionIndex * 3 + dayIndex * 2 + slotIndex) % teachers.length;
          let teacher = teachers[teacherIndex];
          let guard = 0;
          while (busyTeachers[teacher.id + "|" + day + "|" + slot[0]] && guard < teachers.length) {
            teacherIndex = (teacherIndex + 1) % teachers.length;
            teacher = teachers[teacherIndex];
            guard++;
          }
          busyTeachers[teacher.id + "|" + day + "|" + slot[0]] = true;
          timetable.push({
            id: uid("tt"),
            sectionId: section.id,
            day: day,
            start: slot[0],
            end: slot[1],
            courseId: course.id,
            teacherId: teacher.id,
            room: section.room
          });
          const exists = teacherAssignments.some(function (a) {
            return a.teacherId === teacher.id && a.courseId === course.id && a.sectionId === section.id;
          });
          if (!exists) {
            teacherAssignments.push({
              id: uid("ta"),
              teacherId: teacher.id,
              courseId: course.id,
              sectionId: section.id,
              semesterId: section.semesterId,
              academicYearId: section.academicYearId
            });
          }
        });
      });
      const firstAssignment = teacherAssignments.find(function (a) { return a.sectionId === section.id; });
      section.classTeacherId = firstAssignment ? firstAssignment.teacherId : teachers[sectionIndex % teachers.length].id;
    });

    const attendance = [];
    sections.forEach(function (section, sectionIndex) {
      const sectionStudents = students.filter(function (s) { return s.sectionId === section.id; });
      const sectionCourses = courses.filter(function (c) { return c.semesterId === section.semesterId; });
      for (let k = 0; k < 4; k++) {
        const course = sectionCourses[k % sectionCourses.length];
        const assignment = teacherAssignments.find(function (a) {
          return a.sectionId === section.id && a.courseId === course.id;
        });
        const date = "2026-11-" + String(10 + k * 3).padStart(2, "0");
        attendance.push({
          id: "att-" + section.id + "-" + k,
          sectionId: section.id,
          courseId: course.id,
          date: date,
          lecture: "Lecture " + (k + 1),
          teacherId: assignment ? assignment.teacherId : teachers[0].id,
          records: sectionStudents.map(function (s, i) {
            const n = (i + sectionIndex + k * 3) % 17;
            let status = n === 0 ? "Leave" : n < 3 ? "Absent" : n < 5 ? "Late" : "Present";
            if (i < 2 && sectionIndex % 3 === 0) status = "Absent";
            return { studentId: s.id, status: status };
          }),
          submittedAt: date + " 16:00",
          locked: true
        });
      }
    });

    const assignmentTitles = {
      1: ["Introduction Lab Worksheet", "Programming Fundamentals Practice"],
      3: ["Data Structures Lab 04", "Database Normalization Exercise"],
      6: ["Operating Systems Scheduler", "Network Configuration Task"],
      7: ["Machine Learning Dataset Report", "Capstone Proposal Draft"]
    };
    const assignments = [];
    sections.forEach(function (section, sectionIndex) {
      const sectionCourses = courses.filter(function (c) { return c.semesterId === section.semesterId; });
      const sectionStudents = students.filter(function (s) { return s.sectionId === section.id; });
      sectionCourses.slice(0, 2).forEach(function (course, courseIndex) {
        const assignment = teacherAssignments.find(function (a) {
          return a.sectionId === section.id && a.courseId === course.id;
        });
        assignments.push({
          id: "as-" + section.id + "-" + courseIndex,
          teacherId: assignment ? assignment.teacherId : teachers[0].id,
          courseId: course.id,
          sectionId: section.id,
          title: assignmentTitles[section.semesterId.replace("sem-", "")][courseIndex],
          description: "Complete the task using the course material and submit a concise report with your name and roll number.",
          dueDate: "2026-11-" + String(20 + ((sectionIndex + courseIndex) % 8)).padStart(2, "0"),
          marks: 10,
          submissions: sectionStudents.slice(0, 3 + courseIndex).map(function (s, i) {
            return {
              studentId: s.id,
              response: "Demo submission for " + course.code + ".",
              submittedAt: "2026-11-1" + (i % 6) + " 12:30",
              status: "Submitted",
              marks: undefined,
              feedback: ""
            };
          })
        });
      });
    });

    const quizBank = [
      { text: "Which data structure follows LIFO?", options: ["Queue", "Stack", "Linked List", "Tree"], answer: 1 },
      { text: "What is the base case in recursion?", options: ["First call", "Stopping condition", "Loop body", "Return type"], answer: 1 },
      { text: "Which traversal visits the root first?", options: ["In-order", "Post-order", "Pre-order", "Level-order"], answer: 2 }
    ];
    const quizzes = [];
    sections.forEach(function (section, sectionIndex) {
      const sectionCourses = courses.filter(function (c) { return c.semesterId === section.semesterId; });
      const course = sectionCourses[sectionIndex % sectionCourses.length];
      const assignment = teacherAssignments.find(function (a) {
        return a.sectionId === section.id && a.courseId === course.id;
      });
      const quiz = {
        id: "qz-" + section.id,
        teacherId: assignment ? assignment.teacherId : teachers[0].id,
        courseId: course.id,
        sectionId: section.id,
        title: course.name + " – Quiz",
        marks: 10,
        duration: 15,
        attempts: [],
        questions: quizBank.map(function (q, i) {
          return { id: "q" + (i + 1), text: q.text, options: q.options.slice(), answer: q.answer };
        })
      };
      if (sectionIndex < 4) {
        const firstStudent = students.find(function (s) { return s.sectionId === section.id; });
        if (firstStudent) quiz.attempts.push({ studentId: firstStudent.id, score: 7 + (sectionIndex % 4), submittedAt: "2026-11-16 10:30" });
      }
      quizzes.push(quiz);
    });

    function makeEntries(sectionId, offset) {
      return students.filter(function (s) { return s.sectionId === sectionId; }).map(function (s, i) {
        const a = 7 + ((i + offset) % 4);
        const q = 6 + ((i + offset + 1) % 5);
        const m = 21 + ((i + offset) % 10);
        const f = 34 + ((i + offset + 2) % 15);
        const total = a + q + m + f;
        return {
          studentId: s.id, assignment: a, quiz: q, midterm: m, final: f,
          total: total, percentage: total, grade: grade(total),
          remarks: total >= 70 ? "Satisfactory" : "Needs improvement"
        };
      });
    }

    const results = [];
    sections.forEach(function (section, sectionIndex) {
      const course = courses.filter(function (c) { return c.semesterId === section.semesterId; })[0];
      const assignment = teacherAssignments.find(function (a) {
        return a.sectionId === section.id && a.courseId === course.id;
      });
      let status = "Draft";
      if (section.semesterId === "sem-1") status = "Published";
      else if (section.semesterId === "sem-3") status = "Submitted";
      else if (section.semesterId === "sem-6") status = sectionIndex % 2 === 0 ? "Draft" : "Under Review";
      results.push({
        id: "res-" + section.id,
        courseId: course.id,
        sectionId: section.id,
        semesterId: section.semesterId,
        teacherId: assignment ? assignment.teacherId : teachers[0].id,
        status: status,
        submittedAt: status === "Draft" ? "" : "2026-11-1" + ((sectionIndex % 8) + 1) + " 11:20",
        reviewedBy: status === "Published" ? "Principal Office" : "",
        approvedAt: status === "Published" ? "2026-11-18 10:00" : "",
        publishedAt: status === "Published" ? "2026-11-19 09:00" : "",
        remarks: status === "Published" ? "Approved for publication" : "",
        entries: makeEntries(section.id, sectionIndex)
      });
    });

    const announcements = [
      { id: "an-1", title: "Midterm Examination Schedule", message: "Midterm examinations will begin on 24 November 2026. Roll number slips will be issued through class sections.", audience: { type: "all", value: "" }, author: "Principal Office", createdAt: "2026-11-16 09:15" },
      { id: "an-2", title: "CS-301 Lab Slot Change", message: "The CS-301 lab for Morning section T1 has been moved to Wednesday, 11:15 AM in Lab A-2.", audience: { type: "section", value: "sec-cs3-t1" }, author: "Dr. Ahmed Khan", createdAt: "2026-11-15 13:40" },
      { id: "an-3", title: "Library Timing Update", message: "The central library will remain open until 8:00 PM during examination week.", audience: { type: "all", value: "" }, author: "Principal Office", createdAt: "2026-11-12 10:05" },
      { id: "an-4", title: "Assignment Submission Reminder", message: "Please submit all pending CS-101 assignments before 25 November 2026.", audience: { type: "section", value: "sec-cs1-t1" }, author: "Dr. Ahmed Khan", createdAt: "2026-11-10 16:20" }
    ];

    const messages = [
      { id: "m-1", fromRole: "teacher", fromId: "t-01", toRole: "student", toId: "s-cs1-t1-1", subject: "Regarding your lab submission", body: "Please revise the programming worksheet and resubmit before the weekend.", sentAt: "2026-11-16 11:05", read: false },
      { id: "m-2", fromRole: "student", fromId: "s-cs1-t1-2", toRole: "teacher", toId: "t-01", subject: "Question about midterm syllabus", body: "Sir, please confirm whether the recursion chapter is included in the midterm.", sentAt: "2026-11-15 17:30", read: false },
      { id: "m-3", fromRole: "teacher", fromId: "t-02", toRole: "student", toId: "s-cs3-e1-1", subject: "Data structures feedback", body: "Good work. Please add comments to the recursive function.", sentAt: "2026-11-14 12:00", read: true },
      { id: "m-4", fromRole: "principal", fromId: "principal", toRole: "teacher", toId: "t-01", subject: "Result submission timeline", body: "Kindly submit the CS-301 class result by 20 November 2026.", sentAt: "2026-11-13 08:45", read: false }
    ];

    return {
      version: 2,
      institution: {
        name: "EduSphere University",
        shortName: "EduSphere LMS",
        address: "Main Campus, Education City, Pakistan",
        email: "registrar@edusphere.edu",
        phone: "+92 300 1234567",
        currentTerm: "Fall 2026"
      },
      demo: { role: "principal", teacherId: "t-01", studentId: "s-cs1-t1-1" },
      departments: departments,
      programs: programs,
      academicYears: academicYears,
      semesters: semesters,
      sections: sections,
      courses: courses,
      teachers: teachers,
      students: students,
      teacherAssignments: teacherAssignments,
      timetable: timetable,
      attendance: attendance,
      correctionRequests: [
        {
          id: "cr-1", attendanceId: "att-sec-cs1-t1-0", studentId: "s-cs1-t1-4",
          requestedBy: "t-01", reason: "Power failure affected the first ten minutes of the lecture.",
          status: "Pending", requestedAt: "2026-11-13 09:20", reviewedBy: "", reviewRemarks: "", reviewedAt: "", proposedStatus: "Present"
        }
      ],
      assignments: assignments,
      quizzes: quizzes,
      results: results,
      announcements: announcements,
      messages: messages,
      examSchedule: [
        { id: "ex-1", examType: "Midterm", courseId: "cs-301", sectionId: "sec-cs3-t1", date: "2026-11-24", startTime: "09:00", endTime: "11:00", room: "M-301" },
        { id: "ex-2", examType: "Midterm", courseId: "cs-302", sectionId: "sec-cs3-e1", date: "2026-11-25", startTime: "14:00", endTime: "16:00", room: "E-301" },
        { id: "ex-3", examType: "Final", courseId: "cs-601", sectionId: "sec-cs6-e1", date: "2026-12-16", startTime: "14:00", endTime: "17:00", room: "E-601" }
      ],
      notifications: [
        { id: "n-1", title: "CS-301 result submitted", message: "Dr. Ahmed Khan submitted the Morning T1 class result for review.", type: "Result Approval", role: "principal", userId: "", read: false, createdAt: "2026-11-14 11:22" },
        { id: "n-2", title: "Attendance below threshold", message: "Several students in Morning T1 sections are below the attendance threshold.", type: "Attendance Warning", role: "principal", userId: "", read: false, createdAt: "2026-11-16 08:30" },
        { id: "n-3", title: "New assignment", message: "Introduction Lab Worksheet is due on 20 Nov 2026.", type: "New Assignment", role: "student", userId: "s-cs1-t1-1", read: false, createdAt: "2026-11-16 10:00" },
        { id: "n-4", title: "Timetable change", message: "The CS-301 lab for Morning T1 has moved to Wednesday 11:15.", type: "Timetable Change", role: "student", userId: "s-cs1-t1-1", read: true, createdAt: "2026-11-15 13:42" }
      ],
      settings: {
        institution: {
          name: "EduSphere University",
          shortName: "EduSphere LMS",
          address: "Main Campus, Education City, Pakistan",
          email: "registrar@edusphere.edu",
          phone: "+92 300 1234567",
          currentTerm: "Fall 2026"
        },
        attendanceThreshold: 75,
        academicYearLabel: "2026–2027",
        maxSemester: 7,
        grading: {
          maximumMarks: { assignment: 10, quiz: 10, midterm: 40, final: 40 },
          thresholds: [
            { min: 85, grade: "A+", gpa: 4.0 },
            { min: 80, grade: "A", gpa: 4.0 },
            { min: 75, grade: "B+", gpa: 3.5 },
            { min: 70, grade: "B", gpa: 3.0 },
            { min: 65, grade: "C+", gpa: 2.5 },
            { min: 60, grade: "C", gpa: 2.0 },
            { min: 50, grade: "D", gpa: 1.0 },
            { min: 0, grade: "F", gpa: 0.0 }
          ]
        },
        notificationPreferences: {
          assignment: true, quiz: true, result: true, attendance: true, announcement: true
        },
        theme: "light"
      },
      events: [
        { id: "ev-1", title: "Midterm Examinations", date: "2026-11-24", type: "Examination" },
        { id: "ev-2", title: "Faculty Meeting", date: "2026-11-27", type: "Meeting" },
        { id: "ev-3", title: "Assignment Deadline – CS-101", date: "2026-11-28", type: "Deadline" },
        { id: "ev-4", title: "Semester Review Day", date: "2026-12-05", type: "Academic" }
      ],
      activities: [
        { id: uid("ac"), icon: "fa-check", text: "CS-301 result submitted for review", time: "2026-11-14 11:20" },
        { id: uid("ac"), icon: "fa-user-graduate", text: "Student records verified for Fall 2026", time: "2026-11-13 15:10" },
        { id: uid("ac"), icon: "fa-calendar-check", text: "Attendance submitted for CS-101, Morning T1", time: "2026-11-19 16:00" },
        { id: uid("ac"), icon: "fa-bullhorn", text: "Midterm examination notice published", time: "2026-11-16 09:15" }
      ]
    };
  }

  function normalize(seedState, parsed) {
    const defaults = seedState || seed();
    if (!parsed || parsed.version !== 2) return defaults;
    ["departments", "programs", "academicYears", "semesters", "sections", "courses", "teachers",
      "students", "teacherAssignments", "timetable", "attendance", "correctionRequests",
      "assignments", "quizzes", "results", "announcements", "messages", "events",
      "examSchedule", "notifications", "activities"].forEach(function (key) {
        if (!Array.isArray(parsed[key])) parsed[key] = defaults[key] ? defaults[key].slice() : [];
      });
      if (!parsed.settings) parsed.settings = defaults.settings;
      else {
        parsed.settings.institution = Object.assign({}, defaults.settings.institution, parsed.settings.institution || {});
        parsed.settings.grading = Object.assign({}, defaults.settings.grading, parsed.settings.grading || {});
        parsed.settings.grading.maximumMarks = Object.assign({}, defaults.settings.grading.maximumMarks, (parsed.settings.grading.maximumMarks || {}));
        if (!Array.isArray(parsed.settings.grading.thresholds) || !parsed.settings.grading.thresholds.length) {
          parsed.settings.grading.thresholds = defaults.settings.grading.thresholds;
        }
        parsed.settings.notificationPreferences = Object.assign({}, defaults.settings.notificationPreferences, parsed.settings.notificationPreferences || {});
      }
      if (!parsed.demo) parsed.demo = defaults.demo;
      return parsed;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      return normalize(seed(), JSON.parse(raw));
    } catch (err) {
      return seed();
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Demo data could not be saved.", err);
    }
  }

  function byId(collection, id) {
    return (state[collection] || []).find(function (item) { return item.id === id; }) || null;
  }

  const data = {
    grade: grade,
    department: function (id) { return byId("departments", id); },
    program: function (id) { return byId("programs", id); },
    semester: function (id) { return byId("semesters", id); },
    year: function (id) { return byId("academicYears", id); },
    section: function (id) { return byId("sections", id); },
    course: function (id) { return byId("courses", id); },
    teacher: function (id) { return byId("teachers", id); },
    student: function (id) { return byId("students", id); },
    activeStudents: function () {
      return state.students.filter(function (s) { return !s.deleted; });
    },
    studentsInSection: function (sectionId, includeDeleted) {
      return state.students.filter(function (s) {
        return s.sectionId === sectionId && (includeDeleted ? true : !s.deleted);
      });
    },
    sectionsFor: function (departmentId, programId, semesterId) {
      return state.sections.filter(function (s) {
        return (!departmentId || s.departmentId === departmentId) &&
          (!programId || s.programId === programId) &&
          (!semesterId || s.semesterId === semesterId);
      });
    },
    coursesFor: function (programId, semesterId) {
      return state.courses.filter(function (c) {
        return (!programId || c.programId === programId) && (!semesterId || c.semesterId === semesterId);
      });
    },
    programLabel: function (id) {
      const p = data.program(id);
      return p ? p.code : "—";
    },
    semesterLabel: function (id) {
      const s = data.semester(id);
      return s ? s.name : "—";
    },
    sectionLabel: function (id, full) {
      const s = data.section(id);
      if (!s) return "—";
      const d = data.department(s.departmentId);
      const p = data.program(s.programId);
      const sem = data.semester(s.semesterId);
      const name = s.shift ? s.shift + " " + s.name : s.name;
      return full
        ? [d ? d.code : "", p ? p.code : "", sem ? sem.name : "", name].filter(Boolean).join(" · ")
        : name;
    },
    assignmentsForTeacher: function (teacherId) {
      return state.teacherAssignments.filter(function (a) { return a.teacherId === teacherId; });
    },
    resultFor: function (sectionId, courseId) {
      return state.results.find(function (r) { return r.sectionId === sectionId && r.courseId === courseId; }) || null;
    },
    log: function (text, icon) {
      data.audit(text, ES.data.demoRoleName ? ES.data.demoRoleName() : "Principal Office", "", text, icon);
    },
    audit: function (action, user, related, description, icon) {
      const now = new Date();
      state.activities.unshift({
        id: uid("ac"), action: action, user: user || "Demo user", related: related || "—",
        description: description || action, icon: icon || "fa-circle-info",
        date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5),
        text: description || action, at: now.toISOString().slice(0, 16).replace("T", " ")
      });
      state.activities = state.activities.slice(0, 80);
    },
    demoRoleName: function () {
      const role = (state.demo && state.demo.role) || "principal";
      if (role === "teacher") {
        const t = data.teacher(state.demo.teacherId);
        return t ? t.name : "Teacher";
      }
      if (role === "student") {
        const s = data.student(state.demo.studentId);
        return s ? s.name : "Student";
      }
      return "Principal Office";
    },
    settings: function () { return state.settings; },
    saveSettings: function (fn) { fn(state.settings); save(); },
    grading: function () { return state.settings.grading; },
    threshold: function () { return Number(state.settings.attendanceThreshold) || 75; },
    gradeForPercentage: function (pct) {
      const list = (state.settings.grading.thresholds || []).slice().sort(function (a, b) { return b.min - a.min; });
      const match = list.find(function (t) { return pct >= Number(t.min); });
      return match || { grade: "F", gpa: 0, min: 0 };
    },
    evaluate: function (entry) {
      const limits = state.settings.grading.maximumMarks;
      const keys = ["assignment", "quiz", "midterm", "final"];
      const missing = [];
      const invalid = [];
      let total = 0;
      let maximum = 0;
      keys.forEach(function (key) {
        const raw = entry ? entry[key] : undefined;
        const num = Number(raw);
        const limit = Number(limits[key]);
        maximum += limit;
        if (raw === undefined || raw === null || raw === "" || !isFinite(num)) missing.push(key);
        else {
          if (num < 0 || num > limit) invalid.push(key);
          total += num;
        }
      });
      const percentage = maximum ? Math.round((total / maximum) * 100) : 0;
      const scale = data.gradeForPercentage(percentage);
      return {
        total: total, maximum: maximum, percentage: percentage,
        grade: scale.grade || "F", gpa: Number(scale.gpa) || 0,
        complete: missing.length === 0 && invalid.length === 0,
        missing: missing, invalid: invalid
      };
    },
    teacherSectionIds: function (teacherId) {
      const ids = state.teacherAssignments.filter(function (a) { return a.teacherId === teacherId; }).map(function (a) { return a.sectionId; });
      return ids.filter(function (id, i) { return ids.indexOf(id) === i; });
    },
    teacherAssignmentsFor: function (teacherId, sectionId) {
      return state.teacherAssignments.filter(function (a) {
        return a.teacherId === teacherId && (!sectionId || a.sectionId === sectionId);
      });
    },
    coursesForSection: function (sectionId) {
      const section = data.section(sectionId);
      if (!section) return [];
      return state.courses.filter(function (c) {
        return c.programId === section.programId && c.semesterId === section.semesterId;
      });
    },
    timetableFor: function (sectionId, teacherId) {
      const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
      return state.timetable.filter(function (t) {
        return (!sectionId || t.sectionId === sectionId) && (!teacherId || t.teacherId === teacherId);
      }).sort(function (a, b) {
        return (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9) || a.start.localeCompare(b.start);
      });
    },
    attendanceFor: function (sectionId, courseId) {
      return state.attendance.filter(function (a) {
        return (!sectionId || a.sectionId === sectionId) && (!courseId || a.courseId === courseId);
      }).sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    },
    attendanceStats: function (studentId, courseId) {
      const student = data.student(studentId);
      if (!student) return { present: 0, absent: 0, late: 0, leave: 0, total: 0, percentage: 0 };
      const tally = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
      state.attendance.forEach(function (record) {
        if (record.sectionId !== student.sectionId || (courseId && record.courseId !== courseId)) return;
        const entry = (record.records || []).find(function (r) { return r.studentId === studentId; });
        if (!entry) return;
        tally.total++;
        const key = String(entry.status || "").toLowerCase();
        if (tally[key] !== undefined) tally[key]++;
      });
      tally.percentage = tally.total ? Math.round(((tally.present + tally.late) / tally.total) * 100) : 0;
      return tally;
    },
    lowAttendanceStudents: function (sectionId) {
      const threshold = data.threshold();
      return state.students.filter(function (s) {
        return !s.deleted && (!sectionId || s.sectionId === sectionId) && data.attendanceStats(s.id).percentage < threshold;
      });
    },
    resultEntriesForStudent: function (studentId, publishedOnly) {
      const out = [];
      state.results.forEach(function (result) {
        if (publishedOnly && result.status !== "Published") return;
        const entry = (result.entries || []).find(function (e) { return e.studentId === studentId; });
        if (entry) out.push({ result: result, entry: entry, course: data.course(result.courseId) });
      });
      return out;
    },
    notificationsFor: function (role, userId) {
      return state.notifications.filter(function (n) {
        return n.role === role && (!n.userId || !userId || n.userId === userId);
      }).sort(function (a, b) { return (b.createdAt || "").localeCompare(a.createdAt || ""); });
    },
    unreadCount: function (role, userId) {
      return data.notificationsFor(role, userId).filter(function (n) { return !n.read; }).length;
    },
    notify: function (config) {
      const prefs = state.settings.notificationPreferences || {};
      const typeKey = String(config.type || "").toLowerCase();
      if ((typeKey.indexOf("assignment") >= 0 && prefs.assignment === false) ||
          (typeKey.indexOf("quiz") >= 0 && prefs.quiz === false) ||
          (typeKey.indexOf("result") >= 0 && prefs.result === false) ||
          (typeKey.indexOf("attendance") >= 0 && prefs.attendance === false) ||
          (typeKey.indexOf("announcement") >= 0 && prefs.announcement === false)) return;
      state.notifications.unshift({
        id: uid("n"), title: config.title || "Notification", message: config.message || "",
        type: config.type || "General", role: config.role || "principal", userId: config.userId || "",
        read: false, createdAt: new Date().toISOString().slice(0, 16).replace("T", " ")
      });
    },
    messagesFor: function (role, id) {
      return state.messages.filter(function (m) {
        return (m.fromRole === role && m.fromId === id) || (m.toRole === role && m.toId === id);
      }).sort(function (a, b) { return (b.sentAt || "").localeCompare(a.sentAt || ""); });
    },
    eventsUpcoming: function (limit) {
      const upcoming = state.events.filter(function (e) { return e.date >= uiToday(); })
        .sort(function (a, b) { return a.date.localeCompare(b.date); });
      return limit ? upcoming.slice(0, limit) : upcoming;
    },
    sectionSummary: function (sectionId) {
      const students = data.studentsInSection(sectionId);
      const threshold = data.threshold();
      const low = students.filter(function (s) { return data.attendanceStats(s.id).percentage < threshold; }).length;
      const published = state.results.filter(function (r) { return r.sectionId === sectionId && r.status === "Published"; });
      return { students: students.length, lowAttendance: low, publishedResults: published.length, courses: data.coursesForSection(sectionId).length };
    },
    timetableConflicts: function (entry, ignoreId) {
      const conflicts = [];
      state.timetable.forEach(function (t) {
        if (t.id === ignoreId || t.day !== entry.day || t.start !== entry.start) return;
        if (entry.sectionId && t.sectionId === entry.sectionId) conflicts.push("Section already has a lecture at this time");
        if (entry.teacherId && t.teacherId === entry.teacherId) conflicts.push("Teacher is already assigned at this time");
      });
      const duplicate = state.timetable.some(function (t) {
        return t.id !== ignoreId && t.sectionId === entry.sectionId && t.courseId === entry.courseId && t.day === entry.day && t.start === entry.start && t.end === entry.end;
      });
      if (duplicate && !conflicts.length) conflicts.push("Duplicate timetable entry");
      return conflicts.filter(function (c, i, arr) { return arr.indexOf(c) === i; });
    },
    uniqueRoll: function (rollNo, ignoreId) {
      return !state.students.some(function (s) { return s.rollNo === String(rollNo) && s.id !== ignoreId; });
    }
  };

  function uiToday() { return new Date().toISOString().slice(0, 10); }

  window.ES = window.ES || {};
  ES.uid = uid;
  ES.store = {
    get state() { return state; },
    save: save,
    update: function (fn) { fn(state); save(); },
    reset: function () { state = seed(); save(); }
  };
  ES.data = data;
})();
