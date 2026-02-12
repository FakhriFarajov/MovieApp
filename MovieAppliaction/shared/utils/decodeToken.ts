import { jwtDecode } from "jwt-decode";

export interface DecodedUser {
    userId: string;
    name: string;
    surname: string;
    email: string;
    is_email_verified: boolean;
    profile_image?: string;
    phone_number?: string;
    client_profile_id?: string;
}

export function decodeUserFromToken(token: string): DecodedUser | null {
    try {
        const decoded = jwtDecode<any>(token);
        // normalize different shapes for the verification flag
        const raw = decoded?.is_email_verified;
        let isVerified = false;
        if (typeof raw === 'string') {
            isVerified = raw.toLowerCase() === 'true' || raw === '1';
        } else if (typeof raw === 'number') {
            isVerified = raw === 1;
        } else if (typeof raw === 'boolean') {
            isVerified = raw;
        }

        const user: DecodedUser = {
            userId: decoded?.userId || decoded?.sub || decoded?.id || '',
            name: decoded?.name || decoded?.given_name || '',
            surname: decoded?.surname || decoded?.family_name || '',
            email: decoded?.email || '',
            is_email_verified: isVerified,
            profile_image: decoded?.profile_image || decoded?.picture,
            phone_number: decoded?.phone_number || decoded?.phone || undefined,
            client_profile_id: decoded?.client_profile_id || undefined,
        };

        return user;
    } catch (error) {
        return null;
    }
}
