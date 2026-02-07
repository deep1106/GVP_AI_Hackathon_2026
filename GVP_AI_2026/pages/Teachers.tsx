import React, { useState, useEffect } from 'react';
import { User, UserRole, LanguageCode } from '../types';
import { dataService } from '../services/dataService';
import Button from '../components/Button';
import { getTranslation } from '../constants';

interface TeachersProps {
  user: User;
  currentLang: LanguageCode;
}

const Teachers: React.FC<TeachersProps> = ({ user, currentLang }) => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '', username: '', password: '', email: '', department: ''
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = () => {
    setTeachers(dataService.getTeachers());
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher: User = {
        id: `u-${Date.now()}`,
        name: newTeacher.name,
        username: newTeacher.username,
        password: newTeacher.password,
        email: newTeacher.email,
        role: UserRole.TEACHER,
        department: newTeacher.department
    };
    
    dataService.addTeacher(teacher);
    loadTeachers();
    setIsModalOpen(false);
    setNewTeacher({ name: '', username: '', password: '', email: '', department: '' });
  };

  const handleDelete = (id: string) => {
      if(confirm('Delete this teacher account?')) {
          dataService.deleteTeacher(id);
          loadTeachers();
      }
  };

  if (user.role !== UserRole.ADMIN) {
      return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{getTranslation('manageTeachers', currentLang)}</h2>
         <Button onClick={() => setIsModalOpen(true)}>+ Add Teacher</Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map(teacher => (
              <div key={teacher.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold text-xl">
                      {teacher.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{teacher.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{teacher.email}</p>
                      <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                             {teacher.department || 'General'}
                          </span>
                          <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                             @{teacher.username}
                          </span>
                      </div>
                  </div>
                  <button onClick={() => handleDelete(teacher.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
              </div>
          ))}
       </div>

       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
             <h3 className="text-lg font-bold mb-4 dark:text-white">Create Teacher Account</h3>
             <form onSubmit={handleAddTeacher} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Full Name</label>
                  <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Department</label>
                  <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newTeacher.department} onChange={e => setNewTeacher({...newTeacher, department: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Email</label>
                  <input required type="email" className="mt-1 block w-full rounded-md border-gray-300 p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Username</label>
                    <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newTeacher.username} onChange={e => setNewTeacher({...newTeacher, username: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Password</label>
                    <input required type="password" className="mt-1 block w-full rounded-md border-gray-300 p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} />
                 </div>
               </div>
               <div className="flex justify-end gap-3 mt-6">
                 <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button type="submit">Create Account</Button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default Teachers;