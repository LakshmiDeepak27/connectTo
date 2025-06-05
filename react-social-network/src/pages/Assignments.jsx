import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileAlt, FaCalendarAlt, FaClock, FaCheck, FaTimes } from 'react-icons/fa';

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, submitted, graded

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const response = await axios.get('/api/assignments/');
            setAssignments(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (assignmentId, submissionData) => {
        try {
            await axios.post(`/api/assignments/${assignmentId}/submit/`, submissionData);
            fetchAssignments();
            setSelectedAssignment(null);
        } catch (error) {
            console.error('Error submitting assignment:', error);
        }
    };

    const filteredAssignments = assignments.filter(assignment => {
        switch (filter) {
            case 'pending':
                return !assignment.is_submitted;
            case 'submitted':
                return assignment.is_submitted && !assignment.is_graded;
            case 'graded':
                return assignment.is_graded;
            default:
                return true;
        }
    });

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Assignments</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md ${
                            filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-md ${
                            filter === 'pending'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('submitted')}
                        className={`px-4 py-2 rounded-md ${
                            filter === 'submitted'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Submitted
                    </button>
                    <button
                        onClick={() => setFilter('graded')}
                        className={`px-4 py-2 rounded-md ${
                            filter === 'graded'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Graded
                    </button>
                </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
                {filteredAssignments.map((assignment) => (
                    <div
                        key={assignment.id}
                        className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                        onClick={() => setSelectedAssignment(assignment)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">{assignment.title}</h2>
                                <p className="text-gray-600 mb-4">{assignment.course_name}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {assignment.is_submitted ? (
                                    <span className="flex items-center text-green-600">
                                        <FaCheck className="mr-1" />
                                        Submitted
                                    </span>
                                ) : (
                                    <span className="flex items-center text-red-600">
                                        <FaTimes className="mr-1" />
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 text-gray-600">
                            <div className="flex items-center space-x-2">
                                <FaFileAlt className="text-blue-500" />
                                <span>{assignment.description}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FaCalendarAlt className="text-blue-500" />
                                <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FaClock className="text-blue-500" />
                                <span>{assignment.points} points</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Assignment Details Modal */}
            {selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold">{selectedAssignment.title}</h2>
                            <button
                                onClick={() => setSelectedAssignment(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Course</h3>
                                <p className="text-gray-600">{selectedAssignment.course_name}</p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-gray-600">{selectedAssignment.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">Due Date</h3>
                                    <p className="text-gray-600">
                                        {new Date(selectedAssignment.due_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">Points</h3>
                                    <p className="text-gray-600">{selectedAssignment.points} points</p>
                                </div>
                            </div>

                            {!selectedAssignment.is_submitted ? (
                                <div className="mt-6">
                                    <h3 className="font-semibold mb-2">Submit Assignment</h3>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.target);
                                            handleSubmit(selectedAssignment.id, formData);
                                        }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Submission
                                            </label>
                                            <textarea
                                                name="content"
                                                rows="4"
                                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Attachments
                                            </label>
                                            <input
                                                type="file"
                                                name="files"
                                                multiple
                                                className="w-full text-sm text-gray-500"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                        >
                                            Submit Assignment
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">Submission Status</h3>
                                    <p className="text-gray-600">
                                        Submitted on: {new Date(selectedAssignment.submitted_at).toLocaleString()}
                                    </p>
                                    {selectedAssignment.is_graded && (
                                        <div className="mt-2">
                                            <p className="font-medium">Grade: {selectedAssignment.grade}</p>
                                            <p className="text-gray-600">{selectedAssignment.feedback}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignments; 