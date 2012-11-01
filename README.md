Tronline
===============

An online multiplayer version of the game "Tron". It uses nodejs and socket.io for the server, and communicates using WebSockets.

This project will be an online multiplayer version of the game Tron.
The game will be able to have at least 10 players in each game and a maximum of around 100 players.
The game will be web-based and will use the HTML5 Canvas for the graphics, and JavaScript for the logic.
The server will use Node JS to process player movements and chat messages in the lobby.
Gameplay should be as close to real-time as possible and should use Web Sockets in order to have fast communication between the server and client.
As well as the classic Tron rules, the game will incorporate some extra power-ups/rules to make the game more unique and interesting.

Some of the power-ups that will be included are:
* Make your player wider
* Make your player thinner
* Make your player invincible for a short period of time (allowing players to escape sticky situations)
* Infect other players - swap positions with another player (players will change into each other’s colour from tail to head and once complete, each player will now have control of the other one)
* Make your player explode the area around (explode in a radius around you, destroying all trails in the area)
* Make your player let out gas that randomly moves players in different directions when they come in contact with the gas
* Swap ends (player begins moving from tail instead of head)
* Anti-ageing elixir (shrink your player’s tail - rare)
* Make your player speed up
* Make your player slow down
* Make your player leave no trail for a short period of time

A normal two player mode should also be available to play locally.

There will be a lobby to chat in when you are not in game or dead and want to watch your current game finish.
In every game, players should be able to see all the other players’ names above their heads and also at the top of the screen.
