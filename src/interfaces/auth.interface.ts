export interface ISENDOTP {
        Token:Number;
        to:string;
        Name:string;
}

export interface IRECOVERYEMAIL {
        recoveryEmail:String | null | undefined;
        email:String | null |undefined;
        Name:string
}

export interface IFORGETPASSWORD {
        Name:string | undefined;
        email: string;
        Token:string;
}

export interface IPASSWORDCONF {
        Name:string;
        email: string | null;
}