import { IAuthenticationSettings } from './IAuthenticationSettings';
export interface IAuthenticationManagerSettings extends IAuthenticationSettings {
    redirect_uri: string;
    silent_redirect_uri: string;
    post_logout_redirect_uri: string;
    loadUserInfo: boolean;
    automaticSilentRenew: boolean;
}
