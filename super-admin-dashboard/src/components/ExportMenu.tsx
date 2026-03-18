import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import css from '../pages/Table.module.css';

export type ExportFormat = 'csv' | 'xlsx';

interface ExportMenuProps {
    onSelect: (format: ExportFormat) => void;
    disabled?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onSelect, disabled = false }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    const handleSelect = (format: ExportFormat) => {
        onSelect(format);
        setOpen(false);
    };

    return (
        <div className={css.dropdown} ref={containerRef}>
            <button
                className="btn btn-outline"
                type="button"
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
            >
                <Download size={16} /> Export
            </button>
            {open && (
                <div className={css.dropdownMenu}>
                    <button className={css.dropdownItem} type="button" onClick={() => handleSelect('csv')}>
                        <FileText size={14} /> CSV
                    </button>
                    <button className={css.dropdownItem} type="button" onClick={() => handleSelect('xlsx')}>
                        <FileSpreadsheet size={14} /> Excel
                    </button>
                </div>
            )}
        </div>
    );
};
