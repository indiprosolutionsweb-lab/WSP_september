
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FocusNote, FocusItem, FocusItemStatus } from '../types';
import { PlusIcon, TrashIcon } from './icons';

const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
    const timeoutRef = useRef<number | null>(null);
    return (...args: any[]) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => callback(...args), delay);
    };
};

const StatusSelector: React.FC<{ status: FocusItemStatus; onSelect: (status: FocusItemStatus) => void; }> = ({ status, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const colors: { [key in FocusItemStatus]: string } = { 'red': 'bg-red-500', 'yellow': 'bg-yellow-400', 'green': 'bg-green-500', 'none': 'bg-slate-600 border-2 border-slate-500' };
    const statusLabels: { [key in FocusItemStatus]: string } = { green: 'Green', yellow: 'Yellow', red: 'Red', none: 'Clear' };
    const statusOptions: FocusItemStatus[] = ['green', 'yellow', 'red'];
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(p => !p)} className={`w-5 h-5 rounded-full shrink-0 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 ${colors[status]}`} aria-label={`Status: ${status}.`} />
            {isOpen && (
                <div className="absolute z-10 top-full mt-2 right-0 bg-slate-900 border border-slate-700 rounded-lg p-1 flex flex-col gap-1 shadow-lg w-32">
                    {statusOptions.map(s => <button key={s} onClick={() => { onSelect(s); setIsOpen(false); }} className="flex items-center gap-2 w-full text-left p-1.5 rounded-md text-slate-200 hover:bg-slate-700"><span className={`w-4 h-4 rounded-full ${colors[s]}`} /><span>{statusLabels[s]}</span></button>)}
                    <div className="border-t border-slate-700/50 my-1" />
                    <button onClick={() => { onSelect('none'); setIsOpen(false); }} className="flex items-center gap-2 w-full text-left p-1.5 rounded-md text-slate-400 hover:bg-slate-700"><div className={`w-4 h-4 rounded-full ${colors['none']} flex items-center justify-center`}><svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div><span>{statusLabels['none']}</span></button>
                </div>
            )}
        </div>
    );
};

export const FocusView: React.FC<{ note: FocusNote | null; onSave: (note: { focus_text: string | null; pointers_text: string | null; }) => void; }> = ({ note, onSave }) => {
    const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
    const [pointersText, setPointersText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (note) {
            try {
                const parsed = note.focus_text ? JSON.parse(note.focus_text) : [];
                setFocusItems(Array.isArray(parsed) ? parsed : [{ id: crypto.randomUUID(), text: String(note.focus_text), status: 'none' }]);
            } catch (e) {
                setFocusItems(note.focus_text ? [{ id: crypto.randomUUID(), text: note.focus_text, status: 'none' }] : []);
            }
            setPointersText(note.pointers_text || '');
        }
        const timer = setTimeout(() => { isInitialMount.current = false; }, 500);
        return () => clearTimeout(timer);
    }, [note]);

    const debouncedSave = useCallback(useDebounce((newFocusItems: FocusItem[], newPointers: string) => {
        if (isInitialMount.current) return;
        setIsSaving(true);
        onSave({ focus_text: JSON.stringify(newFocusItems), pointers_text: newPointers });
        setTimeout(() => setIsSaving(false), 700);
    }, 1000), [onSave]);

    const updateFocusItems = (items: FocusItem[]) => { setFocusItems(items); debouncedSave(items, pointersText); };
    const handleAddItem = () => updateFocusItems([...focusItems, { id: crypto.randomUUID(), text: '', status: 'none' }]);
    const handleUpdateItemText = (id: string, text: string) => updateFocusItems(focusItems.map(item => item.id === id ? { ...item, text } : item));
    const handleUpdateItemStatus = (id: string, status: FocusItemStatus) => updateFocusItems(focusItems.map(item => item.id === id ? { ...item, status } : item));
    const handleDeleteItem = (id: string) => updateFocusItems(focusItems.filter(item => item.id !== id));
    const handlePointersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setPointersText(e.target.value); debouncedSave(focusItems, e.target.value); };
    const statusBorderStyles: { [key in FocusItemStatus]: string } = { green: 'border-green-500', yellow: 'border-yellow-400', red: 'border-red-500', none: 'border-slate-700/50' };

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 mt-4 flex-grow flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-200">My Focus</h2>
                <div className={`text-sm transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'}`}><span className="text-slate-400 italic">Saving...</span></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-[300px]">
                <div className="flex flex-col">
                    <label className="text-lg font-semibold text-blue-300 mb-2">My Focus</label>
                    <div className="flex-grow w-full bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
                        <div className="flex-grow space-y-2 overflow-y-auto pr-2 -mr-3">
                            {focusItems.length === 0 && <p className="text-slate-500 text-center py-4">Click "Add Item" to get started.</p>}
                            {focusItems.map((item) => (
                                <div key={item.id} className={`flex items-start gap-2 group p-2 rounded-md border transition-colors ${statusBorderStyles[item.status]}`}>
                                    <textarea value={item.text} onChange={(e) => handleUpdateItemText(item.id, e.target.value)} placeholder="Enter focus item..." className="flex-grow w-full bg-transparent p-0 text-slate-200 placeholder-slate-500 focus:outline-none resize-none text-sm" rows={1} onFocus={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`; }} onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`; }} />
                                    <div className="pt-1 flex items-center gap-1.5 shrink-0">
                                        <StatusSelector status={item.status} onSelect={(status) => handleUpdateItemStatus(item.id, status)} />
                                        <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete item"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 mt-auto border-t border-slate-700/50">
                            <button onClick={handleAddItem} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-semibold p-1 -m-1 rounded"><PlusIcon className="w-4 h-4" /> Add Item</button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="pointers-text" className="text-lg font-semibold text-purple-300 mb-2">Pointers / Notes</label>
                    <textarea id="pointers-text" value={pointersText} onChange={handlePointersChange} className="flex-grow w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" aria-label="Pointers and notes" />
                </div>
            </div>
        </div>
    );
};
