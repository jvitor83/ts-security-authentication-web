System.register(['oidc-token-manager'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AuthenticationInitializer;
    return {
        setters:[
            function (_1) {}],
        execute: function() {
            /**
             * AuthenticationInitializer
             */
            AuthenticationInitializer = (function () {
                function AuthenticationInitializer() {
                    this.AuthenticationManagerSettings = null;
                    this.AccessTokenContent = null;
                    this.IdentityTokenContent = null;
                    this.ProfileContent = null;
                }
                Object.defineProperty(AuthenticationInitializer, "Current", {
                    get: function () {
                        if (AuthenticationInitializer._current === null) {
                            AuthenticationInitializer._current = new AuthenticationInitializer();
                        }
                        return AuthenticationInitializer._current;
                    },
                    enumerable: true,
                    configurable: true
                });
                AuthenticationInitializer.Reset = function () {
                    AuthenticationInitializer._current = null;
                };
                AuthenticationInitializer.prototype.Init = function (authenticationSettings) {
                    if (authenticationSettings.authority == null || authenticationSettings.client_id == null) {
                        throw "Should be informed at least 'authority' and 'client_id'!";
                    }
                    //Set default values if not informed
                    authenticationSettings.client_url = authenticationSettings.client_url || location.href; //Self uri
                    authenticationSettings.scopes = authenticationSettings.scopes || 'openid profile email offline_access'; //OpenId default scopes
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token'; //Hybrid flow at default
                    authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false; //Redirect for default
                    var localStorage_redirect_uri = localStorage.getItem('redirect_uri');
                    var localStorage_silent_redirect_uri = localStorage.getItem('silent_redirect_uri');
                    var localStorage_post_logout_redirect_uri = localStorage.getItem('post_logout_redirect_uri');
                    //Convert to the more complete IAuthenticationManagerSettings
                    this.AuthenticationManagerSettings =
                        {
                            authority: authenticationSettings.authority,
                            client_id: authenticationSettings.client_id,
                            client_url: authenticationSettings.client_url,
                            open_on_popup: authenticationSettings.open_on_popup,
                            response_type: authenticationSettings.response_type,
                            scopes: authenticationSettings.scopes,
                            redirect_uri: localStorage_redirect_uri || authenticationSettings.client_url + '?callback=true',
                            silent_redirect_uri: localStorage_silent_redirect_uri || authenticationSettings.client_url + "?silentrefreshframe=true",
                            post_logout_redirect_uri: localStorage_post_logout_redirect_uri || authenticationSettings.client_url + "index.html",
                            authorization_url: authenticationSettings.authority + "/connect/authorize",
                            token_url: authenticationSettings.authority + "/connect/token",
                            userinfo_url: authenticationSettings.authority + "/connect/userinfo"
                        };
                    localStorage.setItem('redirect_uri', this.AuthenticationManagerSettings.redirect_uri);
                    localStorage.setItem('silent_redirect_uri', this.AuthenticationManagerSettings.silent_redirect_uri);
                    localStorage.setItem('post_logout_redirect_uri', this.AuthenticationManagerSettings.post_logout_redirect_uri);
                    //TODO: se nao foi informado um redirect_uri, monta-se com base em uma convenção (multi plataform aware)
                    // let url = window.location.href.split("#")[0];
                    // let indexBarra = url.lastIndexOf('/');
                    // let enderecoCallback = url;
                    // enderecoCallback = enderecoCallback.substr(0, indexBarra) + '/callback.html';
                    var config = {
                        authority: this.AuthenticationManagerSettings.authority,
                        client_id: this.AuthenticationManagerSettings.client_id,
                        load_user_profile: true,
                        scope: this.AuthenticationManagerSettings.scopes,
                        response_type: this.AuthenticationManagerSettings.response_type,
                        client_url: this.AuthenticationManagerSettings.client_url,
                        redirect_uri: this.AuthenticationManagerSettings.redirect_uri,
                        post_logout_redirect_uri: this.AuthenticationManagerSettings.post_logout_redirect_uri,
                        silent_redirect_uri: this.AuthenticationManagerSettings.silent_redirect_uri,
                        silent_renew: true,
                        authorization_endpoint: this.AuthenticationManagerSettings.authority + "/connect/authorize",
                        userinfo_endpoint: this.AuthenticationManagerSettings.authority + "/connect/userinfo",
                        authorization_url: this.AuthenticationManagerSettings.authority + "/connect/authorize",
                        token_url: this.AuthenticationManagerSettings.authority + "/connect/token",
                        userinfo_url: this.AuthenticationManagerSettings.authority + "/connect/userinfo"
                    };
                    this.oidcTokenManager = new OidcTokenManager(config);
                };
                AuthenticationInitializer.prototype.ProcessTokenCallback = function () {
                    this.oidcTokenManager.processTokenCallbackAsync();
                    this.GenerateTokens();
                };
                AuthenticationInitializer.prototype.RenewTokenSilent = function () {
                    this.oidcTokenManager.renewTokenSilentAsync();
                    this.GenerateTokens();
                };
                AuthenticationInitializer.prototype.LoginAndProcessToken = function (openOnPopUp) {
                    var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                    //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
                    if (location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri) {
                        this.ProcessTokenCallback();
                    }
                    else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri) {
                        this.RenewTokenSilent();
                    }
                    else if (location.href.substring(0, this.AuthenticationManagerSettings.client_url.length) === this.AuthenticationManagerSettings.client_url) {
                        this.Login(shouldOpenOnPopUp);
                    }
                };
                AuthenticationInitializer.prototype.Login = function (openOnPopUp) {
                    //TODO: Treat when in mobile browser to not support popup
                    var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                    if (shouldOpenOnPopUp) {
                        this.oidcTokenManager.openPopupForTokenAsync();
                    }
                    else {
                        this.oidcTokenManager.redirectForToken();
                    }
                };
                AuthenticationInitializer.prototype.IsAuthenticated = function () {
                    if (this.AccessTokenContent == null) {
                        return false;
                    }
                    else {
                        return true;
                    }
                };
                //TODO: Split the parser to another project (package - ts-security-tokens?)
                //Include refactory at the ts-security-identity also
                AuthenticationInitializer.prototype.GenerateTokens = function () {
                    this.AccessTokenContent = JSON.parse(atob(this.oidcTokenManager.access_token.split('.')[1]));
                    this.IdentityTokenContent = JSON.parse(atob(this.oidcTokenManager.id_token.split('.')[1]));
                    this.ProfileContent = this.oidcTokenManager.profile;
                };
                AuthenticationInitializer._current = null;
                return AuthenticationInitializer;
            }());
            exports_1("AuthenticationInitializer", AuthenticationInitializer);
        }
    }
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1lBT0E7O2VBRUc7WUFDSDtnQkFxQkk7b0JBSVUsa0NBQTZCLEdBQW1DLElBQUksQ0FBQztvQkEySXhFLHVCQUFrQixHQUFRLElBQUksQ0FBQztvQkFDL0IseUJBQW9CLEdBQVEsSUFBSSxDQUFDO29CQUNqQyxtQkFBYyxHQUFRLElBQUksQ0FBQztnQkEvSWxDLENBQUM7Z0JBbEJELHNCQUFrQixvQ0FBTzt5QkFBekI7d0JBRUksRUFBRSxDQUFBLENBQUMseUJBQXlCLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUMvQyxDQUFDOzRCQUNHLHlCQUF5QixDQUFDLFFBQVEsR0FBSSxJQUFJLHlCQUF5QixFQUFFLENBQUM7d0JBQzFFLENBQUM7d0JBQ0QsTUFBTSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQztvQkFDOUMsQ0FBQzs7O21CQUFBO2dCQUVhLCtCQUFLLEdBQW5CO29CQUVJLHlCQUF5QixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzlDLENBQUM7Z0JBVU0sd0NBQUksR0FBWCxVQUFZLHNCQUErQztvQkFFdkQsRUFBRSxDQUFBLENBQUMsc0JBQXNCLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxzQkFBc0IsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLENBQ3hGLENBQUM7d0JBQ0csTUFBTSwwREFBMEQsQ0FBQztvQkFDckUsQ0FBQztvQkFFRCxvQ0FBb0M7b0JBQ3BDLHNCQUFzQixDQUFDLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVU7b0JBQ2xHLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLElBQUkscUNBQXFDLENBQUMsQ0FBQyx1QkFBdUI7b0JBQy9ILHNCQUFzQixDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxhQUFhLElB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LENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzRixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7Z0JBQ3hELENBQUM7Z0JBNUtjLGtDQUFRLEdBQThCLElBQUksQ0FBQztnQkErSzlELGdDQUFDO1lBQUQsQ0FsTEEsQUFrTEMsSUFBQTtZQWxMRCxpRUFrTEMsQ0FBQSIsImZpbGUiOiJzcmMvQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElBdXRoZW50aWNhdGlvblNldHRpbmdzIH0gZnJvbSAnLi9JQXV0aGVudGljYXRpb25TZXR0aW5ncyc7XHJcbmltcG9ydCB7IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJztcclxuLy9yZXF1aXJlKCdvaWRjLXRva2VuLW1hbmFnZXInKTtcclxuLy9pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlci9kaXN0L29pZGMtdG9rZW4tbWFuYWdlci5qcyc7XHJcbmltcG9ydCAnb2lkYy10b2tlbi1tYW5hZ2VyJztcclxuXHJcblxyXG4vKipcclxuICogQXV0aGVudGljYXRpb25Jbml0aWFsaXplclxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIgXHJcbntcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2N1cnJlbnQ6IEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIgPSBudWxsO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IEN1cnJlbnQoKTogQXV0aGVudGljYXRpb25Jbml0aWFsaXplciBcclxuICAgIHtcclxuICAgICAgICBpZihBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLl9jdXJyZW50ID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5fY3VycmVudCA9ICBuZXcgQXV0aGVudGljYXRpb25Jbml0aWFsaXplcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5fY3VycmVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBSZXNldCgpXHJcbiAgICB7XHJcbiAgICAgICAgQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5fY3VycmVudCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvaWRjVG9rZW5NYW5hZ2VyOiBPaWRjLk9pZGNUb2tlbk1hbmFnZXI7XHJcbiAgICAgICAgXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPSBudWxsO1xyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzOiBJQXV0aGVudGljYXRpb25TZXR0aW5ncykgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgPT0gbnVsbCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJTaG91bGQgYmUgaW5mb3JtZWQgYXQgbGVhc3QgJ2F1dGhvcml0eScgYW5kICdjbGllbnRfaWQnIVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL1NldCBkZWZhdWx0IHZhbHVlcyBpZiBub3QgaW5mb3JtZWRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgfHwgbG9jYXRpb24uaHJlZjsgLy9TZWxmIHVyaVxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGVzID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZXMgfHwgJ29wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzJzsgLy9PcGVuSWQgZGVmYXVsdCBzY29wZXNcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUgfHwgJ2NvZGUgaWRfdG9rZW4gdG9rZW4nOyAvL0h5YnJpZCBmbG93IGF0IGRlZmF1bHRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgfHwgZmFsc2U7IC8vUmVkaXJlY3QgZm9yIGRlZmF1bHRcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGxvY2FsU3RvcmFnZV9yZWRpcmVjdF91cmkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncmVkaXJlY3RfdXJpJyk7XHJcbiAgICAgICAgbGV0IGxvY2FsU3RvcmFnZV9zaWxlbnRfcmVkaXJlY3RfdXJpID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3NpbGVudF9yZWRpcmVjdF91cmknKTtcclxuICAgICAgICBsZXQgbG9jYWxTdG9yYWdlX3Bvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwb3N0X2xvZ291dF9yZWRpcmVjdF91cmknKTtcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICAvL0NvbnZlcnQgdG8gdGhlIG1vcmUgY29tcGxldGUgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzXHJcbiAgICAgICAgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSxcclxuICAgICAgICAgICAgY2xpZW50X2lkOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCxcclxuICAgICAgICAgICAgY2xpZW50X3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBvcGVuX29uX3BvcHVwOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlX3R5cGU6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSxcclxuICAgICAgICAgICAgc2NvcGVzOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlcyxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlZGlyZWN0X3VyaSA6IGxvY2FsU3RvcmFnZV9yZWRpcmVjdF91cmkgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsICsgJz9jYWxsYmFjaz10cnVlJyxcclxuICAgICAgICAgICAgc2lsZW50X3JlZGlyZWN0X3VyaTogbG9jYWxTdG9yYWdlX3NpbGVudF9yZWRpcmVjdF91cmkgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsICsgXCI/c2lsZW50cmVmcmVzaGZyYW1lPXRydWVcIixcclxuICAgICAgICAgICAgcG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpOiBsb2NhbFN0b3JhZ2VfcG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCArIFwiaW5kZXguaHRtbFwiLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXV0aG9yaXphdGlvbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvYXV0aG9yaXplXCIsXHJcbiAgICAgICAgICAgIHRva2VuX3VybCA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC90b2tlblwiLFxyXG4gICAgICAgICAgICB1c2VyaW5mb191cmw6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC91c2VyaW5mb1wiXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncmVkaXJlY3RfdXJpJywgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdzaWxlbnRfcmVkaXJlY3RfdXJpJywgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpKTtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpJywgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5wb3N0X2xvZ291dF9yZWRpcmVjdF91cmkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vVE9ETzogc2UgbmFvIGZvaSBpbmZvcm1hZG8gdW0gcmVkaXJlY3RfdXJpLCBtb250YS1zZSBjb20gYmFzZSBlbSB1bWEgY29udmVuw6fDo28gKG11bHRpIHBsYXRhZm9ybSBhd2FyZSlcclxuICAgICAgICAvLyBsZXQgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCIjXCIpWzBdO1xyXG4gICAgICAgIC8vIGxldCBpbmRleEJhcnJhID0gdXJsLmxhc3RJbmRleE9mKCcvJyk7XHJcbiAgICAgICAgLy8gbGV0IGVuZGVyZWNvQ2FsbGJhY2sgPSB1cmw7XHJcbiAgICAgICAgLy8gZW5kZXJlY29DYWxsYmFjayA9IGVuZGVyZWNvQ2FsbGJhY2suc3Vic3RyKDAsIGluZGV4QmFycmEpICsgJy9jYWxsYmFjay5odG1sJztcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICBsZXQgY29uZmlnID0ge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBsb2FkX3VzZXJfcHJvZmlsZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2NvcGU6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2NvcGVzLFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlc3BvbnNlX3R5cGUsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjbGllbnRfdXJsOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZWRpcmVjdF91cmk6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpLFx0XHJcbiAgICAgICAgICAgIHBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5wb3N0X2xvZ291dF9yZWRpcmVjdF91cmksXHJcbiAgICAgICAgICAgIHNpbGVudF9yZWRpcmVjdF91cmk6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSxcclxuICAgICAgICAgICAgc2lsZW50X3JlbmV3OiB0cnVlLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXV0aG9yaXphdGlvbl9lbmRwb2ludDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLCBcclxuICAgICAgICAgICAgdXNlcmluZm9fZW5kcG9pbnQ6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC91c2VyaW5mb1wiLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXV0aG9yaXphdGlvbl91cmwgOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvYXV0aG9yaXplXCIsXHJcbiAgICAgICAgICAgIHRva2VuX3VybCA6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC90b2tlblwiLFxyXG4gICAgICAgICAgICB1c2VyaW5mb191cmw6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC91c2VyaW5mb1wiXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlcihjb25maWcpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9jZXNzVG9rZW5DYWxsYmFja0FzeW5jKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5HZW5lcmF0ZVRva2VucygpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUmVuZXdUb2tlblNpbGVudCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuR2VuZXJhdGVUb2tlbnMoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIExvZ2luQW5kUHJvY2Vzc1Rva2VuKG9wZW5PblBvcFVwPzogYm9vbGVhbilcclxuICAgIHtcclxuICAgICAgICBsZXQgc2hvdWxkT3Blbk9uUG9wVXAgPSBvcGVuT25Qb3BVcCB8fCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm9wZW5fb25fcG9wdXA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdyZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaycgIFxyXG4gICAgICAgIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5Qcm9jZXNzVG9rZW5DYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3NpbGVudF9yZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaydcclxuICAgICAgICBlbHNlIGlmIChsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5SZW5ld1Rva2VuU2lsZW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnY2xpZW50X3VybCcsIHRoZW4gaSBjb25zaWRlciB0byBtYWtlIHRoZSAnbG9naW4nXHJcbiAgICAgICAgZWxzZSBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5Mb2dpbihzaG91bGRPcGVuT25Qb3BVcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgTG9naW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAge1xyXG4gICAgICAgIC8vVE9ETzogVHJlYXQgd2hlbiBpbiBtb2JpbGUgYnJvd3NlciB0byBub3Qgc3VwcG9ydCBwb3B1cFxyXG4gICAgICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoc2hvdWxkT3Blbk9uUG9wVXApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIub3BlblBvcHVwRm9yVG9rZW5Bc3luYygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVkaXJlY3RGb3JUb2tlbigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIEFjY2Vzc1Rva2VuQ29udGVudDogYW55ID0gbnVsbDsgIFxyXG4gICAgcHVibGljIElkZW50aXR5VG9rZW5Db250ZW50OiBhbnkgPSBudWxsO1xyXG4gICAgcHVibGljIFByb2ZpbGVDb250ZW50OiBhbnkgPSBudWxsO1xyXG5cclxuICAgIC8vVE9ETzogU3BsaXQgdGhlIHBhcnNlciB0byBhbm90aGVyIHByb2plY3QgKHBhY2thZ2UgLSB0cy1zZWN1cml0eS10b2tlbnM/KVxyXG4gICAgLy9JbmNsdWRlIHJlZmFjdG9yeSBhdCB0aGUgdHMtc2VjdXJpdHktaWRlbnRpdHkgYWxzb1xyXG4gICAgcHJvdGVjdGVkIEdlbmVyYXRlVG9rZW5zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCA9IEpTT04ucGFyc2UoYXRvYih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuLnNwbGl0KCcuJylbMV0pKTtcclxuICAgICAgICB0aGlzLklkZW50aXR5VG9rZW5Db250ZW50ID0gSlNPTi5wYXJzZShhdG9iKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbi5zcGxpdCgnLicpWzFdKSk7XHJcbiAgICAgICAgdGhpcy5Qcm9maWxlQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlO1xyXG4gICAgfVxyXG4gICAgXHJcblxyXG59Il19
