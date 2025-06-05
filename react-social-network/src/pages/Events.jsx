import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUsers } from 'react-icons/fa';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get('/api/events/');
            setEvents(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching events:', error);
            setLoading(false);
        }
    };

    const handleRegister = async (eventId) => {
        try {
            await axios.post(`/api/events/${eventId}/register/`);
            fetchEvents(); // Refresh events to update registration status
        } catch (error) {
            console.error('Error registering for event:', error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">College Events</h1>

            {/* Upcoming Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                    <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        {event.image && (
                            <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                            <p className="text-gray-600 mb-4">{event.description}</p>
                            
                            <div className="space-y-2 text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <FaCalendarAlt className="text-blue-500" />
                                    <span>{new Date(event.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaClock className="text-blue-500" />
                                    <span>{event.time}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaMapMarkerAlt className="text-blue-500" />
                                    <span>{event.location}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaUsers className="text-blue-500" />
                                    <span>{event.registered_count} registered</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => handleRegister(event.id)}
                                    className={`w-full py-2 px-4 rounded-md ${
                                        event.is_registered
                                            ? 'bg-gray-200 text-gray-600'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                    disabled={event.is_registered}
                                >
                                    {event.is_registered ? 'Registered' : 'Register Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">{selectedEvent.title}</h2>
                        <p className="text-gray-600 mb-6">{selectedEvent.description}</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <FaCalendarAlt className="text-blue-500" />
                                <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FaClock className="text-blue-500" />
                                <span>{selectedEvent.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FaMapMarkerAlt className="text-blue-500" />
                                <span>{selectedEvent.location}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FaUsers className="text-blue-500" />
                                <span>{selectedEvent.registered_count} registered</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleRegister(selectedEvent.id)}
                                className={`px-4 py-2 rounded-md ${
                                    selectedEvent.is_registered
                                        ? 'bg-gray-200 text-gray-600'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                disabled={selectedEvent.is_registered}
                            >
                                {selectedEvent.is_registered ? 'Registered' : 'Register Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events; 