import { Student, AttendanceRecord, PerformanceRecord, User, UserRole } from '../types';

// NoSQL-like Collection Wrapper
class DBCollection<T> {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  
  findAll(): T[] {
    return JSON.parse(localStorage.getItem(this.name) || '[]');
  }
  
  saveAll(data: T[]) {
    localStorage.setItem(this.name, JSON.stringify(data));
  }

  add(item: T) {
    const data = this.findAll();
    data.push(item);
    this.saveAll(data);
  }

  update(id: string, updatedItem: T) {
    const data = this.findAll();
    // @ts-ignore
    const index = data.findIndex(i => i.id === id || i.studentId === id); 
    // ^ Relaxed check for studentId matching in attendance/performance
    if (index >= 0) {
      data[index] = updatedItem;
      this.saveAll(data);
    } else {
      this.add(updatedItem);
    }
  }

  delete(id: string) {
    let data = this.findAll();
    // @ts-ignore
    data = data.filter(i => i.id !== id);
    this.saveAll(data);
  }
  
  // Custom query like Find in MongoDB
  find(predicate: (item: T) => boolean): T[] {
    return this.findAll().filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.findAll().find(predicate);
  }
}

// Define Collections
// Changing key names slightly to ensure fresh data load for this request without manual cache clear
const Users = new DBCollection<User>('edutrack_users_v2');
const Students = new DBCollection<Student>('edutrack_students_v2');
const Attendance = new DBCollection<AttendanceRecord>('edutrack_attendance_v2');
const Performance = new DBCollection<PerformanceRecord>('edutrack_performance_v2');
const AUTH_KEY = 'edutrack_current_session_v2';

// Seeder
const seedData = () => {
  // Only seed if empty
  if (Students.findAll().length === 0) {
    
    // 1. Create Student: Rahul Shah
    const rahul: Student = {
      id: 's-101',
      rollNumber: '101',
      name: 'Rahul Shah',
      course: 'BCA', // Assumed course based on context
      semester: 3,
      email: 'rahul.shah@college.edu',
      phone: '9876543210'
    };
    Students.saveAll([rahul]);

    // 2. Create Users (Admin, Teacher, and Rahul)
    const defaultUsers: User[] = [
      { id: 'u-admin', username: 'admin', password: 'password', name: 'System Admin', role: UserRole.ADMIN, email: 'admin@college.edu' },
      { id: 'u-teacher', username: 'teacher', password: 'password', name: 'Prof. Sharma', role: UserRole.TEACHER, email: 'teacher@college.edu', department: 'CS' },
      { id: 'u-student', username: 'rahul', password: 'password', name: 'Rahul Shah', role: UserRole.STUDENT, email: 'rahul.shah@college.edu', studentId: 's-101' }
    ];
    Users.saveAll(defaultUsers);

    // 3. Create Attendance (14/20 = 70%)
    const attRecord: AttendanceRecord = {
      id: 'a-s-101',
      studentId: 's-101',
      totalLectures: 20,
      lecturesAttended: 14,
      lastUpdated: new Date().toISOString()
    };
    Attendance.saveAll([attRecord]);

    // 4. Create Performance (Marks: 72 -> Average)
    const perfRecord: PerformanceRecord = {
      id: 'p-s-101',
      studentId: 's-101',
      subject: 'Core Computing',
      marksObtained: 72,
      totalMarks: 100,
      remark: 'Average', // 50-74 Range
      isAiGenerated: false
    };
    Performance.saveAll([perfRecord]);
  }
};

seedData();

export const dataService = {
  // Students
  getStudents: () => Students.findAll(),
  addStudent: (student: Student) => {
    Students.add(student);
    // Create login for student automatically for convenience
    const username = student.name.split(' ')[0].toLowerCase();
    Users.add({
      id: `u-${student.id}`,
      username: username,
      password: 'password', // Default password
      name: student.name,
      role: UserRole.STUDENT,
      email: student.email,
      studentId: student.id
    });
  },
  deleteStudent: (id: string) => {
    Students.delete(id);
    Attendance.delete(`a-${id}`); 
    Performance.delete(`p-${id}`);
    const user = Users.findOne(u => u.studentId === id);
    if(user) Users.delete(user.id);
  },

  // Teachers (Managed by Admin)
  getTeachers: () => Users.find(u => u.role === UserRole.TEACHER),
  addTeacher: (teacher: User) => Users.add(teacher),
  updateTeacher: (teacher: User) => Users.update(teacher.id, teacher),
  deleteTeacher: (id: string) => Users.delete(id),

  // Attendance
  getAttendance: () => Attendance.findAll(),
  updateAttendance: (record: AttendanceRecord) => Attendance.update(record.id, record),

  // Performance
  getPerformance: () => Performance.findAll(),
  updatePerformance: (record: PerformanceRecord) => Performance.update(record.id, record),

  // Auth
  login: (username: string, password: string): User | null => {
    const user = Users.findOne(u => u.username === username && u.password === password);
    if (user) {
      // Don't store password in session
      const sessionUser = { ...user };
      delete sessionUser.password;
      localStorage.setItem(AUTH_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    }
    return null;
  },

  getCurrentUser: (): User | null => {
    const u = localStorage.getItem(AUTH_KEY);
    return u ? JSON.parse(u) : null;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  }
};