declare namespace Oidc {

    interface Logger {
        error(message?: any, ...optionalParams: any[]): void;
        info(message?: any, ...optionalParams: any[]): void;
        warn(message?: any, ...optionalParams: any[]): void;
    }
    interface AccessTokenEvents {

        load(container: User): void;

        unload(): void;

        addAccessTokenExpiring(callback: (...ev: any[]) => void): void;
        removeAccessTokenExpiring(callback: (...ev: any[]) => void): void;

        addAccessTokenExpired(callback: (...ev: any[]) => void): void;
        removeAccessTokenExpired(callback: (...ev: any[]) => void): void;
    }
    interface InMemoryWebStorage {
        getItem(key: string): any;

        setItem(key: string, value: any): any;

        removeItem(key: string): any;

        key(index: number): any;

        length?: number;
    }
    class Log {
        static NONE: number;
        static ERROR: number;
        static WARN: number;
        static INFO: number;
        // For when TypeScript 2.0 compiler is more widely used
        // static readonly NONE: number;
        // static readonly ERROR: number;
        // static readonly WARN: number;
        // static readonly INFO: number;

        static reset(): void;

        static level: number;

        static logger: Logger;

        static info(message?: any, ...optionalParams: any[]): void;
        static warn(message?: any, ...optionalParams: any[]): void;
        static error(message?: any, ...optionalParams: any[]): void;
    }

    interface MetadataService {
        new (settings: OidcClientSettings): MetadataService;

        getMetadata(): PromiseLike<any>;

        getIssuer(): PromiseLike<any>;

        getAuthorizationEndpoint(): PromiseLike<any>;

        getUserInfoEndpoint(): PromiseLike<any>;

        getCheckSessionIframe(): PromiseLike<any>;

        getEndSessionEndpoint(): PromiseLike<any>;

        getSigningKeys(): PromiseLike<any>;
    }
    interface MetadataServiceCtor {
        (settings: OidcClientSettings, jsonServiceCtor?: any): MetadataService;
    }
    interface ResponseValidator {
        validateSigninResponse(state: any, response: any): PromiseLike<any>;
        validateSignoutResponse(state: any, response: any): PromiseLike<any>;
    }
    interface ResponseValidatorCtor {
        (settings: OidcClientSettings, metadataServiceCtor?: MetadataServiceCtor, userInfoServiceCtor?: any): ResponseValidator;
    }

    class OidcClient {
        constructor(settings: OidcClientSettings);

        createSigninRequest(args?: any): PromiseLike<any>;
        processSigninResponse(): PromiseLike<any>;

        createSignoutRequest(args?: any): PromiseLike<any>;
        processSignoutResponse(): PromiseLike<any>;

        clearStaleState(stateStore: any): PromiseLike<any>;
    }

    interface OidcClientSettings {
        authority?: string;
        metadataUrl?: string;
        metadata?: any;
        signingKeys?: string;
        client_id?: string;
        response_type?: string;
        scope?: string;
        redirect_uri?: string;
        post_logout_redirect_uri?: string;
        prompt?: string;
        display?: string;
        max_age?: number;
        ui_locales?: string;
        acr_values?: string;
        filterProtocolClaims?: boolean;
        loadUserInfo?: boolean;
        staleStateAge?: number;
        clockSkew?: number;
        stateStore?: WebStorageStateStore;
        ResponseValidatorCtor?: ResponseValidatorCtor;
        MetadataServiceCtor?: MetadataServiceCtor;
    }

    class UserManager extends OidcClient {
        constructor(settings: UserManagerSettings);

        clearStaleState(): PromiseLike<void>;

        getUser(): PromiseLike<User>;
        removeUser(): PromiseLike<void>;

        signinPopup(args?: any): PromiseLike<User>;
        signinPopupCallback(url?: string): PromiseLike<any>;

        signinSilent(args?: any): PromiseLike<User>;
        signinSilentCallback(url?: string): PromiseLike<any>;

        signinRedirect(args?: any): PromiseLike<any>;
        signinRedirectCallback(url?: string): PromiseLike<User>;

        signoutRedirect(args?: any): PromiseLike<any>;
        signoutRedirectCallback(url?: string): PromiseLike<any>;

        querySessionStatus(args?: any): PromiseLike<any>;

        events: UserManagerEvents;
    }
    interface UserManagerEvents extends AccessTokenEvents {
        load(user: User): any;
        unload(): any;

        addUserLoaded(callback: (...ev: any[]) => void): void;
        removeUserLoaded(callback: (...ev: any[]) => void): void;

        addUserUnloaded(callback: (...ev: any[]) => void): void;
        removeUserUnloaded(callback: (...ev: any[]) => void): void;

        addSilentRenewError(callback: (...ev: any[]) => void): void;
        removeSilentRenewError(callback: (...ev: any[]) => void): void;

        addUserSignedOut(callback: (...ev: any[]) => void): void;
        removeUserSignedOut(callback: (...ev: any[]) => void): void;
    }
    interface UserManagerSettings extends OidcClientSettings {
        popup_redirect_uri?: string;
        popupWindowFeatures?: string;
        popupWindowTarget?: any;
        silent_redirect_uri?: any;
        automaticSilentRenew?: any;
        accessTokenExpiringNotificationTime?: string;
        redirectNavigator?: any;
        popupNavigator?: any;
        iframeNavigator?: any;
        userStore?: any;
    }
    interface WebStorageStateStore {
        set(key: string, value: any): PromiseLike<void>;

        get(key: string): PromiseLike<any>;

        remove(key: string): PromiseLike<any>;

        getAllKeys(): PromiseLike<string[]>;
    }
    interface User {
        id_token: string;
        session_state: any;
        access_token: string;
        token_type: string;
        scope: string;
        profile: any;
        expires_at: number;
        state: any;
        toStorageString(): string;

        expires_in: number;
        expired: boolean;
        scopes: string[];

        // For when TypeScript 2.0 compiler is more widely used
        // readonly expires_in: number;
        // readonly expired: boolean;
        // readonly scopes: string[];
    }
}
