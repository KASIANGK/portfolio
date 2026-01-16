import React, { useState, useEffect } from 'react';
import './Contact.css'

const Contact = () => {
    const [contactInfo, setContactInfo] = useState({ name: '', email: '' })
    const [subjects, setSubjects] = useState([])
    const [selectedSubject, setSelectedSubject] = useState('')
    const [message, setMessage] = useState('')
    const [activeDiv, setActiveDiv] = useState('userInfos')

    useEffect(() => {
        const fetchContact = fetch('/messages.json').then(response => response.json());
        const fetchSubjects = fetch('/subjects.json').then(response => response.json());

        Promise.all([fetchContact, fetchSubjects])
            .then(([contactData, subjectsData]) => {
                setContactInfo(contactData[0] || { name: '', email: '' });
                setSubjects(subjectsData);
            })
            .catch(error => console.error("Error:", error));
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            const selectedMessage = subjects.find(subject => subject.id === selectedSubject)?.message;
            setMessage(selectedMessage || '');
        }
    }, [selectedSubject, subjects]);

    const handleDivClick = (divName) => {
        setActiveDiv(divName); 
    };

    return (
        <div className="contact-container">
            <div 
                className={`ctc-user-infos ${activeDiv === 'userInfos' ? 'active' : ''}`} 
                onClick={() => handleDivClick('userInfos')}
            >
                <input 
                    type="text" 
                    placeholder="Name" 
                    value={contactInfo.name || ''} 
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} 
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={contactInfo.email || ''} 
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} 
                />
            </div>
            <div 
                className={`ctc-content ${activeDiv === 'content' ? 'active' : ''}`} 
                onClick={() => handleDivClick('content')}
            >
                <select onChange={(e) => setSelectedSubject(e.target.value)} value={selectedSubject}>
                    <option value="">Subject</option>
                    {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                            {subject.title}
                        </option>
                    ))}
                </select>
                <textarea 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                />
                <button>Send</button>
            </div>
        </div>
    )
}

export default Contact