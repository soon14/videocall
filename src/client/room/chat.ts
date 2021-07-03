import { sendToServer } from "./socketConnection";

 const chatInput: HTMLTextAreaElement = (document.getElementById("chat_input") as HTMLTextAreaElement);
 const chatToggle = document.getElementById("chat_toggle");
 const chatButton = document.getElementById("chat_button");
 const chatScreen = document.getElementById("chat_screen");
 const hideButton = document.getElementById("hide_chat");
 
 chatButton.onclick = sendMsg;
 
 function sendMsg() {
   const msg = chatInput.value;
   if (msg.length > 0) {
     sendToServer({
       type: "message",
       payload: msg,
     });
     receiveMsg(msg); // add it to local chat screen as well
     chatInput.value = "";
   }
   chatInput.style.display = "none";
   chatButton.style.display = "none";
   chatToggle.style.display = "block";
 }
 
 export function receiveMsg(msg: string) {
   // show chat (if not already visible)
   chatScreen.style.display = "block";
   hideButton.style.display = "block";
   // create element for new msg and append it
   const par = document.createElement("p");
   par.innerText = msg;
   par.className = "chat_message";
   chatScreen.appendChild(par);
   // scroll to see the new message
   chatScreen.scrollTop = chatScreen.scrollHeight;
 }
 
 chatToggle.onclick = (event) => {
   event.stopPropagation(); // prevent window onclick listener
   // show input and send button
   chatInput.style.display = "block";
   chatButton.style.display = "block";
   // show chat (if not already visible)
   chatScreen.style.display = "block";
   hideButton.style.display = "block";
   // hide chat button
   chatToggle.style.display = "none";
 
   chatInput.focus();
 };
 
 hideButton.onclick = () => {
   chatScreen.style.display = "none";
   hideButton.style.display = "none";
 }
 