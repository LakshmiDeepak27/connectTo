import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, CheckCircle, Mail, Linkedin, GraduationCap } from 'lucide-react';

const Alumni = () => {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filtered, setFiltered] = useState([]);

    useEffect(() => {
        fetchAlumni();
    }, []);

    useEffect(() => {
        setFiltered(
            alumni.filter(alum =>
                alum.name.toLowerCase().includes(search.toLowerCase()) ||
                (alum.current_position && alum.current_position.toLowerCase().includes(search.toLowerCase())) ||
                (alum.graduation_year && alum.graduation_year.toString().includes(search))
            )
        );
    }, [search, alumni]);

    const fetchAlumni = async () => {
        try {
            const response = await axios.get('/api/alumni/');
            setAlumni(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching alumni:', error);
            setLoading(false);
        }
    };

    const connectWithAlumni = async (alumniId) => {
        try {
            await axios.post(`/api/alumni/${alumniId}/connect/`);
            // Refresh the alumni list after connecting
            fetchAlumni();
        } catch (error) {
            console.error('Error connecting with alumni:', error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Alumni Network</h1>
            <div className="mb-6 flex items-center">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Search alumni by name, year, or company..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((alum) => (
                    <div key={alum.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <img
                                    src={alum.profile_picture || 'https://via.placeholder.com/50'}
                                    alt={alum.name}
                                    className="w-14 h-14 rounded-full border-2 border-blue-200"
                                />
                                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full shadow">
                                    {alum.graduation_year}
                                </span>
                                {alum.is_verified && (
                                    <span className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow" title="Verified Alumni">
                                        <GraduationCap size={14} />
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-semibold">{alum.name}</h3>
                                    {alum.is_verified && <CheckCircle size={16} className="text-green-500" title="Verified" />}
                                </div>
                                <p className="text-gray-600">{alum.graduation_year} • {alum.current_position}</p>
                                {alum.company && <p className="text-gray-500">{alum.company}</p>}
                            </div>
                        </div>
                        
                        <div className="mt-3 text-gray-700">{alum.bio}</div>
                        
                        <div className="mt-4 flex items-center space-x-3">
                            {alum.linkedin && (
                                <a href={alum.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline flex items-center">
                                    <Linkedin size={18} className="mr-1" /> LinkedIn
                                </a>
                            )}
                            {alum.email && (
                                <a href={`mailto:${alum.email}`} className="text-gray-700 hover:underline flex items-center">
                                    <Mail size={18} className="mr-1" /> Email
                                </a>
                            )}
                        </div>
                        
                        <div className="mt-4">
                            <button
                                onClick={() => connectWithAlumni(alum.id)}
                                className={`px-4 py-2 rounded-md ${
                                    alum.is_connected 
                                        ? 'bg-gray-200 text-gray-600 cursor-not-allowed' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                disabled={alum.is_connected}
                                title={alum.is_connected ? 'Already connected' : 'Connect with this alumni'}
                            >
                                {alum.is_connected ? (
                                    <span className="flex items-center"><CheckCircle size={16} className="mr-1" /> Connected</span>
                                ) : (
                                    'Connect'
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {filtered.length === 0 && (
                <div className="text-center text-gray-500 mt-8">No alumni found.</div>
            )}
        </div>
    );
};

export default Alumni; 