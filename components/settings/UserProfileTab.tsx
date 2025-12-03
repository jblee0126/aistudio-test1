
import React, { useState, useEffect, useRef } from 'react';
import { useOkr } from '../../App';
import { User } from '../../types';
import { Loader2, Camera } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

const UserProfileTab: React.FC = () => {
    const { currentUser, teams, updateUserProfile, setToast } = useOkr();
    const [formData, setFormData] = useState<Partial<User>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData({
            name: currentUser.name,
            displayName: currentUser.displayName,
            jobTitle: currentUser.jobTitle,
            defaultTeamId: currentUser.defaultTeamId,
            timezone: currentUser.timezone,
        });
    }, [currentUser]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Helper: Compress image to base64 string (max 400x400)
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    // Convert to JPEG with 0.7 quality to save space
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation (limit to ~5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
            setToast({ message: "Image size should be less than 5MB", type: 'error' });
            return;
        }

        setIsImageUploading(true);
        try {
            const compressedBase64 = await compressImage(file);
            // Update immediately
            await updateUserProfile(currentUser.id, { avatarUrl: compressedBase64 });
        } catch (error) {
            console.error("Image processing failed", error);
            setToast({ message: "Failed to upload image. Please try another file.", type: 'error' });
        } finally {
            setIsImageUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            updateUserProfile(currentUser.id, formData);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="p-2 md:p-4">
            <h2 className="text-xl font-semibold mb-6">My Profile</h2>
            
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center mb-8">
                <div 
                    className="relative group cursor-pointer"
                    onClick={() => !isImageUploading && fileInputRef.current?.click()}
                >
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center relative">
                        {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold text-slate-500 dark:text-slate-400">
                                {getInitials(currentUser.name)}
                            </span>
                        )}
                        {isImageUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="text-white animate-spin" size={32} />
                            </div>
                        )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={32} />
                    </div>
                    
                    <div className="absolute bottom-0 right-0 bg-brand-500 text-white p-2 rounded-full shadow-md border-2 border-white dark:border-slate-800 group-hover:scale-110 transition-transform">
                        <Camera size={16} />
                    </div>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Click to change profile picture</p>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                />
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="input-label">Full Name</label>
                        <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="input-style" />
                    </div>
                     <div>
                        <label htmlFor="displayName" className="input-label">Display Name</label>
                        <input type="text" id="displayName" name="displayName" value={formData.displayName || ''} onChange={handleChange} className="input-style" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="email" className="input-label">Email</label>
                    <input type="email" id="email" value={currentUser.email} disabled className="input-style disabled:bg-slate-200/50 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed" />
                </div>
                 <div>
                    <label htmlFor="role" className="input-label">Role</label>
                    <input type="text" id="role" value={currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} disabled className="input-style disabled:bg-slate-200/50 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="jobTitle" className="input-label">Job Title</label>
                        <input type="text" id="jobTitle" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} className="input-style" />
                    </div>
                    <div>
                        <label htmlFor="defaultTeamId" className="input-label">Default Team</label>
                        <select id="defaultTeamId" name="defaultTeamId" value={formData.defaultTeamId || ''} onChange={handleChange} className="input-style" disabled>
                            <option value="">Select a team</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Team assignment is managed by administrators.</p>
                    </div>
                </div>
                <div className="flex justify-start pt-4">
                    <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg disabled:bg-brand-400 disabled:cursor-not-allowed">
                        {isLoading && <Loader2 className="animate-spin" size={18}/>}
                        {isLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
             <style>{`
                .input-label {
                    display: block;
                    margin-bottom: 0.25rem;
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                    font-weight: 500;
                    color: #475569; /* slate-600 */
                }
                .dark .input-label {
                    color: #d1d5db; /* slate-300 */
                }
                .input-style {
                    background-color: rgb(241 245 249 / 1);
                    border: 1px solid rgb(203 213 225 / 1);
                    border-radius: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    width: 100%;
                }
                .dark .input-style {
                    background-color: rgb(51 65 85 / 1);
                    border-color: rgb(71 85 105 / 1);
                }
                .input-style:focus {
                    --tw-ring-color: rgb(14 165 233 / 1);
                    border-color: rgb(14 165 233 / 1);
                    box-shadow: 0 0 0 1px rgb(14 165 233 / 1);
                }
                .input-style:disabled {
                    background-color: rgb(226 232 240 / 0.5);
                    cursor: not-allowed;
                }
                .dark .input-style:disabled {
                    background-color: rgb(71 85 105 / 0.5);
                }
            `}</style>
        </div>
    );
};

export default UserProfileTab;
