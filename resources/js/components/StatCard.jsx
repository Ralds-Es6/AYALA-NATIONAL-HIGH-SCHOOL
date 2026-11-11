import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatCard({ 
    title, 
    value, 
    unit,
    subtitle, 
    subtitleColor,
    icon: Icon, 
    iconColor = '#2563EB',
    color,
    badge,
    badgeVariant = 'success',
    trend,
    onClick
}) {
    const getBadgeClasses = (variant) => {
        switch (variant) {
            case 'success':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'warning':
            case 'amber':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'danger':
            case 'rose':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'info':
            case 'cyan':
            case 'teal':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'neutral':
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const resolvedIconColor = color || iconColor || '#2563EB';

    return (
        <div 
            className={`stat-card bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[130px] shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group ${
                onClick ? 'cursor-pointer hover:border-blue-300' : ''
            }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-500 leading-snug">
                    {title}
                </span>
                {Icon && (
                    <div
                        style={{ color: resolvedIconColor }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-50/90 group-hover:bg-blue-50/80 group-hover:scale-110 transition-all duration-200"
                    >
                        <Icon size={17} strokeWidth={2.2} />
                    </div>
                )}
            </div>

            <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {value}
                </span>
                {unit && (
                    <span className="text-sm font-semibold text-slate-500">
                        {unit}
                    </span>
                )}
            </div>

            {(subtitle || badge || trend) && (
                <div className="flex items-center justify-between gap-2 mt-2">
                    {subtitle && (
                        <span
                            style={subtitleColor ? { color: subtitleColor } : undefined}
                            className={`text-[11px] leading-snug ${
                                subtitleColor ? 'font-bold' : 'font-medium text-slate-400'
                            }`}
                        >
                            {subtitle}
                        </span>
                    )}
                    {badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getBadgeClasses(badgeVariant)}`}>
                            {badge}
                        </span>
                    )}
                    {trend && (
                        <span className={`stat-trend ${trend.direction}`}>
                            {trend.direction === 'up' && <ArrowUpRight size={12} />}
                            {trend.direction === 'down' && <ArrowDownRight size={12} />}
                            {trend.direction === 'neutral' && <Minus size={12} />}
                            <span>{trend.label}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
