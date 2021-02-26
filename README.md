# Dependency-Analyzer
Dependency analizer made for NaNLABS challenge. Clone the repo and run
	`npm install`
1. The project already has a csv created to test it.
2. It includes one row that does not have a file (trello), to make sure validations are correct.
3. The project assumes that the folders and files from the htmls are goint to be located in the root folder (like Clarin example)

## Endpoints

- /create to create a new csv file to process
- /content-lengths to get a list with the size from each html file
- /dependencies to get a list of dependencies from each html file
- /frequency to get a list of dependencies and how many times they appear