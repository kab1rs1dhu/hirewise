'use server';
import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

const ONE_WEEK = 60 * 60 * 24 * 7 * 1000;

export async function signUp(params: SignUpParams) {

    const { uid, name, email } = params;

    try {

        const userRecord = await db.collection('users').doc(uid).get();

        if (userRecord.exists) {
            return {
                success: false,
                message: 'User already exists. Please sign in instead.'
            }
        }

        await db.collection('users').doc(uid).set({
            name,
            email
        });

        return {
            success: true,
            message: 'Account created successfully'
        };

    } catch (error: any) {

        console.error("Error creating user:", error);

        if (error.code === 'auth/email-already-exists') {
            return {
                success: false,
                message: 'Email already in use'
            }
        }

        return {
            success: false,
            message: 'failed to create account'
        }

    }

}


export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: ONE_WEEK,
    })

    cookieStore.set('session', sessionCookie, {
        maxAge: ONE_WEEK,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax'
    })
}

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {

        const userRecord = await db.collection('users').where('email', '==', email).get();

        if (userRecord.empty) {
            return {
                success: false,
                message: 'User does not exist. Please sign up first.'
            }
        }

        await setSessionCookie(idToken);

        return {
            success: true,
            message: 'Signed in successfully'
        };
        
    } catch (error) {
        console.error("Error signing in:", error);

        return {
            success: false,
            message: 'Sign in failed'
        }
        
    }
}