import React, { useState } from 'react';
import { Student, UserRole, User, LanguageCode } from '../types';
import { dataService } from '../services/dataService';
import { COURSES, SEMESTERS, getTranslation } from '../constants';
import Button from '../components/Button';

interface StudentsProps {
  user: User;
  currentLang: LanguageCode;
}

const Students: React.FC<StudentsProps> = ({ user, currentLang }) => {
  const [students, setStudents] = useState<Student[]>(dataService.getStudents());
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterSem, setFilterSem] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    rollNumber: '', name: '', course: 'BCA', semester: 1, email: '', phone: ''
  });

  const filteredStudents = students.filter(s => {
    return (filterCourse === 'All' || s.course === filterCourse) &&
           (filterSem === 'All' || s.semester.toString() === filterSem);
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.rollNumber || !newStudent.name) return;
    
    const student: Student = {
        id: `s-${Date.now()}`,
        rollNumber: newStudent.rollNumber!,
        name: newStudent.name!,
        course: newStudent.course || 'BCA',
        semester: Number(newStudent.semester) || 1,
        email: newStudent.email || '',
        phone: newStudent.phone || ''
    };
    
    dataService.addStudent(student);
    setStudents(dataService.getStudents());
    setIsModalOpen(false);
    setNewStudent({ rollNumber: '', name: '', course: 'BCA', semester: 1, email: '', phone: '' });
  };

  const handleDelete = (id: string) => {
    if(confirm('Are you sure? This will delete related attendance and performance data.')) {
        dataService.deleteStudent(id);
        setStudents(dataService.getStudents());
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTranslation('students', currentLang)}</h2>
         {user.role === UserRole.ADMIN && (
             <Button onClick={() => setIsModalOpen(true)}>+ Add Student</Button>
         )}
       </div>

       {/* Filters */}
       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-end">
           <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{getTranslation('course', currentLang)}</label>
               <select 
                value={filterCourse} 
                onChange={e => setFilterCourse(e.target.value)}
                className="w-full min-w-[150px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2"
               >
                   <option value="All">All Courses</option>
                   {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
           </div>
           <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{getTranslation('semester', currentLang)}</label>
               <select 
                value={filterSem} 
                onChange={e => setFilterSem(e.target.value)}
                className="w-full min-w-[150px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2"
               >
                   <option value="All">All Semesters</option>
                   {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
           </div>
       </div>

       {/* Table */}
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
             <thead className="bg-gray-50 dark:bg-gray-700/50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Roll No</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course / Sem</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                 {user.role === UserRole.ADMIN && (
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{getTranslation('actions', currentLang)}</th>
                 )}
               </tr>
             </thead>
             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
               {filteredStudents.length === 0 ? (
                 <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No students found matching filters.</td></tr>
               ) : (
                 filteredStudents.map(student => (
                   <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.rollNumber}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{student.name}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                         {student.course} - {student.semester}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>{student.email}</div>
                        <div className="text-xs">{student.phone}</div>
                     </td>
                     {user.role === UserRole.ADMIN && (
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">Delete</button>
                       </td>
                     )}
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
       </div>

       {/* Add Modal */}
       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
             <h3 className="text-lg font-bold mb-4 dark:text-white">Add New Student</h3>
             <form onSubmit={handleAddStudent} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Name</label>
                  <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Roll Number</label>
                  <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" value={newStudent.rollNumber} onChange={e => setNewStudent({...newStudent, rollNumber: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Course</label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" value={newStudent.course} onChange={e => setNewStudent({...newStudent, course: e.target.value})}>
                      {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Semester</label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" value={newStudent.semester} onChange={e => setNewStudent({...newStudent, semester: Number(e.target.value)})}>
                      {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
               </div>
               <div className="flex justify-end gap-3 mt-6">
                 <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button type="submit">Save Student</Button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default Students;