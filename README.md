# pong

Online multiplayer implementation of the classic arcade game pong.

[How to Run pong Locally](#how-to-run-pong-locally)  
[How to Run pong on Azure](#how-to-run-pong-on-azure)

This project is built with React.js on the front end, Node.js on the back end, and runs on Azure.
You can find it [here](20.151.202.31)(*).
This project also uses Express.js to serve the content and Socket.io for real-time communication.

I built this project with the goal of learning how to implement an online multiplayer game.
I consider it a success because I learned a lot about various web and cloud technologies.
I kept the game concept simple for this project so I could really focus on the technical aspects.

(*) The virtual machine running pong may not be available since I am using my Visual Studio Professional Subscription Azure Credits which do not come with any Service Level Agreement from Microsoft.

## Communication Architecture Overview

Initially, the starting settings for the game are set on both the client and the server.
Once a game connection is established with a game code and both players are ready, the game loop starts on the server.
Every 33 ms, the server sends a "ping" to both clients.
This ping contains all the state information for the game (e.g., location of each player's paddle, the ball's location and velocity, etc.).
The client uses this information to render the game to the player.
The client then sends back a ping response which contains a move request.
The value of the move request is based on what keys the player is pressing (e.g., up, down).
The server takes this information and updates the paddle locations of both players.
When it is time for the next ping, the server determines the next location of the ball and updates it's velocity before sending the updated game data to the clients.

## How to Run pong Locally

First install Node.js and npm on your system if you do not have them already.
I highly recommend using your systems package manager through the command line to do this.

Next, optionally fork, and clone the repository to your computer.

Now you need to install the dependencies that the project uses from npm.
To do this, navigate to the cloned folder and run the command `npm install`.

Now you should be able to run the project with the command `node pongServer.js --debug`.
The `--debug` option uses port 3000 to listen for connections.

In a browser window, navigate to [localhost:3000](localhost:3000), or if you want to run it on a different port, change the `PORT` variable in `pongServer.js` and replace the `3000` with whatever port number you choose.

You can open two browser windows and play against yourself by switching between them to test the game.

If you want to develop pong further, I also recommend installing the React Developer Tools (available as a browser plugin for most browsers).

## How to Run pong on Azure

If you want to make pong available for other people to access it over the internet, you can run it on an Azure virtual machine.
You can run it on any other cloud service if you want and the process should be largely the same, but this quick guide will focus on Azure. This guide should work in MacOS and Linux, but the methods to accomplish some steps may differ on windows.

First, get setup with Azure and make sure you have a subscription that has either credits or a payment method.
Login to the Azure Portal from a web browser.

Next, create a virtual machine resource and name it whatever you like.
On the `Basics` tab, the important options and their settings are:
- `Region`: Pick something physically close to you.
- `Image`: Ubuntu Server 20.04 LTS - Gen2.
- `Size`: Standard_B1ls. This is the smallest/cheapest size available. You can use a larger size if you want but it is probably not needed.
- `Username`: Use any name you want. This is the username you will use to connect to the virtual machine over SSH.
- `Authentication Type`: SSH Public Key.
- `SSH public key source`: Create new pair.
- `Public inbound ports`: Allow selected ports.
- `Select inbound ports`: Check SSH and HTTP.

On the disks tab:
- `OS disk type`: Standard SSD. A premium SSD won't make a difference here since a game runs only in memory.

On the management tab:
- `Enable auto-shutdown`: Uncheck this to turn it off.

At this point you can to the create and review tab and create the virtual machine.
When you press the create option, you will be prompted to download the private key.
Download this and save it to a safe location, if you loose it, you will not be able to SSH into your virtual machine.

There is one last thing to do in the web portal.
Go to the resource group that was created along with, and contains, your virtual machine.
Go to the Network Interface resource and then the IP Configurations tab.
Go to `ipconfig1` and select `Disassociate` for the public IP address and save the change.
This will allow up to change the IP address from dynamic to static.
To do this, go back to the resource group and then go to the Public IP Address resource.
Go to the Configuration tab and change the IP address assignment from dynamic to static, then save the change.
Now we need to re-associate this IP with the network interface so navigate back to `ipconfig1` under the IP Configurations tab of the Network Interface resource.
Select `Associate` and then select the IP address that we just changed from the dropdown.
Save the change and the virtual machine should be completely configured!

Connect to your virtual machine using SSH and provide the private key that was downloaded earlier to authenticate yourself.
Fist, you need to change the permissions on the private key file.
To do this, use the command `sudo chmod 600 /path/to/private_key.cer`.
Then the SSH command is `ssh -i /path/to/private_key.cer username@IP_Address` where you replace `/path/to/private_key.cer`, `username`, and `IP_Address` with the values from your setup.
If this is your first time connecting to the virtual machine, you will be asked if you are sure you want to continue; select yes.

Now we need to install Node.js and npm on the virtual machine.
Run the command `sudo apt-get update` to update apt so it can find the packages.
Then run `sudo apt install nodejs npm` to install Node.js and npm.

To get the code, just clone the GitHub repository to the virtual machine.
You also need to download the required dependencies from npm, and you can do this by navigating to the cloned directory and running `npm install`.

At this point, you can run pong with `sudo node pongServer.js --release` and pong will be available over the internet to anyone that goes to the IP address of your virtual machine.
The `--release` option specifies that the server should listen on port 80, which is the default HTTP port.
The `sudo` option is necessary because root access is required to access port 80.
However there is still one issue: if you logout of the virtual machine the process running pong will end.
To fix this, we can use a program called [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/) that helps manage running Node.js programs.
Install pm2 with `sudo npm install pm2@latest -g`.
Now you can start a pongServer process in the background with `sudo pm2 start pongServer.js -- --release`.
This process will continue running even if you log out of the virtual machine.
If you want to end the process, you can use `sudo pm2 delete pongServer`.

## Conclusion

Thanks for taking an interest in pong!
If you found the code and this guide to be useful, I would appreciate a star on the repository!

Happy coding!
