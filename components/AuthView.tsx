import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider, createUserProfileDocument } from '../firebase';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { LoadingSpinner } from './LoadingSpinner';

export const AuthView: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        if (isLogin) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err: any) {
                setError(err.message.replace('Firebase: ', ''));
            }
        } else { // Sign Up
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setLoading(false);
                return;
            }
             if (username.length < 3) {
                setError("Username must be at least 3 characters long.");
                setLoading(false);
                return;
            }
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!passwordRegex.test(password)) {
                setError("Password must be 8+ characters and include an uppercase letter, a number, and a symbol.");
                setLoading(false);
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Immediately create the user profile with the chosen username
                await createUserProfileDocument(userCredential.user, { username });
            } catch (err: any) {
                setError(err.message.replace('Firebase: ', ''));
            }
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            // FIX: Added missing curly braces for the catch block which caused a syntax error.
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center p-4 bg-[--color-obsidian-slate] overflow-y-auto">
             <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(ellipse 50% 40% at 20% 15%, rgba(0, 191, 255, 0.1), transparent),
                                  radial-gradient(ellipse 50% 40% at 80% 20%, rgba(139, 92, 246, 0.1), transparent)`
            }}></div>

            <div className="relative bg-[--color-dark-matter]/50 backdrop-blur-lg border border-[--color-border] rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-fade-in-up my-auto">
                <div className="flex items-center justify-center space-x-3 mb-6">
                    <ChartBarIcon className="w-10 h-10 text-[--color-neural-blue]" />
                    <h1 className="text-3xl font-bold tracking-tight text-[--color-ghost-white]">Forex TA Pro</h1>
                </div>

                <h2 className="text-2xl font-bold text-[--color-ghost-white]">
                    {isLogin ? 'Sign In' : 'Create Account'}
                </h2>

                <form onSubmit={handleAuthAction} className="mt-6 text-left space-y-4">
                     {!isLogin && (
                         <div>
                            <label htmlFor="username" className="block text-sm font-medium text-[--color-ghost-white]/80 mb-1">Username</label>
                            <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-[--color-obsidian-slate] border border-[--color-border] rounded-lg py-2 px-3 text-[--color-ghost-white] focus:ring-2 focus:ring-[--color-neural-blue]" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[--color-ghost-white]/80 mb-1">Email</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[--color-obsidian-slate] border border-[--color-border] rounded-lg py-2 px-3 text-[--color-ghost-white] focus:ring-2 focus:ring-[--color-neural-blue]" />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-[--color-ghost-white]/80 mb-1">Password</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[--color-obsidian-slate] border border-[--color-border] rounded-lg py-2 px-3 text-[--color-ghost-white] focus:ring-2 focus:ring-[--color-neural-blue]" />
                    </div>
                    {!isLogin && (
                        <div>
                            <label htmlFor="confirm-password"className="block text-sm font-medium text-[--color-ghost-white]/80 mb-1">Confirm Password</label>
                            <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full bg-[--color-obsidian-slate] border border-[--color-border] rounded-lg py-2 px-3 text-[--color-ghost-white] focus:ring-2 focus:ring-[--color-neural-blue]" />
                        </div>
                    )}

                    {error && <p className="text-sm text-[--color-warning-red] text-center">{error}</p>}

                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-3 px-4 bg-[--color-neural-blue] text-[--color-obsidian-slate] font-semibold rounded-lg shadow-md hover:bg-[--color-neural-blue]/80 disabled:bg-[--color-border]">
                        {loading ? <LoadingSpinner /> : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="mt-4 relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[--color-border]"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-[--color-dark-matter] text-[--color-muted-grey]">Or continue with</span></div>
                </div>

                <button onClick={handleGoogleSignIn} disabled={loading} className="w-full mt-4 flex items-center justify-center py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20">
                   {/* Google Icon SVG */}
                   <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.438 36.372 48 30.656 48 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                    Sign in with Google
                </button>

                <p className="mt-6 text-sm">
                    <span className="text-[--color-muted-grey]">{isLogin ? "Don't have an account?" : "Already have an account?"} </span>
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-medium text-[--color-neural-blue] hover:underline">
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
};