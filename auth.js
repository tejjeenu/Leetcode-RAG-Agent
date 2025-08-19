import {db, auth, googleProvider } from '../config/firebase';
import {getDocs,getDoc,collection,addDoc,deleteDoc,updateDoc,doc,query,where,setDoc} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword, sendEmailVerification} from 'firebase/auth';
import { AnimatePresence, motion } from "framer-motion";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Popup } from './popup.js';
import '../App.css';

const pageVariants = {
    initial: { opacity: 0, y: 0 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: 0, transition: { duration: 0.3 } }
};

export const Auth = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [issigninPopupOpen, setIssigninPopupOpen] = useState(false);
    const [issignupPopupOpen, setIssignupPopupOpen] = useState(false);
    const [isverificationPopupOpen, setIsverificationPopupOpen] = useState(false);
    const navigate = useNavigate();

    const signUp = async () => {

        try{
            //await createUserWithEmailAndPassword(auth, email, password);
            //navigate("/home"); might just ask to sign in for

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            setIsverificationPopupOpen(true);
        }
        catch(err){
            setIssignupPopupOpen(true);
            //console.error(err);
            //alert(`Sign Up failed: ${err.message}`);
        }
        
    };

    // Helper function to ensure settings doc exists for user
    const ensureUserSettingsDoc = async (userId) => {
        const settingsRef = collection(db, "settings");
        const q = query(settingsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            //get attribute named 'id' from each document in the 'leetcode_solutions' collection
            //order those ids in ascending order
            const questionsRef = collection(db, "leetcode_solutions");
            const questionsSnapshot = await getDocs(questionsRef);
            const newquestions = questionsSnapshot.docs.map(doc => doc.data().id).sort((a, b) => a - b);

            await addDoc(settingsRef, {
                questions: newquestions,
                lastpopped:"*", 
                lastflashcardupdate:"*",
                learningrate:1,
                userId:userId
            });
        }

        navigate("/home");
    };

    const signIn = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (!userCredential.user.emailVerified) {
                setIsverificationPopupOpen(true);
                auth.signOut();
                return;
            }

            await ensureUserSettingsDoc(auth?.currentUser?.uid);
        } catch (err) {
            setIssigninPopupOpen(true);
        }
    }

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            await ensureUserSettingsDoc(auth?.currentUser?.uid);
        } catch (err) {
            console.error(err);
        }
    };

    return(
        <AnimatePresence mode="wait">
        <>
        <motion.div className={(issigninPopupOpen || issignupPopupOpen || isverificationPopupOpen) ? 'centered-container-new' : 'centered-container'} {...pageVariants}>
            <Popup 
              isOpen={issigninPopupOpen} 
              onClose={() => setIssigninPopupOpen(false)} 
              heading={'Sign in Error'}
              subheading={'check if email and/or password is correct'}
            />
            <Popup 
              isOpen={issignupPopupOpen} 
              onClose={() => setIssignupPopupOpen(false)} 
              heading={'Sign Up Error'}
              subheading={'check if email is valid and password is strong enough'}
            />
            <Popup 
              isOpen={isverificationPopupOpen} 
              onClose={() => setIsverificationPopupOpen(false)} 
              heading={'Verify Email'}
              subheading={'check spam folder and verify before sign on'}
            />
            <div className='auth'>
                <h3>Learn Leetcode the smart way</h3>
            </div>
            <div className='auth'>
                <h1>
                    <svg
                      fill="#EAB03C"
                      viewBox="0 0 32 32"
                      stroke="#EAB03C"
                      width="40"
                      height="40"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path d="M21.469 23.907l-3.595 3.473c-0.624 0.625-1.484 0.885-2.432 0.885s-1.807-0.26-2.432-0.885l-5.776-5.812c-0.62-0.625-0.937-1.537-0.937-2.485 0-0.952 0.317-1.812 0.937-2.432l5.76-5.844c0.62-0.619 1.5-0.859 2.448-0.859s1.808 0.26 2.432 0.885l3.595 3.473c0.687 0.688 1.823 0.663 2.536-0.052 0.708-0.713 0.735-1.848 0.047-2.536l-3.473-3.511c-0.901-0.891-2.032-1.505-3.261-1.787l3.287-3.333c0.688-0.687 0.667-1.823-0.047-2.536s-1.849-0.735-2.536-0.052l-13.469 13.469c-1.307 1.312-1.989 3.113-1.989 5.113 0 1.996 0.683 3.86 1.989 5.168l5.797 5.812c1.307 1.307 3.115 1.937 5.115 1.937 1.995 0 3.801-0.683 5.109-1.989l3.479-3.521c0.688-0.683 0.661-1.817-0.052-2.531s-1.849-0.74-2.531-0.052zM27.749 17.349h-13.531c-0.932 0-1.692 0.801-1.692 1.791 0 0.991 0.76 1.797 1.692 1.797h13.531c0.933 0 1.693-0.807 1.693-1.797 0-0.989-0.76-1.791-1.693-1.791z"></path>
                      </g>
                    </svg>
                    Leetcode
                    Agent
                </h1>
            </div>
            <div className="form-control login">
                <input 
                    type="value" 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <label>
                    <span style={{transitionDelay:'0ms'}}>E</span>
                    <span style={{transitionDelay:'50ms'}}>m</span>
                    <span style={{transitionDelay:'100ms'}}>a</span>
                    <span style={{transitionDelay:'150ms'}}>i</span>
                    <span style={{transitionDelay:'200ms'}}>l</span>
                </label>
            </div>

            <div className="form-control login">
                <input 
                    type="password" 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <label>
                    <span style={{transitionDelay: '0ms'}} >P</span>
                    <span style={{transitionDelay: '50ms'}}>a</span>
                    <span style={{transitionDelay: '100ms'}}>s</span>
                    <span style={{transitionDelay: '150ms'}}>s</span>
                    <span style={{transitionDelay: '200ms'}}>w</span>
                    <span style={{transitionDelay: '250ms'}}>o</span>
                    <span style={{transitionDelay: '300ms'}}>r</span>
                    <span style={{transitionDelay: '350ms'}}>d</span>
                </label>
            </div>

            <div className="arrange-horizontal">

              <button onClick={signUp} className="animated-button">
                <svg viewBox="0 0 24 24" className="arr-2">
                  <path
                    d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                  ></path>
                </svg>
                <span className="text">Sign Up</span>
                <span className="circle"></span>
                <svg viewBox="0 0 24 24" className="arr-1">
                  <path
                    d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                  ></path>
                </svg>
              </button>

              <button onClick={signIn} className="animated-button">
                <svg viewBox="0 0 24 24" className="arr-2">
                  <path
                    d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                  ></path>
                </svg>
                <span className="text">Sign In</span>
                <span className="circle"></span>
                <svg viewBox="0 0 24 24" className="arr-1">
                  <path
                    d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                  ></path>
                </svg>
              </button>

            </div>

            <button onClick={signInWithGoogle} className="animated-button">
              <svg preserveAspectRatio="xMidYMid" viewBox="0 0 256 262" className="arr-2">
                <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
                <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
              </svg>
              <span className="text">Sign In</span>
              <span className="circle"></span>
              <svg preserveAspectRatio="xMidYMid" viewBox="0 0 256 262" className="arr-1">
                <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
                <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
              </svg>
            </button>

        </motion.div>
        </>
        </AnimatePresence>
    );

}