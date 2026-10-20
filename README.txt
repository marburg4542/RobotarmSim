I used REACT + VITE(v6.3.5) + daisyUI to create this web-ui
Overall of this project is to build up the web-ui for controlling 6 dof robotic arm which included all the functions below:

On LOGIN screen
    u have to register ur account and login to use the web-ui, after u logged in, u gonna move to homepage automatically

On HOMEPAGE screen
- connection button (connect/disconnect)
- speed control (10-100%)
- movement mode (moveL/moveJ)
- jog step control (1x, 5x, 10x, 20x, 30x)
- live sync (set web-ui parameters to sync with robot)
- gripper control (vary on/off angles)
- I/O setting (add I/O which can be input or output)

- Limitaion alert 
    if move to maximum angle that each servo can reached, alert gonna popup on the screen

- emergency stop 
    if press the emergency stop button, the robot will be stop at current postion and after u press the reset button ur robot gonna move back to home position

- path setting
    - new path (crate new path to ur path planning)
    - add point (after u create a new path, u must click add point to ur path planning as well)
    - paste (in case of u already created path and u also want the same thing, u can press copy&paste path to ur path planning again)

- path planning 
    u can setup the path that u want the robot to moving to

- import/export path planning 
    u can import/export as a json file *** copy&paste it in a new file as .txt file and save it in ur computer ***

- live stream (we used raspi-camera to live stream and send it to ur computer using port 8765)
- console log button 📑 (display logs that hooks from terminal ** easy for debugging, u don't have to check from cmd/terminal)
- swap icon 🎮/👾 (switch from manual to AI mode *** we haven't done the AI mode yet, if u still want this function u gotta create it by yourself)

On ABOUT US screen
    not special just had all the rolls of each member in our team

On SETTING screen
    u can change avatar(profile pic), username & password from here

*** In case of forgot ur password, u can reset ur password on login screen and it will send u an email to reset ur password

*** If u don't want any login components because it's unnecessary include register, reset password, change username/password, u gotta change all the code stuctures by yourself
    *** U CAN DELETE UNNECESSARY FILES AND CHANGE THE STUCTURE FROM App.jsx ***

If u want to leave it there, u gotta change .env file in sever folder (MONGODB_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS)
*** we used mongoDB as a database to collect all the username/password ***

When u gonna use the web-ui, u have to
    "cd server" and run "npm start" after that u have to open another terminal and run "npm run dev"
