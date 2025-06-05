import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaBook, FaGraduationCap, FaBuilding } from 'react-icons/fa';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('/api/departments/');
            setDepartments(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">College Departments</h1>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {departments.map((dept) => (
                    <div
                        key={dept.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                        onClick={() => setSelectedDepartment(dept)}
                    >
                        {dept.image && (
                            <img
                                src={dept.image}
                                alt={dept.name}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-2">{dept.name}</h2>
                            <p className="text-gray-600 mb-4">{dept.description}</p>
                            
                            <div className="space-y-2 text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <FaUsers className="text-blue-500" />
                                    <span>{dept.student_count} Students</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaBook className="text-blue-500" />
                                    <span>{dept.course_count} Courses</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaGraduationCap className="text-blue-500" />
                                    <span>{dept.faculty_count} Faculty Members</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Department Details Modal */}
            {selectedDepartment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold">{selectedDepartment.name}</h2>
                            <button
                                onClick={() => setSelectedDepartment(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedDepartment.image && (
                            <img
                                src={selectedDepartment.image}
                                alt={selectedDepartment.name}
                                className="w-full h-64 object-cover rounded-lg mb-6"
                            />
                        )}

                        <p className="text-gray-600 mb-6">{selectedDepartment.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Programs Offered</h3>
                                <ul className="list-disc list-inside text-gray-600">
                                    {selectedDepartment.programs.map((program, index) => (
                                        <li key={index}>{program}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Key Features</h3>
                                <ul className="list-disc list-inside text-gray-600">
                                    {selectedDepartment.features.map((feature, index) => (
                                        <li key={index}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <FaUsers className="text-blue-500" />
                                    <span>Total Students</span>
                                </div>
                                <span className="font-semibold">{selectedDepartment.student_count}</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <FaBook className="text-blue-500" />
                                    <span>Courses Offered</span>
                                </div>
                                <span className="font-semibold">{selectedDepartment.course_count}</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <FaGraduationCap className="text-blue-500" />
                                    <span>Faculty Members</span>
                                </div>
                                <span className="font-semibold">{selectedDepartment.faculty_count}</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="font-semibold mb-2">Contact Information</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-600">
                                    <span className="font-medium">Head of Department:</span> {selectedDepartment.hod}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Email:</span> {selectedDepartment.email}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Phone:</span> {selectedDepartment.phone}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Departments; 