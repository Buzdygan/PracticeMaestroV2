// auth.js

class AuthManager {
    constructor(app) {
        this.app = app;
        this.user = null;
        this.isSignedIn = false;
    }

    setupAuth() {
        if (typeof firebase === 'undefined') {
            setTimeout(() => this.setupAuth(), 100);
            return;
        }

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.handleSignIn(user);
            } else {
                this.handleSignOut();
            }
        });
    }

    async handleSignIn(user) {
        console.log('handleSignIn called for user:', user.email);
        this.user = user;
        this.isSignedIn = true;
        this.app.onSignIn(user);
    }

    handleSignOut() {
        console.log("handleSignOut called. User is now signed out.");
        this.user = null;
        this.isSignedIn = false;
        this.app.onSignOut();
    }

    async signOut() {
        try {
            console.log('Attempting to sign out...');
            if (typeof firebase === 'undefined' || !firebase.auth) {
                console.log('Firebase not available, signing out locally');
                this.handleSignOut();
                return;
            }
            await firebase.auth().signOut();
            console.log('Firebase sign out successful');
        } catch (error) {
            console.error('Sign out failed:', error);
            showToast('Sign out failed: ' + error.message, 'error');
            this.handleSignOut();
        }
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebase.auth().signInWithPopup(provider);
        } catch (error) {
            console.error('Sign in with Google failed:', error);
            showToast(`Sign in failed: ${error.message}`, 'error');
        }
    }

    async handleEmailSignIn(e) {
        e.preventDefault();
        const email = e.target.signInEmail.value;
        const password = e.target.signInPassword.value;
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error('Email sign in failed:', error);
            showToast(`Sign in failed: ${error.message}`, 'error');
        }
    }

    async handleEmailSignUp(e) {
        e.preventDefault();
        const email = e.target.signUpEmail.value;
        const password = e.target.signUpPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (password !== confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        try {
            await firebase.auth().createUserWithEmailAndPassword(email, password);
        } catch (error) {
            console.error('Email sign up failed:', error);
            showToast(`Sign up failed: ${error.message}`, 'error');
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('signInEmail').value;
        if (!email) {
            showToast("Please enter your email address to reset password.", "info");
            return;
        }

        try {
            await firebase.auth().sendPasswordResetEmail(email);
            showToast("Password reset email sent!", "success");
        } catch (error) {
            console.error('Forgot password failed:', error);
            showToast(`Password reset failed: ${error.message}`, 'error');
        }
    }
} 