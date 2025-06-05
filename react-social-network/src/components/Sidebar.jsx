import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBars, FaTimes, FaUserGraduate, FaBook, FaCalendarAlt, FaBuilding, FaFileAlt } from 'react-icons/fa';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handler = () => setIsOpen((open) => !open);
        window.addEventListener('toggleSidebar', handler);
        return () => window.removeEventListener('toggleSidebar', handler);
    }, []);

    const navLinks = [
        { path: '/alumni', icon: <FaUserGraduate />, label: 'Alumni Connect' },
        { path: '/notes', icon: <FaBook />, label: 'Study Notes' },
        { path: '/events', icon: <FaCalendarAlt />, label: 'College Events' },
        { path: '/departments', icon: <FaBuilding />, label: 'Departments' },
        { path: '/assignments', icon: <FaFileAlt />, label: 'Assignments' }
    ];

    return (
        <>
            {/* Sidebar - no overlay */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">Konnectia</h2>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                <span className="text-xl">{link.icon}</span>
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>
        </>
    );
};

export default Sidebar; 