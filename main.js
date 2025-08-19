import React, { useEffect, useState, Suspense, lazy} from 'react';
//import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import '../App.css';
import {db,auth} from '../config/firebase.js';
import moment from 'moment';
import { AnimatePresence, motion } from "framer-motion";
import { Logout } from './logout.js';
import { Popup } from './popup.js';
import {getDocs,collection,addDoc,deleteDoc,updateDoc,doc, query, where} from 'firebase/firestore';
import axios from 'axios';
import { form } from 'framer-motion/m';

const Navigation = lazy(() => import('./navigation.js'));

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 1, 
        delay: 1,  // Add delay here (in seconds)
        ease: "easeInOut"
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { 
        duration: 1, 
        ease: "easeInOut" 
      } 
    }
};

export const Main = () => {

    //databases
    //const habitsref = collection(db, "collectionname");

    //states
    const [input, setInput] = useState('');
    const [states, setStates] = useState(['classify']);
    const [statecount, setStatecount] = useState(1);
    const [shorttermmemory, setShorttermmemory] = useState({});
    const [response, setResponse] = useState([]);
    const [loading, setLoading] = useState(false);

    const placeholderText = 
    "You can ask the Agent to:\n\n" +
    "- Practice Leetcode problems from Neetcode 150 (will help you learn with spaced repetition!)\n\n" +
    "- Practice specific Leetcode topics from Neetcode 150 (e.g., 'Practice trees and graphs') to go through all problems in those topics\n\n" +
    "- View your learning plan or topics in your problem set\n\n" +
    "- Change your learning rate (how many new problems to learn a day e.g., 'Set my learning rate to 3')\n\n" +
    "- Tell the Agent if you’re struggling with certain topics (Agent will change your learning plan accordingly)\n\n" +
    "- Request a performance review of your progress\n\n" +
    "Just type and send your request!";

    useEffect(() => {
      const checkAndUpdateFlashcards = async () => {
        try {
            // Get settings document for current user
            const settingsRef = collection(db, "settings");
            const settingsQuery = query(settingsRef, where("userId", "==", auth.currentUser?.uid));
            const settingsSnapshot = await getDocs(settingsQuery);
            
            if (!settingsSnapshot.empty) {
                const settingsDoc = settingsSnapshot.docs[0].data();
                const today = moment().format('DD/MM/YYYY');
                
                // Only update flashcards if lastflashcardupdate is not today
                if (settingsDoc.lastflashcardupdate !== today) {
                    await updateFlashcards();
                    
                    // Update the lastflashcardupdate field
                    const docRef = doc(db, "settings", settingsSnapshot.docs[0].id);
                    await updateDoc(docRef, {
                        lastflashcardupdate: today
                    });
                }
            }
        } catch (error) {
            console.error("Error checking settings:", error);
        }
      };

      checkAndUpdateFlashcards();
    }, []);


    const handleInputChange = (event) => {
      setInput(event.target.value);
    };

    const calculateResponse = async () => {
      //here I will do the api call
      setResponse('');
      setLoading(true);

      const postData = {
        userinput: input,
        username: auth.currentUser?.uid,
        userstate: states,
        userstatecount: statecount,
        usershorttermmemory: shorttermmemory
      };

      // http://192.168.0.19:5000/api/agentresponse

      axios.post('https://tej17-api.onrender.com/api/agentresponse', postData)  // Flask POST API endpoint
      .then(response => {
        if(response.data.agentoutput !== ""){
          setResponse(response.data.agentoutput);
          setInput('');  // Clear input after response
        }

        if(response.data.newstate.length > 0){
          setStates(response.data.newstate);
        } else {
          setStates(['classify']);
        }

        setStatecount(response.data.newstatecount);
        setShorttermmemory(response.data.newshorttermmemory);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error posting data:', error);
      });

    }

    const updateFlashcards = async () => {
        try {
            const flashcardsRef = collection(db, "flashcards");
            const q = query(flashcardsRef, where("userId", "==", auth.currentUser?.uid));
            const querySnapshot = await getDocs(q);

            const today = moment();

            querySnapshot.forEach(async (document) => {
                const flashcard = document.data();
                let newDaysLeft;

                if (flashcard.lastcompleted === "*") {
                    // For uncompleted flashcards, just decrement by 1
                    newDaysLeft = Math.max(0, flashcard.daysleft - 1);
                } else {
                    // For completed flashcards, calculate days difference
                    const lastCompleted = moment(flashcard.lastcompleted, "DD/MM/YYYY");
                    const daysDifference = today.diff(lastCompleted, 'days');

                    if (daysDifference > 0) {
                        newDaysLeft = Math.max(0, flashcard.daysleft - daysDifference);
                    } else {
                        return; // Skip if lastcompleted is today or in future
                    }
                }

                // Update the document
                const docRef = doc(db, "flashcards", document.id);
                await updateDoc(docRef, {
                    daysleft: newDaysLeft
                });
            });
        } catch (error) {
            console.error("Error updating flashcards:", error);
        }
    };

    return(
        <Suspense fallback={
      <div className="wrapper">
        <div className="round"></div>
        <div className="round"></div>
        <div className="round"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
      </div>
    }>
      <AnimatePresence mode="wait">
        <>
          <motion.div className='centered-container' {...pageVariants}>
            <Logout/>
            {loading &&
              <div className="wrapper">
                <div className="round"></div>
                <div className="round"></div>
                <div className="round"></div>
                <div className="shadow"></div>
                <div className="shadow"></div>
                <div className="shadow"></div>
              </div>
            }
            {response.length > 0 &&
              /*<div>
                {response.map((item, idx) => (
                  <p key={idx} className="preserve-whitespace">{item}</p>
                ))}
              </div>*/
              <>
                <motion.textarea
                  className="preserve-whitespace"
                  value={response.join('\n\n')}
                  readOnly
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </>
            }
            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder={placeholderText}
            />
            <button onClick={calculateResponse} className="animated-button" width="140px">
              <svg className="arr-1" viewBox="0 0 32 32" version="1.1" fill="#000000">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <title>arrow-right-square</title>
                  <desc>Created with Sketch Beta.</desc>
                  <defs></defs>
                  <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g id="Icon-Set" transform="translate(-464.000000, -983.000000)" fill="#EAB03C">
                      <path d="M494,1011 C494,1012.1 493.104,1013 492,1013 L468,1013 C466.896,1013 466,1012.1 466,1011 L466,987 C466,985.896 466.896,985 468,985 L492,985 C493.104,985 494,985.896 494,987 L494,1011 L494,1011 Z M492,983 L468,983 C465.791,983 464,984.791 464,987 L464,1011 C464,1013.21 465.791,1015 468,1015 L492,1015 C494.209,1015 496,1013.21 496,1011 L496,987 C496,984.791 494.209,983 492,983 L492,983 Z M487.535,998.121 L481.879,992.465 C481.488,992.074 480.855,992.074 480.465,992.465 C480.074,992.854 480.074,993.488 480.465,993.879 L484.586,998 L474,998 C473.447,998 473,998.447 473,999 C473,999.552 473.447,1000 474,1000 L484.586,1000 L480.465,1004.12 C480.074,1004.51 480.074,1005.14 480.465,1005.54 C480.855,1005.93 481.488,1005.93 481.879,1005.54 L487.535,999.879 C487.775,999.639 487.85,999.311 487.795,999 C487.85,998.689 487.775,998.361 487.535,998.121 L487.535,998.121 Z" id="arrow-right-square"></path>
                    </g>
                  </g>
                </g>
              </svg>
              <span className="text">Send</span>
              <span className="circle"></span>
              <svg className="arr-2" viewBox="0 0 32 32" version="1.1" fill="#EAB03C" stroke="#EAB03C">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <title>arrow-right-square</title>
                  <desc>Created with Sketch Beta.</desc>
                  <defs></defs>
                  <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g id="Icon-Set" transform="translate(-464.000000, -983.000000)" fill="#000000">
                      <path d="M494,1011 C494,1012.1 493.104,1013 492,1013 L468,1013 C466.896,1013 466,1012.1 466,1011 L466,987 C466,985.896 466.896,985 468,985 L492,985 C493.104,985 494,985.896 494,987 L494,1011 L494,1011 Z M492,983 L468,983 C465.791,983 464,984.791 464,987 L464,1011 C464,1013.21 465.791,1015 468,1015 L492,1015 C494.209,1015 496,1013.21 496,1011 L496,987 C496,984.791 494.209,983 492,983 L492,983 Z M487.535,998.121 L481.879,992.465 C481.488,992.074 480.855,992.074 480.465,992.465 C480.074,992.854 480.074,993.488 480.465,993.879 L484.586,998 L474,998 C473.447,998 473,998.447 473,999 C473,999.552 473.447,1000 474,1000 L484.586,1000 L480.465,1004.12 C480.074,1004.51 480.074,1005.14 480.465,1005.54 C480.855,1005.93 481.488,1005.93 481.879,1005.54 L487.535,999.879 C487.775,999.639 487.85,999.311 487.795,999 C487.85,998.689 487.775,998.361 487.535,998.121 L487.535,998.121 Z" id="arrow-right-square"></path>
                    </g>
                  </g>
                </g>
              </svg>
            </button>
          </motion.div>
        </>
      </AnimatePresence>
    </Suspense>
    );
}