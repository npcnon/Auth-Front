'use client';

import { useState, useEffect, Fragment } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, LogOut } from 'lucide-react';
import { getCookieValue, parseJwt } from '@/lib/jwt-decoder';

// Define an interface for the external employee
interface ExternalEmployee {
  employee_id: number;
  role: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  isActive: boolean;
  fullNameWithRole: string;
}

// Create a combined type for users
type CombinedUser = User & {
  externalData?: ExternalEmployee;
};

export default function UserList() {
    const [users, setUsers] = useState<CombinedUser[]>([]);
    const [externalEmployees, setExternalEmployees] = useState<ExternalEmployee[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const router = useRouter();
  
    // Password change state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
    const [newPassword, setNewPassword] = useState<string>('');
    const [passwordChangeError, setPasswordChangeError] = useState<string>('');
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<boolean>(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
    const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  
    // Registration state
    const [registrationData, setRegistrationData] = useState<{
      username: string;
      email: string;
      password: string;
    }>({
      username: '',
      email: '',
      password: ''
    });
    const [registrationError, setRegistrationError] = useState<string>('');
    const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

    useEffect(() => {
        const cookieName = 'access_token'; 
        const token = getCookieValue(cookieName);

        if (!token) {
            console.warn(`No JWT token found in cookies under the key: ${cookieName}`);
            return;
        }

        parseJwt(token);
    }, []); 

    function getAllCookies(): void {
        console.log('All Cookies:', document.cookie);
    }
    
    function getCookieValue(cookieName: string): string | null {
        const cookies = document.cookie.split('; ');
        console.log('Cookies Split:', cookies);
    
        const cookie = cookies.find(row => row.startsWith(`${cookieName}=`));
        console.log(`Searched Cookie (${cookieName}):`, cookie);
    
        return cookie ? cookie.split('=')[1] : null;
    }
    
    useEffect(() => {
        getAllCookies(); // Log all cookies
        const cookieName = 'access_token';
        const token = getCookieValue(cookieName);
    
        if (!token) {
            console.warn(`No JWT token found in cookies under the key: ${cookieName}`);
            return;
        }
    
        parseJwt(token);
    }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch registered users and external employees concurrently
        const [registeredUsers, externalEmployeesData] = await Promise.all([
          authApi.getAllUsers(),
          authApi.proxy()
        ]);

        // Map external employees data
        setExternalEmployees(externalEmployeesData);

        const combinedUsers: CombinedUser[] = registeredUsers.map(user => {
            // Find matching external employee
            const externalEmployee = externalEmployeesData.find(
              (emp: ExternalEmployee) => emp.employee_id.toString() === user.identifier
            );
          
            return {
              ...user,
              externalData: externalEmployee
            };
          });

        const unregisteredEmployees: CombinedUser[] = externalEmployeesData
        .filter(
            (emp: ExternalEmployee) => !combinedUsers.some(user => user.identifier === emp.employee_id.toString())
        )
        .map((emp: ExternalEmployee) => ({
            id: null,
            username: null,
            email: null,
            role: [emp.role],
            identifier: emp.employee_id.toString(),
            externalData: emp
        }));
        setUsers([...combinedUsers, ...unregisteredEmployees]);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch users');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      router.push('/mod/login');
    } catch (err) {
      console.error('Logout failed', err);
      setIsLoggingOut(false);
    }
  };
  const openPasswordChangeModal = (user: CombinedUser) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
    setNewPassword('');
    setPasswordChangeError('');
    setPasswordChangeSuccess(false);
  };
  const openRegistrationModal = (user: CombinedUser) => {
    setSelectedUser(user);
    setIsRegistrationModalOpen(true);
    setRegistrationData({
      username: `${user.externalData?.firstName?.replace(/\s+/g, '_')}_${user.externalData?.lastName?.replace(/\s+/g, '_')}` || '',
      email: `${user.externalData?.firstName?.replace(/\s+/g, '_')}_${user.externalData?.lastName?.replace(/\s+/g, '_')}@example.com` || '', 
      password: ''
    });
    setRegistrationError('');
    setRegistrationSuccess(false);
  };
  const handlePasswordChange = async () => {
    if (!selectedUser || !newPassword) return;

    setIsChangingPassword(true);
    setPasswordChangeError('');

    try {
      await authApi.changePassword({
        username: selectedUser.username || '',
        password: newPassword
      });
      setPasswordChangeSuccess(true);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordChangeSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordChangeError(err.response?.data?.detail || 'Password change failed');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUserRegistration = async () => {
    if (!selectedUser?.externalData) return;

    setIsRegistering(true);
    setRegistrationError('');

    try {
      await authApi.registerUser({
        username: registrationData.username,
        email: registrationData.email,
        password: registrationData.password,
        identifier: selectedUser.identifier
      });
      
      setRegistrationSuccess(true);
      
      // Refresh user list after successful registration
      setTimeout(() => {
        setIsRegistrationModalOpen(false);
        window.location.reload(); // Simple way to refresh the page
      }, 2000);
    } catch (err: any) {
      setRegistrationError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

      if (loading) return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50"
        >
            <motion.div
                animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="text-base md:text-2xl font-bold text-indigo-600 flex items-center"
            >
                <Loader2 className="mr-2 md:mr-3 animate-spin" size={24} />
                Loading Users...
            </motion.div>
        </motion.div>
    );

    if (error) return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-center mt-10 bg-red-50 p-4 rounded-lg"
        >
            Error: {error}
        </motion.div>
    );

  return (
    <>
    <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-2 sm:px-4 md:px-8 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen"
    >
        <div className="py-4 md:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <motion.h2 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0"
                >
                    User Management
                </motion.h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                        isLoggingOut 
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-red-500 hover:bg-red-700 text-white'
                    }`}
                >
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="mr-2 animate-spin" size={20} />
                            Logging Out...
                        </>
                    ) : (
                        <>
                            <LogOut size={20} />
                            <span>Logout</span>
                        </>
                    )}
                </motion.button>
            </div>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="-mx-2 sm:-mx-4 md:-mx-8 px-2 sm:px-4 md:px-8 py-4 overflow-x-auto"
            >
                <div className="inline-block min-w-full shadow-lg rounded-lg overflow-hidden bg-white">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gradient-to-r from-indigo-100 to-purple-100">
                            <tr>
                                {['Username', 'Email', 'Roles', 'Identifier', 'Status', 'Actions'].map((header) => (
                                    <th 
                                        key={header}
                                        className="px-2 sm:px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => (
                            <motion.tr 
                                key={user.identifier}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`${
                                    user.id 
                                        ? 'hover:bg-indigo-50' 
                                        : 'bg-yellow-50 hover:bg-yellow-100'
                                } transition-colors duration-200 block md:table-row`}
                            >
                                <td className="block md:table-cell px-2 sm:px-5 py-5 border-b border-gray-200 text-sm">
                                    <span className="md:hidden font-bold mr-2">Username:</span>
                                    {user.username || user.externalData?.fullNameWithRole || 'N/A'}
                                </td>
                                <td className="block md:table-cell px-2 sm:px-5 py-5 border-b border-gray-200 text-sm">
                                    <span className="md:hidden font-bold mr-2">Email:</span>
                                    {user.email || 'N/A'}
                                </td>
                                <td className="block md:table-cell px-2 sm:px-5 py-5 border-b border-gray-200 text-sm">
                                    <span className="md:hidden font-bold mr-2">Roles:</span>
                                    {user.role?.join(', ') || user.externalData?.role || 'N/A'}
                                </td>
                                <td className="block md:table-cell px-2 sm:px-5 py-5 border-b border-gray-200 text-sm">
                                    <span className="md:hidden font-bold mr-2">Identifier:</span>
                                    {user.identifier}
                                </td>
                                <td className="block md:table-cell px-2 sm:px-5 py-5 border-b border-gray-200 text-sm">
                                    <span className="md:hidden font-bold mr-2">Status:</span>
                                    <span className={`
                                        px-2 py-1 rounded-full text-xs font-semibold
                                        ${user.id 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'}
                                        ${user.externalData?.isActive === false ? 'bg-red-100 text-red-800' : ''}
                                    `}>
                                        {user.id ? 'Registered' : 'Not Registered'}
                                        {user.externalData?.isActive === false && ' (Inactive)'}
                                    </span>
                                </td>
                                <td className="block md:table-cell px-2 sm:px-5 py-5 border-b border-gray-200 text-sm text-center md:text-left">
                                    {user.id ? (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => openPasswordChangeModal(user)}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded transition-colors duration-300 w-full md:w-auto"
                                        >
                                            Change Password
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => openRegistrationModal(user)}
                                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded transition-colors duration-300 w-full md:w-auto"
                                        >
                                            Register User
                                        </motion.button>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    </motion.div>

      {/* Password Change Modal */}
      <Transition appear show={isPasswordModalOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-10" 
          onClose={() => setIsPasswordModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Change Password for {selectedUser?.username}
                  </Dialog.Title>
                  <div className="mt-4">
                  <div className="relative">
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 border rounded pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        {isPasswordVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                    {passwordChangeError && (
                      <p className="text-red-500 mt-2">{passwordChangeError}</p>
                    )}
                    {passwordChangeSuccess && (
                      <p className="text-green-500 mt-2">Password changed successfully!</p>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-2">
                  <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        disabled={isChangingPassword}
                        className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium 
                        ${isChangingPassword 
                            ? 'bg-blue-200 text-blue-700 cursor-not-allowed' 
                            : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                        } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
                        onClick={handlePasswordChange}
                    >
                        {isChangingPassword ? (
                        <>
                            <Loader2 className="mr-2 animate-spin" size={20} />
                            Changing...
                        </>
                        ) : (
                        'Change Password'
                        )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() => setIsPasswordModalOpen(false)}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <Transition appear show={isRegistrationModalOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-10" 
          onClose={() => setIsRegistrationModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Register {selectedUser?.externalData?.fullNameWithRole}
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <input
                      type="text"
                      value={registrationData.username}
                      onChange={(e) => setRegistrationData({...registrationData, username: e.target.value})}
                      placeholder="Username"
                      className="w-full px-3 py-2 border rounded"
                    />
                    <input
                      type="email"
                      value={registrationData.email}
                      onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                      placeholder="Email"
                      className="w-full px-3 py-2 border rounded"
                    />
                    <div className="relative">
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        value={registrationData.password}
                        onChange={(e) => setRegistrationData({...registrationData, password: e.target.value})}
                        placeholder="Enter password"
                        className="w-full px-3 py-2 border rounded pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {registrationError && (
                      <p className="text-red-500 mt-2">{registrationError}</p>
                    )}
                    {registrationSuccess && (
                      <p className="text-green-500 mt-2">User registered successfully!</p>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-2">
                  <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        disabled={isRegistering}
                        className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium 
                        ${isRegistering 
                            ? 'bg-green-200 text-green-700 cursor-not-allowed' 
                            : 'bg-green-100 text-green-900 hover:bg-green-200'
                        } focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2`}
                        onClick={handleUserRegistration}
                    >
                        {isRegistering ? (
                        <>
                            <Loader2 className="mr-2 animate-spin" size={20} />
                            Registering...
                        </>
                        ) : (
                        'Register'
                        )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() => setIsRegistrationModalOpen(false)}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}