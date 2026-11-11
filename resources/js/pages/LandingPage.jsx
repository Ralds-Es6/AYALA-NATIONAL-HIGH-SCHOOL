import React, { useState, useEffect } from 'react';
import {
    CalendarCheck, ShieldCheck, GraduationCap, BookOpen, Mail, Lock,
    Clock, AlertOctagon, Sparkles, ArrowRight, MapPin,
    Users, Award, BarChart3, CheckCircle, Globe, X, LogIn, Info, Moon, Sun
} from 'lucide-react';
import Alert from '../components/Alert';

function NavLink({ children, href }) {
    const [hov, setHov] = useState(false);
    return (
        <a 
            href={href} 
            style={{ 
                color: hov ? '#FBBF24' : 'rgba(255,255,255,0.8)', 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                textDecoration: 'none', 
                padding: '0.25rem 0', 
                borderBottom: `2px solid ${hov ? '#FBBF24' : 'transparent'}`, 
                transition: 'color 0.2s, border-color 0.2s' 
            }}
            onMouseEnter={() => setHov(true)} 
            onMouseLeave={() => setHov(false)}
        >
            {children}
        </a>
    );
}

function FeatureCard({ icon: Icon, color, title, description, isDarkMode }) {
    const [hov, setHov] = useState(false);
    return (
        <div 
            onMouseEnter={() => setHov(true)} 
            onMouseLeave={() => setHov(false)} 
            style={{ 
                background: isDarkMode
                    ? (hov ? '#111116' : '#09090B')
                    : (hov ? 'linear-gradient(145deg, rgba(30,58,138,0.35), rgba(15,39,68,0.7))' : 'rgba(15,39,68,0.5)'), 
                border: `1px solid ${hov ? color + '60' : (isDarkMode ? '#1E293B' : 'rgba(255,255,255,0.08)')}`, 
                borderRadius: '20px', 
                padding: '2rem 1.75rem', 
                transition: 'all 0.3s ease', 
                transform: hov ? 'translateY(-6px)' : 'translateY(0)', 
                boxShadow: hov ? `0 20px 40px rgba(0,0,0,0.6), 0 0 20px ${color}22` : 'none', 
                backdropFilter: 'blur(12px)', 
                cursor: 'default' 
            }}
        >
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg, ${color}30, ${color}15)`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Icon size={26} color={color} strokeWidth={1.8} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>{title}</h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.65, margin: 0 }}>{description}</p>
        </div>
    );
}


export default function LandingPage({ onNavigate, onQuickLogin, currentUser, onLogout, isDarkMode = false, onToggleDarkMode }) {
    const [scrolled, setScrolled] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [email, setEmail] = useState('student@anhs.edu.ph');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    // Handle Esc key to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showStudentModal) {
                setShowStudentModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showStudentModal]);

    const handleStudentSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (onQuickLogin) {
                await onQuickLogin({ 
                    email: email.trim(), 
                    password, 
                    expected_role: 'student' 
                });
            } else {
                onNavigate('/student/dashboard');
            }
            setShowStudentModal(false);
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.message;
            setError(serverMsg || 'Authentication failed. Please check your student credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFillStudent = (accountEmail = 'student@anhs.edu.ph') => {
        setEmail(accountEmail);
        setPassword('password');
        setError(null);
    };

    const features = [
        { icon: CalendarCheck, color: '#3B82F6', title: 'Automated Schedule Generation', description: 'One-click timetable generation that automatically allocates all faculty, classrooms, and subjects across all grade sections — conflict-free within seconds.' },
        { icon: AlertOctagon, color: '#F59E0B', title: 'Real-Time Conflict Detection', description: 'Every schedule entry is validated against teacher availability, room occupancy, and section time slots simultaneously before it is saved.' },
        { icon: Mail, color: '#10B981', title: 'Gmail Automated Notifications', description: 'Schedule publications, room changes, and cancellations automatically dispatch HTML-formatted timetables to all faculty via Gmail — eliminating paper memos.' },
        { icon: Clock, color: '#8B5CF6', title: 'Official DepEd Reports (SF-7)', description: 'Export officially formatted DepEd School Form 7, master class schedules, and workload compliance summaries ready for Division review — in one click.' },
        { icon: BarChart3, color: '#EC4899', title: 'Faculty Workload Monitoring', description: "Tracks every teacher's total assigned weekly teaching hours against the DepEd statutory 30-hour cap and flags over- or under-allocated personnel." },
        { icon: Award, color: '#14B8A6', title: 'DepEd Assessment & Grading Hub', description: 'Teachers record Written Works, Performance Tasks, and Quarterly Exams per DepEd competencies. Students view grades in their portal instantly.' },
    ];

    const aboutCards = [
        { icon: Globe, color: '#3B82F6', title: 'Web-Based Access', desc: 'Access from any device — desktop, tablet, or mobile — with any modern browser.' },
        { icon: ShieldCheck, color: '#F59E0B', title: 'Role-Based Security', desc: 'Protected data integrity ensuring authorized access to timetables and student grades.' },
        { icon: Clock, color: '#10B981', title: 'Real-Time Sync', desc: 'All schedule changes reflect instantly for all users without manual updates.' },
        { icon: GraduationCap, color: '#8B5CF6', title: 'Learner Transparency', desc: 'Students can securely view quarterly assessments and class schedules anytime.' },
    ];

    return (
        <div style={{ background: isDarkMode ? '#000000' : '#0A192F', color: '#F1F5F9', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: '100vh', overflowX: 'hidden', transition: 'background 0.25s ease' }}>

            {/* ══ NAVBAR ══ */}
            <header style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                zIndex: 100, 
                padding: scrolled ? '0.75rem 0' : '1.1rem 0', 
                background: isDarkMode
                    ? (scrolled ? 'rgba(0,0,0,0.96)' : 'rgba(0,0,0,0.65)')
                    : (scrolled ? 'rgba(7,19,36,0.95)' : 'rgba(7,19,36,0.4)'), 
                backdropFilter: 'blur(16px)', 
                borderBottom: isDarkMode
                    ? '1px solid #1E293B'
                    : (scrolled ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.06)'), 
                transition: 'all 0.35s ease' 
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                            src="/assets/backgrounds/ayala-logo.jpeg" 
                            alt="Ayala NHS Logo" 
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,99,235,0.7)', boxShadow: '0 0 12px rgba(37,99,235,0.3)' }} 
                        />
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Ayala National High School</div>
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 500 }}>Automated Scheduling &amp; Assessment System</div>
                        </div>
                    </div>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                        <NavLink href="#about">About</NavLink>
                        <NavLink href="#features">Features</NavLink>
                    </nav>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {onToggleDarkMode && (
                            <button
                                type="button"
                                onClick={onToggleDarkMode}
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
                                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: isDarkMode ? '#18181B' : 'rgba(255,255,255,0.08)',
                                    color: '#FFFFFF',
                                    border: isDarkMode ? '1px solid #27272A' : '1px solid rgba(255,255,255,0.16)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {isDarkMode ? <Sun size={17} color="#FDE047" /> : <Moon size={17} color="#E2E8F0" />}
                            </button>
                        )}
                        {currentUser ? (
                            <>
                                <button 
                                    onClick={() => onNavigate(`/${currentUser.role}/dashboard`)} 
                                    style={{ padding: '0.55rem 1.25rem', borderRadius: '10px', background: '#F59E0B', color: '#0A192F', fontWeight: 700, fontSize: '0.825rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}
                                >
                                    My Dashboard
                                </button>
                                <button 
                                    onClick={onLogout} 
                                    style={{ padding: '0.55rem 0.95rem', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', color: '#94A3B8', fontWeight: 600, fontSize: '0.825rem', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setShowStudentModal(true)} 
                                style={{ 
                                    padding: '0.55rem 1.25rem', 
                                    borderRadius: '10px', 
                                    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', 
                                    color: '#FFFFFF', 
                                    fontWeight: 700, 
                                    fontSize: '0.825rem', 
                                    border: '1px solid rgba(245,158,11,0.4)', 
                                    cursor: 'pointer', 
                                    boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px'
                                }}
                            >
                                <GraduationCap size={16} color="#FBBF24" />
                                Student Login
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ══ HERO — MINIMAL TEXT & FULL VISIBILITY FOR BACKGROUND IMAGE ══ */}
            <section style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'relative', 
                overflow: 'hidden', 
                paddingTop: '7rem', 
                paddingBottom: '5rem' 
            }}>
                {/* Real School Background Photo (Prominently Visible) */}
                <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    backgroundImage: 'url(/assets/backgrounds/ayala-background.jpeg)', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center 20%', 
                    backgroundRepeat: 'no-repeat', 
                    pointerEvents: 'none' 
                }} />

                {/* Subtle soft gradient overlay so the photo is vibrant and clearly visible */}
                <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    background: 'linear-gradient(180deg, rgba(7, 19, 36, 0.45) 0%, rgba(7, 19, 36, 0.25) 45%, rgba(10, 25, 47, 0.75) 100%)', 
                    pointerEvents: 'none' 
                }} />

                {/* Minimalist Hero Content — Unobstructed View */}
                <div style={{ 
                    maxWidth: '900px', 
                    margin: '0 auto', 
                    padding: '0 2rem', 
                    position: 'relative', 
                    zIndex: 2, 
                    textAlign: 'center' 
                }}>
                    {/* Minimal DepEd badge */}
                    <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        background: 'rgba(7, 19, 36, 0.65)', 
                        border: '1px solid rgba(245, 158, 11, 0.4)', 
                        backdropFilter: 'blur(10px)', 
                        borderRadius: '999px', 
                        padding: '6px 18px', 
                        marginBottom: '1.5rem',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 8px #F59E0B', display: 'block' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FDE047', letterSpacing: '0.08em' }}>
                            DEPED REGION IX • DIVISION OF ZAMBOANGA CITY • SCHOOL ID 303812
                        </span>
                    </div>

                    {/* Minimal Crisp Title */}
                    <h1 style={{ 
                        fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', 
                        fontWeight: 900, 
                        lineHeight: 1.15, 
                        letterSpacing: '-0.035em', 
                        margin: '0 0 1rem', 
                        color: '#FFFFFF',
                        textShadow: '0 4px 20px rgba(0, 0, 0, 0.7)'
                    }}>
                        Ayala National High School
                    </h1>

                    <div style={{ 
                        fontSize: 'clamp(1.2rem, 2.2vw, 1.65rem)', 
                        fontWeight: 700, 
                        letterSpacing: '-0.02em', 
                        margin: '0 0 1.25rem',
                        background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #FCD34D 100%)', 
                        WebkitBackgroundClip: 'text', 
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
                    }}>
                        Automated Scheduling & Student Assessment Tracker
                    </div>

                    {/* Minimal Tagline */}
                    <p style={{ 
                        fontSize: '1.05rem', 
                        color: '#E2E8F0', 
                        lineHeight: 1.65, 
                        maxWidth: '640px', 
                        margin: '0 auto 2.25rem',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                        background: 'rgba(7, 19, 36, 0.45)',
                        backdropFilter: 'blur(8px)',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        Empowering learners with real-time class timetables, room assignments, and transparent quarterly academic performance tracking.
                    </p>

                    {/* Single Minimal Student Action Button — Triggers Floating Modal */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => setShowStudentModal(true)} 
                            style={{ 
                                padding: '0.9rem 2.2rem', 
                                borderRadius: '14px', 
                                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                                color: '#0A192F', 
                                fontWeight: 800, 
                                fontSize: '1rem', 
                                border: 'none', 
                                cursor: 'pointer', 
                                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.45), 0 0 20px rgba(245, 158, 11, 0.25)', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '10px',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <GraduationCap size={20} color="#0A192F" strokeWidth={2.2} />
                            <span>Student Portal Login</span>
                            <ArrowRight size={18} color="#0A192F" />
                        </button>

                        <a 
                            href="#about" 
                            style={{ 
                                padding: '0.9rem 1.8rem', 
                                borderRadius: '14px', 
                                background: 'rgba(7, 19, 36, 0.65)', 
                                color: '#E2E8F0', 
                                fontWeight: 600, 
                                fontSize: '0.95rem', 
                                border: '1px solid rgba(255, 255, 255, 0.2)', 
                                textDecoration: 'none', 
                                backdropFilter: 'blur(10px)', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px' 
                            }}
                        >
                            <span>Learn More</span>
                        </a>
                    </div>
                </div>

                {/* Subtle Scroll Indicator */}
                <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }}>
                    <span>EXPLORE SYSTEM</span>
                    <div style={{ width: '22px', height: '34px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4px 0' }}>
                        <div style={{ width: '4px', height: '7px', borderRadius: '2px', background: '#F59E0B' }} />
                    </div>
                </div>
            </section>

            {/* ══ ABOUT ══ */}
            <section id="about" style={{ padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '999px', padding: '4px 12px', marginBottom: '1.25rem' }}>
                            <Sparkles size={13} color="#60A5FA" />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60A5FA', letterSpacing: '0.06em' }}>ABOUT THE SYSTEM</span>
                        </div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', margin: '0 0 1.1rem', lineHeight: 1.2 }}>
                            Purpose-Built for<br />Ayala National High School
                        </h2>
                        <p style={{ fontSize: '1rem', color: '#94A3B8', lineHeight: 1.75, margin: '0 0 1rem' }}>
                            The <strong style={{ color: '#E2E8F0' }}>Ayala NHS Automated Scheduling & Assessment Tracker</strong> provides an integrated platform designed to eliminate scheduling friction and provide learners with direct transparency over their academic schedules and DepEd grades.
                        </p>
                        <p style={{ fontSize: '1rem', color: '#94A3B8', lineHeight: 1.75, margin: '0 0 1.75rem' }}>
                            Built in full compliance with DepEd standards for the Division of Zamboanga City, the system serves junior high school students from Grade 7 through Grade 10.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                            {['DepEd Region IX', 'Division of Zamboanga City', 'Junior & Senior HS', 'AY 2026–2027'].map(t => (
                                <span key={t} style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>{t}</span>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {aboutCards.map(({ icon: Icon, color, title, desc }) => (
                            <div key={title} style={{ padding: '1.4rem', background: isDarkMode ? '#09090B' : 'rgba(15,39,68,0.5)', border: isDarkMode ? '1px solid #1E293B' : '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                                    <Icon size={18} color={color} />
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.4rem' }}>{title}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.55 }}>{desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ FEATURES ══ */}
            <section id="features" style={{ padding: '6rem 2rem', background: isDarkMode ? '#000000' : 'rgba(7,19,36,0.7)', borderTop: isDarkMode ? '1px solid #121318' : 'none' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '999px', padding: '4px 12px', marginBottom: '1rem' }}>
                            <Sparkles size={13} color="#FBBF24" />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FBBF24', letterSpacing: '0.06em' }}>CORE SYSTEM FEATURES</span>
                        </div>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', margin: '0 0 0.85rem' }}>Essential School Capabilities</h2>
                        <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '560px', margin: '0 auto', lineHeight: 1.65 }}>
                            Automated timetable calculation, real-time conflict prevention, and official DepEd compliance in one unified system.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        {features.map(f => <FeatureCard key={f.title} {...f} isDarkMode={isDarkMode} />)}
                    </div>
                </div>
            </section>

            {/* ══ CTA BANNER (Student Focused with Neon Marquee Animation) ══ */}
            <section style={{ 
                padding: '5rem 0 5.5rem', 
                background: isDarkMode ? '#050507' : 'linear-gradient(135deg, rgba(15, 33, 64, 0.7) 0%, rgba(7, 19, 36, 0.95) 100%)', 
                borderTop: '1px solid rgba(245, 158, 11, 0.3)', 
                borderBottom: '1px solid rgba(56, 189, 248, 0.25)', 
                position: 'relative', 
                overflow: 'hidden' 
            }}>
                {/* CSS Keyframes for Modern Ticker & Neon Glow */}
                <style>{`
                    @keyframes anhsMarqueeTrack {
                        0% { transform: translate3d(0, 0, 0); }
                        100% { transform: translate3d(-50%, 0, 0); }
                    }
                    @keyframes anhsNeonGlow {
                        0%, 100% {
                            filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.7)) drop-shadow(0 0 25px rgba(56, 189, 248, 0.5));
                        }
                        50% {
                            filter: drop-shadow(0 0 22px rgba(245, 158, 11, 0.95)) drop-shadow(0 0 45px rgba(56, 189, 248, 0.85));
                        }
                    }
                    @keyframes anhsGradientFlow {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .anhs-neon-marquee-wrap {
                        overflow: hidden;
                        width: 100%;
                        position: relative;
                        padding: 0.9rem 0;
                        mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                        -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                        background: rgba(7, 19, 36, 0.55);
                        border-top: 1px solid rgba(245, 158, 11, 0.2);
                        border-bottom: 1px solid rgba(56, 189, 248, 0.2);
                        margin-bottom: 2.75rem;
                    }
                    .anhs-neon-marquee-track {
                        display: flex;
                        width: max-content;
                        animation: anhsMarqueeTrack 28s linear infinite;
                        will-change: transform;
                    }
                    .anhs-neon-marquee-track:hover {
                        animation-play-state: paused;
                    }
                    .anhs-neon-text {
                        background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 22%, #38BDF8 50%, #A855F7 78%, #F59E0B 100%);
                        background-size: 250% 250%;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        animation: anhsGradientFlow 5s ease infinite, anhsNeonGlow 3.5s ease-in-out infinite;
                    }
                    .anhs-ticker-item {
                        display: inline-flex;
                        align-items: center;
                        gap: 1.25rem;
                        padding: 0 1.5rem;
                        font-size: 0.92rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        background: linear-gradient(90deg, #FDE047 0%, #38BDF8 50%, #A855F7 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.35));
                    }
                `}</style>

                {/* Subtle Ambient Neon Background Blobs */}
                <div style={{ position: 'absolute', top: '15%', left: '10%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12), transparent 70%)', filter: 'blur(45px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

                {/* Modern Continuous Neon Marquee Ribbon (Infinite Loop — No Deprecated Marquee Tag) */}
                <div className="anhs-neon-marquee-wrap">
                    <div className="anhs-neon-marquee-track">
                        {/* Repeat Set 1 */}
                        {[1, 2].map((setIndex) => (
                            <React.Fragment key={setIndex}>
                                <div className="anhs-ticker-item">
                                    <span>✦ Shaping Lives, Securing the Future</span>
                                    <span style={{ color: 'rgba(245, 158, 11, 0.8)' }}>•</span>
                                    <span>Ayala National High School</span>
                                    <span style={{ color: 'rgba(56, 189, 248, 0.8)' }}>•</span>
                                    <span>Excellence • Integrity • Service</span>
                                    <span style={{ color: 'rgba(168, 85, 247, 0.8)' }}>•</span>
                                    <span>DepEd Region IX • Zamboanga City</span>
                                    <span style={{ color: 'rgba(245, 158, 11, 0.8)' }}>•</span>
                                    <span>Automated Scheduling & Assessment</span>
                                    <span style={{ color: 'rgba(56, 189, 248, 0.8)' }}>•</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 2rem' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
                        <div style={{ 
                            position: 'absolute', 
                            inset: '-8px', 
                            borderRadius: '50%', 
                            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.5), rgba(56, 189, 248, 0.3), transparent 70%)', 
                            filter: 'blur(10px)',
                            pointerEvents: 'none' 
                        }} />
                        <img 
                            src="/assets/backgrounds/ayala-logo.jpeg" 
                            alt="ANHS Logo" 
                            style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '50%', 
                                objectFit: 'cover', 
                                border: '3px solid rgba(245,158,11,0.8)', 
                                boxShadow: '0 0 25px rgba(245,158,11,0.5), 0 0 45px rgba(56,189,248,0.3)', 
                                position: 'relative' 
                            }} 
                        />
                    </div>

                    {/* Neon Gradient Headline with Pulsing Glow */}
                    <h2 className="anhs-neon-text" style={{ 
                        fontSize: 'clamp(2.1rem, 4.2vw, 3rem)', 
                        fontWeight: 900, 
                        letterSpacing: '-0.03em', 
                        margin: '0 0 1rem',
                        lineHeight: 1.15
                    }}>
                        Shaping Lives, Securing the Future
                    </h2>

                    <p style={{ fontSize: '1.05rem', color: '#CBD5E1', lineHeight: 1.7, margin: '0 auto 2.25rem', maxWidth: '620px', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                        Ayala National High School commits to excellence in every aspect of secondary education — delivering organized, accessible, and transparent learning services for every student.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                            onClick={() => setShowStudentModal(true)} 
                            style={{ 
                                padding: '0.9rem 2.4rem', 
                                borderRadius: '14px', 
                                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                                color: '#0A192F', 
                                fontWeight: 800, 
                                fontSize: '0.98rem', 
                                border: '1px solid rgba(254, 240, 138, 0.4)', 
                                cursor: 'pointer', 
                                boxShadow: '0 8px 30px rgba(245,158,11,0.5), 0 0 25px rgba(56,189,248,0.35)', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '10px',
                                transition: 'all 0.25s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 35px rgba(245,158,11,0.65), 0 0 35px rgba(56,189,248,0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,158,11,0.5), 0 0 25px rgba(56,189,248,0.35)';
                            }}
                        >
                            <GraduationCap size={20} color="#0A192F" strokeWidth={2.2} />
                            <span>Access Student Portal</span>
                            <ArrowRight size={18} color="#0A192F" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ══ FOOTER ══ */}
            <footer style={{ background: '#050D1A', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '3.5rem 2rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '2.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                <img src="/assets/backgrounds/ayala-logo.jpeg" alt="ANHS Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(245,158,11,0.5)' }} />
                                <div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>Ayala National High School</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Ayala, Zamboanga City</div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.65, marginBottom: '1rem', maxWidth: '300px' }}>
                                Official web-based Automated Teacher Scheduling and Student Assessment Tracking System — DepEd School ID 303812, Division of Zamboanga City, Region IX.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#475569' }}>
                                <MapPin size={14} color="#F59E0B" />
                                <span>Ayala, Zamboanga City, 7000</span>
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>Portal Access</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button 
                                    onClick={() => setShowStudentModal(true)} 
                                    style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.825rem', cursor: 'pointer', padding: 0, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', textAlign: 'left' }}
                                >
                                    → Student Portal Login
                                </button>
                                <button 
                                    onClick={() => onNavigate('/teacher/login')} 
                                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.825rem', cursor: 'pointer', padding: 0, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', textAlign: 'left' }}
                                >
                                    → Teacher Portal Login
                                </button>
                                <button 
                                    onClick={() => onNavigate('/admin/login')} 
                                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.825rem', cursor: 'pointer', padding: 0, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', textAlign: 'left' }}
                                >
                                    → Administrator Portal
                                </button>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.75rem', lineHeight: 1.5 }}>
                                Official student &amp; faculty access to timetable schedules and quarter assessments.
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>DepEd Info</div>
                            {['Region IX — Zamboanga Peninsula', 'Division of Zamboanga City', 'School Form SF-7 Compliant', 'DepEd Order No. 21, s. 2023'].map(t => (
                                <div key={t} style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>• {t}</div>
                            ))}
                        </div>

                        <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>System</div>
                            {['Scheduling Engine v2.4', 'Laravel 11 + React 19', 'Gmail API Notifications', 'Real-Time Conflict Engine', 'AY 2026–2027 Active'].map(t => (
                                <div key={t} style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>• {t}</div>
                            ))}
                        </div>
                    </div>

                    <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#334155' }}>© 2026 Ayala National High School • Republic of the Philippines, Department of Education</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {['DepEd 303812', 'SF-7 Compliant', 'Zero Clashes'].map(t => (
                                <span key={t} style={{ fontSize: '0.7rem', color: '#1E3A5F', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

            {/* ══ FLOATING STUDENT LOGIN MODAL ══ */}
            {showStudentModal && (
                <div 
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowStudentModal(false);
                    }}
                    style={{ 
                        position: 'fixed', 
                        inset: 0, 
                        zIndex: 9999, 
                        background: 'rgba(5, 13, 26, 0.75)', 
                        backdropFilter: 'blur(10px)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '1.5rem',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <div 
                        style={{ 
                            background: 'linear-gradient(145deg, #0D1F38 0%, #0A192F 100%)', 
                            border: '1px solid rgba(245, 158, 11, 0.4)', 
                            borderRadius: '24px', 
                            width: '100%', 
                            maxWidth: '450px', 
                            padding: '2.25rem 2rem', 
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(37, 99, 235, 0.25)', 
                            position: 'relative',
                            color: '#FFFFFF'
                        }}
                    >
                        {/* Close Button */}
                        <button 
                            onClick={() => setShowStudentModal(false)}
                            aria-label="Close login modal"
                            style={{ 
                                position: 'absolute', 
                                top: '1.25rem', 
                                right: '1.25rem', 
                                background: 'rgba(255,255,255,0.06)', 
                                border: '1px solid rgba(255,255,255,0.12)', 
                                borderRadius: '10px', 
                                width: '34px', 
                                height: '34px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#94A3B8', 
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        >
                            <X size={18} />
                        </button>

                        {/* Modal Header */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ 
                                width: '56px', 
                                height: '56px', 
                                borderRadius: '16px', 
                                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', 
                                border: '2px solid #F59E0B', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                boxShadow: '0 8px 20px rgba(37,99,235,0.4)',
                                marginBottom: '0.85rem'
                            }}>
                                <BookOpen size={28} color="#FFFFFF" />
                            </div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                                Student Learner Portal
                            </h2>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                                Ayala National High School &bull; DepEd Region IX
                            </div>
                        </div>

                        {/* Guidance Note */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            padding: '0.75rem 1rem', 
                            background: 'rgba(30, 58, 138, 0.25)', 
                            borderRadius: '12px', 
                            border: '1px solid rgba(59, 130, 246, 0.3)', 
                            marginBottom: '1.25rem' 
                        }}>
                            <Info size={18} color="#93C5FD" style={{ flexShrink: 0 }} />
                            <div style={{ fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                                Sign in with your student credentials to view your class schedule and quarterly grades!
                            </div>
                        </div>

                        {error && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <Alert type="danger" message={error} onClose={() => setError(null)} />
                            </div>
                        )}

                        <form onSubmit={handleStudentSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                                    Student Email / LRN
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                    <input 
                                        type="email" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        required 
                                        placeholder="student@anhs.edu.ph"
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.7rem 1rem 0.7rem 2.4rem', 
                                            borderRadius: '10px', 
                                            background: 'rgba(15, 23, 42, 0.7)', 
                                            border: '1px solid rgba(255, 255, 255, 0.15)', 
                                            color: '#FFFFFF', 
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }} 
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                        placeholder="••••••••"
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.7rem 1rem 0.7rem 2.4rem', 
                                            borderRadius: '10px', 
                                            background: 'rgba(15, 23, 42, 0.7)', 
                                            border: '1px solid rgba(255, 255, 255, 0.15)', 
                                            color: '#FFFFFF', 
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }} 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.8rem', 
                                    borderRadius: '12px', 
                                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', 
                                    color: '#FFFFFF', 
                                    fontWeight: 700, 
                                    fontSize: '0.95rem', 
                                    border: 'none', 
                                    cursor: loading ? 'not-allowed' : 'pointer', 
                                    boxShadow: '0 4px 16px rgba(22, 163, 74, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                <LogIn size={18} />
                                {loading ? 'Signing In...' : 'Sign In as Student'}
                            </button>
                        </form>

                        {/* Demo Auto-fill Helper */}
                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', textAlign: 'center', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Demo Quick-Fill by Curriculum Level:
                            </div>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button 
                                    type="button"
                                    onClick={() => handleQuickFillStudent('student@anhs.edu.ph')}
                                    style={{ 
                                        background: 'rgba(255,255,255,0.08)', 
                                        border: '1px solid rgba(255,255,255,0.15)', 
                                        color: '#FBBF24', 
                                        fontSize: '0.725rem', 
                                        fontWeight: 600, 
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    Junior High (Gr. 10)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleQuickFillStudent('j.garcia@anhs.edu.ph')}
                                    style={{ 
                                        background: 'rgba(16, 185, 129, 0.12)', 
                                        border: '1px solid rgba(16, 185, 129, 0.3)', 
                                        color: '#34D399', 
                                        fontSize: '0.725rem', 
                                        fontWeight: 600, 
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    Senior High (STEM Gr. 11)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleQuickFillStudent('b.mariano@anhs.edu.ph')}
                                    style={{ 
                                        background: 'rgba(6, 182, 212, 0.14)', 
                                        border: '1px solid rgba(6, 182, 212, 0.3)', 
                                        color: '#38BDF8', 
                                        fontSize: '0.725rem', 
                                        fontWeight: 600, 
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    Senior High (TVL-ICT Gr. 11)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
