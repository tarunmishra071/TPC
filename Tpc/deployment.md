Open a terminal in project root folder
Run the following command to install firebase-tools globally

```
npm install -g firebase-tools
```

## Login to firebase

```
firebase login
```

## List your firebase projects

```
firebase projects:list
```

## Link your project to firebase

```
firebase use <project_id>
```

## Initialize firebase

```
firebase init
```

Select Hosting and press spacebar to select it. Press enter to confirm your choice.

## Build your project

```
npm run build
```

Note: build output directory is build, firebase.json is configured to use this directory as public directory.

## Deploy your project

```
firebase deploy
```
