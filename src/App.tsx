import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import axios from 'axios';
import './App.css';
import { io } from "socket.io-client";
import { User } from './interfaces';
const socket = io("http://localhost:3001");

function App() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [allMessage, setAllMessage] = useState<string[] | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const allMessageRef = useRef<string[] | null>();
  allMessageRef.current = allMessage;
  
  const checkIfLoggedIn = () => {
    const user = localStorage.getItem('user');
    console.log('USER_LOGGED_IN user', user);
    
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  };

  useEffect(() => {
    checkIfLoggedIn();
    socket.on("connect", () => {
      console.log('[SOCKET socket.id]', socket.id); // x8WIv7-mJelg7on_ALbx
    });
    socket.on("NEW_MESSAGE", (arg) => {
      console.log('NEW_MESSAGE', arg); // world
      pushToMessage(arg);
    });
    socket.on("NEW_USER", (arg) => {
      console.log('NEW_USER', arg); // world
      pushToMessage(`New user joined: ${arg.name}`);
    });
    socket.on("NEW_MESSAGE", (arg) => {
      console.log('NEW_MESSAGE', arg); // world
      pushToMessage(`[${arg.user.name}]\n${arg.message}`);
    });
    return () => {
      socket.off('NEW_MESSAGE');
      socket.off('NEW_USER');
    }
  }, [])

  const submit = () => {
    setCurrentRoom(currentRoomName);
    socket.emit('JOIN_ROOM', { roomId: currentRoomName, user: currentUser });
  }

  const submitMessage = () => {
    socket.emit('NEW_MESSAGE', { message: currentMessage, roomId: currentRoomName, user: currentUser });
    if (currentMessage) {
      pushToMessage(currentMessage);
    }
    setCurrentMessage(null);
  }

  const pushToMessage = (arg: string) => {
    let allMessageTmp = [];
    console.log('NEW_MESSAGE allMessageRef.current', allMessageRef.current);
    if (allMessageRef.current && allMessageRef.current.length > 0) {
      allMessageTmp = JSON.parse(JSON.stringify([...allMessageRef.current]));
      allMessageTmp.push(arg);
    } else {
      allMessageTmp = [arg]
    }
    console.log('NEW_MESSAGE allMessageTmp', allMessageTmp);
    setAllMessage(allMessageTmp);
  }

  const login = async () => {
    if (email && email !== '' && password && password !== '') {
      try {
        const response = await axios.post('http://localhost:3001/users/authenticate', { email, password });
        console.log('[LOGIN_RESPONSE response]', response);
        if (response) {
          setCurrentUser(response.data.data.user);
          const finalData = {...response.data.data.user, token: response.data.data.token};
          console.log('[LOGIN_RESPONSE finalData]', finalData);
          localStorage.setItem('user', JSON.stringify(finalData));
        } else {
          throw 'ERROR';
        }
      } catch (error) {
        alert('Cannot login')  
      }
    } else {
      alert('Please add email and password')
    }
  }

  return (
    <div>

      {!currentUser ? (
        <div className="room-cont">
          <div className='room-tf-cont'>
            <h2>Login</h2>
            <h3>Email</h3>
            <input onChange={(e) => setEmail(e.target.value)} type={'text'} className='room-tf' />
            <h3>Password</h3>
            <input onChange={(e) => setPassword(e.target.value)} type={'text'} className='room-tf' />
            <button onClick={(e) => login()}>Submit</button>
          </div>
        </div>
      ) : currentRoom ? (
        <div className="messages-cont">
          <div className='top-messages-cont'>
            {allMessage && Array.isArray(allMessage) && allMessage.length > 0 ? (
              <div>
                {allMessage.map(message => (
                  <div><strong>Message</strong>: {message}</div>
                ))}
              </div>
            ) : (
              <h3>No messages</h3>
            )}
          </div>
          <div className='bottom-tf-cont'>
            <input onChange={(e) => setCurrentMessage(e.target.value)} type={'text'} className='room-tf' />
            <button onClick={(e) => submitMessage()}>Submit</button>
          </div>
        </div>
      ) : (
        <div className="room-cont">
          <div className='room-tf-cont'>
            <h2>Enter Room Name</h2>
            <input onChange={(e) => setCurrentRoomName(e.target.value)} type={'text'} className='room-tf' />
            <button onClick={(e) => submit()}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
