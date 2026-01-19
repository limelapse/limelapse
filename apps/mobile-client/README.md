# Install CLI

```sh
npm install -g @ionic/cli
```

# Add native platform

```sh
ionic cap add ios
```

```sh
ionic cap add android
```

# Run iOS simulator (MacOS only)

1. Install XCode

2. Sync iOS project

```sh
ionic cap sync
```

3. Open the project in XCode:

```sh
ionic cap open ios
```

4. Start the simulator in XCode

5. Start app

```sh
ionic cap run ios --livereload --external
```
