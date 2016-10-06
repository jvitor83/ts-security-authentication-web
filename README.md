# ts-security-authentication-web

A lightweight Typescript Security Identity Framework with Platform-Agnostic purposes (slightly based on WIF).

# 1. Getting Started

##  1.1 Installing

Install package from using npm
```sh
	npm install --save ts-security-authentication-web
```

##  1.2 Build

Configure your build system to copy the files from `node_modules/ts-security-authentication-web` to your `dist/vendor/ts-security-authentication-web` folder. 


## 1.3 Configuring

Recommendation to use [SystemJS](https://github.com/systemjs/systemjs) to load the package at runtime. 
```javascript
System.config({ 
  map: {
    'ts-security-authentication-web': 'vendor/ts-security-authentication-web/dist/prod/js/src/'
  },
  packages: {
    'ts-security-authentication-web': {
      main: 'index.js'
    }
  }
 });
```
or
```javascript
System.config({ 
  packageConfigPaths: ['vendor/ts-security-authentication-web/package.json']
 });
```


# 2. Using

##  2.1 Initializing

To initialize, is needed to invoke the Init method.

```typescript
let config :IAuthenticationSettings = {
        authority: 'http://idp-teste.tjmt.jus.br',
        client_id: '2380',
        client_url: 'http://localhost:5555/'
};
AuthenticationContext.Current.Init(config).then(() => {
    console.log('Initialized!');
});
```


##  2.2 Login
 
 Request the login:
 
```typescript
    AuthenticationContext.Current.Login();
```


##  2.2 Tokens

 Get the tokens (contents and encoded):

```typescript
    let jsons: any[] = AuthenticationContext.Current.TokensContents.tokensContentsToArray(true);
```


##  2.3 Events

 OnTokenObtained:

```typescript
    let loginProcess = () => {
        let jsons: any[] = AuthenticationContext.Current.TokensContents.tokensContentsToArray(true);
        SecurityContextInitializer.InitializeWithTokens(jsons);
        console.debug('Authenticated as: ' + SecurityContext.Current.Principal.Identity.Name);
        return jsons;
    };
    AuthenticationContext.Current.AddOnTokenObtained(loginProcess);
```


#  3 Sample

 Working sample:

```typescript
let config :IAuthenticationSettings = {
        authority: 'http://idp-teste.tjmt.jus.br',
        client_id: '2380',
        client_url: 'http://localhost:5555/'
};

AuthenticationContext.Current.Init(config).then(() => {
    
    let loginProcess = () => {
        let jsons = AuthenticationContext.Current.TokensContents.tokensContentsToArray(true);
        SecurityContextInitializer.InitializeWithTokens(jsons);
        console.debug('Authenticated as: ' + SecurityContext.Current.Principal.Identity.Name);
        return jsons;
    };

    AuthenticationContext.Current.AddOnTokenObtained(loginProcess);
    AuthenticationContext.Current.Login();

});
```
