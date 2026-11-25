(function () {
    "use strict";

    const customerSession = "cineverseCustomer";
    const adminSession = "cineverseAdmin";
    const accountPrefix = "cineverseAccount:";
    const adminEmail = "admin@cineverse.com";
    const customerEmail = "customer@cineverse.com";
    const demoSalt = new Uint8Array([46, 181, 16, 213, 70, 124, 22, 45, 12, 111, 171, 95, 62, 233, 161, 17]);
    const demoPasswordHash = "92497ef644946f7572f4c745b4d5694bf8dce32e64ae856260d83ca3b9b39d59";
    const demoCustomer = { name: "Demo Customer", demo: true, salt: Array.from(demoSalt), hash: demoPasswordHash };

    function readAccount(email) {
        if (!email) return null;
        const record = localStorage.getItem(accountPrefix + email);
        if (record !== null) return JSON.parse(record);
        return email === customerEmail ? demoCustomer : null;
    }

    function getIdentity() {
        try {
            if (sessionStorage.getItem(adminSession) === "true") {
                return { role: "admin" };
            }

            const email = sessionStorage.getItem(customerSession);
            const account = readAccount(email);
            if (email && (!account || account.removed)) {
                sessionStorage.removeItem(customerSession);
            } else if (account) {
                return { role: "customer", name: account.name, email, demo: account.demo === true };
            }
        } catch {
            // Public pages remain available when browser storage is blocked.
        }

        return { role: "guest" };
    }

    function getCustomerAccounts() {
        if (getIdentity().role !== "admin") return [];

        const accounts = [];
        if (localStorage.getItem(accountPrefix + customerEmail) === null) {
            accounts.push({ name: demoCustomer.name, email: customerEmail, demo: true });
        }
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || key.indexOf(accountPrefix) !== 0) continue;

            const email = key.slice(accountPrefix.length);
            if (email === adminEmail) continue;

            const account = readAccount(email);
            if (account && !account.moved) {
                accounts.push({ name: account.name, email: email, removed: account.removed === true, demo: account.demo === true });
            }
        }
        return accounts.sort(function (first, second) {
            return first.name.localeCompare(second.name);
        });
    }

    function setCustomerAccountRemoved(email, removed) {
        if (getIdentity().role !== "admin" || email === adminEmail || email === customerEmail) return false;

        const account = readAccount(email);
        if (!account || account.demo || account.moved) return false;
        // Keep the saved account and its booking history available for restoration.
        account.removed = removed;
        localStorage.setItem(accountPrefix + email, JSON.stringify(account));
        return true;
    }

    async function hashPassword(password, salt) {
        const key = await crypto.subtle.importKey(
            "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
        );
        const hash = await crypto.subtle.deriveBits(
            { name: "PBKDF2", hash: "SHA-256", iterations: 600000, salt },
            key,
            256
        );
        return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    function isValidPassword(password) {
        return password.length >= 8 && /\p{L}/u.test(password) && /\d/.test(password);
    }

    function isValidName(name) {
        return name.length >= 3 && /^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$/u.test(name);
    }

    function moveCustomerEmail(previousEmail, email, account) {
        const targetKey = accountPrefix + email;
        const targetRecord = localStorage.getItem(targetKey);
        const bookings = getCustomerBookings(previousEmail);
        const draftOwner = sessionStorage.getItem("bookingDraftOwner");
        let movedBookings = 0;

        localStorage.setItem(targetKey, JSON.stringify(account));
        try {
            bookings.forEach(function (booking) {
                saveBooking({ ...booking, customerEmail: email });
                movedBookings++;
            });
            if (draftOwner === previousEmail) sessionStorage.setItem("bookingDraftOwner", email);
            sessionStorage.setItem(customerSession, email);
            if (previousEmail === customerEmail) {
                // Keep the built-in address reserved after the demo customer moves.
                localStorage.setItem(accountPrefix + previousEmail, JSON.stringify({ removed: true, moved: true }));
            } else {
                localStorage.removeItem(accountPrefix + previousEmail);
            }
        } catch (error) {
            if (targetRecord === null) localStorage.removeItem(targetKey);
            else localStorage.setItem(targetKey, targetRecord);
            for (let i = 0; i < movedBookings; i++) saveBooking(bookings[i]);
            if (draftOwner === previousEmail) sessionStorage.setItem("bookingDraftOwner", previousEmail);
            sessionStorage.setItem(customerSession, previousEmail);
            throw error;
        }
    }

    function setupProfileEdit(identity) {
        const form = document.getElementById("editProfileForm");
        const nameInput = document.getElementById("profileName");
        const emailInput = document.getElementById("profileEmail");
        const submit = document.getElementById("profileSubmit");
        const error = document.getElementById("profileError");
        const status = document.getElementById("profileStatus");
        nameInput.value = identity.name;
        emailInput.value = identity.email;
        if (new URLSearchParams(window.location.search).get("profile") === "updated") {
            status.textContent = "Profile updated.";
            window.history.replaceState(null, "", "account.html");
        }

        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (submit.disabled) return;
            clearFieldErrors(form);
            error.textContent = "";
            status.textContent = "";

            const name = nameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            if (!isValidName(name)) {
                showFieldError(nameInput, "Enter a name with at least 3 characters and no numbers.");
                return;
            }
            if (!emailInput.validity.valid || !isValidEmail(email)) {
                showFieldError(emailInput, invalidEmailMessage);
                return;
            }

            submit.disabled = true;
            try {
                await updateBookingStorage(function () {
                    const account = readAccount(identity.email);
                    if (!account || account.removed || getIdentity().email !== identity.email) {
                        error.textContent = "Your session changed. Log in again to edit your profile.";
                        return;
                    }
                    const updatedAccount = { ...account, name };
                    if (email === identity.email) {
                        localStorage.setItem(accountPrefix + email, JSON.stringify(updatedAccount));
                    } else {
                        const targetAccount = readAccount(email);
                        const returningDemo = account.demo && email === customerEmail && targetAccount?.moved;
                        if (email === adminEmail || (targetAccount && !returningDemo) || getCustomerBookings(email).length) {
                            showFieldError(emailInput, "This email address is already in use.");
                            return;
                        }
                        moveCustomerEmail(identity.email, email, updatedAccount);
                    }
                    window.location.replace("account.html?profile=updated");
                });
            } catch {
                error.textContent = "Could not save your profile. Check browser storage and try again.";
            } finally {
                submit.disabled = false;
            }
        });
    }

    function setupPasswordChange(email) {
        const panel = document.getElementById("changePassword");
        const changeForm = document.getElementById("changePasswordForm");
        const current = document.getElementById("currentPassword");
        const next = document.getElementById("newPassword");
        const confirmation = document.getElementById("newPasswordConfirmation");
        const changeSubmit = document.getElementById("changePasswordSubmit");
        const changeError = document.getElementById("changePasswordError");
        const status = document.getElementById("changePasswordStatus");
        panel.hidden = false;

        changeForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (changeSubmit.disabled) return;

            changeError.textContent = "";
            status.textContent = "";
            clearFieldErrors(changeForm);

            const currentPassword = current.value;
            const newPassword = next.value;

            if (!currentPassword.trim()) {
                showFieldError(current, "Enter your current password.");
                return;
            }
            if (!isValidPassword(newPassword)) {
                showFieldError(next, "Choose a password that meets the requirements below.");
                return;
            }
            if (newPassword === currentPassword) {
                showFieldError(next, "Choose a password different from your current password.");
                return;
            }
            if (newPassword !== confirmation.value) {
                showFieldError(confirmation, "New passwords do not match.");
                return;
            }

            changeSubmit.disabled = true;
            try {
                const account = readAccount(email);
                if (!account || await hashPassword(currentPassword, Uint8Array.from(account.salt)) !== account.hash) {
                    showFieldError(current, "Current password is incorrect.");
                    return;
                }

                const salt = crypto.getRandomValues(new Uint8Array(16));
                const hash = await hashPassword(newPassword, salt);
                const latestAccount = readAccount(email);
                if (sessionStorage.getItem(customerSession) !== email ||
                    latestAccount?.removed || latestAccount?.hash !== account.hash) {
                    changeError.textContent = "Your account changed. Please sign in again before updating your password.";
                    return;
                }

                localStorage.setItem(accountPrefix + email, JSON.stringify({
                    ...latestAccount, salt: Array.from(salt), hash
                }));
                changeForm.reset();
                panel.open = false;
                status.textContent = "Password updated successfully.";
                panel.querySelector("summary").focus();
            } catch {
                changeError.textContent = "Could not update your password. Please allow browser storage and try again.";
            } finally {
                changeSubmit.disabled = false;
            }
        });
    }

    window.getCineVerseIdentity = getIdentity;
    window.getCineVerseCustomerAccounts = getCustomerAccounts;
    window.setCineVerseCustomerAccountRemoved = setCustomerAccountRemoved;
    const identity = getIdentity();
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".navbar .nav-links a").forEach(link => {
        if (link.getAttribute("href") === currentPage) link.setAttribute("aria-current", "page");
    });
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) window.location.reload();
    });
    if (identity.role === "customer") {
        window.addEventListener("storage", function (event) {
            if (event.key === accountPrefix + identity.email) {
                const updated = getIdentity();
                if (updated.role !== "customer" || updated.name !== identity.name) window.location.reload();
            }
        });
    }

    const bookingContent = document.querySelector("[data-booking-account-required]");
    if (bookingContent) {
        const customer = identity.role === "customer";
        const bookingPrompt = document.getElementById("bookingAccountPrompt");
        bookingContent.hidden = !customer;
        bookingPrompt.hidden = customer;

        if (!customer) {
            const returnPage = bookingContent.dataset.bookingAccountRequired + window.location.search;
            const returnQuery = new URLSearchParams({ returnTo: returnPage });
            const bookingLogIn = document.getElementById("bookingLogIn");
            bookingLogIn.href = "account.html?" + returnQuery;
            returnQuery.set("mode", "signup");
            const bookingSignUp = document.getElementById("bookingSignUp");
            bookingSignUp.href = "account.html?" + returnQuery;

            if (identity.role === "admin") {
                bookingPrompt.querySelector("p").textContent = "Switch to a customer account to book tickets.";
                bookingLogIn.textContent = "Switch Account";
                bookingSignUp.hidden = true;
                bookingLogIn.addEventListener("click", function () {
                    sessionStorage.removeItem(adminSession);
                });
            }
        }
    }

    if (identity.role !== "guest") {
        let displayName = identity.name;
        if (identity.role === "admin") displayName = "Admin";
        if (identity.demo && identity.name === demoCustomer.name) displayName = "Customer";

        document.querySelectorAll("[data-account-link]").forEach(link => {
            const avatar = document.createElement("span");
            avatar.className = "nav-profile-avatar";
            avatar.textContent = displayName.charAt(0).toUpperCase();
            avatar.setAttribute("aria-hidden", "true");

            const name = document.createElement("span");
            name.className = "nav-profile-name";
            name.textContent = displayName;

            link.classList.add("nav-profile");
            link.title = displayName;
            link.textContent = "";
            link.append(avatar, name);
            if (identity.role === "admin") link.href = "admin.html";
        });
    }

    const checkoutName = document.getElementById("customerName");
    const checkoutEmail = document.getElementById("customerEmail");
    if (identity.role === "customer" && checkoutName && checkoutEmail) {
        checkoutName.value ||= identity.name;
        checkoutEmail.value ||= identity.email;
    }

    const form = document.getElementById("accountForm");
    if (!form) return;

    if (identity.role === "admin") {
        window.location.replace("admin.html");
        return;
    }

    const title = document.getElementById("accountTitle");
    const signupLink = document.getElementById("signupLink");
    if (identity.role === "customer") {
        document.body.classList.remove("account-entry");
        form.hidden = true;
        signupLink.hidden = true;
        document.getElementById("accountOptions").hidden = true;
        document.getElementById("accountProfile").hidden = false;
        title.textContent = "My Account";
        document.getElementById("accountProfileName").textContent = identity.name;
        document.getElementById("accountProfileEmail").textContent = identity.email;
        document.getElementById("accountInitial").textContent = identity.name.trim().charAt(0).toUpperCase();
        document.body.classList.add("customer-account");
        setupProfileEdit(identity);
        if (!identity.demo) setupPasswordChange(identity.email);

        document.getElementById("accountLogout").addEventListener("click", function () {
            sessionStorage.removeItem(customerSession);
            sessionStorage.removeItem(adminSession);
            window.location.replace("account.html");
        });
        return;
    }

    const accountParams = new URLSearchParams(window.location.search);
    const signup = accountParams.get("mode") === "signup";
    const requestedPage = accountParams.get("returnTo") || "";
    const returnPage = /^(booking|checkout|confirmation)\.html(?:\?[^#]*)?$/.test(requestedPage) ? requestedPage : "";
    if (returnPage) {
        const returnQuery = new URLSearchParams({ returnTo: returnPage });
        document.getElementById("signupLogin").querySelector("a").href = "account.html?" + returnQuery;
        returnQuery.set("mode", "signup");
        signupLink.querySelector("a").href = "account.html?" + returnQuery;
    }
    const nameInput = document.getElementById("accountName");
    const emailInput = document.getElementById("accountEmail");
    const passwordInput = document.getElementById("accountPassword");
    const confirmationInput = document.getElementById("accountConfirmation");
    const submit = document.getElementById("accountSubmit");
    const error = document.getElementById("accountError");

    if (signup) {
        title.textContent = "Create an Account";
        signupLink.hidden = true;
        document.getElementById("signupName").hidden = false;
        document.getElementById("signupConfirmation").hidden = false;
        document.getElementById("passwordHint").hidden = false;
        passwordInput.autocomplete = "new-password";
        passwordInput.setAttribute("aria-describedby", "accountPasswordError passwordHint");
        nameInput.required = true;
        confirmationInput.required = true;
        submit.textContent = "Create Account";
        document.getElementById("signupLogin").hidden = false;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (submit.disabled) return;

        error.textContent = "";
        clearFieldErrors(form);

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (signup && !isValidName(name)) {
            showFieldError(nameInput, "Enter a name with at least 3 characters and no numbers.");
            return;
        }
        try {
            const existingAccount = readAccount(email);
            // Let older customers sign in so they can update their existing email.
            if (!emailInput.validity.valid || (!isValidEmail(email) && (signup || !existingAccount || existingAccount.removed))) {
                showFieldError(emailInput, invalidEmailMessage);
                return;
            }
            if (!password.trim()) {
                showFieldError(passwordInput, "Enter your password.");
                return;
            }
            if (signup && !isValidPassword(password)) {
                showFieldError(passwordInput, "Choose a password that meets the requirements below.");
                return;
            }
            if (signup && password !== confirmationInput.value) {
                showFieldError(confirmationInput, "Passwords do not match.");
                return;
            }

            submit.disabled = true;
            submit.textContent = signup ? "Creating account…" : "Signing in…";
            if (!signup && email === adminEmail && await hashPassword(password, demoSalt) === demoPasswordHash) {
                sessionStorage.removeItem(customerSession);
                sessionStorage.setItem(adminSession, "true");
                window.location.replace("admin.html");
                return;
            }

            if (signup) {
                if (existingAccount || email === adminEmail) {
                    showFieldError(emailInput, "An account already exists for this email. Log in instead.");
                    return;
                }
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const hash = await hashPassword(password, salt);
                const created = await updateBookingStorage(function () {
                    if (readAccount(email) || getCustomerBookings(email).length) return false;
                    localStorage.setItem(accountPrefix + email, JSON.stringify({
                        name, salt: Array.from(salt), hash
                    }));
                    return true;
                });
                if (!created) {
                    showFieldError(emailInput, "An account already exists for this email. Log in instead.");
                    return;
                }
            } else if (email === adminEmail || !existingAccount || existingAccount.removed ||
                await hashPassword(password, Uint8Array.from(existingAccount.salt)) !== existingAccount.hash) {
                showFieldError(passwordInput, "Incorrect email or password.");
                return;
            }

            const latestAccount = readAccount(email);
            if (!signup && (!latestAccount || latestAccount.removed || latestAccount.hash !== existingAccount.hash)) {
                showFieldError(passwordInput, "Incorrect email or password.");
                return;
            }

            sessionStorage.setItem(customerSession, email);
            sessionStorage.removeItem(adminSession);
            window.location.replace(returnPage || "index.html");
        } catch {
            error.textContent = "Account access requires browser storage and a secure page. Open this demo over localhost or HTTPS.";
        } finally {
            submit.disabled = false;
            submit.textContent = signup ? "Create Account" : "Log In";
        }
    });
})();
