import React from 'react';
import { Activity, Plus, RefreshCw } from 'lucide-react';

export default function Navbar({ title, onOpenNewLoad, onRefresh, isRefreshing }) {
    return (
        <header className="topbar">
            <div className="topbar-title-section">
                <h2 className="page-title">{title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    Laravel REST API Connected
                </div>
            </div>

            <div className="topbar-actions">
                <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title="Reload data from Laravel API"
                >
                    <RefreshCw size={14} className={isRefreshing ? 'spinner' : ''} />
                    <span>Sync</span>
                </button>

                {onOpenNewLoad && (
                    <button className="btn btn-primary btn-sm" onClick={onOpenNewLoad}>
                        <Plus size={16} />
                        <span>Assign Load</span>
                    </button>
                )}
            </div>
        </header>
    );
}
