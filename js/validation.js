/* CineVerse Contact Form Validation */

var contactForm = document.getElementById("contactForm");
var contactName = document.getElementById("contactName");
var contactEmail = document.getElementById("contactEmail");
var contactSubject = document.getElementById("contactSubject");
var contactMessage = document.getElementById("contactMessage");
var contactSuccess = document.getElementById("contactSuccess");

contactForm.addEventListener("submit", function(event) {
    event.preventDefault();
    contactSuccess.textContent = "";
    clearFieldErrors(contactForm);

    var name = contactName.value.trim();
    if (name.length < 3 || !/^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$/u.test(name)) {
        showFieldError(contactName, "Enter a name with at least 3 characters and no numbers.");
        return;
    }
    if (!contactEmail.validity.valid || !isValidEmail(contactEmail.value.trim())) {
        showFieldError(contactEmail, invalidEmailMessage);
        return;
    }
    if (!contactSubject.value) {
        showFieldError(contactSubject, "Choose a subject for your message.");
        return;
    }
    if (contactMessage.value.trim().length < 10) {
        showFieldError(contactMessage, "Enter a message with at least 10 characters.");
        return;
    }

    contactSuccess.textContent = "Your message passed validation. CineVerse is a demo, so no message was sent.";
    contactForm.reset();
});
