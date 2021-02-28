# Dependency-Analyzer
Dependency analizer made for NaNLABS challenge. 

Clone the repo and run
	`npm install`
	
To start the app run
	`node index.js`
	
or if you have nodemon
	`nodemon index.js`

The default port is setted at 3000

1. The project already has a csv created to test it.
2. It includes one row that does not have a file (trello), to make sure validations are correct.
3. The project assumes that the folders and files from the htmls are located in the root folder (like Clarin example)
4. For practical purposes, all the functionality of the app is reflected in the index.js file for this little challenge. In a real case, it would be convenient to separate the different functionalities into different files.

## Endpoints

- /create to create a new csv file to process
- /content-lengths to get a list with the size from each html file
- /dependencies to get a list of dependencies from each html file
- /frequency to get a list of dependencies and how many times they appear
